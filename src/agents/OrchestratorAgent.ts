import { BaseAgent, AgentContext, AgentResponse, AgentRegistry } from './BaseAgent'

export interface OrchestratorConfig {
  maxRetries: number
  timeoutMs: number
  fallbackEnabled: boolean
  circuitBreakerThreshold: number
}

export interface ExecutionPlan {
  agents: string[]
  parallel: boolean
  fallbackChain: string[]
  priority: number
}

export class OrchestratorAgent extends BaseAgent {
  private registry: AgentRegistry
  private config: OrchestratorConfig
  private executionHistory: Map<string, any[]> = new Map()
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date }> = new Map()

  constructor(registry: AgentRegistry, config: Partial<OrchestratorConfig> = {}) {
    super('orchestrator', 'Orchestrator Agent', [
      {
        name: 'orchestration',
        description: 'Coordinates multi-agent workflows',
        inputTypes: ['any'],
        outputTypes: ['any'],
        dependencies: []
      }
    ])

    this.registry = registry
    this.config = {
      maxRetries: 3,
      timeoutMs: 30000,
      fallbackEnabled: true,
      circuitBreakerThreshold: 5,
      ...config
    }
  }

  async process(context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now()
    
    try {
      this.log('info', 'Starting orchestration', { 
        sessionId: context.sessionId,
        requestId: context.requestId 
      })

      // Determine the execution plan based on context
      const plan = this.createExecutionPlan(context)
      
      // Execute the plan
      const result = await this.executePlan(plan, context)
      
      // Record execution history
      this.recordExecution(context.requestId, plan, result, Date.now() - startTime)

      return this.createResponse(true, result, undefined, {
        processingTime: Date.now() - startTime,
        confidence: this.calculateConfidence(result),
        executionPlan: plan
      })

    } catch (error) {
      this.log('error', 'Orchestration failed', { error: error.message, context })
      
      return this.createResponse(false, undefined, `Orchestration failed: ${error.message}`, {
        processingTime: Date.now() - startTime,
        confidence: 0
      })
    }
  }

  canHandle(context: AgentContext): boolean {
    // Orchestrator can handle any context
    return true
  }

  async getHealthStatus(): Promise<{ healthy: boolean; details?: any }> {
    const agentHealth = await this.registry.checkAllAgentsHealth()
    const healthyCount = Array.from(agentHealth.values()).filter(Boolean).length
    const totalCount = agentHealth.size

    return {
      healthy: healthyCount > 0,
      details: {
        totalAgents: totalCount,
        healthyAgents: healthyCount,
        unhealthyAgents: totalCount - healthyCount,
        agentHealth: Object.fromEntries(agentHealth)
      }
    }
  }

  // Create execution plan based on context
  private createExecutionPlan(context: AgentContext): ExecutionPlan {
    const plan: ExecutionPlan = {
      agents: [],
      parallel: false,
      fallbackChain: [],
      priority: 1
    }

    // Determine which agents to use based on context
    if (this.isResearchQuery(context)) {
      plan.agents = ['data-sourcing', 'validation', 'caching']
      plan.fallbackChain = ['error-handling']
      plan.parallel = false // Sequential for research queries
    } else if (this.isChatMessage(context)) {
      plan.agents = ['caching', 'data-sourcing', 'validation']
      plan.fallbackChain = ['error-handling']
      plan.parallel = false
    } else {
      plan.agents = ['error-handling']
      plan.parallel = false
    }

    return plan
  }

  // Execute the plan with proper error handling and fallbacks
  private async executePlan(plan: ExecutionPlan, context: AgentContext): Promise<any> {
    let result: any = null
    let lastError: Error | null = null

    // Execute primary agents
    for (const agentId of plan.agents) {
      if (this.isCircuitBreakerOpen(agentId)) {
        this.log('warn', `Circuit breaker open for agent: ${agentId}`)
        continue
      }

      const agent = this.registry.getAgent(agentId)
      if (!agent || !agent.isHealthy()) {
        this.log('warn', `Agent not available: ${agentId}`)
        continue
      }

      try {
        this.log('info', `Executing agent: ${agentId}`)
        const agentResult = await this.executeWithTimeout(agent, context)
        
        if (agentResult.success) {
          result = agentResult.data
          this.resetCircuitBreaker(agentId)
          
          // Update context for next agent
          context.metadata = {
            ...context.metadata,
            previousAgent: agentId,
            previousResult: result
          }
        } else {
          lastError = new Error(agentResult.error || 'Agent execution failed')
          this.recordFailure(agentId)
        }

      } catch (error) {
        this.log('error', `Agent execution failed: ${agentId}`, error)
        lastError = error as Error
        this.recordFailure(agentId)
      }
    }

    // Execute fallback chain if needed
    if (!result && plan.fallbackChain.length > 0) {
      this.log('info', 'Executing fallback chain')
      
      for (const fallbackAgentId of plan.fallbackChain) {
        const agent = this.registry.getAgent(fallbackAgentId)
        if (agent && agent.isHealthy()) {
          try {
            const fallbackResult = await this.executeWithTimeout(agent, {
              ...context,
              metadata: {
                ...context.metadata,
                fallbackMode: true,
                originalError: lastError?.message
              }
            })

            if (fallbackResult.success) {
              result = fallbackResult.data
              break
            }
          } catch (error) {
            this.log('error', `Fallback agent failed: ${fallbackAgentId}`, error)
          }
        }
      }
    }

    if (!result && lastError) {
      throw lastError
    }

    return result
  }

  // Execute agent with timeout
  private async executeWithTimeout(agent: BaseAgent, context: AgentContext): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Agent timeout: ${agent.getId()}`))
      }, this.config.timeoutMs)

      agent.process(context)
        .then(result => {
          clearTimeout(timeout)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeout)
          reject(error)
        })
    })
  }

  // Circuit breaker implementation
  private isCircuitBreakerOpen(agentId: string): boolean {
    const breaker = this.circuitBreakers.get(agentId)
    if (!breaker) return false

    const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime()
    const cooldownPeriod = 60000 // 1 minute

    if (timeSinceLastFailure > cooldownPeriod) {
      // Reset after cooldown
      this.circuitBreakers.delete(agentId)
      return false
    }

    return breaker.failures >= this.config.circuitBreakerThreshold
  }

  private recordFailure(agentId: string): void {
    const breaker = this.circuitBreakers.get(agentId) || { failures: 0, lastFailure: new Date() }
    breaker.failures++
    breaker.lastFailure = new Date()
    this.circuitBreakers.set(agentId, breaker)
  }

  private resetCircuitBreaker(agentId: string): void {
    this.circuitBreakers.delete(agentId)
  }

  // Utility methods for context analysis
  private isResearchQuery(context: AgentContext): boolean {
    return !!(context.researchPaper || 
              context.metadata?.type === 'research' ||
              context.metadata?.query?.includes('research'))
  }

  private isChatMessage(context: AgentContext): boolean {
    return !!(context.conversation || 
              context.metadata?.type === 'chat' ||
              context.metadata?.message)
  }

  private calculateConfidence(result: any): number {
    if (!result) return 0
    if (result.metadata?.confidence) return result.metadata.confidence
    return 0.8 // Default confidence
  }

  private recordExecution(requestId: string, plan: ExecutionPlan, result: any, duration: number): void {
    if (!this.executionHistory.has(requestId)) {
      this.executionHistory.set(requestId, [])
    }

    this.executionHistory.get(requestId)!.push({
      timestamp: new Date(),
      plan,
      result,
      duration,
      success: !!result
    })

    // Keep only last 100 executions per request
    const history = this.executionHistory.get(requestId)!
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }
  }

  // Analytics methods
  getExecutionHistory(requestId: string): any[] {
    return this.executionHistory.get(requestId) || []
  }

  getOverallStats(): any {
    const stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      averageDuration: 0,
      circuitBreakerStatus: Object.fromEntries(this.circuitBreakers)
    }

    let totalDuration = 0
    
    for (const executions of this.executionHistory.values()) {
      for (const execution of executions) {
        stats.totalExecutions++
        if (execution.success) stats.successfulExecutions++
        totalDuration += execution.duration
      }
    }

    if (stats.totalExecutions > 0) {
      stats.averageDuration = totalDuration / stats.totalExecutions
    }

    return stats
  }
}
