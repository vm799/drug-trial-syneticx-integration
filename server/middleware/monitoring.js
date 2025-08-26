// Enterprise-grade monitoring and observability middleware
import winston from 'winston'
import { createPrometheusMetrics } from '../utils/metrics.js'
import { performance } from 'perf_hooks'
import os from 'os'
import v8 from 'v8'

// Initialize metrics
const metrics = createPrometheusMetrics()

// Configure structured logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        service: 'medresearch-ai-backend',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        ...meta,
      })
    })
  ),
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
    new winston.transports.File({
      filename: 'logs/app.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true,
    }),
    new winston.transports.File({
      filename: 'logs/errors.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
  ],
  exitOnError: false,
})

// Request logging and metrics middleware
export const requestLogging = (req, res, next) => {
  const startTime = performance.now()
  const requestId = req.headers['x-request-id'] || generateRequestId()
  
  // Add request context
  req.requestId = requestId
  req.startTime = startTime
  
  // Log request start
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
    sessionId: req.headers['x-session-id'],
  })

  // Increment request counter
  metrics.httpRequestsTotal.labels({
    method: req.method,
    route: req.route?.path || req.url,
    status_code: 'pending',
  }).inc()

  // Override res.end to capture response metrics
  const originalEnd = res.end
  res.end = function(chunk, encoding) {
    const duration = performance.now() - startTime
    
    // Record response time
    metrics.httpRequestDuration.labels({
      method: req.method,
      route: req.route?.path || req.url,
      status_code: res.statusCode,
    }).observe(duration / 1000)

    // Update request counter with final status
    metrics.httpRequestsTotal.labels({
      method: req.method,
      route: req.route?.path || req.url,
      status_code: res.statusCode,
    }).inc()

    // Log request completion
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      contentLength: res.get('content-length') || chunk?.length || 0,
      userId: req.user?.id,
    })

    // Call original end method
    originalEnd.call(this, chunk, encoding)
  }

  next()
}

// Error tracking middleware
export const errorTracking = (error, req, res, next) => {
  const errorId = generateRequestId()
  
  // Log error with full context
  logger.error('Application error', {
    errorId,
    requestId: req.requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
      body: sanitizeBody(req.body),
      params: req.params,
      query: req.query,
    },
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    } : null,
    timestamp: new Date().toISOString(),
  })

  // Increment error counter
  metrics.errorTotal.labels({
    type: error.name || 'UnknownError',
    route: req.route?.path || req.url,
  }).inc()

  // Send error response
  const statusCode = error.statusCode || error.status || 500
  const isProduction = process.env.NODE_ENV === 'production'
  
  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? 'Internal server error' : error.message,
    errorId: isProduction ? errorId : undefined,
    stack: isProduction ? undefined : error.stack,
    timestamp: new Date().toISOString(),
  })
}

// API usage tracking middleware
export const apiUsageTracking = async (req, res, next) => {
  if (!req.user) {
    return next()
  }

  try {
    // Track API usage by subscription tier
    metrics.apiUsageTotal.labels({
      userId: req.user.id,
      subscription: req.user.subscription || 'free',
      endpoint: req.route?.path || req.url,
    }).inc()

    // Track token usage for AI endpoints
    if (req.url.includes('/chat') || req.url.includes('/analyze')) {
      const originalJson = res.json
      res.json = function(data) {
        if (data && data.metadata && data.metadata.tokens) {
          metrics.tokenUsageTotal.labels({
            userId: req.user.id,
            subscription: req.user.subscription || 'free',
            model: data.metadata.model || 'unknown',
          }).inc(data.metadata.tokens)
        }
        return originalJson.call(this, data)
      }
    }

    next()
  } catch (error) {
    logger.error('API usage tracking error', { error: error.message, requestId: req.requestId })
    next() // Don't block request on tracking error
  }
}

// Performance monitoring middleware
export const performanceMonitoring = (req, res, next) => {
  const startMemory = process.memoryUsage()
  const startCpuUsage = process.cpuUsage()
  
  // Override res.end to capture performance metrics
  const originalEnd = res.end
  res.end = function(chunk, encoding) {
    try {
      const endMemory = process.memoryUsage()
      const endCpuUsage = process.cpuUsage(startCpuUsage)
      const duration = performance.now() - req.startTime
      
      // Memory usage metrics
      metrics.memoryUsage.set(endMemory.heapUsed)
      metrics.memoryUsageExternal.set(endMemory.external)
      
      // CPU usage metrics
      const cpuPercent = (endCpuUsage.user + endCpuUsage.system) / 1000 / duration * 100
      metrics.cpuUsage.set(cpuPercent)
      
      // Request memory delta
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed
      metrics.requestMemoryDelta.labels({
        route: req.route?.path || req.url,
      }).observe(memoryDelta)
      
      // Log performance metrics for slow requests
      if (duration > 1000) { // Log requests taking more than 1 second
        logger.warn('Slow request detected', {
          requestId: req.requestId,
          url: req.url,
          duration: `${duration.toFixed(2)}ms`,
          memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
          cpuUsage: `${cpuPercent.toFixed(2)}%`,
        })
      }
    } catch (error) {
      logger.error('Performance monitoring error', { error: error.message })
    }
    
    originalEnd.call(this, chunk, encoding)
  }
  
  next()
}

// Database query monitoring
export const dbQueryMonitoring = (queryType, collection, duration, success = true) => {
  metrics.dbQueryDuration.labels({
    type: queryType,
    collection: collection,
    success: success ? 'true' : 'false',
  }).observe(duration / 1000)
  
  metrics.dbQueryTotal.labels({
    type: queryType,
    collection: collection,
    success: success ? 'true' : 'false',
  }).inc()
  
  logger.debug('Database query', {
    type: queryType,
    collection,
    duration: `${duration.toFixed(2)}ms`,
    success,
  })
}

// AI model monitoring
export const aiModelMonitoring = (model, operation, tokens, duration, confidence) => {
  metrics.aiRequestsTotal.labels({
    model,
    operation,
  }).inc()
  
  metrics.aiRequestDuration.labels({
    model,
    operation,
  }).observe(duration / 1000)
  
  if (tokens) {
    metrics.aiTokensTotal.labels({
      model,
      operation,
    }).inc(tokens)
  }
  
  if (confidence !== undefined) {
    metrics.aiConfidenceScore.labels({
      model,
      operation,
    }).observe(confidence)
  }
  
  logger.info('AI model request', {
    model,
    operation,
    tokens,
    duration: `${duration.toFixed(2)}ms`,
    confidence,
  })
}

// Health check endpoint
export const healthCheck = async (req, res) => {
  const startTime = performance.now()
  
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: await checkDatabaseHealth(),
        redis: await checkRedisHealth(),
        external_apis: await checkExternalApisHealth(),
        memory: checkMemoryHealth(),
        cpu: checkCpuHealth(),
        disk: await checkDiskHealth(),
      },
      metrics: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        eventLoop: await getEventLoopMetrics(),
        gc: v8.getHeapStatistics(),
      },
    }
    
    // Determine overall health status
    const failedChecks = Object.entries(health.checks)
      .filter(([, check]) => check.status !== 'healthy')
      .map(([name]) => name)
    
    if (failedChecks.length > 0) {
      health.status = 'degraded'
      health.issues = failedChecks
    }
    
    const duration = performance.now() - startTime
    metrics.healthCheckDuration.observe(duration / 1000)
    
    const statusCode = health.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(health)
    
  } catch (error) {
    logger.error('Health check failed', { error: error.message })
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    })
  }
}

// System metrics collection
export const collectSystemMetrics = () => {
  setInterval(() => {
    try {
      // System metrics
      const memUsage = process.memoryUsage()
      const cpuUsage = process.cpuUsage()
      const loadAvg = os.loadavg()
      
      metrics.systemMemoryUsage.set(memUsage.heapUsed)
      metrics.systemCpuUsage.set(cpuUsage.user + cpuUsage.system)
      metrics.systemLoadAverage.set(loadAvg[0])
      
      // Node.js specific metrics
      metrics.nodeVersion.set({
        version: process.version,
      }, 1)
      
      metrics.eventLoopLag.observe(measureEventLoopLag())
      
    } catch (error) {
      logger.error('System metrics collection failed', { error: error.message })
    }
  }, 10000) // Collect every 10 seconds
}

// Helper functions
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function sanitizeHeaders(headers) {
  const sanitized = { ...headers }
  delete sanitized.authorization
  delete sanitized.cookie
  delete sanitized['x-api-key']
  return sanitized
}

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') {
    return body
  }
  
  const sanitized = { ...body }
  delete sanitized.password
  delete sanitized.token
  delete sanitized.apiKey
  return sanitized
}

async function checkDatabaseHealth() {
  try {
    const startTime = performance.now()
    // Replace with actual database health check
    // await mongoose.connection.db.admin().ping()
    const duration = performance.now() - startTime
    
    return {
      status: 'healthy',
      responseTime: `${duration.toFixed(2)}ms`,
      connection: 'active',
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    }
  }
}

async function checkRedisHealth() {
  try {
    const startTime = performance.now()
    // Replace with actual Redis health check
    // await redisClient.ping()
    const duration = performance.now() - startTime
    
    return {
      status: 'healthy',
      responseTime: `${duration.toFixed(2)}ms`,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    }
  }
}

async function checkExternalApisHealth() {
  const apis = [
    { name: 'OpenAI', url: 'https://api.openai.com/v1/models' },
    { name: 'PubMed', url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi' },
  ]
  
  const results = {}
  
  for (const api of apis) {
    try {
      const startTime = performance.now()
      const response = await fetch(api.url, {
        method: 'HEAD',
        timeout: 5000,
      })
      const duration = performance.now() - startTime
      
      results[api.name] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: `${duration.toFixed(2)}ms`,
        statusCode: response.status,
      }
    } catch (error) {
      results[api.name] = {
        status: 'unhealthy',
        error: error.message,
      }
    }
  }
  
  return results
}

function checkMemoryHealth() {
  const memUsage = process.memoryUsage()
  const maxHeap = v8.getHeapStatistics().heap_size_limit
  const heapUsedPercent = (memUsage.heapUsed / maxHeap) * 100
  
  return {
    status: heapUsedPercent > 90 ? 'unhealthy' : 'healthy',
    heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
    heapUsedPercent: `${heapUsedPercent.toFixed(2)}%`,
  }
}

function checkCpuHealth() {
  const loadAvg = os.loadavg()
  const cpuCount = os.cpus().length
  const loadPercent = (loadAvg[0] / cpuCount) * 100
  
  return {
    status: loadPercent > 80 ? 'unhealthy' : 'healthy',
    loadAverage: loadAvg[0].toFixed(2),
    loadPercent: `${loadPercent.toFixed(2)}%`,
    cpuCount,
  }
}

async function checkDiskHealth() {
  try {
    const stats = await import('fs').then(fs => 
      fs.promises.stat(process.cwd())
    )
    
    return {
      status: 'healthy',
      accessible: true,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    }
  }
}

function measureEventLoopLag() {
  const start = process.hrtime.bigint()
  return new Promise(resolve => {
    setImmediate(() => {
      const delta = process.hrtime.bigint() - start
      resolve(Number(delta) / 1000000) // Convert to milliseconds
    })
  })
}

async function getEventLoopMetrics() {
  const lag = await measureEventLoopLag()
  return {
    lag: `${lag.toFixed(2)}ms`,
    utilization: performance.eventLoopUtilization().utilization,
  }
}

export default {
  requestLogging,
  errorTracking,
  apiUsageTracking,
  performanceMonitoring,
  dbQueryMonitoring,
  aiModelMonitoring,
  healthCheck,
  collectSystemMetrics,
  logger,
}