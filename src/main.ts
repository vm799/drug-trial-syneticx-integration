import { createApp } from 'vue'
import App from './App.vue'

// Import PWA and Agent services
import { getPWAManager } from './pwa/pwaManager'
import { getAgentService } from './services/agentService'

// Import styles
import './assets/main.css'

// Initialize the Vue app
const app = createApp(App)

// Initialize PWA Manager
const pwaManager = getPWAManager({
  enableNotifications: true,
  enableBackgroundSync: true,
  enableOfflineMode: true,
  updateCheckInterval: 60000, // Check for updates every minute
  cacheStrategy: 'networkFirst',
})

// Initialize Agent Service
const agentService = getAgentService({
  enableOfflineMode: true,
  cacheResponses: true,
  maxRetries: 3,
  retryDelay: 1000,
})

// Global properties for easy access in components
app.config.globalProperties.$pwa = pwaManager
app.config.globalProperties.$agents = agentService

// Provide services for composition API
app.provide('pwaManager', pwaManager)
app.provide('agentService', agentService)

// Global error handler for uncaught errors
app.config.errorHandler = (error, instance, info) => {
  console.error('Vue error:', error, info)

  // Log error for analytics
  if (instance && (instance as any).$agents) {
    // Could send error to analytics service here
  }
}

// Setup PWA event listeners
pwaManager.on('updateAvailable', () => {
  console.log('🔄 App update available')
  // Could show a toast or modal here
})

pwaManager.on('installPromptAvailable', () => {
  console.log('📲 App can be installed')
  // Could show install banner here
})

pwaManager.on('offline', () => {
  console.log('📱 App is offline - using cached data')
})

pwaManager.on('online', () => {
  console.log('🌐 App is back online')
})

// Initialize agent service when app starts
agentService
  .initialize()
  .then(() => {
    console.log('🤖 Multi-agent system ready')
  })
  .catch((error) => {
    console.error('❌ Failed to initialize agent system:', error)
    // App will still work in degraded mode
  })

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)

  // Prevent the default browser behavior
  event.preventDefault()
})

// Handle global errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

// Service worker message handling
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const { type, data } = event.data

    switch (type) {
      case 'BACKGROUND_SYNC':
        console.log('📤 Background sync completed:', data)
        break
      case 'NOTIFICATION_CLICK':
        console.log('🔔 Notification clicked:', data)
        break
      case 'UPDATE_AVAILABLE':
        console.log('🔄 Service worker update available')
        break
    }
  })
}

// Performance monitoring
if ('performance' in window && 'getEntriesByType' in window.performance) {
  window.addEventListener('load', () => {
    // Log performance metrics
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')

    console.log('📊 Performance Metrics:', {
      loadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
      domContentLoaded: Math.round(
        navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      ),
      firstContentfulPaint: paint.find((p) => p.name === 'first-contentful-paint')?.startTime,
      largestContentfulPaint: paint.find((p) => p.name === 'largest-contentful-paint')?.startTime,
    })
  })
}

// Install prompt handling
window.addEventListener('beforeinstallprompt', (event) => {
  // PWA manager handles this, but we can add additional logic here
  console.log('📲 Install prompt intercepted by PWA manager')
})

// Visibility change handling (for background sync and performance)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('📱 App moved to background')

    // Request background sync for pending data
    pwaManager.requestBackgroundSync('research-data-sync')
  } else {
    console.log('👀 App is visible again')

    // Check for updates when app becomes visible
    pwaManager.checkForUpdates()
  }
})

// Network information API (if available)
if ('connection' in navigator) {
  const connection = (navigator as any).connection

  console.log('🌐 Network Info:', {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  })

  // Adjust agent service based on connection quality
  if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    agentService.updateConfig({
      maxRetries: 2,
      retryDelay: 2000,
    })
    console.log('📱 Adjusted for slow connection')
  }
}

// Memory usage monitoring (if available)
if ('memory' in performance) {
  const memory = (performance as any).memory
  console.log('💾 Memory Usage:', {
    used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
    total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
    limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB',
  })
}

// Storage usage monitoring (if available)
if ('storage' in navigator && 'estimate' in navigator.storage) {
  navigator.storage.estimate().then((estimate) => {
    console.log('💾 Storage Usage:', {
      used: Math.round((estimate.usage || 0) / 1024 / 1024) + ' MB',
      quota: Math.round((estimate.quota || 0) / 1024 / 1024) + ' MB',
      percentage: Math.round(((estimate.usage || 0) / (estimate.quota || 1)) * 100) + '%',
    })
  })
}

// Mount the app
app.mount('#app')

// Log startup information
console.log('🚀 MedResearch AI Application Started')
console.log('📱 PWA Features:', pwaManager.getStats())
console.log('🤖 Agent Service Status:', agentService.isServiceReady() ? 'Ready' : 'Initializing')

// Expose services to window for debugging (only in development)
if (import.meta.env.DEV) {
  ;(window as any).pwaManager = pwaManager(window as any).agentService = agentService
  console.log('🔧 Development mode: Services exposed to window object')
}
