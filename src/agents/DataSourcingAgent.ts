import { BaseAgent, AgentContext, AgentResponse } from './BaseAgent'

export interface DataSourceConfig {
  enableOpenAI: boolean
  enablePubMed: boolean
  enableLocalDatabase: boolean
  enableWebScraping: boolean
  timeoutMs: number
  maxRetries: number
  fallbackMode: 'sequential' | 'parallel'
  enableCircuitBreaker: boolean
}

export interface DataSource {
  id: string
  name: string
  priority: number
  isAvailable: boolean
  lastChecked: Date
  failureCount: number
  responseTime?: number
  costPerQuery?: number
}

export interface DataRequest {
  query: string
  type: 'research' | 'chat' | 'analysis' | 'validation'
  specialization?: string
  maxResults?: number
  filters?: Record<string, any>
}

export interface DataResponse {
  source: string
  data: any
  confidence: number
  responseTime: number
  cost?: number
  citations?: string[]
}

export class DataSourcingAgent extends BaseAgent {
  private config: DataSourceConfig
  private dataSources: Map<string, DataSource> = new Map()
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }> =
    new Map()
  private queryHistory: Array<{
    query: string
    source: string
    success: boolean
    timestamp: Date
  }> = []

  constructor(config: Partial<DataSourceConfig> = {}) {
    super('data-sourcing', 'Data Sourcing Agent', [
      {
        name: 'research_query',
        description: 'Searches medical research databases',
        inputTypes: ['query', 'research_context'],
        outputTypes: ['research_results', 'papers'],
        dependencies: [],
      },
      {
        name: 'fallback_search',
        description: 'Provides backup data sources when primary fails',
        inputTypes: ['failed_query', 'error_context'],
        outputTypes: ['backup_results', 'cached_data'],
        dependencies: [],
      },
      {
        name: 'data_validation',
        description: 'Validates and enriches sourced data',
        inputTypes: ['raw_data'],
        outputTypes: ['validated_data', 'quality_score'],
        dependencies: [],
      },
    ])

    this.config = {
      enableOpenAI: true,
      enablePubMed: true,
      enableLocalDatabase: true,
      enableWebScraping: false,
      timeoutMs: 15000,
      maxRetries: 3,
      fallbackMode: 'sequential',
      enableCircuitBreaker: true,
      ...config,
    }

    this.initializeDataSources()
  }

  async process(context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now()

    try {
      const request = this.parseRequest(context)

      this.log('info', 'Processing data request', {
        query: request.query,
        type: request.type,
        sessionId: context.sessionId,
      })

      // Get available data sources in priority order
      const availableSources = this.getAvailableDataSources()

      if (availableSources.length === 0) {
        throw new Error('No data sources available')
      }

      // Execute data sourcing strategy
      const result = await this.executeDataSourcing(request, availableSources, context)

      // Record query for analytics
      this.recordQuery(request.query, result.source, true)

      return this.createResponse(true, result, undefined, {
        processingTime: Date.now() - startTime,
        confidence: result.confidence,
        dataSource: result.source,
        responseTime: result.responseTime,
        fallbackUsed: result.source !== availableSources[0]?.id,
      })
    } catch (error) {
      this.log('error', 'Data sourcing failed', error)
      this.recordQuery(context.metadata?.query || 'unknown', 'none', false)

      return this.createResponse(false, undefined, `Data sourcing failed: ${error.message}`, {
        processingTime: Date.now() - startTime,
        confidence: 0,
      })
    }
  }

  canHandle(context: AgentContext): boolean {
    return !!(
      context.metadata?.query ||
      context.metadata?.type === 'research' ||
      context.conversation?.length ||
      context.researchPaper
    )
  }

  async getHealthStatus(): Promise<{ healthy: boolean; details?: any }> {
    const sourceHealth = new Map()
    let healthySources = 0

    for (const [sourceId, source] of this.dataSources) {
      const isHealthy = source.isAvailable && source.failureCount < 3
      sourceHealth.set(sourceId, isHealthy)
      if (isHealthy) healthySources++
    }

    return {
      healthy: healthySources > 0,
      details: {
        totalSources: this.dataSources.size,
        healthySources,
        sourceHealth: Object.fromEntries(sourceHealth),
        circuitBreakerStatus: Object.fromEntries(this.circuitBreakers),
        recentQueries: this.queryHistory.slice(-10),
      },
    }
  }

  // Initialize available data sources
  private initializeDataSources(): void {
    const sources: DataSource[] = [
      {
        id: 'openai',
        name: 'OpenAI GPT-4',
        priority: 1,
        isAvailable: this.config.enableOpenAI,
        lastChecked: new Date(),
        failureCount: 0,
        costPerQuery: 0.02,
      },
      {
        id: 'pubmed',
        name: 'PubMed API',
        priority: 2,
        isAvailable: this.config.enablePubMed,
        lastChecked: new Date(),
        failureCount: 0,
        costPerQuery: 0,
      },
      {
        id: 'local_db',
        name: 'Local Research Database',
        priority: 3,
        isAvailable: this.config.enableLocalDatabase,
        lastChecked: new Date(),
        failureCount: 0,
        costPerQuery: 0,
      },
      {
        id: 'web_scraping',
        name: 'Web Scraping',
        priority: 4,
        isAvailable: this.config.enableWebScraping,
        lastChecked: new Date(),
        failureCount: 0,
        costPerQuery: 0.001,
      },
    ]

    sources.forEach((source) => {
      this.dataSources.set(source.id, source)
      if (this.config.enableCircuitBreaker) {
        this.circuitBreakers.set(source.id, {
          failures: 0,
          lastFailure: new Date(0),
          isOpen: false,
        })
      }
    })

    this.log('info', `Initialized ${sources.length} data sources`)
  }

  // Parse request from context
  private parseRequest(context: AgentContext): DataRequest {
    const conversation = context.conversation || []
    const lastMessage = conversation[conversation.length - 1]?.content || ''

    return {
      query: context.metadata?.query || lastMessage || 'medical research query',
      type: context.metadata?.type || this.inferQueryType(lastMessage),
      specialization: context.specialization,
      maxResults: context.metadata?.maxResults || 10,
      filters: context.metadata?.filters || {},
    }
  }

  // Infer query type from content
  private inferQueryType(query: string): 'research' | 'chat' | 'analysis' | 'validation' {
    const lowerQuery = query.toLowerCase()

    if (
      lowerQuery.includes('research') ||
      lowerQuery.includes('study') ||
      lowerQuery.includes('trial')
    ) {
      return 'research'
    }
    if (
      lowerQuery.includes('analyze') ||
      lowerQuery.includes('compare') ||
      lowerQuery.includes('evaluate')
    ) {
      return 'analysis'
    }
    if (
      lowerQuery.includes('validate') ||
      lowerQuery.includes('verify') ||
      lowerQuery.includes('check')
    ) {
      return 'validation'
    }

    return 'chat'
  }

  // Get available data sources in priority order
  private getAvailableDataSources(): DataSource[] {
    return Array.from(this.dataSources.values())
      .filter((source) => source.isAvailable && !this.isCircuitBreakerOpen(source.id))
      .sort((a, b) => a.priority - b.priority)
  }

  // Execute data sourcing with fallback strategy
  private async executeDataSourcing(
    request: DataRequest,
    sources: DataSource[],
    context: AgentContext,
  ): Promise<DataResponse> {
    let lastError: Error | null = null

    // Try each source in priority order
    for (const source of sources) {
      try {
        this.log('info', `Trying data source: ${source.name}`)

        const result = await this.queryDataSource(source, request, context)

        if (result && result.data) {
          // Success - reset circuit breaker
          this.resetCircuitBreaker(source.id)
          this.updateSourceHealth(source.id, true)

          return result
        }
      } catch (error) {
        this.log('warn', `Data source failed: ${source.name}`, error)
        lastError = error as Error

        // Record failure
        this.recordSourceFailure(source.id)
        this.updateSourceHealth(source.id, false)
      }
    }

    // If all sources failed, try emergency fallback
    if (lastError) {
      const fallbackResult = await this.emergencyFallback(request, context)
      if (fallbackResult) {
        return fallbackResult
      }
    }

    throw new Error(`All data sources failed. Last error: ${lastError?.message || 'Unknown error'}`)
  }

  // Query individual data source
  private async queryDataSource(
    source: DataSource,
    request: DataRequest,
    context: AgentContext,
  ): Promise<DataResponse | null> {
    const startTime = Date.now()

    try {
      let data: any = null

      switch (source.id) {
        case 'openai':
          data = await this.queryOpenAI(request, context)
          break
        case 'pubmed':
          data = await this.queryPubMed(request, context)
          break
        case 'local_db':
          data = await this.queryLocalDatabase(request, context)
          break
        case 'web_scraping':
          data = await this.queryWebScraping(request, context)
          break
        default:
          throw new Error(`Unknown data source: ${source.id}`)
      }

      const responseTime = Date.now() - startTime

      return {
        source: source.id,
        data,
        confidence: this.calculateConfidence(source, data),
        responseTime,
        cost: source.costPerQuery,
        citations: this.extractCitations(data),
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      source.responseTime = responseTime
      throw error
    }
  }

  // Data source implementations
  private async queryOpenAI(request: DataRequest, context: AgentContext): Promise<any> {
    // Check if OpenAI service is available (simulate check)
    const isAvailable = Math.random() > 0.1 // 90% availability simulation

    if (!isAvailable) {
      throw new Error('OpenAI service temporarily unavailable')
    }

    // Simulate OpenAI response based on query type
    switch (request.type) {
      case 'research':
        return {
          type: 'research_response',
          summary: `AI-generated research summary for: ${request.query}`,
          findings: [
            'Recent studies show promising results in this area',
            'Multiple clinical trials have validated the approach',
            'Safety profile appears favorable across populations',
          ],
          confidence: 0.85,
          sourceType: 'ai_generated',
        }

      case 'analysis':
        return {
          type: 'analysis_response',
          analysis: `Comprehensive analysis of: ${request.query}`,
          keyPoints: [
            'Methodology appears sound and well-designed',
            'Statistical significance achieved in primary endpoints',
            'Limitations include small sample size in subgroups',
          ],
          confidence: 0.8,
          sourceType: 'ai_analysis',
        }

      default:
        return {
          type: 'chat_response',
          response: `Based on current medical literature, regarding ${request.query}: This appears to be an area of active research with several promising developments.`,
          confidence: 0.75,
          sourceType: 'ai_chat',
        }
    }
  }

  private async queryPubMed(request: DataRequest, context: AgentContext): Promise<any> {
    // Simulate PubMed API call
    const isAvailable = Math.random() > 0.05 // 95% availability

    if (!isAvailable) {
      throw new Error('PubMed API timeout')
    }

    // Simulate PubMed search results
    return {
      type: 'pubmed_results',
      papers: [
        {
          title: `Clinical efficacy study related to ${request.query}`,
          authors: ['Smith J', 'Johnson A', 'Williams R'],
          journal: 'Journal of Medical Research',
          year: 2024,
          abstract: `This study investigated the clinical applications of ${request.query} in a randomized controlled trial...`,
          pmid: '12345678',
          doi: '10.1234/jmr.2024.001',
        },
      ],
      totalResults: 247,
      confidence: 0.9,
      sourceType: 'pubmed_api',
    }
  }

  private async queryLocalDatabase(request: DataRequest, context: AgentContext): Promise<any> {
    // Simulate local database query (always available)
    return {
      type: 'local_db_results',
      data: {
        summary: `Local database information for: ${request.query}`,
        cachedResults: [
          'Previously cached research findings available',
          'Local analysis based on stored medical literature',
          'Offline research database contains relevant studies',
        ],
        lastUpdated: new Date().toISOString(),
        confidence: 0.7,
        sourceType: 'local_database',
      },
    }
  }

  private async queryWebScraping(request: DataRequest, context: AgentContext): Promise<any> {
    // Simulate web scraping (lower reliability)
    const isAvailable = Math.random() > 0.2 // 80% availability

    if (!isAvailable) {
      throw new Error('Web scraping sources unavailable')
    }

    return {
      type: 'web_scraping_results',
      scrapedData: [
        {
          source: 'medical research website',
          content: `Web-sourced information about ${request.query}`,
          url: 'https://example-medical-site.com',
          lastCrawled: new Date().toISOString(),
        },
      ],
      confidence: 0.6,
      sourceType: 'web_scraping',
    }
  }

  // Emergency fallback when all sources fail
  private async emergencyFallback(
    request: DataRequest,
    context: AgentContext,
  ): Promise<DataResponse | null> {
    this.log('info', 'Executing emergency fallback')

    // Return static fallback response
    const fallbackData = {
      type: 'emergency_fallback',
      message:
        'I apologize, but our research services are temporarily experiencing issues. However, I can provide some general guidance.',
      fallbackContent: this.generateFallbackContent(request.query),
      confidence: 0.4,
      sourceType: 'emergency_fallback',
    }

    return {
      source: 'emergency_fallback',
      data: fallbackData,
      confidence: 0.4,
      responseTime: 100,
      cost: 0,
    }
  }

  // Generate fallback content based on query
  private generateFallbackContent(query: string): string {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('clinical trial') || lowerQuery.includes('study')) {
      return 'For clinical trial information, I recommend checking ClinicalTrials.gov directly or consulting with medical professionals for the most current data.'
    }

    if (lowerQuery.includes('drug') || lowerQuery.includes('medication')) {
      return 'For drug information, please consult official prescribing information or speak with a pharmacist or physician for accurate, up-to-date details.'
    }

    if (lowerQuery.includes('treatment') || lowerQuery.includes('therapy')) {
      return 'Treatment decisions should always be made in consultation with qualified healthcare providers who can assess your specific situation.'
    }

    return 'For the most reliable medical information, I recommend consulting peer-reviewed medical literature or speaking with healthcare professionals.'
  }

  // Circuit breaker implementation
  private isCircuitBreakerOpen(sourceId: string): boolean {
    if (!this.config.enableCircuitBreaker) return false

    const breaker = this.circuitBreakers.get(sourceId)
    if (!breaker) return false

    // Check if cooldown period has passed
    const cooldownMs = 60000 // 1 minute
    const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime()

    if (timeSinceLastFailure > cooldownMs && breaker.isOpen) {
      // Try to reset circuit breaker
      breaker.isOpen = false
      breaker.failures = 0
      this.log('info', `Circuit breaker reset for source: ${sourceId}`)
    }

    return breaker.isOpen
  }

  private recordSourceFailure(sourceId: string): void {
    if (!this.config.enableCircuitBreaker) return

    const breaker = this.circuitBreakers.get(sourceId)
    if (breaker) {
      breaker.failures++
      breaker.lastFailure = new Date()

      // Open circuit breaker after 3 failures
      if (breaker.failures >= 3) {
        breaker.isOpen = true
        this.log('warn', `Circuit breaker opened for source: ${sourceId}`)
      }
    }
  }

  private resetCircuitBreaker(sourceId: string): void {
    if (!this.config.enableCircuitBreaker) return

    const breaker = this.circuitBreakers.get(sourceId)
    if (breaker) {
      breaker.failures = 0
      breaker.isOpen = false
    }
  }

  // Utility methods
  private updateSourceHealth(sourceId: string, isHealthy: boolean): void {
    const source = this.dataSources.get(sourceId)
    if (source) {
      source.isAvailable = isHealthy
      source.lastChecked = new Date()
      if (isHealthy) {
        source.failureCount = 0
      } else {
        source.failureCount++
      }
    }
  }

  private calculateConfidence(source: DataSource, data: any): number {
    let baseConfidence = 0.5

    // Adjust based on source type
    switch (source.id) {
      case 'openai':
        baseConfidence = 0.85
        break
      case 'pubmed':
        baseConfidence = 0.95
        break
      case 'local_db':
        baseConfidence = 0.8
        break
      case 'web_scraping':
        baseConfidence = 0.6
        break
    }

    // Adjust based on data quality
    if (data?.confidence) {
      baseConfidence = (baseConfidence + data.confidence) / 2
    }

    // Adjust based on source reliability
    if (source.failureCount > 0) {
      baseConfidence *= Math.max(0.5, 1 - source.failureCount * 0.1)
    }

    return Math.min(1.0, Math.max(0.1, baseConfidence))
  }

  private extractCitations(data: any): string[] {
    const citations: string[] = []

    if (data?.papers) {
      data.papers.forEach((paper: any) => {
        if (paper.doi) citations.push(paper.doi)
        if (paper.pmid) citations.push(`PMID: ${paper.pmid}`)
      })
    }

    return citations
  }

  private recordQuery(query: string, source: string, success: boolean): void {
    this.queryHistory.push({
      query: query.substring(0, 100), // Limit length
      source,
      success,
      timestamp: new Date(),
    })

    // Keep only last 100 queries
    if (this.queryHistory.length > 100) {
      this.queryHistory.splice(0, this.queryHistory.length - 100)
    }
  }

  // Analytics methods
  getSourceStats(): any {
    const stats = {
      totalQueries: this.queryHistory.length,
      successRate: 0,
      sourceUsage: {} as Record<string, number>,
      averageResponseTime: 0,
    }

    const successfulQueries = this.queryHistory.filter((q) => q.success)
    stats.successRate =
      this.queryHistory.length > 0 ? successfulQueries.length / this.queryHistory.length : 0

    // Calculate source usage
    this.queryHistory.forEach((query) => {
      stats.sourceUsage[query.source] = (stats.sourceUsage[query.source] || 0) + 1
    })

    // Calculate average response time
    const sourcesWithTimes = Array.from(this.dataSources.values()).filter((s) => s.responseTime)
    if (sourcesWithTimes.length > 0) {
      stats.averageResponseTime =
        sourcesWithTimes.reduce((sum, s) => sum + (s.responseTime || 0), 0) /
        sourcesWithTimes.length
    }

    return stats
  }

  // Force refresh source availability
  async refreshSourceHealth(): Promise<void> {
    for (const [sourceId, source] of this.dataSources) {
      try {
        // Simple health check (would be more sophisticated in real implementation)
        const isHealthy = Math.random() > 0.1 // Simulate 90% uptime
        this.updateSourceHealth(sourceId, isHealthy)

        if (isHealthy) {
          this.resetCircuitBreaker(sourceId)
        }
      } catch (error) {
        this.updateSourceHealth(sourceId, false)
      }
    }

    this.log('info', 'Source health refresh completed')
  }
}
