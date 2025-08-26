// Base Agent Interface for Multi-Agent System
export interface AgentContext {
  sessionId: string
  userId?: string
  requestId: string
  timestamp: Date
  specialization?: string
  researchPaper?: any
  conversation?: any[]
  metadata?: Record<string, any>
}

export interface AgentResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    agentId: string
    processingTime: number
    confidence: number
    sources?: string[]
    nextAgent?: string
  }
  context?: AgentContext
}

export interface AgentCapability {
  name: string
  description: string
  inputTypes: string[]
  outputTypes: string[]
  dependencies: string[]
}

export abstract class BaseAgent {
  protected id: string
  protected name: string
  protected capabilities: AgentCapability[]
  protected isEnabled: boolean = true
  protected priority: number = 1

  constructor(id: string, name: string, capabilities: AgentCapability[] = []) {
    this.id = id
    this.name = name
    this.capabilities = capabilities
  }

  // Abstract methods that each agent must implement
  abstract process(context: AgentContext): Promise<AgentResponse>
  abstract canHandle(context: AgentContext): boolean
  abstract getHealthStatus(): Promise<{ healthy: boolean; details?: any }>

  // Common methods
  getId(): string {
    return this.id
  }

  getName(): string {
    return this.name
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities
  }

  isHealthy(): boolean {
    return this.isEnabled
  }

  getPriority(): number {
    return this.priority
  }

  setPriority(priority: number): void {
    this.priority = priority
  }

  enable(): void {
    this.isEnabled = true
  }

  disable(): void {
    this.isEnabled = false
  }

  // Utility method for creating response
  protected createResponse<T>(
    success: boolean,
    data?: T,
    error?: string,
    metadata?: any,
  ): AgentResponse<T> {
    return {
      success,
      data,
      error,
      metadata: {
        agentId: this.id,
        processingTime: Date.now(),
        confidence: 0.8,
        ...metadata,
      },
    }
  }

  // Logging utility
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    console[level](`[${timestamp}] [${this.name}] ${message}`, data || '')
  }
}

// Agent Registry for managing all agents
export class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map()
  private agentsByCapability: Map<string, BaseAgent[]> = new Map()

  register(agent: BaseAgent): void {
    this.agents.set(agent.getId(), agent)

    // Index by capabilities
    agent.getCapabilities().forEach((capability) => {
      if (!this.agentsByCapability.has(capability.name)) {
        this.agentsByCapability.set(capability.name, [])
      }
      this.agentsByCapability.get(capability.name)!.push(agent)
    })

    console.log(`✅ Agent registered: ${agent.getName()} (${agent.getId()})`)
  }

  unregister(agentId: string): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      this.agents.delete(agentId)

      // Remove from capability index
      agent.getCapabilities().forEach((capability) => {
        const agentList = this.agentsByCapability.get(capability.name)
        if (agentList) {
          const index = agentList.findIndex((a) => a.getId() === agentId)
          if (index !== -1) {
            agentList.splice(index, 1)
          }
        }
      })

      console.log(`❌ Agent unregistered: ${agent.getName()}`)
    }
  }

  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId)
  }

  getAgentsByCapability(capability: string): BaseAgent[] {
    return this.agentsByCapability.get(capability) || []
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values())
  }

  getHealthyAgents(): BaseAgent[] {
    return Array.from(this.agents.values()).filter((agent) => agent.isHealthy())
  }

  async checkAllAgentsHealth(): Promise<Map<string, boolean>> {
    const healthMap = new Map<string, boolean>()

    for (const [agentId, agent] of this.agents) {
      try {
        const health = await agent.getHealthStatus()
        healthMap.set(agentId, health.healthy)
      } catch (error) {
        healthMap.set(agentId, false)
        console.error(`Health check failed for agent ${agentId}:`, error)
      }
    }

    return healthMap
  }
}
