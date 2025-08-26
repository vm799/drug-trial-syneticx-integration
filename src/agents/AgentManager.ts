import { BaseAgent, AgentRegistry } from './BaseAgent'
import type { AgentContext, AgentResponse } from './BaseAgent'
import { OrchestratorAgent } from './OrchestratorAgent'
import { ErrorHandlingAgent } from './ErrorHandlingAgent'
import { CachingAgent } from './CachingAgent'
import { DataSourcingAgent } from './DataSourcingAgent'
import { ValidationAgent } from './ValidationAgent'
import { v4 as uuidv4 } from 'uuid'

export interface AgentManagerConfig {
  enableCaching: boolean
  enableValidation: boolean
  enableErrorHandling: boolean
  enableDataSourcing: boolean
  enableAnalytics: boolean
  defaultTimeout: number
  maxConcurrentRequests: number
}

export interface ChatRequest {
  message: string
  sessionId: string
  userId?: string
  specialization?: string
  researchPaper?: any
  conversationHistory?: Array<{ type: 'user' | 'assistant'; content: string }>
  metadata?: Record<string, any>
}

export interface ChatResponse {
  content: string
  confidence: number
  sources: string[]
  metadata: {
    agentsUsed: string[]
    processingTime: number
    cached: boolean
    validated: boolean
    qualityScore?: number
    errorRecovered?: boolean
  }
  error?: string
}

export class AgentManager {
  private config: AgentManagerConfig
  private registry!: AgentRegistry
  private orchestrator!: OrchestratorAgent
  private activeRequests: Map<string, Promise<AgentResponse>> = new Map()
  private analytics: {
    totalRequests: number
    successfulRequests: number
    averageResponseTime: number
    agentUsageStats: Record<string, number>
  }

  constructor(config: Partial<AgentManagerConfig> = {}) {
    this.config = {
      enableCaching: true,
      enableValidation: true,
      enableErrorHandling: true,
      enableDataSourcing: true,
      enableAnalytics: true,
      defaultTimeout: 30000,
      maxConcurrentRequests: 10,
      ...config,
    }

    this.analytics = {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      agentUsageStats: {},
    }

    this.initializeAgents()
  }

  // Initialize all agents and register them
  private initializeAgents(): void {
    this.registry = new AgentRegistry()

    try {
      // Create and register core agents
      if (this.config.enableErrorHandling) {
        const errorAgent = new ErrorHandlingAgent({
          enableUserFriendlyMessages: true,
          enableRecoveryActions: true,
          enableFallbackResponses: true,
        })
        this.registry.register(errorAgent)
      }

      if (this.config.enableCaching) {
        const cachingAgent = new CachingAgent({
          enableMemoryCache: true,
          enableBrowserCache: true,
          memoryTTL: 60 * 60, // 1 hour
          browserTTL: 30 * 60, // 30 minutes
          enablePredictiveCaching: true,
        })
        this.registry.register(cachingAgent)
      }

      if (this.config.enableDataSourcing) {
        const dataAgent = new DataSourcingAgent({
          enableOpenAI: true,
          enablePubMed: true,
          enableLocalDatabase: true,
          timeoutMs: 15000,
          maxRetries: 3,
          fallbackMode: 'sequential',
        })
        this.registry.register(dataAgent)
      }

      if (this.config.enableValidation) {
        const validationAgent = new ValidationAgent({
          enableCitationCheck: true,
          enableFactVerification: true,
          enableMedicalSafety: true,
          minConfidenceThreshold: 0.7,
        })
        this.registry.register(validationAgent)
      }

      // Create orchestrator after all agents are registered
      this.orchestrator = new OrchestratorAgent(this.registry, {
        maxRetries: 3,
        timeoutMs: this.config.defaultTimeout,
        fallbackEnabled: true,
        circuitBreakerThreshold: 5,
      })
      this.registry.register(this.orchestrator)

      console.log('🤖 Multi-agent system initialized successfully')
      console.log(`📊 Registered ${this.registry.getAllAgents().length} agents`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ Failed to initialize agents:', errorMessage)
      throw new Error(`Agent initialization failed: ${errorMessage}`)
    }
  }

  // Main chat interface
  async processChat(request: ChatRequest): Promise<ChatResponse> {
    const requestId = uuidv4()
    const startTime = Date.now()

    // Check concurrent request limit
    if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
      throw new Error('Maximum concurrent requests reached. Please try again shortly.')
    }

    try {
      this.analytics.totalRequests++

      // Create agent context
      const context: AgentContext = {
        sessionId: request.sessionId,
        userId: request.userId,
        requestId,
        timestamp: new Date(),
        specialization: request.specialization,
        researchPaper: request.researchPaper,
        conversation: request.conversationHistory,
        metadata: {
          query: request.message,
          type: 'chat',
          enableCaching: this.config.enableCaching,
          requiresValidation: this.config.enableValidation,
          ...request.metadata,
        },
      }

      // Execute orchestrated workflow
      const orchestrationPromise = this.orchestrator.process(context)
      this.activeRequests.set(requestId, orchestrationPromise)

      const result = await orchestrationPromise

      // Process successful response
      if (result.success) {
        const response = await this.buildChatResponse(result, startTime, context)
        this.analytics.successfulRequests++
        return response
      } else {
        // Handle orchestration failure
        throw new Error(result.error || 'Orchestration failed')
      }
    } catch (error) {
      console.error('Chat processing error:', error)

      // Try emergency fallback
      const errorInstance = error instanceof Error ? error : new Error(String(error))
      const fallbackResponse = await this.emergencyFallback(request, errorInstance)
      return fallbackResponse
    } finally {
      this.activeRequests.delete(requestId)
      this.updateAnalytics(Date.now() - startTime)
    }
  }

  // Build chat response from agent result
  private async buildChatResponse(
    result: AgentResponse,
    startTime: number,
    context: AgentContext,
  ): Promise<ChatResponse> {
    const processingTime = Date.now() - startTime

    // Extract content from result
    let content = ''
    let confidence = result.metadata?.confidence || 0.5
    let sources: string[] = []
    let agentsUsed: string[] = []

    // Handle different response types
    if (result.data?.content) {
      content = result.data.content
    } else if (result.data?.response) {
      content = result.data.response
    } else if (result.data?.userMessage) {
      content = result.data.userMessage
    } else if (typeof result.data === 'string') {
      content = result.data
    } else {
      content = 'I have processed your request, but encountered an issue formatting the response.'
    }

    // Extract sources
    if (result.data?.citations) {
      sources = result.data.citations
    }
    if (result.metadata?.sources) {
      sources.push(...result.metadata.sources)
    }

    // Track agents used
    if (result.metadata?.agentId) {
      agentsUsed.push(result.metadata.agentId)
    }

    // Get additional metadata from orchestrator
    const orchestratorStats = this.orchestrator.getOverallStats()

    return {
      content,
      confidence,
      sources: [...new Set(sources)], // Remove duplicates
      metadata: {
        agentsUsed,
        processingTime,
        cached: false,
        validated: false,
        qualityScore: result.metadata?.confidence || 0.5,
        errorRecovered: false,
      },
    }
  }

  // Emergency fallback when all else fails
  private async emergencyFallback(request: ChatRequest, error: Error): Promise<ChatResponse> {
    console.log('🚨 Executing emergency fallback')

    // Try to get a fallback response from error handling agent
    const errorAgent = this.registry.getAgent('error-handling') as ErrorHandlingAgent

    if (errorAgent) {
      try {
        const context: AgentContext = {
          sessionId: request.sessionId,
          requestId: uuidv4(),
          timestamp: new Date(),
          metadata: {
            error: error.message,
            fallbackMode: true,
            originalMessage: request.message,
          },
        }

        const errorResult = await errorAgent.process(context)

        if (errorResult.success && errorResult.data?.userMessage) {
          return {
            content: errorResult.data.userMessage,
            confidence: 0.4,
            sources: [],
            metadata: {
              agentsUsed: ['error-handling'],
              processingTime: 200,
              cached: false,
              validated: false,
              errorRecovered: true,
            },
          }
        }
      } catch (fallbackError) {
        console.error('Emergency fallback failed:', fallbackError)
      }
    }

    // Final static fallback
    return {
      content:
        "I apologize, but I'm experiencing technical difficulties right now. Please try your question again in a moment, or contact support if the issue persists.",
      confidence: 0.2,
      sources: [],
      metadata: {
        agentsUsed: ['emergency-static'],
        processingTime: 100,
        cached: false,
        validated: false,
        errorRecovered: true,
      },
      error: error.message,
    }
  }

  // Health check for all agents
  async checkSystemHealth(): Promise<{
    healthy: boolean
    agents: Record<string, { healthy: boolean; details?: any }>
    overall: any
  }> {
    const agentHealth: Record<string, { healthy: boolean; details?: any }> = {}
    let healthyCount = 0

    const allAgents = this.registry.getAllAgents()

    for (const agent of allAgents) {
      try {
        const health = await agent.getHealthStatus()
        agentHealth[agent.getId()] = health
        if (health.healthy) healthyCount++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        agentHealth[agent.getId()] = {
          healthy: false,
          details: { error: errorMessage },
        }
      }
    }

    const overall = {
      totalAgents: allAgents.length,
      healthyAgents: healthyCount,
      activeRequests: this.activeRequests.size,
      analytics: this.analytics,
    }

    return {
      healthy: healthyCount > 0,
      agents: agentHealth,
      overall,
    }
  }

  // Analytics and monitoring
  getAnalytics(): any {
    return {
      ...this.analytics,
      orchestratorStats: this.orchestrator.getOverallStats(),
      agentHealth: this.registry.getAllAgents().map((agent) => ({
        id: agent.getId(),
        name: agent.getName(),
        healthy: agent.isHealthy(),
        priority: agent.getPriority(),
      })),
    }
  }

  private updateAnalytics(responseTime: number): void {
    // Update average response time
    const totalTime = this.analytics.averageResponseTime * (this.analytics.totalRequests - 1)
    this.analytics.averageResponseTime = (totalTime + responseTime) / this.analytics.totalRequests
  }

  // Agent management methods
  enableAgent(agentId: string): boolean {
    const agent = this.registry.getAgent(agentId)
    if (agent) {
      agent.enable()
      console.log(`✅ Agent enabled: ${agentId}`)
      return true
    }
    return false
  }

  disableAgent(agentId: string): boolean {
    const agent = this.registry.getAgent(agentId)
    if (agent) {
      agent.disable()
      console.log(`❌ Agent disabled: ${agentId}`)
      return true
    }
    return false
  }

  getAgentInfo(agentId: string): any {
    const agent = this.registry.getAgent(agentId)
    if (!agent) return null

    return {
      id: agent.getId(),
      name: agent.getName(),
      capabilities: agent.getCapabilities(),
      healthy: agent.isHealthy(),
      priority: agent.getPriority(),
    }
  }

  getAllAgentsInfo(): any[] {
    return this.registry.getAllAgents().map((agent) => this.getAgentInfo(agent.getId()))
  }

  // Configuration updates
  updateConfig(newConfig: Partial<AgentManagerConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('🔧 Agent manager configuration updated')
  }

  // Cache management
  async clearCaches(): Promise<void> {
    const cachingAgent = this.registry.getAgent('caching') as CachingAgent
    if (cachingAgent) {
      await cachingAgent.clearAll()
      console.log('🗑️ All caches cleared')
    }
  }

  getCacheInfo(): any {
    const cachingAgent = this.registry.getAgent('caching') as CachingAgent
    return cachingAgent ? cachingAgent.getCacheInfo() : null
  }

  // Data source management
  async refreshDataSources(): Promise<void> {
    const dataAgent = this.registry.getAgent('data-sourcing') as DataSourcingAgent
    if (dataAgent) {
      await dataAgent.refreshSourceHealth()
      console.log('🔄 Data sources refreshed')
    }
  }

  getDataSourceStats(): any {
    const dataAgent = this.registry.getAgent('data-sourcing') as DataSourcingAgent
    return dataAgent ? dataAgent.getSourceStats() : null
  }

  // Validation statistics
  getValidationStats(): any {
    const validationAgent = this.registry.getAgent('validation') as ValidationAgent
    return validationAgent ? validationAgent.getValidationStats() : null
  }

  // Error handling statistics
  getErrorStats(): any {
    const errorAgent = this.registry.getAgent('error-handling') as ErrorHandlingAgent
    return errorAgent ? errorAgent.getErrorStats() : null
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down agent manager...')

    // Wait for active requests to complete (with timeout)
    const activeRequestPromises = Array.from(this.activeRequests.values())
    if (activeRequestPromises.length > 0) {
      console.log(`⏳ Waiting for ${activeRequestPromises.length} active requests...`)

      try {
        await Promise.race([
          Promise.allSettled(activeRequestPromises),
          new Promise((resolve) => setTimeout(resolve, 5000)), // 5 second timeout
        ])
      } catch (error) {
        console.warn('Some requests did not complete during shutdown:', error)
      }
    }

    // Clear caches
    await this.clearCaches()

    console.log('✅ Agent manager shutdown complete')
  }
}

// Create singleton instance
let agentManagerInstance: AgentManager | null = null

export function getAgentManager(config?: Partial<AgentManagerConfig>): AgentManager {
  if (!agentManagerInstance) {
    agentManagerInstance = new AgentManager(config)
  }
  return agentManagerInstance
}

export function resetAgentManager(): void {
  if (agentManagerInstance) {
    agentManagerInstance.shutdown()
    agentManagerInstance = null
  }
}
