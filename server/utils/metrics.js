// Prometheus metrics configuration and setup
import client from 'prom-client'
import os from 'os'

// Create a Registry to register metrics
const register = new client.Registry()

// Set default labels for all metrics
register.setDefaultLabels({
  app: 'medresearch-ai',
  version: process.env.npm_package_version || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  instance: process.env.HOSTNAME || os.hostname(),
})

// Collect default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
})

export function createPrometheusMetrics() {
  // HTTP Request Metrics
  const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
  })

  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
  })

  const httpRequestSize = new client.Histogram({
    name: 'http_request_size_bytes',
    help: 'HTTP request size in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
    registers: [register],
  })

  const httpResponseSize = new client.Histogram({
    name: 'http_response_size_bytes',
    help: 'HTTP response size in bytes',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
    registers: [register],
  })

  // Authentication Metrics
  const authAttemptsTotal = new client.Counter({
    name: 'auth_attempts_total',
    help: 'Total number of authentication attempts',
    labelNames: ['method', 'success', 'failure_reason'],
    registers: [register],
  })

  const authTokensActive = new client.Gauge({
    name: 'auth_tokens_active',
    help: 'Number of active authentication tokens',
    registers: [register],
  })

  const authSessionDuration = new client.Histogram({
    name: 'auth_session_duration_seconds',
    help: 'User session duration in seconds',
    buckets: [60, 300, 900, 1800, 3600, 7200, 14400, 28800, 86400],
    registers: [register],
  })

  // Database Metrics
  const dbQueryTotal = new client.Counter({
    name: 'db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['type', 'collection', 'success'],
    registers: [register],
  })

  const dbQueryDuration = new client.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['type', 'collection', 'success'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [register],
  })

  const dbConnectionsActive = new client.Gauge({
    name: 'db_connections_active',
    help: 'Number of active database connections',
    registers: [register],
  })

  const dbDocumentsTotal = new client.Gauge({
    name: 'db_documents_total',
    help: 'Total number of documents in database',
    labelNames: ['collection'],
    registers: [register],
  })

  // API Usage Metrics
  const apiUsageTotal = new client.Counter({
    name: 'api_usage_total',
    help: 'Total API usage by user and subscription tier',
    labelNames: ['userId', 'subscription', 'endpoint'],
    registers: [register],
  })

  const apiRateLimitHits = new client.Counter({
    name: 'api_rate_limit_hits_total',
    help: 'Total number of rate limit hits',
    labelNames: ['userId', 'subscription', 'endpoint'],
    registers: [register],
  })

  const apiUsersActive = new client.Gauge({
    name: 'api_users_active',
    help: 'Number of active API users',
    labelNames: ['subscription'],
    registers: [register],
  })

  // AI Model Metrics
  const aiRequestsTotal = new client.Counter({
    name: 'ai_requests_total',
    help: 'Total number of AI model requests',
    labelNames: ['model', 'operation'],
    registers: [register],
  })

  const aiRequestDuration = new client.Histogram({
    name: 'ai_request_duration_seconds',
    help: 'AI model request duration in seconds',
    labelNames: ['model', 'operation'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60],
    registers: [register],
  })

  const aiTokensTotal = new client.Counter({
    name: 'ai_tokens_total',
    help: 'Total number of AI tokens consumed',
    labelNames: ['model', 'operation'],
    registers: [register],
  })

  const aiConfidenceScore = new client.Histogram({
    name: 'ai_confidence_score',
    help: 'AI model confidence scores',
    labelNames: ['model', 'operation'],
    buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    registers: [register],
  })

  const aiErrorsTotal = new client.Counter({
    name: 'ai_errors_total',
    help: 'Total number of AI model errors',
    labelNames: ['model', 'operation', 'error_type'],
    registers: [register],
  })

  // Chat System Metrics
  const chatSessionsActive = new client.Gauge({
    name: 'chat_sessions_active',
    help: 'Number of active chat sessions',
    registers: [register],
  })

  const chatMessagesTotal = new client.Counter({
    name: 'chat_messages_total',
    help: 'Total number of chat messages',
    labelNames: ['type', 'user_subscription'],
    registers: [register],
  })

  const chatSessionDuration = new client.Histogram({
    name: 'chat_session_duration_seconds',
    help: 'Chat session duration in seconds',
    buckets: [60, 300, 600, 1200, 1800, 3600, 7200],
    registers: [register],
  })

  const chatResponseTime = new client.Histogram({
    name: 'chat_response_time_seconds',
    help: 'Time to generate chat response',
    buckets: [0.5, 1, 2, 5, 10, 15, 30, 60],
    registers: [register],
  })

  // Research Paper Metrics
  const papersTotal = new client.Gauge({
    name: 'research_papers_total',
    help: 'Total number of research papers in database',
    labelNames: ['field', 'type'],
    registers: [register],
  })

  const papersProcessedTotal = new client.Counter({
    name: 'research_papers_processed_total',
    help: 'Total number of papers processed by AI',
    labelNames: ['source', 'success'],
    registers: [register],
  })

  const paperSearchesTotal = new client.Counter({
    name: 'paper_searches_total',
    help: 'Total number of paper searches performed',
    labelNames: ['field', 'user_subscription'],
    registers: [register],
  })

  const paperAnalysisTime = new client.Histogram({
    name: 'paper_analysis_duration_seconds',
    help: 'Time to analyze a research paper',
    buckets: [1, 5, 10, 30, 60, 120, 300],
    registers: [register],
  })

  // Error Metrics
  const errorTotal = new client.Counter({
    name: 'errors_total',
    help: 'Total number of application errors',
    labelNames: ['type', 'route'],
    registers: [register],
  })

  const errorsByUser = new client.Counter({
    name: 'errors_by_user_total',
    help: 'Total errors by user',
    labelNames: ['userId', 'errorType'],
    registers: [register],
  })

  // Performance Metrics
  const memoryUsage = new client.Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    registers: [register],
  })

  const memoryUsageExternal = new client.Gauge({
    name: 'memory_usage_external_bytes',
    help: 'External memory usage in bytes',
    registers: [register],
  })

  const cpuUsage = new client.Gauge({
    name: 'cpu_usage_percent',
    help: 'CPU usage percentage',
    registers: [register],
  })

  const eventLoopLag = new client.Histogram({
    name: 'event_loop_lag_seconds',
    help: 'Event loop lag in seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    registers: [register],
  })

  const requestMemoryDelta = new client.Histogram({
    name: 'request_memory_delta_bytes',
    help: 'Memory delta per request',
    labelNames: ['route'],
    buckets: [1024, 10240, 102400, 1048576, 10485760],
    registers: [register],
  })

  // System Metrics
  const systemMemoryUsage = new client.Gauge({
    name: 'system_memory_usage_bytes',
    help: 'System memory usage',
    registers: [register],
  })

  const systemCpuUsage = new client.Gauge({
    name: 'system_cpu_usage_microseconds',
    help: 'System CPU usage',
    registers: [register],
  })

  const systemLoadAverage = new client.Gauge({
    name: 'system_load_average',
    help: 'System load average',
    registers: [register],
  })

  const nodeVersion = new client.Gauge({
    name: 'node_version_info',
    help: 'Node.js version information',
    labelNames: ['version'],
    registers: [register],
  })

  // Health Check Metrics
  const healthCheckDuration = new client.Histogram({
    name: 'health_check_duration_seconds',
    help: 'Health check duration',
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1],
    registers: [register],
  })

  const healthCheckStatus = new client.Gauge({
    name: 'health_check_status',
    help: 'Health check status (1=healthy, 0=unhealthy)',
    labelNames: ['check_type'],
    registers: [register],
  })

  // Business Metrics
  const usersTotal = new client.Gauge({
    name: 'users_total',
    help: 'Total number of users',
    labelNames: ['subscription', 'status'],
    registers: [register],
  })

  const usersActive = new client.Gauge({
    name: 'users_active',
    help: 'Number of active users',
    labelNames: ['subscription', 'period'],
    registers: [register],
  })

  const subscriptionRevenue = new client.Gauge({
    name: 'subscription_revenue_total',
    help: 'Total subscription revenue',
    labelNames: ['subscription', 'period'],
    registers: [register],
  })

  const featureUsage = new client.Counter({
    name: 'feature_usage_total',
    help: 'Feature usage by users',
    labelNames: ['feature', 'subscription'],
    registers: [register],
  })

  // WebSocket Metrics
  const websocketConnections = new client.Gauge({
    name: 'websocket_connections_active',
    help: 'Number of active WebSocket connections',
    registers: [register],
  })

  const websocketMessages = new client.Counter({
    name: 'websocket_messages_total',
    help: 'Total WebSocket messages',
    labelNames: ['type', 'direction'],
    registers: [register],
  })

  // Cache Metrics
  const cacheOperations = new client.Counter({
    name: 'cache_operations_total',
    help: 'Total cache operations',
    labelNames: ['operation', 'cache_type', 'result'],
    registers: [register],
  })

  const cacheHitRatio = new client.Gauge({
    name: 'cache_hit_ratio',
    help: 'Cache hit ratio',
    labelNames: ['cache_type'],
    registers: [register],
  })

  // Security Metrics
  const securityEvents = new client.Counter({
    name: 'security_events_total',
    help: 'Total security events',
    labelNames: ['event_type', 'severity'],
    registers: [register],
  })

  const suspiciousActivity = new client.Counter({
    name: 'suspicious_activity_total',
    help: 'Total suspicious activities detected',
    labelNames: ['activity_type', 'user_id'],
    registers: [register],
  })

  return {
    register,
    
    // HTTP Metrics
    httpRequestsTotal,
    httpRequestDuration,
    httpRequestSize,
    httpResponseSize,
    
    // Auth Metrics
    authAttemptsTotal,
    authTokensActive,
    authSessionDuration,
    
    // Database Metrics
    dbQueryTotal,
    dbQueryDuration,
    dbConnectionsActive,
    dbDocumentsTotal,
    
    // API Usage Metrics
    apiUsageTotal,
    apiRateLimitHits,
    apiUsersActive,
    
    // AI Metrics
    aiRequestsTotal,
    aiRequestDuration,
    aiTokensTotal,
    aiConfidenceScore,
    aiErrorsTotal,
    
    // Chat Metrics
    chatSessionsActive,
    chatMessagesTotal,
    chatSessionDuration,
    chatResponseTime,
    
    // Research Metrics
    papersTotal,
    papersProcessedTotal,
    paperSearchesTotal,
    paperAnalysisTime,
    
    // Error Metrics
    errorTotal,
    errorsByUser,
    
    // Performance Metrics
    memoryUsage,
    memoryUsageExternal,
    cpuUsage,
    eventLoopLag,
    requestMemoryDelta,
    
    // System Metrics
    systemMemoryUsage,
    systemCpuUsage,
    systemLoadAverage,
    nodeVersion,
    
    // Health Metrics
    healthCheckDuration,
    healthCheckStatus,
    
    // Business Metrics
    usersTotal,
    usersActive,
    subscriptionRevenue,
    featureUsage,
    
    // WebSocket Metrics
    websocketConnections,
    websocketMessages,
    
    // Cache Metrics
    cacheOperations,
    cacheHitRatio,
    
    // Security Metrics
    securityEvents,
    suspiciousActivity,
  }
}

// Metrics endpoint handler
export const metricsHandler = async (req, res) => {
  try {
    const metrics = await register.metrics()
    res.set('Content-Type', register.contentType)
    res.send(metrics)
  } catch (error) {
    res.status(500).send(`Error collecting metrics: ${error.message}`)
  }
}

// Custom metric helpers
export const customMetrics = {
  // Track business events
  trackBusinessEvent(event, properties = {}) {
    const metric = new client.Counter({
      name: `business_event_${event}_total`,
      help: `Total ${event} business events`,
      labelNames: Object.keys(properties),
      registers: [register],
    })
    
    metric.labels(properties).inc()
  },
  
  // Track user journey
  trackUserJourney(step, userId, properties = {}) {
    const metric = new client.Counter({
      name: 'user_journey_steps_total',
      help: 'User journey step completions',
      labelNames: ['step', 'user_id', ...Object.keys(properties)],
      registers: [register],
    })
    
    metric.labels({ step, user_id: userId, ...properties }).inc()
  },
  
  // Track feature adoption
  trackFeatureAdoption(feature, userId, subscription) {
    const metric = new client.Counter({
      name: 'feature_adoption_total',
      help: 'Feature adoption by users',
      labelNames: ['feature', 'user_id', 'subscription'],
      registers: [register],
    })
    
    metric.labels({ feature, user_id: userId, subscription }).inc()
  },
  
  // Track conversion funnel
  trackConversion(funnelStep, userId, properties = {}) {
    const metric = new client.Counter({
      name: 'conversion_funnel_total',
      help: 'Conversion funnel completions',
      labelNames: ['step', 'user_id', ...Object.keys(properties)],
      registers: [register],
    })
    
    metric.labels({ step: funnelStep, user_id: userId, ...properties }).inc()
  },
  
  // Track custom durations
  trackDuration(operation, duration, labels = {}) {
    const metric = new client.Histogram({
      name: `custom_duration_${operation}_seconds`,
      help: `Duration of ${operation} operations`,
      labelNames: Object.keys(labels),
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [register],
    })
    
    metric.labels(labels).observe(duration / 1000)
  },
}

export default {
  createPrometheusMetrics,
  metricsHandler,
  customMetrics,
  register,
}