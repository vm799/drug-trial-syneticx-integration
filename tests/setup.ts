// Global test setup and configuration
import { beforeAll, afterAll, afterEach } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Test environment setup
beforeAll(async () => {
  // Set up Pinia for state management in tests
  setActivePinia(createPinia())
  
  // Configure Vue Test Utils
  config.global.plugins = [createPinia()]
  
  // Mock environment variables
  process.env.VITE_API_BASE_URL = 'http://localhost:3001/api'
  process.env.VITE_WS_URL = 'ws://localhost:3001'
  
  // Mock browser APIs
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  } as any

  global.sessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  } as any

  // Mock WebSocket
  global.WebSocket = vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1,
  })) as any

  // Mock fetch
  global.fetch = vi.fn()

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock IntersectionObserver  
  global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock navigator
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  })

  Object.defineProperty(navigator, 'language', {
    writable: true,
    value: 'en-US',
  })

  // Mock window methods
  global.scrollTo = vi.fn()
  global.alert = vi.fn()
  global.confirm = vi.fn(() => true)

  // Mock console methods to reduce test noise
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})

// Global cleanup
afterAll(() => {
  vi.restoreAllMocks()
})