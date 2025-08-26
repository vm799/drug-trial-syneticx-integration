import { BaseAgent, AgentContext, AgentResponse } from './BaseAgent'

export interface CacheConfig {
  enableRedis: boolean
  enableMemoryCache: boolean
  enableBrowserCache: boolean
  redisTTL: number
  memoryTTL: number
  browserTTL: number
  maxMemoryCacheSize: number
  enablePredictiveCaching: boolean
  enableCompression: boolean
}

export interface CacheEntry {
  key: string
  data: any
  timestamp: Date
  ttl: number
  accessCount: number
  lastAccessed: Date
  size?: number
  tags?: string[]
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  evictions: number
  hitRate: number
}

export class CachingAgent extends BaseAgent {
  private config: CacheConfig
  private memoryCache: Map<string, CacheEntry> = new Map()
  private cacheStats: CacheStats = { hits: 0, misses: 0, sets: 0, evictions: 0, hitRate: 0 }
  private redisClient: any = null // Will be initialized if Redis is available
  private currentMemorySize: number = 0

  constructor(config: Partial<CacheConfig> = {}) {
    super('caching', 'Caching Agent', [
      {
        name: 'cache_retrieval',
        description: 'Retrieves cached responses and data',
        inputTypes: ['cache_key', 'query'],
        outputTypes: ['cached_data', 'cache_miss'],
        dependencies: []
      },
      {
        name: 'cache_storage',
        description: 'Stores responses in multi-layer cache',
        inputTypes: ['data', 'cache_key'],
        outputTypes: ['cache_stored'],
        dependencies: []
      },
      {
        name: 'predictive_caching',
        description: 'Pre-caches likely needed data',
        inputTypes: ['user_pattern', 'context'],
        outputTypes: ['predictive_cache'],
        dependencies: []
      }
    ])

    this.config = {
      enableRedis: false, // Will be enabled when Redis is available
      enableMemoryCache: true,
      enableBrowserCache: true,
      redisTTL: 24 * 60 * 60, // 24 hours
      memoryTTL: 60 * 60, // 1 hour
      browserTTL: 30 * 60, // 30 minutes
      maxMemoryCacheSize: 50 * 1024 * 1024, // 50MB
      enablePredictiveCaching: true,
      enableCompression: false,
      ...config
    }

    this.initializeRedis()
  }

  async process(context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now()

    try {
      const operation = context.metadata?.operation || 'get'
      const cacheKey = this.generateCacheKey(context)

      this.log('info', `Cache operation: ${operation}`, { 
        cacheKey,
        sessionId: context.sessionId 
      })

      let result: any

      switch (operation) {
        case 'get':
          result = await this.get(cacheKey, context)
          break
        case 'set':
          result = await this.set(cacheKey, context.metadata?.data, context)
          break
        case 'invalidate':
          result = await this.invalidate(cacheKey, context)
          break
        case 'predictive':
          result = await this.predictiveCaching(context)
          break
        default:
          result = await this.get(cacheKey, context)
      }

      this.updateStats()

      return this.createResponse(true, result, undefined, {
        processingTime: Date.now() - startTime,
        confidence: result?.cached ? 1.0 : 0.5,
        cacheKey,
        operation,
        cacheStats: this.getCacheStats()
      })

    } catch (error) {
      this.log('error', 'Cache operation failed', error)
      
      return this.createResponse(false, undefined, `Cache operation failed: ${error.message}`, {
        processingTime: Date.now() - startTime,
        confidence: 0
      })
    }
  }

  canHandle(context: AgentContext): boolean {
    return !!(
      context.metadata?.operation === 'cache' ||
      context.metadata?.cacheKey ||
      context.metadata?.enableCaching !== false
    )
  }

  async getHealthStatus(): Promise<{ healthy: boolean; details?: any }> {
    const memoryUsage = (this.currentMemorySize / this.config.maxMemoryCacheSize) * 100
    
    return {
      healthy: memoryUsage < 90,
      details: {
        memoryCacheSize: this.memoryCache.size,
        memoryUsagePercent: memoryUsage,
        redisConnected: !!this.redisClient,
        cacheStats: this.cacheStats,
        config: this.config
      }
    }
  }

  // Initialize Redis connection if available
  private async initializeRedis(): Promise<void> {
    if (!this.config.enableRedis) return

    try {
      // In a real implementation, you would connect to Redis here
      // For now, we'll simulate Redis being unavailable
      this.log('info', 'Redis not available, using memory cache only')
    } catch (error) {
      this.log('warn', 'Redis initialization failed, falling back to memory cache', error)
      this.config.enableRedis = false
    }
  }

  // Generate cache key from context
  private generateCacheKey(context: AgentContext): string {
    const components = []

    // Include user context
    if (context.userId) components.push(`user:${context.userId}`)
    
    // Include specialization
    if (context.specialization) components.push(`spec:${context.specialization}`)
    
    // Include research paper context
    if (context.researchPaper?.title) {
      const paperKey = context.researchPaper.title.substring(0, 50).replace(/\s+/g, '_')
      components.push(`paper:${paperKey}`)
    }

    // Include conversation context
    if (context.conversation?.length) {
      const lastMessage = context.conversation[context.conversation.length - 1]?.content || ''
      const messageHash = this.simpleHash(lastMessage.substring(0, 100))
      components.push(`msg:${messageHash}`)
    }

    // Include query hash if available
    if (context.metadata?.query) {
      const queryHash = this.simpleHash(context.metadata.query)
      components.push(`query:${queryHash}`)
    }

    return `med_research:${components.join(':')}`.toLowerCase()
  }

  // Get data from cache
  private async get(key: string, context: AgentContext): Promise<any> {
    // Try memory cache first (fastest)
    const memoryResult = this.getFromMemory(key)
    if (memoryResult) {
      this.cacheStats.hits++
      this.log('info', 'Cache hit - memory', { key })
      return { data: memoryResult.data, cached: true, source: 'memory' }
    }

    // Try Redis cache (if available)
    if (this.config.enableRedis && this.redisClient) {
      const redisResult = await this.getFromRedis(key)
      if (redisResult) {
        this.cacheStats.hits++
        // Also store in memory for faster access
        this.setInMemory(key, redisResult, this.config.memoryTTL)
        this.log('info', 'Cache hit - Redis', { key })
        return { data: redisResult, cached: true, source: 'redis' }
      }
    }

    // Try browser cache (for client-side caching)
    if (this.config.enableBrowserCache && typeof window !== 'undefined') {
      const browserResult = this.getFromBrowser(key)
      if (browserResult) {
        this.cacheStats.hits++
        this.log('info', 'Cache hit - browser', { key })
        return { data: browserResult, cached: true, source: 'browser' }
      }
    }

    // Cache miss
    this.cacheStats.misses++
    this.log('info', 'Cache miss', { key })
    return { data: null, cached: false, source: null }
  }

  // Set data in cache
  private async set(key: string, data: any, context: AgentContext): Promise<any> {
    if (!data) {
      this.log('warn', 'Attempted to cache null/undefined data', { key })
      return { stored: false, reason: 'No data to cache' }
    }

    const results = []

    // Store in memory cache
    if (this.config.enableMemoryCache) {
      const memoryResult = this.setInMemory(key, data, this.config.memoryTTL)
      results.push({ layer: 'memory', success: memoryResult })
    }

    // Store in Redis cache
    if (this.config.enableRedis && this.redisClient) {
      const redisResult = await this.setInRedis(key, data, this.config.redisTTL)
      results.push({ layer: 'redis', success: redisResult })
    }

    // Store in browser cache
    if (this.config.enableBrowserCache && typeof window !== 'undefined') {
      const browserResult = this.setInBrowser(key, data, this.config.browserTTL)
      results.push({ layer: 'browser', success: browserResult })
    }

    this.cacheStats.sets++
    this.log('info', 'Data cached', { key, layers: results.length })

    return { stored: true, layers: results }
  }

  // Invalidate cache entry
  private async invalidate(key: string, context: AgentContext): Promise<any> {
    const results = []

    // Invalidate memory cache
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!
      this.currentMemorySize -= entry.size || 0
      this.memoryCache.delete(key)
      results.push({ layer: 'memory', success: true })
    }

    // Invalidate Redis cache
    if (this.config.enableRedis && this.redisClient) {
      const redisResult = await this.removeFromRedis(key)
      results.push({ layer: 'redis', success: redisResult })
    }

    // Invalidate browser cache
    if (this.config.enableBrowserCache && typeof window !== 'undefined') {
      const browserResult = this.removeFromBrowser(key)
      results.push({ layer: 'browser', success: browserResult })
    }

    this.log('info', 'Cache invalidated', { key, layers: results.length })
    return { invalidated: true, layers: results }
  }

  // Predictive caching based on user patterns
  private async predictiveCaching(context: AgentContext): Promise<any> {
    if (!this.config.enablePredictiveCaching) {
      return { predictive: false, reason: 'Predictive caching disabled' }
    }

    const predictions = this.generatePredictions(context)
    const cachedPredictions = []

    for (const prediction of predictions) {
      // Check if we already have this data cached
      const existingData = await this.get(prediction.key, context)
      if (!existingData.cached) {
        // Pre-generate and cache this data
        const predictedData = await this.generatePredictedData(prediction, context)
        if (predictedData) {
          await this.set(prediction.key, predictedData, context)
          cachedPredictions.push(prediction)
        }
      }
    }

    this.log('info', 'Predictive caching completed', { 
      predictions: predictions.length, 
      cached: cachedPredictions.length 
    })

    return { 
      predictive: true, 
      predictions: predictions.length,
      cached: cachedPredictions.length
    }
  }

  // Memory cache operations
  private getFromMemory(key: string): CacheEntry | null {
    const entry = this.memoryCache.get(key)
    if (!entry) return null

    // Check if expired
    const now = Date.now()
    const ageSeconds = (now - entry.timestamp.getTime()) / 1000
    
    if (ageSeconds > entry.ttl) {
      this.currentMemorySize -= entry.size || 0
      this.memoryCache.delete(key)
      this.cacheStats.evictions++
      return null
    }

    // Update access info
    entry.accessCount++
    entry.lastAccessed = new Date()

    return entry
  }

  private setInMemory(key: string, data: any, ttlSeconds: number): boolean {
    try {
      const serialized = JSON.stringify(data)
      const size = serialized.length

      // Check memory limit
      if (this.currentMemorySize + size > this.config.maxMemoryCacheSize) {
        this.evictLeastUsed()
      }

      const entry: CacheEntry = {
        key,
        data,
        timestamp: new Date(),
        ttl: ttlSeconds,
        accessCount: 0,
        lastAccessed: new Date(),
        size
      }

      this.memoryCache.set(key, entry)
      this.currentMemorySize += size

      return true
    } catch (error) {
      this.log('error', 'Memory cache set failed', error)
      return false
    }
  }

  // Redis cache operations (stubbed for now)
  private async getFromRedis(key: string): Promise<any> {
    // Placeholder for Redis implementation
    return null
  }

  private async setInRedis(key: string, data: any, ttlSeconds: number): Promise<boolean> {
    // Placeholder for Redis implementation
    return false
  }

  private async removeFromRedis(key: string): Promise<boolean> {
    // Placeholder for Redis implementation
    return false
  }

  // Browser cache operations
  private getFromBrowser(key: string): any {
    if (typeof localStorage === 'undefined') return null

    try {
      const item = localStorage.getItem(`medresearch_cache_${key}`)
      if (!item) return null

      const parsed = JSON.parse(item)
      const now = Date.now()
      
      if (now > parsed.expires) {
        localStorage.removeItem(`medresearch_cache_${key}`)
        return null
      }

      return parsed.data
    } catch (error) {
      return null
    }
  }

  private setInBrowser(key: string, data: any, ttlSeconds: number): boolean {
    if (typeof localStorage === 'undefined') return false

    try {
      const item = {
        data,
        expires: Date.now() + (ttlSeconds * 1000)
      }

      localStorage.setItem(`medresearch_cache_${key}`, JSON.stringify(item))
      return true
    } catch (error) {
      return false
    }
  }

  private removeFromBrowser(key: string): boolean {
    if (typeof localStorage === 'undefined') return false

    try {
      localStorage.removeItem(`medresearch_cache_${key}`)
      return true
    } catch (error) {
      return false
    }
  }

  // Cache management
  private evictLeastUsed(): void {
    if (this.memoryCache.size === 0) return

    let leastUsedKey = ''
    let leastUsedCount = Infinity
    let oldestAccess = Date.now()

    for (const [key, entry] of this.memoryCache) {
      const accessTime = entry.lastAccessed.getTime()
      if (entry.accessCount < leastUsedCount || 
          (entry.accessCount === leastUsedCount && accessTime < oldestAccess)) {
        leastUsedKey = key
        leastUsedCount = entry.accessCount
        oldestAccess = accessTime
      }
    }

    if (leastUsedKey) {
      const entry = this.memoryCache.get(leastUsedKey)!
      this.currentMemorySize -= entry.size || 0
      this.memoryCache.delete(leastUsedKey)
      this.cacheStats.evictions++
      this.log('info', 'Evicted least used cache entry', { key: leastUsedKey })
    }
  }

  // Utility methods
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private generatePredictions(context: AgentContext): Array<{ key: string, type: string, confidence: number }> {
    const predictions = []

    // Predict related research papers
    if (context.researchPaper) {
      predictions.push({
        key: `related_papers:${this.simpleHash(context.researchPaper.title)}`,
        type: 'related_papers',
        confidence: 0.8
      })
    }

    // Predict follow-up questions
    if (context.conversation?.length) {
      const lastMessage = context.conversation[context.conversation.length - 1]?.content || ''
      predictions.push({
        key: `followup:${this.simpleHash(lastMessage)}`,
        type: 'followup_questions',
        confidence: 0.6
      })
    }

    return predictions
  }

  private async generatePredictedData(prediction: any, context: AgentContext): Promise<any> {
    // Placeholder for generating predicted data
    // In a real implementation, this would call appropriate services
    return null
  }

  private updateStats(): void {
    const total = this.cacheStats.hits + this.cacheStats.misses
    this.cacheStats.hitRate = total > 0 ? this.cacheStats.hits / total : 0
  }

  // Public methods for accessing cache stats
  getCacheStats(): CacheStats {
    return { ...this.cacheStats }
  }

  getCacheInfo(): any {
    return {
      memoryCache: {
        size: this.memoryCache.size,
        memorySizeBytes: this.currentMemorySize,
        maxSizeBytes: this.config.maxMemoryCacheSize,
        utilizationPercent: (this.currentMemorySize / this.config.maxMemoryCacheSize) * 100
      },
      stats: this.cacheStats,
      config: this.config
    }
  }

  // Clear all caches
  async clearAll(): Promise<void> {
    this.memoryCache.clear()
    this.currentMemorySize = 0
    
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('medresearch_cache_'))
      keys.forEach(key => localStorage.removeItem(key))
    }
    
    this.log('info', 'All caches cleared')
  }
}
