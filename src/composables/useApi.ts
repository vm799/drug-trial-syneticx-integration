// Enterprise API composable with comprehensive error handling and retry logic
import { ref, reactive, computed } from 'vue'
import type {
  ApiResponse,
  RequestConfig,
  ApiError,
  ApiErrorCode,
  User,
  ChatSession,
  ChatMessage,
  ResearchPaper,
  PaperSearchParams,
  PaginatedResponse,
  AnalyticsData
} from '@/types/api'

// API Configuration
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
}

// Global API state
export const apiState = reactive({
  isOnline: navigator.onLine,
  requestsInFlight: 0,
  lastRequestTime: null as Date | null,
  rateLimitStatus: null as { remaining: number; reset: Date } | null,
})

// Network status monitoring
window.addEventListener('online', () => {
  apiState.isOnline = true
})

window.addEventListener('offline', () => {
  apiState.isOnline = false
})

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public details?: any,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Request interceptor for authentication
const addAuthHeader = (config: RequestConfig): RequestConfig => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return config
}

// Response interceptor for error handling
const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const responseData = await response.json().catch(() => ({}))

  // Update rate limit info
  if (response.headers.has('x-ratelimit-remaining')) {
    apiState.rateLimitStatus = {
      remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
      reset: new Date(response.headers.get('x-ratelimit-reset') || Date.now()),
    }
  }

  if (!response.ok) {
    const errorCode = getErrorCodeFromStatus(response.status)
    throw new ApiError(
      errorCode,
      responseData.message || `Request failed with status ${response.status}`,
      responseData,
      response.status
    )
  }

  return responseData
}

// Map HTTP status codes to API error codes
const getErrorCodeFromStatus = (status: number): ApiErrorCode => {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR'
    case 401:
      return 'AUTHENTICATION_ERROR'
    case 403:
      return 'AUTHORIZATION_ERROR'
    case 404:
      return 'NOT_FOUND'
    case 429:
      return 'RATE_LIMIT_EXCEEDED'
    case 500:
      return 'INTERNAL_ERROR'
    case 503:
      return 'SERVICE_UNAVAILABLE'
    default:
      return 'INVALID_REQUEST'
  }
}

// Retry logic with exponential backoff
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  attempts: number = API_CONFIG.retryAttempts
): Promise<T> => {
  let lastError: any

  for (let i = 0; i < attempts; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error

      // Don't retry for certain error types
      if (error instanceof ApiError) {
        const noRetryErrors: ApiErrorCode[] = [
          'AUTHENTICATION_ERROR',
          'AUTHORIZATION_ERROR',
          'VALIDATION_ERROR',
          'NOT_FOUND',
        ]
        if (noRetryErrors.includes(error.code)) {
          throw error
        }
      }

      // Wait before retrying (exponential backoff)
      if (i < attempts - 1) {
        const delay = API_CONFIG.retryDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// Main API request function
const apiRequest = async <T = any>(config: RequestConfig): Promise<ApiResponse<T>> => {
  if (!apiState.isOnline) {
    throw new ApiError('SERVICE_UNAVAILABLE', 'No internet connection')
  }

  apiState.requestsInFlight++
  apiState.lastRequestTime = new Date()

  try {
    const authenticatedConfig = addAuthHeader(config)
    const url = `${API_CONFIG.baseUrl}${config.url}`

    const fetchOptions: RequestInit = {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...authenticatedConfig.headers,
      },
      signal: AbortSignal.timeout(config.timeout || API_CONFIG.timeout),
    }

    // Add body for POST/PUT/PATCH requests
    if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      fetchOptions.body = JSON.stringify(config.data)
    }

    // Add query parameters for GET requests
    const urlWithParams = config.params
      ? `${url}?${new URLSearchParams(config.params)}`
      : url

    return await retryRequest(async () => {
      const response = await fetch(urlWithParams, fetchOptions)
      return handleApiResponse<T>(response)
    })
  } finally {
    apiState.requestsInFlight--
  }
}

// Composable hook for API operations
export function useApi() {
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  const isLoading = computed(() => loading.value || apiState.requestsInFlight > 0)
  const hasError = computed(() => error.value !== null)

  const clearError = () => {
    error.value = null
  }

  const handleError = (err: any) => {
    error.value = err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', err.message)
    console.error('API Error:', error.value)
  }

  // Generic request method
  const request = async <T = any>(config: RequestConfig): Promise<T | null> => {
    loading.value = true
    clearError()

    try {
      const response = await apiRequest<T>(config)
      return response.data || null
    } catch (err) {
      handleError(err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Authentication methods
  const login = async (email: string, password: string) => {
    return request<{ token: string; user: User }>({
      method: 'POST',
      url: '/auth/login',
      data: { email, password },
    })
  }

  const register = async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    organization?: string
    specialization?: string[]
  }) => {
    return request<{ token: string; user: User }>({
      method: 'POST',
      url: '/auth/register',
      data: userData,
    })
  }

  const logout = async () => {
    return request({
      method: 'POST',
      url: '/auth/logout',
    })
  }

  const refreshToken = async () => {
    return request<{ token: string }>({
      method: 'POST',
      url: '/auth/refresh',
    })
  }

  // User methods
  const getCurrentUser = async () => {
    return request<User>({
      method: 'GET',
      url: '/user/profile',
    })
  }

  const updateProfile = async (updates: Partial<User>) => {
    return request<User>({
      method: 'PUT',
      url: '/user/profile',
      data: updates,
    })
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return request({
      method: 'PUT',
      url: '/user/password',
      data: { currentPassword, newPassword },
    })
  }

  // Chat methods
  const createChatSession = async (context: {
    type: string
    researchPaper?: string
    specialization?: string
  }) => {
    return request<ChatSession>({
      method: 'POST',
      url: '/chat/sessions',
      data: { context },
    })
  }

  const getChatSessions = async () => {
    return request<ChatSession[]>({
      method: 'GET',
      url: '/chat/sessions',
    })
  }

  const getChatSession = async (sessionId: string) => {
    return request<ChatSession>({
      method: 'GET',
      url: `/chat/sessions/${sessionId}`,
    })
  }

  const sendMessage = async (sessionId: string, message: string, context?: any) => {
    return request<{
      response: ChatMessage
      session: ChatSession
    }>({
      method: 'POST',
      url: `/chat/sessions/${sessionId}/messages`,
      data: { message, context },
    })
  }

  const deleteChatSession = async (sessionId: string) => {
    return request({
      method: 'DELETE',
      url: `/chat/sessions/${sessionId}`,
    })
  }

  // Research paper methods
  const searchPapers = async (params: PaperSearchParams) => {
    return request<PaginatedResponse<ResearchPaper>>({
      method: 'GET',
      url: '/research/papers',
      params: params as Record<string, any>,
    })
  }

  const getPaper = async (paperId: string) => {
    return request<ResearchPaper>({
      method: 'GET',
      url: `/research/papers/${paperId}`,
    })
  }

  const analyzePaper = async (paperId: string, analysisType?: string) => {
    return request<{
      analysis: string
      confidence: number
      sources: string[]
    }>({
      method: 'POST',
      url: `/research/papers/${paperId}/analyze`,
      data: { analysisType },
    })
  }

  const bookmarkPaper = async (paperId: string) => {
    return request({
      method: 'POST',
      url: `/research/papers/${paperId}/bookmark`,
    })
  }

  const unbookmarkPaper = async (paperId: string) => {
    return request({
      method: 'DELETE',
      url: `/research/papers/${paperId}/bookmark`,
    })
  }

  const getBookmarks = async () => {
    return request<ResearchPaper[]>({
      method: 'GET',
      url: '/user/bookmarks',
    })
  }

  const submitPaper = async (paperData: Partial<ResearchPaper>) => {
    return request<ResearchPaper>({
      method: 'POST',
      url: '/research/papers',
      data: paperData,
    })
  }

  // Analytics methods
  const getDashboardAnalytics = async (days: number = 30) => {
    return request<AnalyticsData>({
      method: 'GET',
      url: '/analytics/dashboard',
      params: { days },
    })
  }

  const getUsageAnalytics = async (period: string = 'month') => {
    return request<any>({
      method: 'GET',
      url: '/analytics/usage',
      params: { period },
    })
  }

  // File upload method
  const uploadFile = async (file: File, type: string = 'paper') => {
    loading.value = true
    clearError()

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_CONFIG.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      const responseData = await handleApiResponse(response)
      return responseData.data
    } catch (err) {
      handleError(err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Health check
  const healthCheck = async () => {
    return request({
      method: 'GET',
      url: '/health',
    })
  }

  return {
    // State
    loading: isLoading,
    error: computed(() => error.value),
    hasError,
    apiState: computed(() => apiState),

    // Methods
    clearError,
    request,

    // Auth
    login,
    register,
    logout,
    refreshToken,

    // User
    getCurrentUser,
    updateProfile,
    changePassword,

    // Chat
    createChatSession,
    getChatSessions,
    getChatSession,
    sendMessage,
    deleteChatSession,

    // Research
    searchPapers,
    getPaper,
    analyzePaper,
    bookmarkPaper,
    unbookmarkPaper,
    getBookmarks,
    submitPaper,

    // Analytics
    getDashboardAnalytics,
    getUsageAnalytics,

    // Utils
    uploadFile,
    healthCheck,
  }
}

// Specialized composables for specific domains
export function useAuth() {
  const { login, register, logout, refreshToken, getCurrentUser, loading, error } = useApi()
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => {
    return !!localStorage.getItem('authToken') && !!user.value
  })

  const initialize = async () => {
    const token = localStorage.getItem('authToken')
    if (token) {
      const userData = await getCurrentUser()
      if (userData) {
        user.value = userData
      } else {
        localStorage.removeItem('authToken')
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    const response = await login(email, password)
    if (response) {
      localStorage.setItem('authToken', response.token)
      user.value = response.user
      return true
    }
    return false
  }

  const signUp = async (userData: any) => {
    const response = await register(userData)
    if (response) {
      localStorage.setItem('authToken', response.token)
      user.value = response.user
      return true
    }
    return false
  }

  const signOut = async () => {
    await logout()
    localStorage.removeItem('authToken')
    user.value = null
  }

  return {
    user: computed(() => user.value),
    isAuthenticated,
    loading,
    error,
    initialize,
    signIn,
    signUp,
    signOut,
  }
}

export function useResearch() {
  const {
    searchPapers,
    getPaper,
    analyzePaper,
    bookmarkPaper,
    unbookmarkPaper,
    getBookmarks,
    loading,
    error,
  } = useApi()

  const papers = ref<ResearchPaper[]>([])
  const currentPaper = ref<ResearchPaper | null>(null)
  const bookmarks = ref<ResearchPaper[]>([])

  const search = async (params: PaperSearchParams) => {
    const results = await searchPapers(params)
    if (results) {
      papers.value = results.items
    }
    return results
  }

  const loadPaper = async (paperId: string) => {
    const paper = await getPaper(paperId)
    if (paper) {
      currentPaper.value = paper
    }
    return paper
  }

  const loadBookmarks = async () => {
    const bookmarkedPapers = await getBookmarks()
    if (bookmarkedPapers) {
      bookmarks.value = bookmarkedPapers
    }
  }

  const toggleBookmark = async (paperId: string) => {
    const isBookmarked = bookmarks.value.some(p => p.id === paperId)
    
    if (isBookmarked) {
      await unbookmarkPaper(paperId)
      bookmarks.value = bookmarks.value.filter(p => p.id !== paperId)
    } else {
      await bookmarkPaper(paperId)
      const paper = await getPaper(paperId)
      if (paper) {
        bookmarks.value.push(paper)
      }
    }
  }

  return {
    papers: computed(() => papers.value),
    currentPaper: computed(() => currentPaper.value),
    bookmarks: computed(() => bookmarks.value),
    loading,
    error,
    search,
    loadPaper,
    loadBookmarks,
    toggleBookmark,
    analyzePaper,
  }
}