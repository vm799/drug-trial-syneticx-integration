#!/usr/bin/env node
// Standalone health check script for Docker containers
import http from 'http'
import https from 'https'
import { performance } from 'perf_hooks'

const HEALTH_CHECK_PORT = process.env.PORT || 3001
const HEALTH_CHECK_HOST = process.env.HOST || 'localhost'
const HEALTH_CHECK_TIMEOUT = 5000
const MAX_RESPONSE_TIME = 10000 // 10 seconds
const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1

// Health check configuration
const healthChecks = [
  {
    name: 'api',
    url: `http://${HEALTH_CHECK_HOST}:${HEALTH_CHECK_PORT}/health`,
    critical: true,
    timeout: HEALTH_CHECK_TIMEOUT,
  },
  {
    name: 'api_detailed',
    url: `http://${HEALTH_CHECK_HOST}:${HEALTH_CHECK_PORT}/api/health`,
    critical: true,
    timeout: HEALTH_CHECK_TIMEOUT,
  },
  {
    name: 'metrics',
    url: `http://${HEALTH_CHECK_HOST}:${HEALTH_CHECK_PORT}/metrics`,
    critical: false,
    timeout: HEALTH_CHECK_TIMEOUT,
  },
]

// Perform HTTP health check
async function httpHealthCheck(check) {
  return new Promise((resolve) => {
    const startTime = performance.now()
    const url = new URL(check.url)
    const client = url.protocol === 'https:' ? https : http
    
    const request = client.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      timeout: check.timeout,
      headers: {
        'User-Agent': 'Docker-HealthCheck/1.0',
        'Accept': 'application/json',
      },
    }, (response) => {
      let data = ''
      
      response.on('data', (chunk) => {
        data += chunk
      })
      
      response.on('end', () => {
        const duration = performance.now() - startTime
        
        try {
          const result = {
            name: check.name,
            status: response.statusCode >= 200 && response.statusCode < 300 ? 'healthy' : 'unhealthy',
            statusCode: response.statusCode,
            responseTime: Math.round(duration),
            critical: check.critical,
          }
          
          // Try to parse JSON response for additional info
          if (response.headers['content-type']?.includes('application/json')) {
            try {
              const jsonData = JSON.parse(data)
              result.data = jsonData
              
              // Check for specific health indicators in response
              if (jsonData.status) {
                result.status = jsonData.status === 'healthy' ? 'healthy' : 'unhealthy'
              }
              
              // Check for failed sub-checks
              if (jsonData.checks) {
                const failedChecks = Object.entries(jsonData.checks)
                  .filter(([, check]) => check.status !== 'healthy')
                  .map(([name]) => name)
                
                if (failedChecks.length > 0) {
                  result.status = 'degraded'
                  result.failedChecks = failedChecks
                }
              }
            } catch (parseError) {
              // JSON parse error, but response might still be valid
              result.data = data.substring(0, 200) // Limit data size
            }
          }
          
          resolve(result)
        } catch (error) {
          resolve({
            name: check.name,
            status: 'unhealthy',
            error: error.message,
            critical: check.critical,
          })
        }
      })
    })
    
    request.on('error', (error) => {
      resolve({
        name: check.name,
        status: 'unhealthy',
        error: error.message,
        critical: check.critical,
      })
    })
    
    request.on('timeout', () => {
      request.destroy()
      resolve({
        name: check.name,
        status: 'unhealthy',
        error: `Timeout after ${check.timeout}ms`,
        critical: check.critical,
      })
    })
    
    request.end()
  })
}

// Check if process is responding
function checkProcessHealth() {
  try {
    // Check memory usage
    const memUsage = process.memoryUsage()
    const maxMemory = 1024 * 1024 * 1024 // 1GB limit
    
    if (memUsage.heapUsed > maxMemory) {
      return {
        name: 'memory',
        status: 'unhealthy',
        error: `Memory usage too high: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        critical: true,
      }
    }
    
    // Check uptime
    const uptime = process.uptime()
    if (uptime < 5) { // Less than 5 seconds uptime
      return {
        name: 'uptime',
        status: 'starting',
        uptime: Math.round(uptime),
        critical: false,
      }
    }
    
    return {
      name: 'process',
      status: 'healthy',
      uptime: Math.round(uptime),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
      critical: true,
    }
  } catch (error) {
    return {
      name: 'process',
      status: 'unhealthy',
      error: error.message,
      critical: true,
    }
  }
}

// Main health check function
async function runHealthCheck() {
  const startTime = performance.now()
  
  try {
    console.log('🏥 Starting health check...')
    
    // Check process health first
    const processCheck = checkProcessHealth()
    console.log(`   ${processCheck.status === 'healthy' ? '✅' : '❌'} Process: ${processCheck.status}`)
    
    // Run all HTTP health checks
    const httpResults = await Promise.all(
      healthChecks.map(check => httpHealthCheck(check))
    )
    
    // Combine all results
    const allResults = [processCheck, ...httpResults]
    
    // Log individual results
    httpResults.forEach(result => {
      const icon = result.status === 'healthy' ? '✅' : 
                   result.status === 'degraded' ? '⚠️' : '❌'
      const time = result.responseTime ? ` (${result.responseTime}ms)` : ''
      console.log(`   ${icon} ${result.name}: ${result.status}${time}`)
      
      if (result.error) {
        console.log(`      Error: ${result.error}`)
      }
      
      if (result.failedChecks) {
        console.log(`      Failed checks: ${result.failedChecks.join(', ')}`)
      }
    })
    
    // Determine overall health
    const criticalFailures = allResults.filter(r => r.critical && r.status === 'unhealthy')
    const degradedServices = allResults.filter(r => r.status === 'degraded')
    const healthyServices = allResults.filter(r => r.status === 'healthy')
    
    const totalDuration = Math.round(performance.now() - startTime)
    
    let overallStatus = 'healthy'
    let exitCode = EXIT_SUCCESS
    
    if (criticalFailures.length > 0) {
      overallStatus = 'unhealthy'
      exitCode = EXIT_FAILURE
      console.log(`\n❌ Health check FAILED (${totalDuration}ms)`)
      console.log(`   Critical failures: ${criticalFailures.length}`)
      console.log(`   Services: ${healthyServices.length} healthy, ${degradedServices.length} degraded, ${criticalFailures.length} failed`)
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded'
      exitCode = EXIT_SUCCESS // Still consider healthy for container orchestration
      console.log(`\n⚠️  Health check DEGRADED (${totalDuration}ms)`)
      console.log(`   Services: ${healthyServices.length} healthy, ${degradedServices.length} degraded`)
    } else {
      console.log(`\n✅ Health check PASSED (${totalDuration}ms)`)
      console.log(`   All ${allResults.length} checks passed`)
    }
    
    // Check if response time is acceptable
    if (totalDuration > MAX_RESPONSE_TIME) {
      console.log(`\n⚠️  Warning: Health check took ${totalDuration}ms (max: ${MAX_RESPONSE_TIME}ms)`)
    }
    
    // Export results for monitoring systems
    const healthSummary = {
      timestamp: new Date().toISOString(),
      status: overallStatus,
      duration: totalDuration,
      checks: allResults.length,
      healthy: healthyServices.length,
      degraded: degradedServices.length,
      failed: criticalFailures.length,
      details: allResults,
    }
    
    // Write summary to stdout for log collection
    if (process.env.HEALTH_CHECK_JSON_OUTPUT === 'true') {
      console.log(JSON.stringify(healthSummary))
    }
    
    process.exit(exitCode)
    
  } catch (error) {
    const totalDuration = Math.round(performance.now() - startTime)
    console.error(`\n💥 Health check ERROR (${totalDuration}ms)`)
    console.error(`   ${error.message}`)
    
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`)
    }
    
    process.exit(EXIT_FAILURE)
  }
}

// Handle signals for graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Health check interrupted')
  process.exit(EXIT_FAILURE)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Health check terminated')
  process.exit(EXIT_FAILURE)
})

// Add timeout for the entire health check process
setTimeout(() => {
  console.error('\n⏰ Health check timed out')
  process.exit(EXIT_FAILURE)
}, MAX_RESPONSE_TIME + 5000) // Add 5 second buffer

// Environment-specific configuration
if (process.env.NODE_ENV === 'development') {
  // More lenient checks in development
  healthChecks.forEach(check => {
    check.timeout = 10000 // Increase timeout
    if (check.name === 'metrics') {
      check.critical = false // Metrics not critical in dev
    }
  })
}

// Run the health check
runHealthCheck().catch(error => {
  console.error('💥 Unexpected error in health check:', error)
  process.exit(EXIT_FAILURE)
})