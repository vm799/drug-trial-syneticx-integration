// Comprehensive API type definitions for enterprise frontend

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: ValidationError[]
  metadata?: ResponseMetadata
}

export interface ValidationError {
  field: string
  message: string
  value: any
}

export interface ResponseMetadata {
  timestamp: string
  version: string
  requestId: string
  processingTime: number
  rateLimit?: {
    remaining: number
    reset: Date
    limit: number
  }
}

// Authentication Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  organization?: string
  specialization?: MedicalSpecialization[]
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: User
  expiresAt: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: UserRole
  subscription: SubscriptionTier
  organization?: string
  specialization: MedicalSpecialization[]
  isActive: boolean
  emailVerified: boolean
  lastActivity: string
  createdAt: string
  updatedAt: string
  preferences: UserPreferences
  apiUsage: ApiUsage
}

export type UserRole = 'user' | 'researcher' | 'admin'
export type SubscriptionTier = 'free' | 'premium' | 'enterprise'

export type MedicalSpecialization = 
  | 'oncology'
  | 'cardiology' 
  | 'neurology'
  | 'infectious_diseases'
  | 'immunology'
  | 'pharmacology'
  | 'surgery'
  | 'pediatrics'
  | 'geriatrics'
  | 'psychiatry'
  | 'dermatology'
  | 'endocrinology'
  | 'clinical_trials'
  | 'epidemiology'
  | 'biostatistics'
  | 'other'

export interface UserPreferences {
  language: string
  timezone: string
  notifications: NotificationSettings
  ai_settings: AISettings
}

export interface NotificationSettings {
  email: boolean
  research_updates: boolean
  system_alerts: boolean
}

export interface AISettings {
  response_length: 'concise' | 'detailed' | 'comprehensive'
  include_citations: boolean
  confidence_threshold: number
}

export interface ApiUsage {
  daily: UsagePeriod
  monthly: UsagePeriod
}

export interface UsagePeriod {
  requests: number
  tokens: number
  date?: string
  month?: number
  year?: number
}

// Chat Types
export interface ChatSession {
  sessionId: string
  userId: string
  title?: string
  context: ChatContext
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
  isActive: boolean
  quality?: QualityMetrics
}

export interface ChatContext {
  type: 'research' | 'general' | 'paper_analysis'
  researchPaper?: string // Research paper ID
  specialization?: MedicalSpecialization
  metadata?: Record<string, any>
}

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  tokens: number
  confidence: number
  responseTime: number
  agentId?: string
  sources?: Source[]
  validation?: ValidationResult
  nextAgent?: string
}

export interface ValidationResult {
  hasCitations: boolean
  factChecked: boolean
  riskFlags: string[]
  confidence: number
}

export interface Source {
  type: 'paper' | 'database' | 'web'
  title: string
  url?: string
  relevanceScore: number
  paperId?: string
}

export interface SendMessageRequest {
  message: string
  context?: Partial<ChatContext>
}

export interface CreateSessionRequest {
  title?: string
  context: ChatContext
}

export interface QualityMetrics {
  coherenceScore: number
  relevanceScore: number
  accuracyScore: number
  flagged: boolean
}

// Research Paper Types
export interface ResearchPaper {
  id: string
  pubmedId?: string
  doi?: string
  title: string
  abstract: string
  authors: Author[]
  journal: Journal
  publicationDate: string
  volume?: string
  issue?: string
  pages?: string
  researchType: ResearchType
  medicalFields: MedicalSpecialization[]
  keywords: string[]
  meshTerms: string[]
  qualityScore: number
  evidenceLevel: 'A' | 'B' | 'C' | 'D'
  citationCount: number
  clinicalTrial?: ClinicalTrialData
  aiProcessing: AIProcessingData
  interactions: InteractionMetrics
  validation: ValidationFlags
  fullText?: FullTextData
  source: 'pubmed' | 'manual' | 'import' | 'clinicaltrials_gov'
  language: string
  status: 'active' | 'archived' | 'flagged' | 'processing'
  createdAt: string
  updatedAt: string
}

export interface Author {
  name: string
  affiliation?: string
  orcid?: string
}

export interface Journal {
  name: string
  issn?: string
  impactFactor?: number
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4'
}

export type ResearchType = 
  | 'clinical_trial'
  | 'systematic_review'
  | 'meta_analysis'
  | 'case_study'
  | 'cohort_study'
  | 'randomized_controlled_trial'
  | 'observational_study'
  | 'laboratory_study'
  | 'review_article'
  | 'other'

export interface ClinicalTrialData {
  phase?: 'preclinical' | 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4'
  studyType?: 'interventional' | 'observational'
  participantCount?: number
  primaryEndpoint?: string
  secondaryEndpoints?: string[]
  inclusion_criteria?: string[]
  exclusion_criteria?: string[]
  clinicalTrialsGovId?: string
}

export interface AIProcessingData {
  lastProcessed?: string
  embedding?: number[]
  summaryGenerated: boolean
  factChecked: boolean
  confidenceScore: number
}

export interface InteractionMetrics {
  views: number
  bookmarks: number
  shares: number
  chatSessions: number
}

export interface ValidationFlags {
  peerReviewed: boolean
  retracted: boolean
  flagged: boolean
  flagReason?: string
  lastValidated?: string
}

export interface FullTextData {
  available: boolean
  content?: string
  sections?: Section[]
}

export interface Section {
  title: string
  content: string
  type: 'introduction' | 'methods' | 'results' | 'discussion' | 'conclusion'
}

// Search and Filtering Types
export interface PaperSearchParams {
  search?: string
  field?: MedicalSpecialization
  type?: ResearchType
  page?: number
  limit?: number
  sort?: 'relevance' | 'date' | 'quality' | 'citations'
  dateFrom?: string
  dateTo?: string
  qualityMin?: number
  evidenceLevel?: ('A' | 'B' | 'C' | 'D')[]
  hasFullText?: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
  filters?: FilterInfo
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface FilterInfo {
  appliedFilters: Record<string, any>
  availableFilters: Record<string, any[]>
  resultCount: number
}

// Analytics Types
export interface AnalyticsData {
  usage: UsageAnalytics
  research: ResearchAnalytics
  quality: QualityAnalytics
  trends: TrendAnalytics
}

export interface UsageAnalytics {
  totalRequests: number
  totalSessions: number
  averageSessionLength: number
  peakUsageHour: number
  apiUsageByDay: DailyUsage[]
}

export interface DailyUsage {
  date: string
  requests: number
  tokens: number
  sessions: number
}

export interface ResearchAnalytics {
  totalPapers: number
  papersByField: FieldDistribution[]
  recentPapers: number
  topJournals: JournalStats[]
}

export interface FieldDistribution {
  field: MedicalSpecialization
  count: number
  percentage: number
}

export interface JournalStats {
  name: string
  count: number
  averageQuality: number
  impactFactor?: number
}

export interface QualityAnalytics {
  averageQuality: number
  citationDistribution: CitationStats
  evidenceLevelDistribution: EvidenceStats[]
}

export interface CitationStats {
  average: number
  median: number
  max: number
  distribution: number[]
}

export interface EvidenceStats {
  level: 'A' | 'B' | 'C' | 'D'
  count: number
  percentage: number
}

export interface TrendAnalytics {
  researchTrends: TrendData[]
  emergingTopics: Topic[]
  collaborationPatterns: CollaborationData[]
}

export interface TrendData {
  topic: string
  timeline: TimelinePoint[]
  growth: number
}

export interface TimelinePoint {
  date: string
  value: number
}

export interface Topic {
  name: string
  relevanceScore: number
  paperCount: number
  recentGrowth: number
}

export interface CollaborationData {
  institution: string
  collaborations: number
  networkSize: number
}

// WebSocket Types
export interface WebSocketMessage {
  type: WebSocketMessageType
  payload: any
  timestamp: string
  sessionId?: string
}

export type WebSocketMessageType =
  | 'chat_message'
  | 'typing_start'
  | 'typing_stop' 
  | 'session_created'
  | 'session_updated'
  | 'user_joined'
  | 'user_left'
  | 'error'
  | 'system_notification'

export interface TypingIndicator {
  userId: string
  sessionId: string
  isTyping: boolean
}

// Agent System Types
export interface AgentResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: AgentMetadata
  context?: AgentContext
}

export interface AgentMetadata {
  agentId: string
  processingTime: number
  confidence: number
  sources?: string[]
  nextAgent?: string
}

export interface AgentContext {
  sessionId: string
  userId?: string
  requestId: string
  timestamp: Date
  specialization?: MedicalSpecialization
  researchPaper?: ResearchPaper
  conversation?: ChatMessage[]
  metadata?: Record<string, any>
}

// Error Types
export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
  requestId: string
}

export type ApiErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INVALID_REQUEST'

// Component Props Types
export interface ChatInterfaceProps {
  visible: boolean
  sessionId?: string
  initialContext?: Partial<ChatContext>
  onSessionCreated?: (session: ChatSession) => void
  onMessageSent?: (message: ChatMessage) => void
  onClose?: () => void
}

export interface ResearchPaperProps {
  paper: ResearchPaper
  expanded?: boolean
  showActions?: boolean
  onBookmark?: (paper: ResearchPaper) => void
  onShare?: (paper: ResearchPaper) => void
  onAnalyze?: (paper: ResearchPaper) => void
}

export interface SuggestionCardProps {
  suggestion: ResearchSuggestion
  onAccept?: (suggestion: ResearchSuggestion) => void
  onDismiss?: (suggestion: ResearchSuggestion) => void
}

export interface ResearchSuggestion {
  id: string
  type: 'paper' | 'topic' | 'collaboration' | 'trend'
  title: string
  description: string
  relevanceScore: number
  data: any
  createdAt: string
}

// Form Types
export interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  organization?: string
  specialization: MedicalSpecialization[]
  agreeToTerms: boolean
}

export interface ProfileUpdateForm {
  firstName: string
  lastName: string
  organization?: string
  specialization: MedicalSpecialization[]
  preferences: UserPreferences
}

export interface PaperSubmissionForm {
  title: string
  abstract: string
  authors: Author[]
  journal: Partial<Journal>
  publicationDate: string
  researchType: ResearchType
  medicalFields: MedicalSpecialization[]
  keywords: string[]
  doi?: string
  pubmedId?: string
  fullTextFile?: File
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface RequestConfig {
  method: ApiMethod
  url: string
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
}

// State Management Types
export interface AppState {
  auth: AuthState
  chat: ChatState
  research: ResearchState
  ui: UIState
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface ChatState {
  currentSession: ChatSession | null
  sessions: ChatSession[]
  messages: ChatMessage[]
  isLoading: boolean
  isTyping: boolean
  error: string | null
}

export interface ResearchState {
  papers: ResearchPaper[]
  currentPaper: ResearchPaper | null
  searchResults: PaginatedResponse<ResearchPaper> | null
  bookmarks: ResearchPaper[]
  isLoading: boolean
  error: string | null
}

export interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  chatVisible: boolean
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
  createdAt: string
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

// Configuration Types
export interface AppConfig {
  api: {
    baseUrl: string
    timeout: number
    retryAttempts: number
  }
  websocket: {
    url: string
    reconnectInterval: number
    maxReconnectAttempts: number
  }
  features: {
    enableChat: boolean
    enableVoiceInput: boolean
    enableAnalytics: boolean
    enableRealTimeUpdates: boolean
  }
  limits: {
    maxFileSize: number
    maxMessageLength: number
    maxSessionDuration: number
  }
}