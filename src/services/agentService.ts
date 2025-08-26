import { getAgentManager, type AgentManager, type ChatRequest, type ChatResponse } from '../agents/AgentManager'

interface AgentServiceConfig {
  enableOfflineMode: boolean
  cacheResponses: boolean
  maxRetries: number
  retryDelay: number
}

class AgentService {
  private agentManager: AgentManager
  private config: AgentServiceConfig
  private isInitialized: boolean = false
  private initializationPromise: Promise<void> | null = null

  constructor(config: Partial<AgentServiceConfig> = {}) {
    this.config = {
      enableOfflineMode: true,
      cacheResponses: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    }

    // Initialize agent manager
    this.agentManager = getAgentManager({
      enableCaching: this.config.cacheResponses,
      enableValidation: true,
      enableErrorHandling: true,
      enableDataSourcing: true,
      enableAnalytics: true,
      defaultTimeout: 30000,
      maxConcurrentRequests: 5
    })
  }

  // Initialize the service
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = this.performInitialization()
    await this.initializationPromise
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🚀 Initializing Multi-Agent Research System...')

      // Check system health
      const health = await this.agentManager.checkSystemHealth()
      
      if (!health.healthy) {
        console.warn('⚠️ Some agents are not healthy, but system will operate in degraded mode')
      }

      console.log('✅ Multi-Agent system initialized successfully')
      console.log(`📊 System Status: ${health.overall.healthyAgents}/${health.overall.totalAgents} agents healthy`)
      
      this.isInitialized = true

    } catch (error) {
      console.error('❌ Failed to initialize agent service:', error)
      
      if (this.config.enableOfflineMode) {
        console.log('🔄 Falling back to offline mode')
        this.isInitialized = true // Allow operation in degraded mode
      } else {
        throw error
      }
    }
  }

  // Process chat message through multi-agent system
  async processMessage(
    message: string,
    sessionId: string,
    options: {
      userId?: string
      specialization?: string
      researchPaper?: any
      conversationHistory?: Array<{ type: 'user' | 'assistant', content: string }>
      metadata?: Record<string, any>
    } = {}
  ): Promise<ChatResponse> {
    await this.initialize()

    const request: ChatRequest = {
      message,
      sessionId,
      userId: options.userId,
      specialization: options.specialization,
      researchPaper: options.researchPaper,
      conversationHistory: options.conversationHistory,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ...options.metadata
      }
    }

    let lastError: Error | null = null
    
    // Retry logic
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🤖 Processing message (attempt ${attempt}/${this.config.maxRetries})`)
        
        const response = await this.agentManager.processChat(request)
        
        // Log successful processing
        console.log(`✅ Message processed successfully`, {
          confidence: response.confidence,
          agentsUsed: response.metadata.agentsUsed,
          processingTime: response.metadata.processingTime,
          cached: response.metadata.cached
        })

        return response

      } catch (error) {
        lastError = error as Error
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message)

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt)
        }
      }
    }

    // All retries failed, return error response
    console.error('❌ All processing attempts failed:', lastError?.message)
    
    return {
      content: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
      confidence: 0.1,
      sources: [],
      metadata: {
        agentsUsed: ['error-fallback'],
        processingTime: 100,
        cached: false,
        validated: false,
        errorRecovered: true
      },
      error: lastError?.message
    }
  }

  // Quick action processing (for buttons like "summarize", "critique", etc.)
  async processQuickAction(
    action: string,
    sessionId: string,
    options: {
      researchPaper?: any
      specialization?: string
      userId?: string
    } = {}
  ): Promise<ChatResponse> {
    const actionMessages = {
      summarize: 'Please provide a comprehensive summary of this research paper, highlighting the key findings and methodology.',
      methodology: 'Can you explain the research methodologies used in this study and evaluate their appropriateness?',
      critique: 'What are the strengths and limitations of this research? Please provide a balanced critique.',
      related: 'Can you find and show me related studies on this topic? Focus on recent, high-quality research.',
      implications: 'What are the clinical implications of these research findings?',
      statistics: 'Can you explain the statistical methods and results presented in this study?'
    }

    const message = actionMessages[action as keyof typeof actionMessages] || 
                   `Please help me analyze this research with focus on: ${action}`

    return this.processMessage(message, sessionId, {
      ...options,
      metadata: {
        type: 'quick_action',
        action,
        automated: true
      }
    })
  }

  // Get system health status
  async getSystemHealth(): Promise<any> {
    await this.initialize()
    return this.agentManager.checkSystemHealth()
  }

  // Get analytics and usage statistics
  getAnalytics(): any {
    if (!this.isInitialized) return null
    return this.agentManager.getAnalytics()
  }

  // Cache management
  async clearCaches(): Promise<void> {
    if (!this.isInitialized) return
    await this.agentManager.clearCaches()
  }

  getCacheInfo(): any {
    if (!this.isInitialized) return null
    return this.agentManager.getCacheInfo()
  }

  // Data source management
  async refreshDataSources(): Promise<void> {
    if (!this.isInitialized) return
    await this.agentManager.refreshDataSources()
  }

  getDataSourceStats(): any {
    if (!this.isInitialized) return null
    return this.agentManager.getDataSourceStats()
  }

  // Get detailed agent information
  getAgentInfo(): any[] {
    if (!this.isInitialized) return []
    return this.agentManager.getAllAgentsInfo()
  }

  // Enable/disable specific agents
  enableAgent(agentId: string): boolean {
    if (!this.isInitialized) return false
    return this.agentManager.enableAgent(agentId)
  }

  disableAgent(agentId: string): boolean {
    if (!this.isInitialized) return false
    return this.agentManager.disableAgent(agentId)
  }

  // Configuration management
  updateConfig(newConfig: Partial<AgentServiceConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (this.isInitialized) {
      this.agentManager.updateConfig({
        enableCaching: this.config.cacheResponses,
        maxConcurrentRequests: 5
      })
    }
  }

  // Service status
  isServiceReady(): boolean {
    return this.isInitialized
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return
    
    console.log('🛑 Shutting down agent service...')
    await this.agentManager.shutdown()
    this.isInitialized = false
    this.initializationPromise = null
    console.log('✅ Agent service shutdown complete')
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Performance monitoring
  getPerformanceMetrics(): {
    totalRequests: number
    successRate: number
    averageResponseTime: number
    cacheHitRate: number
    agentHealth: Record<string, boolean>
  } {
    if (!this.isInitialized) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        agentHealth: {}
      }
    }

    const analytics = this.getAnalytics()
    const cacheInfo = this.getCacheInfo()
    
    return {
      totalRequests: analytics?.totalRequests || 0,
      successRate: analytics?.totalRequests > 0 
        ? (analytics.successfulRequests / analytics.totalRequests) 
        : 0,
      averageResponseTime: analytics?.averageResponseTime || 0,
      cacheHitRate: cacheInfo?.stats?.hitRate || 0,
      agentHealth: analytics?.agentHealth?.reduce((acc: Record<string, boolean>, agent: any) => {
        acc[agent.id] = agent.healthy
        return acc
      }, {}) || {}
    }
  }

  // Diagnostic methods
  async runDiagnostics(): Promise<{
    overallHealth: boolean
    issues: string[]
    recommendations: string[]
    agentStatuses: Record<string, any>
  }> {
    await this.initialize()

    const health = await this.getSystemHealth()
    const analytics = this.getAnalytics()
    const cacheInfo = this.getCacheInfo()
    
    const issues: string[] = []
    const recommendations: string[] = []

    // Check for unhealthy agents
    Object.entries(health.agents).forEach(([agentId, status]) => {
      if (!status.healthy) {
        issues.push(`Agent ${agentId} is not healthy`)
        recommendations.push(`Check ${agentId} agent configuration and dependencies`)
      }
    })

    // Check performance issues
    if (analytics?.averageResponseTime > 10000) {
      issues.push('High average response time detected')
      recommendations.push('Consider optimizing agent configurations or increasing timeout values')
    }

    // Check cache performance
    if (cacheInfo?.stats?.hitRate < 0.3) {
      issues.push('Low cache hit rate detected')
      recommendations.push('Review caching strategies and increase cache TTL if appropriate')
    }

    return {
      overallHealth: health.healthy && issues.length === 0,
      issues,
      recommendations,
      agentStatuses: health.agents
    }
  }
}

// Create singleton instance
let agentServiceInstance: AgentService | null = null

export function getAgentService(config?: Partial<AgentServiceConfig>): AgentService {
  if (!agentServiceInstance) {
    agentServiceInstance = new AgentService(config)
  }
  return agentServiceInstance
}

export function resetAgentService(): void {
  if (agentServiceInstance) {
    agentServiceInstance.shutdown()
    agentServiceInstance = null
  }
}

export default getAgentService()
export type { ChatResponse }
