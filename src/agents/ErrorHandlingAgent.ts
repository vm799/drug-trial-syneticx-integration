import { BaseAgent, AgentContext, AgentResponse } from './BaseAgent'

export interface ErrorTranslation {
  errorType: string
  userMessage: string
  suggestedAction: string
  recoveryOptions: string[]
}

export interface ErrorHandlingConfig {
  enableUserFriendlyMessages: boolean
  enableRecoveryActions: boolean
  enableFallbackResponses: boolean
  enableErrorReporting: boolean
}

export class ErrorHandlingAgent extends BaseAgent {
  private config: ErrorHandlingConfig
  private errorTranslations: Map<string, ErrorTranslation> = new Map()
  private errorHistory: Array<{
    timestamp: Date
    error: string
    context: string
    resolution: string
  }> = []

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    super('error-handling', 'Error Handling Agent', [
      {
        name: 'error_translation',
        description: 'Translates technical errors into user-friendly messages',
        inputTypes: ['error', 'exception'],
        outputTypes: ['user_message', 'recovery_action'],
        dependencies: [],
      },
      {
        name: 'fallback_response',
        description: 'Provides fallback responses when services are unavailable',
        inputTypes: ['service_failure', 'api_error'],
        outputTypes: ['fallback_content', 'alternative_action'],
        dependencies: [],
      },
    ])

    this.config = {
      enableUserFriendlyMessages: true,
      enableRecoveryActions: true,
      enableFallbackResponses: true,
      enableErrorReporting: true,
      ...config,
    }

    this.initializeErrorTranslations()
  }

  async process(context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now()

    try {
      const error = context.metadata?.error || context.metadata?.originalError
      const errorType = this.categorizeError(error)

      this.log('info', 'Processing error', {
        errorType,
        sessionId: context.sessionId,
        error: typeof error === 'string' ? error : error?.message,
      })

      // Get user-friendly translation
      const translation = this.translateError(errorType, error)

      // Generate fallback response if needed
      const fallbackResponse = await this.generateFallbackResponse(context, errorType)

      // Create recovery actions
      const recoveryActions = this.createRecoveryActions(errorType, context)

      // Record error for analytics
      this.recordError(error, context, translation.userMessage)

      const result = {
        userMessage: translation.userMessage,
        suggestedAction: translation.suggestedAction,
        recoveryOptions: recoveryActions,
        fallbackContent: fallbackResponse,
        errorType,
        canRecover: recoveryActions.length > 0,
        severity: this.getErrorSeverity(errorType),
      }

      return this.createResponse(true, result, undefined, {
        processingTime: Date.now() - startTime,
        confidence: 0.9,
        errorType,
        fallbackProvided: !!fallbackResponse,
      })
    } catch (processingError) {
      this.log('error', 'Error processing failed', processingError)

      return this.createResponse(false, undefined, 'Error processing failed', {
        processingTime: Date.now() - startTime,
        confidence: 0,
      })
    }
  }

  canHandle(context: AgentContext): boolean {
    return !!(
      context.metadata?.error ||
      context.metadata?.originalError ||
      context.metadata?.fallbackMode
    )
  }

  async getHealthStatus(): Promise<{ healthy: boolean; details?: any }> {
    return {
      healthy: true,
      details: {
        errorTranslationsLoaded: this.errorTranslations.size,
        recentErrors: this.errorHistory.slice(-5),
        config: this.config,
      },
    }
  }

  // Initialize error translations
  private initializeErrorTranslations(): void {
    const translations: ErrorTranslation[] = [
      {
        errorType: 'OPENAI_RATE_LIMIT',
        userMessage:
          "Our AI assistant is experiencing high demand right now. We're switching to our backup research database to help you.",
        suggestedAction:
          "Try your query again - we'll use cached research data to provide helpful information.",
        recoveryOptions: [
          'Use cached research responses',
          'Search local research database',
          'Try again in a few minutes',
        ],
      },
      {
        errorType: 'PUBMED_TIMEOUT',
        userMessage:
          'PubMed is responding slowly right now. Let me search our local research collection instead.',
        suggestedAction: "I'll provide information from our comprehensive offline database.",
        recoveryOptions: [
          'Search local research papers',
          'Use cached medical literature',
          'Try a more specific search term',
        ],
      },
      {
        errorType: 'NETWORK_ERROR',
        userMessage:
          "There seems to be a connection issue. Don't worry - I can still help using our offline research database.",
        suggestedAction: "I'll show you relevant research findings from our cached collection.",
        recoveryOptions: [
          'Use offline research database',
          'Show cached study results',
          'Check connection and retry',
        ],
      },
      {
        errorType: 'API_UNAUTHORIZED',
        userMessage: "There's a temporary access issue with our external research services.",
        suggestedAction:
          "I'll use our internal database to find relevant medical research for you.",
        recoveryOptions: [
          'Use internal research database',
          'Access cached study data',
          'Contact support if issue persists',
        ],
      },
      {
        errorType: 'DATABASE_ERROR',
        userMessage:
          "Our database is temporarily unavailable. I'll provide information from backup sources.",
        suggestedAction: 'Let me search our backup research collection for relevant studies.',
        recoveryOptions: [
          'Use backup research data',
          'Access emergency cache',
          'Try again shortly',
        ],
      },
      {
        errorType: 'PARSING_ERROR',
        userMessage: 'I had trouble understanding your question. Could you rephrase it?',
        suggestedAction:
          'Try asking about specific medical topics, research findings, or clinical trials.',
        recoveryOptions: [
          'Rephrase your question',
          'Use simpler terms',
          'Ask about specific medical topics',
        ],
      },
      {
        errorType: 'VALIDATION_FAILED',
        userMessage: 'I need to verify some medical information before providing an answer.',
        suggestedAction: "I'll search for peer-reviewed sources to ensure accuracy.",
        recoveryOptions: [
          'Search peer-reviewed sources',
          'Verify with multiple databases',
          'Provide general information instead',
        ],
      },
      {
        errorType: 'SERVICE_UNAVAILABLE',
        userMessage: 'Some of our research services are temporarily down, but I can still help!',
        suggestedAction: "I'll use our offline research library to find relevant information.",
        recoveryOptions: [
          'Use offline research library',
          'Access cached medical studies',
          'Try alternative search methods',
        ],
      },
    ]

    translations.forEach((translation) => {
      this.errorTranslations.set(translation.errorType, translation)
    })

    this.log('info', `Loaded ${translations.length} error translations`)
  }

  // Categorize error based on error message or type
  private categorizeError(error: any): string {
    if (!error) return 'UNKNOWN_ERROR'

    const errorMessage =
      typeof error === 'string' ? error.toLowerCase() : error.message?.toLowerCase() || ''

    // OpenAI errors
    if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return 'OPENAI_RATE_LIMIT'
    }

    // Network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('enotfound') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('timeout')
    ) {
      return 'NETWORK_ERROR'
    }

    // API errors
    if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('403') ||
      errorMessage.includes('401')
    ) {
      return 'API_UNAUTHORIZED'
    }

    // Database errors
    if (
      errorMessage.includes('database') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('mongo')
    ) {
      return 'DATABASE_ERROR'
    }

    // Parsing errors
    if (
      errorMessage.includes('parse') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('malformed')
    ) {
      return 'PARSING_ERROR'
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid input')) {
      return 'VALIDATION_FAILED'
    }

    // Service errors
    if (
      errorMessage.includes('service unavailable') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504')
    ) {
      return 'SERVICE_UNAVAILABLE'
    }

    // PubMed specific
    if (errorMessage.includes('pubmed') || errorMessage.includes('ncbi')) {
      return 'PUBMED_TIMEOUT'
    }

    return 'UNKNOWN_ERROR'
  }

  // Translate error to user-friendly message
  private translateError(errorType: string, originalError: any): ErrorTranslation {
    const translation = this.errorTranslations.get(errorType)

    if (translation) {
      return translation
    }

    // Default fallback translation
    return {
      errorType: 'UNKNOWN_ERROR',
      userMessage:
        'Something unexpected happened, but I can still help you with your research questions.',
      suggestedAction: 'Let me try a different approach to find the information you need.',
      recoveryOptions: [
        'Try your question again',
        'Use simpler search terms',
        'Contact support if the issue continues',
      ],
    }
  }

  // Generate fallback response based on context
  private async generateFallbackResponse(
    context: AgentContext,
    errorType: string,
  ): Promise<string | null> {
    if (!this.config.enableFallbackResponses) {
      return null
    }

    const conversation = context.conversation || []
    const lastMessage = conversation[conversation.length - 1]?.content || ''

    // Generate contextual fallback based on user's question
    if (
      lastMessage.toLowerCase().includes('summary') ||
      lastMessage.toLowerCase().includes('summarize')
    ) {
      return 'I can provide a general overview based on commonly cited medical research. What specific medical topic would you like me to summarize?'
    }

    if (
      lastMessage.toLowerCase().includes('clinical trial') ||
      lastMessage.toLowerCase().includes('study')
    ) {
      return "While I can't access live clinical trial databases right now, I can share information about established research methodologies and common trial findings. What area of clinical research interests you?"
    }

    if (
      lastMessage.toLowerCase().includes('drug') ||
      lastMessage.toLowerCase().includes('medication')
    ) {
      return 'I can provide general information about drug research and development from established medical literature. What specific medication or therapeutic area are you researching?'
    }

    // General fallback
    return "I'm still here to help with your medical research questions using our comprehensive offline database. What would you like to know?"
  }

  // Create recovery actions based on error type and context
  private createRecoveryActions(errorType: string, context: AgentContext): string[] {
    const baseActions = this.errorTranslations.get(errorType)?.recoveryOptions || []

    // Add context-specific recovery actions
    const contextualActions: string[] = []

    if (context.researchPaper) {
      contextualActions.push('Analyze current paper offline')
    }

    if (context.conversation?.length) {
      contextualActions.push('Continue conversation with cached responses')
    }

    if (context.specialization) {
      contextualActions.push(`Search ${context.specialization} specific database`)
    }

    return [...baseActions, ...contextualActions].slice(0, 5) // Limit to 5 options
  }

  // Get error severity level
  private getErrorSeverity(errorType: string): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityErrors = ['DATABASE_ERROR', 'SERVICE_UNAVAILABLE']
    const mediumSeverityErrors = ['OPENAI_RATE_LIMIT', 'API_UNAUTHORIZED', 'PUBMED_TIMEOUT']
    const lowSeverityErrors = ['PARSING_ERROR', 'VALIDATION_FAILED', 'NETWORK_ERROR']

    if (highSeverityErrors.includes(errorType)) return 'high'
    if (mediumSeverityErrors.includes(errorType)) return 'medium'
    if (lowSeverityErrors.includes(errorType)) return 'low'

    return 'medium' // Default
  }

  // Record error for analytics
  private recordError(error: any, context: AgentContext, resolution: string): void {
    if (!this.config.enableErrorReporting) return

    this.errorHistory.push({
      timestamp: new Date(),
      error: typeof error === 'string' ? error : error?.message || 'Unknown error',
      context: `Session: ${context.sessionId}, User: ${context.userId || 'anonymous'}`,
      resolution,
    })

    // Keep only last 100 errors
    if (this.errorHistory.length > 100) {
      this.errorHistory.splice(0, this.errorHistory.length - 100)
    }
  }

  // Get error statistics
  getErrorStats(): any {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const recentErrors = this.errorHistory.filter((e) => now - e.timestamp.getTime() < oneHour)

    const errorCounts = this.errorHistory.reduce(
      (acc, error) => {
        const type = this.categorizeError(error.error)
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recentErrors.length,
      errorsByType: errorCounts,
      mostCommonError: Object.keys(errorCounts).reduce(
        (a, b) => (errorCounts[a] > errorCounts[b] ? a : b),
        'none',
      ),
    }
  }
}
