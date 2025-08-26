interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errors?: any[]
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: string
  subscription: string
  organization?: string
  specialization: string[]
  preferences: any
}

interface AuthResponse {
  token: string
  sessionId: string
  user: User
}

interface ChatMessage {
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    tokens?: number
    confidence?: number
    responseTime?: number
    evidence?: any[]
    validation?: any
  }
}

interface ChatSession {
  sessionId: string
  title: string
  status: string
  context: {
    type: string
    researchPaper?: string
    specialization?: string
  }
  messages: ChatMessage[]
  metrics: {
    totalMessages: number
    lastActivity: string
  }
}

interface ResearchPaper {
  _id: string
  title: string
  authors: Array<{ name: string; affiliation?: string }>
  journal: { name: string; impactFactor?: number }
  publicationDate: string
  abstract: string
  researchType: string
  medicalFields: string[]
  qualityScore: number
  citationCount: number
  interactions: {
    views: number
    bookmarks: number
    shares: number
  }
  doi?: string
}

class ApiService {
  private baseURL: string
  private token: string | null = null
  private sessionId: string | null = null

  constructor() {
    // Determine base URL based on environment
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    this.baseURL = import.meta.env.VITE_API_URL || (isDevelopment ? 'http://localhost:3001/api' : '/api')
    this.token = localStorage.getItem('authToken')
    this.sessionId = localStorage.getItem('sessionId')
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      defaultHeaders.Authorization = `Bearer ${this.token}`
    }

    if (this.sessionId) {
      defaultHeaders['X-Session-ID'] = this.sessionId
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      })

      // Check if response is ok before trying to read the body
      if (!response.ok) {
        let errorMessage = 'API request failed'
        try {
          // Try to read error response as JSON
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (jsonError) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Only read the body if response is ok
      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // Authentication methods
  async register(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    organization?: string
    specialization?: string[]
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    if (response.success && response.data) {
      this.setAuthData(response.data.token, response.data.sessionId)
      return response.data
    }

    throw new Error(response.message || 'Registration failed')
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (response.success && response.data) {
      this.setAuthData(response.data.token, response.data.sessionId)
      return response.data
    }

    throw new Error(response.message || 'Login failed')
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' })
    this.clearAuthData()
  }

  async getProfile(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me')

    if (response.success && response.data) {
      return response.data.user
    }

    throw new Error(response.message || 'Failed to fetch profile')
  }

  // Chat methods
  async createChatSession(context?: {
    type?: string
    researchPaper?: string
    specialization?: string
  }): Promise<ChatSession> {
    const response = await this.request<{ session: ChatSession }>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ context }),
    })

    if (response.success && response.data) {
      return response.data.session
    }

    throw new Error(response.message || 'Failed to create chat session')
  }

  async getChatSessions(
    page = 1,
    limit = 20,
  ): Promise<{
    sessions: ChatSession[]
    pagination: any
  }> {
    const response = await this.request<{
      sessions: ChatSession[]
      pagination: any
    }>(`/chat/sessions?page=${page}&limit=${limit}`)

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to fetch chat sessions')
  }

  async getChatSession(sessionId: string): Promise<ChatSession> {
    const response = await this.request<{ session: ChatSession }>(`/chat/sessions/${sessionId}`)

    if (response.success && response.data) {
      return response.data.session
    }

    throw new Error(response.message || 'Failed to fetch chat session')
  }

  async sendMessage(
    sessionId: string,
    message: string,
    context?: any,
  ): Promise<{
    response: {
      content: string
      metadata: any
    }
    session: any
  }> {
    const response = await this.request<{
      response: {
        content: string
        metadata: any
      }
      session: any
    }>(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to send message')
  }

  // Research methods
  async getResearchPapers(params?: {
    page?: number
    limit?: number
    search?: string
    field?: string
    type?: string
    sort?: string
  }): Promise<{
    papers: ResearchPaper[]
    pagination: any
    filters: any
  }> {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const response = await this.request<{
      papers: ResearchPaper[]
      pagination: any
      filters: any
    }>(`/research/papers?${queryParams}`)

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to fetch research papers')
  }

  async getResearchPaper(id: string): Promise<ResearchPaper> {
    const response = await this.request<{ paper: ResearchPaper }>(`/research/papers/${id}`)

    if (response.success && response.data) {
      return response.data.paper
    }

    throw new Error(response.message || 'Failed to fetch research paper')
  }

  async bookmarkPaper(id: string): Promise<{ bookmarked: boolean; bookmarkCount: number }> {
    const response = await this.request<{ bookmarked: boolean; bookmarkCount: number }>(
      `/research/papers/${id}/bookmark`,
      { method: 'POST' },
    )

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to bookmark paper')
  }

  async getBookmarks(
    page = 1,
    limit = 20,
  ): Promise<{
    papers: ResearchPaper[]
    pagination: any
  }> {
    const response = await this.request<{
      papers: ResearchPaper[]
      pagination: any
    }>(`/research/bookmarks?page=${page}&limit=${limit}`)

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to fetch bookmarks')
  }

  async analyzePaper(
    id: string,
    analysisType: 'summary' | 'methodology' | 'findings' | 'limitations' | 'comparison',
    additionalContext?: string,
  ): Promise<any> {
    const response = await this.request(`/research/papers/${id}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ analysisType, additionalContext }),
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to analyze paper')
  }

  // Analytics methods
  async getDashboardAnalytics(days = 30): Promise<any> {
    const response = await this.request(`/analytics/dashboard?days=${days}`)

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to fetch analytics')
  }

  // Utility methods
  private setAuthData(token: string, sessionId: string): void {
    this.token = token
    this.sessionId = sessionId
    localStorage.setItem('authToken', token)
    localStorage.setItem('sessionId', sessionId)
  }

  private clearAuthData(): void {
    this.token = null
    this.sessionId = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('sessionId')
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  getToken(): string | null {
    return this.token
  }
}

// Create singleton instance
const apiService = new ApiService()

export default apiService
export type { User, ChatSession, ChatMessage, ResearchPaper, ApiResponse }
