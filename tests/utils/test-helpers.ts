// Test utilities and helper functions
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import type { Component } from 'vue'
import type { 
  User, 
  ResearchPaper, 
  ChatSession, 
  ChatMessage,
  ApiResponse 
} from '@/types/api'

// Mock data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  role: 'researcher',
  subscription: 'premium',
  organization: 'Test University',
  specialization: ['oncology', 'immunology'],
  isActive: true,
  emailVerified: true,
  lastActivity: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  preferences: {
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: true,
      research_updates: true,
      system_alerts: true,
    },
    ai_settings: {
      response_length: 'detailed',
      include_citations: true,
      confidence_threshold: 0.8,
    },
  },
  apiUsage: {
    daily: {
      requests: 10,
      tokens: 1500,
      date: new Date().toISOString(),
    },
    monthly: {
      requests: 200,
      tokens: 30000,
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    },
  },
  ...overrides,
})

export const createMockResearchPaper = (overrides: Partial<ResearchPaper> = {}): ResearchPaper => ({
  id: '507f1f77bcf86cd799439012',
  title: 'Novel Immunotherapy Approaches in Cancer Treatment',
  abstract: 'This study investigates new immunotherapy approaches for treating various cancer types...',
  authors: [
    {
      name: 'Dr. Jane Smith',
      affiliation: 'Harvard Medical School',
      orcid: '0000-0002-1825-0097',
    },
    {
      name: 'Dr. John Johnson',
      affiliation: 'Stanford University',
    },
  ],
  journal: {
    name: 'Nature Medicine',
    issn: '1078-8956',
    impactFactor: 87.241,
    quartile: 'Q1',
  },
  publicationDate: '2024-01-15T00:00:00.000Z',
  volume: '30',
  issue: '1',
  pages: '123-135',
  researchType: 'clinical_trial',
  medicalFields: ['oncology', 'immunology'],
  keywords: ['immunotherapy', 'cancer', 'treatment', 'clinical trial'],
  meshTerms: ['Immunotherapy', 'Neoplasms', 'Clinical Trials'],
  qualityScore: 8.5,
  evidenceLevel: 'A',
  citationCount: 156,
  doi: '10.1038/s41591-024-00001-1',
  pubmedId: '38123456',
  aiProcessing: {
    lastProcessed: new Date().toISOString(),
    embedding: Array(1536).fill(0).map(() => Math.random()),
    summaryGenerated: true,
    factChecked: true,
    confidenceScore: 0.92,
  },
  interactions: {
    views: 2341,
    bookmarks: 127,
    shares: 43,
    chatSessions: 89,
  },
  validation: {
    peerReviewed: true,
    retracted: false,
    flagged: false,
    lastValidated: new Date().toISOString(),
  },
  fullText: {
    available: true,
    sections: [
      {
        title: 'Introduction',
        content: 'Cancer immunotherapy has emerged as...',
        type: 'introduction',
      },
      {
        title: 'Methods',
        content: 'We conducted a randomized controlled trial...',
        type: 'methods',
      },
    ],
  },
  source: 'pubmed',
  language: 'en',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockChatSession = (overrides: Partial<ChatSession> = {}): ChatSession => ({
  sessionId: 'session_123456',
  userId: '507f1f77bcf86cd799439011',
  title: 'Cancer Immunotherapy Discussion',
  context: {
    type: 'paper_analysis',
    researchPaper: '507f1f77bcf86cd799439012',
    specialization: 'oncology',
  },
  messages: [
    createMockChatMessage({ type: 'user', content: 'Can you explain the methodology of this paper?' }),
    createMockChatMessage({ type: 'assistant', content: 'This study uses a randomized controlled trial design...' }),
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isActive: true,
  quality: {
    coherenceScore: 0.87,
    relevanceScore: 0.92,
    accuracyScore: 0.89,
    flagged: false,
  },
  ...overrides,
})

export const createMockChatMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: `msg_${Math.random().toString(36).substr(2, 9)}`,
  type: 'user',
  content: 'Hello, can you help me understand this research paper?',
  timestamp: new Date().toISOString(),
  metadata: {
    tokens: 15,
    confidence: 0.85,
    responseTime: 1200,
    sources: [
      {
        type: 'paper',
        title: 'Supporting Research Title',
        relevanceScore: 0.89,
      },
    ],
    validation: {
      hasCitations: true,
      factChecked: true,
      riskFlags: [],
      confidence: 0.85,
    },
  },
  ...overrides,
})

export const createMockApiResponse = <T>(
  data: T,
  overrides: Partial<ApiResponse<T>> = {}
): ApiResponse<T> => ({
  success: true,
  data,
  metadata: {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
    processingTime: Math.floor(Math.random() * 1000),
    rateLimit: {
      remaining: 95,
      reset: new Date(Date.now() + 3600000),
      limit: 100,
    },
  },
  ...overrides,
})

// Component mounting utilities
export const mountComponent = <T extends Component>(
  component: T,
  options: Record<string, any> = {}
): VueWrapper<any> => {
  const pinia = createPinia()
  
  return mount(component, {
    global: {
      plugins: [pinia],
      stubs: {
        // Stub common components that don't need testing
        'router-link': true,
        'router-view': true,
        ...options.stubs,
      },
      mocks: {
        $t: (key: string) => key, // Mock i18n
        $route: {
          path: '/',
          name: 'home',
          params: {},
          query: {},
          ...options.route,
        },
        $router: {
          push: vi.fn(),
          replace: vi.fn(),
          go: vi.fn(),
          back: vi.fn(),
          forward: vi.fn(),
          ...options.router,
        },
        ...options.mocks,
      },
    },
    ...options,
  })
}

// API mocking utilities
export const mockApiSuccess = <T>(data: T): Promise<ApiResponse<T>> => {
  return Promise.resolve(createMockApiResponse(data))
}

export const mockApiError = (
  message = 'Test error',
  code = 'INTERNAL_ERROR',
  statusCode = 500
): Promise<never> => {
  return Promise.reject(new Error(message))
}

export const mockFetch = (response: any, options: { ok?: boolean; status?: number } = {}) => {
  const mockResponse = {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(response),
    headers: new Map([
      ['content-type', 'application/json'],
      ['x-ratelimit-remaining', '95'],
      ['x-ratelimit-reset', new Date(Date.now() + 3600000).toISOString()],
    ]),
  }
  
  global.fetch = vi.fn().mockResolvedValue(mockResponse)
  return mockResponse
}

// DOM testing utilities
export const waitForElement = async (
  wrapper: VueWrapper<any>,
  selector: string,
  timeout = 1000
): Promise<void> => {
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    if (wrapper.find(selector).exists()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  throw new Error(`Element ${selector} not found within ${timeout}ms`)
}

export const fillForm = async (wrapper: VueWrapper<any>, formData: Record<string, any>) => {
  for (const [field, value] of Object.entries(formData)) {
    const input = wrapper.find(`[name="${field}"], [data-testid="${field}"]`)
    if (input.exists()) {
      await input.setValue(value)
    }
  }
}

export const submitForm = async (wrapper: VueWrapper<any>, formSelector = 'form') => {
  const form = wrapper.find(formSelector)
  if (form.exists()) {
    await form.trigger('submit')
  }
}

// Async utilities
export const flushPromises = (): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, 0)
  })
}

export const nextTick = (): Promise<void> => {
  return new Promise(resolve => {
    // Use Vue's nextTick if available, otherwise setTimeout
    if (typeof window !== 'undefined' && (window as any).Vue) {
      ;(window as any).Vue.nextTick(resolve)
    } else {
      setTimeout(resolve, 0)
    }
  })
}

// Local storage utilities
export const mockLocalStorage = (initialData: Record<string, string> = {}) => {
  const store = new Map(Object.entries(initialData))
  
  global.localStorage = {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    length: store.size,
    key: vi.fn((index: number) => Array.from(store.keys())[index] || null),
  } as any

  return store
}

// WebSocket mocking
export class MockWebSocket {
  public readyState: number = 1
  public url: string
  public onopen: ((event: Event) => void) | null = null
  public onclose: ((event: CloseEvent) => void) | null = null
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: Event) => void) | null = null

  constructor(url: string) {
    this.url = url
    setTimeout(() => this.onopen?.(new Event('open')), 0)
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    // Mock implementation - can be extended for specific tests
  }

  close(code?: number, reason?: string): void {
    this.readyState = 3
    setTimeout(() => this.onclose?.(new CloseEvent('close', { code, reason })), 0)
  }

  addEventListener(type: string, listener: EventListener): void {
    // Mock implementation
  }

  removeEventListener(type: string, listener: EventListener): void {
    // Mock implementation
  }

  dispatchEvent(event: Event): boolean {
    return true
  }

  // Helper methods for testing
  mockMessage(data: any): void {
    const message = new MessageEvent('message', {
      data: JSON.stringify(data),
    })
    this.onmessage?.(message)
  }

  mockError(): void {
    this.onerror?.(new Event('error'))
  }

  mockClose(code = 1000, reason = 'Test close'): void {
    this.close(code, reason)
  }
}

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<void> | void): Promise<number> => {
  const start = performance.now()
  await fn()
  return performance.now() - start
}

export const createPerformanceTest = (name: string, threshold: number) => {
  return async (fn: () => Promise<void> | void) => {
    const duration = await measurePerformance(fn)
    if (duration > threshold) {
      console.warn(`Performance test "${name}" took ${duration}ms (threshold: ${threshold}ms)`)
    }
    return duration
  }
}

// Accessibility testing utilities
export const checkAccessibility = (wrapper: VueWrapper<any>): string[] => {
  const issues: string[] = []

  // Check for missing alt attributes on images
  const images = wrapper.findAll('img')
  images.forEach((img, index) => {
    if (!img.attributes('alt')) {
      issues.push(`Image at index ${index} missing alt attribute`)
    }
  })

  // Check for missing labels on form inputs
  const inputs = wrapper.findAll('input, textarea, select')
  inputs.forEach((input, index) => {
    const hasLabel = input.attributes('aria-label') || 
                    input.attributes('aria-labelledby') ||
                    wrapper.find(`label[for="${input.attributes('id')}"]`).exists()
    
    if (!hasLabel) {
      issues.push(`Form input at index ${index} missing label`)
    }
  })

  // Check for missing ARIA roles on interactive elements
  const buttons = wrapper.findAll('button, [role="button"]')
  buttons.forEach((button, index) => {
    if (!button.attributes('aria-label') && !button.text().trim()) {
      issues.push(`Button at index ${index} missing accessible label`)
    }
  })

  return issues
}

// Export all utilities
export default {
  createMockUser,
  createMockResearchPaper,
  createMockChatSession,
  createMockChatMessage,
  createMockApiResponse,
  mountComponent,
  mockApiSuccess,
  mockApiError,
  mockFetch,
  waitForElement,
  fillForm,
  submitForm,
  flushPromises,
  nextTick,
  mockLocalStorage,
  MockWebSocket,
  measurePerformance,
  createPerformanceTest,
  checkAccessibility,
}