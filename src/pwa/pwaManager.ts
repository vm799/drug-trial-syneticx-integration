import { Workbox } from 'workbox-window'

export interface PWAManagerConfig {
  enableNotifications: boolean
  enableBackgroundSync: boolean
  enableOfflineMode: boolean
  updateCheckInterval: number
  cacheStrategy: 'networkFirst' | 'cacheFirst' | 'staleWhileRevalidate'
}

export interface PWAInstallPrompt {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

class PWAManager {
  private workbox: Workbox | null = null
  private config: PWAManagerConfig
  private installPrompt: PWAInstallPrompt | null = null
  private isUpdateAvailable: boolean = false
  private isOnline: boolean = navigator.onLine
  private eventListeners: Map<string, Function[]> = new Map()

  constructor(config: Partial<PWAManagerConfig> = {}) {
    this.config = {
      enableNotifications: true,
      enableBackgroundSync: true,
      enableOfflineMode: true,
      updateCheckInterval: 60000, // 1 minute
      cacheStrategy: 'networkFirst',
      ...config,
    }

    this.initialize()
  }

  private initialize(): void {
    // Initialize service worker
    this.initializeServiceWorker()

    // Setup online/offline detection
    this.setupNetworkDetection()

    // Setup install prompt handling
    this.setupInstallPrompt()

    // Setup notification permission
    if (this.config.enableNotifications) {
      this.requestNotificationPermission()
    }

    console.log('📱 PWA Manager initialized')
  }

  private initializeServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      this.workbox = new Workbox('/sw.js')

      // Service worker update available
      this.workbox.addEventListener('waiting', (event) => {
        this.isUpdateAvailable = true
        this.emit('updateAvailable', event)

        // Show update notification
        this.showUpdateNotification()
      })

      // Service worker controlling the page
      this.workbox.addEventListener('controlling', (event) => {
        this.emit('updateActivated', event)

        // Reload page to get latest assets
        window.location.reload()
      })

      // Service worker installed for the first time
      this.workbox.addEventListener('installed', (event) => {
        this.emit('installed', event)
        console.log('✅ App is ready for offline use')
      })

      // Register the service worker
      this.workbox.register().catch((error) => {
        console.error('❌ Service worker registration failed:', error)
      })
    }
  }

  private setupNetworkDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.emit('online')
      console.log('🌐 Connection restored')

      if (this.config.enableNotifications) {
        this.showNotification('Connection restored', {
          body: "You're back online! Syncing data...",
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'connection-status',
        })
      }
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.emit('offline')
      console.log('📱 Working offline')

      if (this.config.enableNotifications) {
        this.showNotification('Working offline', {
          body: 'No internet connection. Using cached data.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'connection-status',
        })
      }
    })
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent the default install prompt
      event.preventDefault()

      // Store the event for later use
      this.installPrompt = event as any
      this.emit('installPromptAvailable')

      console.log('📲 App install prompt available')
    })

    // Handle app installed event
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null
      this.emit('appInstalled')
      console.log('✅ App installed successfully')
    })
  }

  private async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return Notification.permission === 'granted'
  }

  // Public API

  // Install the app
  async installApp(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('⚠️ Install prompt not available')
      return false
    }

    try {
      await this.installPrompt.prompt()
      const result = await this.installPrompt.userChoice

      if (result.outcome === 'accepted') {
        console.log('✅ User accepted app installation')
        return true
      } else {
        console.log('❌ User dismissed app installation')
        return false
      }
    } catch (error) {
      console.error('❌ App installation failed:', error)
      return false
    }
  }

  // Check if app can be installed
  canInstall(): boolean {
    return !!this.installPrompt
  }

  // Update the app
  async updateApp(): Promise<void> {
    if (!this.workbox || !this.isUpdateAvailable) {
      console.warn('⚠️ No update available')
      return
    }

    try {
      // Tell the waiting service worker to skip waiting and become active
      this.workbox.messageSkipWaiting()
      console.log('🔄 App update initiated')
    } catch (error) {
      console.error('❌ App update failed:', error)
    }
  }

  // Check for updates
  async checkForUpdates(): Promise<boolean> {
    if (!this.workbox) return false

    try {
      const registration = await this.workbox.register()
      if (registration) {
        await registration.update()
        return this.isUpdateAvailable
      }
    } catch (error) {
      console.error('❌ Update check failed:', error)
    }

    return false
  }

  // Show notification
  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.config.enableNotifications || Notification.permission !== 'granted') {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, {
        ...options,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
      })
    } catch (error) {
      console.error('❌ Notification failed:', error)
    }
  }

  private showUpdateNotification(): void {
    this.showNotification('App update available', {
      body: 'A new version is ready. Tap to update.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'app-update',
      requireInteraction: true,
    })
  }

  // Background sync
  async requestBackgroundSync(tag: string): Promise<void> {
    if (!this.config.enableBackgroundSync || !('serviceWorker' in navigator)) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      if ('sync' in registration) {
        await (registration as any).sync.register(tag)
        console.log(`🔄 Background sync requested: ${tag}`)
      }
    } catch (error) {
      console.error('❌ Background sync request failed:', error)
    }
  }

  // Cache management
  async clearCache(cacheName?: string): Promise<void> {
    if (!('caches' in window)) return

    try {
      if (cacheName) {
        await caches.delete(cacheName)
        console.log(`🗑️ Cache cleared: ${cacheName}`)
      } else {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
        console.log('🗑️ All caches cleared')
      }
    } catch (error) {
      console.error('❌ Cache clearing failed:', error)
    }
  }

  async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0

    try {
      const cacheNames = await caches.keys()
      let totalSize = 0

      for (const name of cacheNames) {
        const cache = await caches.open(name)
        const keys = await cache.keys()

        for (const request of keys) {
          const response = await cache.match(request)
          if (response) {
            const blob = await response.blob()
            totalSize += blob.size
          }
        }
      }

      return totalSize
    } catch (error) {
      console.error('❌ Cache size calculation failed:', error)
      return 0
    }
  }

  // Network status
  isOnlineMode(): boolean {
    return this.isOnline
  }

  isOfflineMode(): boolean {
    return !this.isOnline
  }

  // App status
  isInstalled(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true
    )
  }

  hasUpdateAvailable(): boolean {
    return this.isUpdateAvailable
  }

  // Event management
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => callback(data))
    }
  }

  // Configuration
  updateConfig(newConfig: Partial<PWAManagerConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ PWA configuration updated')
  }

  getConfig(): PWAManagerConfig {
    return { ...this.config }
  }

  // Statistics
  getStats(): any {
    return {
      isOnline: this.isOnline,
      isInstalled: this.isInstalled(),
      canInstall: this.canInstall(),
      hasUpdate: this.isUpdateAvailable,
      notificationsEnabled: Notification.permission === 'granted',
      serviceWorkerSupported: 'serviceWorker' in navigator,
      cacheSupported: 'caches' in window,
      backgroundSyncSupported:
        'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    }
  }
}

// Create singleton instance
let pwaManagerInstance: PWAManager | null = null

export function getPWAManager(config?: Partial<PWAManagerConfig>): PWAManager {
  if (!pwaManagerInstance) {
    pwaManagerInstance = new PWAManager(config)
  }
  return pwaManagerInstance
}

export default getPWAManager()
