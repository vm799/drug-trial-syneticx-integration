import { BaseAgent, AgentContext, AgentResponse } from './BaseAgent'

export interface ValidationConfig {
  enableCitationCheck: boolean
  enableFactVerification: boolean
  enableMedicalSafety: boolean
  enablePeerReviewCheck: boolean
  minConfidenceThreshold: number
  maxResponseLength: number
  requireMultipleSources: boolean
}

export interface ValidationResult {
  isValid: boolean
  confidence: number
  issues: ValidationIssue[]
  recommendations: string[]
  enhancedData?: any
  qualityScore: number
}

export interface ValidationIssue {
  type: 'citation' | 'fact' | 'safety' | 'review' | 'confidence' | 'source'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  recommendation: string
  location?: string
}

export interface MedicalSafetyCheck {
  containsMedicalAdvice: boolean
  hasDiagnosticContent: boolean
  includesDosageInfo: boolean
  recommendsTreatment: boolean
  riskLevel: 'low' | 'medium' | 'high'
  safeguards: string[]
}

export class ValidationAgent extends BaseAgent {
  private config: ValidationConfig
  private validationHistory: Array<{
    timestamp: Date
    contentHash: string
    result: ValidationResult
    source: string
  }> = []
  
  private medicalTerminology: Set<string> = new Set()
  private prohibitedPhrases: Set<string> = new Set()
  private citationPatterns: RegExp[] = []

  constructor(config: Partial<ValidationConfig> = {}) {
    super('validation', 'Validation Agent', [
      {
        name: 'content_validation',
        description: 'Validates medical content for accuracy and safety',
        inputTypes: ['medical_content', 'research_data'],
        outputTypes: ['validation_result', 'quality_score'],
        dependencies: []
      },
      {
        name: 'citation_verification',
        description: 'Verifies and enhances citations in medical content',
        inputTypes: ['cited_content'],
        outputTypes: ['citation_status', 'enhanced_citations'],
        dependencies: []
      },
      {
        name: 'safety_screening',
        description: 'Screens content for medical safety concerns',
        inputTypes: ['medical_text'],
        outputTypes: ['safety_report', 'risk_assessment'],
        dependencies: []
      }
    ])

    this.config = {
      enableCitationCheck: true,
      enableFactVerification: true,
      enableMedicalSafety: true,
      enablePeerReviewCheck: true,
      minConfidenceThreshold: 0.7,
      maxResponseLength: 2000,
      requireMultipleSources: true,
      ...config
    }

    this.initializeValidationResources()
  }

  async process(context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now()

    try {
      const content = this.extractContent(context)
      const contentType = context.metadata?.type || 'medical_content'
      
      this.log('info', 'Validating content', { 
        contentLength: content.length,
        type: contentType,
        sessionId: context.sessionId 
      })

      // Perform comprehensive validation
      const validationResult = await this.validateContent(content, context)
      
      // Record validation for analytics
      this.recordValidation(content, validationResult, context.metadata?.source || 'unknown')

      // Determine if content passes validation
      const passes = validationResult.isValid && 
                    validationResult.confidence >= this.config.minConfidenceThreshold &&
                    !validationResult.issues.some(issue => issue.severity === 'critical')

      return this.createResponse(passes, validationResult, passes ? undefined : 'Content validation failed', {
        processingTime: Date.now() - startTime,
        confidence: validationResult.confidence,
        qualityScore: validationResult.qualityScore,
        issueCount: validationResult.issues.length,
        validationPassed: passes
      })

    } catch (error) {
      this.log('error', 'Validation process failed', error)
      
      return this.createResponse(false, undefined, `Validation failed: ${error.message}`, {
        processingTime: Date.now() - startTime,
        confidence: 0
      })
    }
  }

  canHandle(context: AgentContext): boolean {
    return !!(
      context.metadata?.requiresValidation ||
      context.metadata?.type === 'medical_content' ||
      context.metadata?.data ||
      context.conversation?.length
    )
  }

  async getHealthStatus(): Promise<{ healthy: boolean; details?: any }> {
    const recentValidations = this.validationHistory.slice(-20)
    const passRate = recentValidations.length > 0 
      ? recentValidations.filter(v => v.result.isValid).length / recentValidations.length 
      : 1

    return {
      healthy: passRate > 0.8,
      details: {
        totalValidations: this.validationHistory.length,
        recentPassRate: passRate,
        averageQualityScore: this.calculateAverageQuality(),
        config: this.config,
        resourcesLoaded: {
          medicalTerms: this.medicalTerminology.size,
          prohibitedPhrases: this.prohibitedPhrases.size,
          citationPatterns: this.citationPatterns.length
        }
      }
    }
  }

  // Initialize validation resources
  private initializeValidationResources(): void {
    // Medical terminology for validation
    const medicalTerms = [
      'clinical trial', 'randomized controlled trial', 'systematic review', 'meta-analysis',
      'peer-reviewed', 'placebo', 'double-blind', 'efficacy', 'safety profile',
      'adverse effects', 'contraindications', 'dosage', 'pharmacokinetics',
      'biomarker', 'endpoint', 'statistical significance', 'confidence interval'
    ]
    medicalTerms.forEach(term => this.medicalTerminology.add(term.toLowerCase()))

    // Prohibited phrases that could indicate medical advice
    const prohibitedPhrases = [
      'you should take', 'i recommend taking', 'stop taking', 'increase your dose',
      'you have', 'you are diagnosed with', 'treatment for you', 'prescribed for you',
      'medical advice for you', 'your condition requires', 'your symptoms indicate'
    ]
    prohibitedPhrases.forEach(phrase => this.prohibitedPhrases.add(phrase.toLowerCase()))

    // Citation patterns
    this.citationPatterns = [
      /\([^)]*\d{4}[^)]*\)/g, // (Author, 2024) or (Journal 2024)
      /\[[^\]]*\d+[^\]]*\]/g, // [1] or [Smith et al.]
      /doi:\s*[\d\.\/\w-]+/gi, // DOI references
      /pmid:\s*\d+/gi, // PubMed IDs
      /https?:\/\/[^\s]+/gi, // URLs
      /according to [^.,]+/gi, // "according to study..."
      /studies? (?:show|suggest|indicate|demonstrate|found)/gi
    ]

    this.log('info', 'Validation resources initialized', {
      medicalTerms: this.medicalTerminology.size,
      prohibitedPhrases: this.prohibitedPhrases.size,
      citationPatterns: this.citationPatterns.length
    })
  }

  // Extract content to validate from context
  private extractContent(context: AgentContext): string {
    if (context.metadata?.content) {
      return context.metadata.content
    }

    if (context.metadata?.data?.content) {
      return context.metadata.data.content
    }

    if (context.metadata?.data?.response) {
      return context.metadata.data.response
    }

    if (context.conversation?.length) {
      const lastMessage = context.conversation[context.conversation.length - 1]
      return lastMessage?.content || ''
    }

    return context.metadata?.query || ''
  }

  // Main validation function
  private async validateContent(content: string, context: AgentContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = []
    let qualityScore = 1.0
    let confidence = 0.8

    // 1. Citation validation
    if (this.config.enableCitationCheck) {
      const citationResult = this.validateCitations(content)
      issues.push(...citationResult.issues)
      qualityScore *= citationResult.qualityFactor
    }

    // 2. Medical safety screening
    if (this.config.enableMedicalSafety) {
      const safetyResult = this.performSafetyScreening(content)
      issues.push(...safetyResult.issues)
      qualityScore *= safetyResult.qualityFactor
    }

    // 3. Fact verification
    if (this.config.enableFactVerification) {
      const factResult = await this.verifyFacts(content, context)
      issues.push(...factResult.issues)
      qualityScore *= factResult.qualityFactor
      confidence = Math.min(confidence, factResult.confidence)
    }

    // 4. Peer review check
    if (this.config.enablePeerReviewCheck) {
      const reviewResult = this.checkPeerReviewQuality(content)
      issues.push(...reviewResult.issues)
      qualityScore *= reviewResult.qualityFactor
    }

    // 5. Length and structure validation
    const structureResult = this.validateStructure(content)
    issues.push(...structureResult.issues)
    qualityScore *= structureResult.qualityFactor

    // 6. Multiple source validation
    if (this.config.requireMultipleSources) {
      const sourceResult = this.validateMultipleSources(content, context)
      issues.push(...sourceResult.issues)
      qualityScore *= sourceResult.qualityFactor
    }

    // Calculate overall validity
    const criticalIssues = issues.filter(issue => issue.severity === 'critical')
    const isValid = criticalIssues.length === 0 && qualityScore > 0.5

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, content)

    return {
      isValid,
      confidence: Math.max(0.1, Math.min(1.0, confidence)),
      issues,
      recommendations,
      qualityScore: Math.max(0.1, Math.min(1.0, qualityScore))
    }
  }

  // Citation validation
  private validateCitations(content: string): { issues: ValidationIssue[], qualityFactor: number } {
    const issues: ValidationIssue[] = []
    let qualityFactor = 1.0

    // Check for citation presence
    const hasCitations = this.citationPatterns.some(pattern => pattern.test(content))
    
    if (!hasCitations && content.length > 200) {
      issues.push({
        type: 'citation',
        severity: 'medium',
        message: 'No citations found in substantial medical content',
        recommendation: 'Add references to peer-reviewed sources to support medical claims'
      })
      qualityFactor *= 0.8
    }

    // Check for medical claims without nearby citations
    const medicalClaims = this.extractMedicalClaims(content)
    for (const claim of medicalClaims) {
      if (!this.hasNearByCitation(content, claim)) {
        issues.push({
          type: 'citation',
          severity: 'high',
          message: `Medical claim lacks supporting citation: "${claim.substring(0, 50)}..."`,
          recommendation: 'Provide peer-reviewed source for this medical claim',
          location: claim
        })
        qualityFactor *= 0.7
      }
    }

    return { issues, qualityFactor }
  }

  // Medical safety screening
  private performSafetyScreening(content: string): { issues: ValidationIssue[], qualityFactor: number } {
    const issues: ValidationIssue[] = []
    let qualityFactor = 1.0

    const lowerContent = content.toLowerCase()

    // Check for prohibited medical advice phrases
    for (const phrase of this.prohibitedPhrases) {
      if (lowerContent.includes(phrase)) {
        issues.push({
          type: 'safety',
          severity: 'critical',
          message: `Content contains potential medical advice: "${phrase}"`,
          recommendation: 'Remove direct medical advice and add disclaimer to consult healthcare professionals',
          location: phrase
        })
        qualityFactor *= 0.3
      }
    }

    // Check for diagnostic language
    const diagnosticPatterns = [
      /you (?:have|are diagnosed with|suffer from)/gi,
      /your (?:condition|disease|illness) is/gi,
      /you need (?:to take|treatment|surgery)/gi
    ]

    for (const pattern of diagnosticPatterns) {
      const matches = content.match(pattern)
      if (matches) {
        issues.push({
          type: 'safety',
          severity: 'critical',
          message: 'Content contains diagnostic or prescriptive language',
          recommendation: 'Reframe as general information and add medical disclaimer'
        })
        qualityFactor *= 0.4
      }
    }

    // Check for dosage information without proper context
    const dosagePattern = /\d+\s*(?:mg|ml|cc|units?|tablets?|capsules?)/gi
    const dosageMatches = content.match(dosagePattern)
    if (dosageMatches && dosageMatches.length > 0) {
      const hasProperContext = /(?:study|trial|research|literature) (?:used|administered|reported)/gi.test(content)
      if (!hasProperContext) {
        issues.push({
          type: 'safety',
          severity: 'high',
          message: 'Content contains dosage information without research context',
          recommendation: 'Ensure dosage information is presented as research data, not medical advice'
        })
        qualityFactor *= 0.6
      }
    }

    return { issues, qualityFactor }
  }

  // Fact verification
  private async verifyFacts(content: string, context: AgentContext): Promise<{ 
    issues: ValidationIssue[], 
    qualityFactor: number, 
    confidence: number 
  }> {
    const issues: ValidationIssue[] = []
    let qualityFactor = 1.0
    let confidence = 0.8

    // Check for contradictory statements
    const contradictions = this.findContradictions(content)
    for (const contradiction of contradictions) {
      issues.push({
        type: 'fact',
        severity: 'high',
        message: `Potential contradiction detected: ${contradiction}`,
        recommendation: 'Review and resolve contradictory statements'
      })
      qualityFactor *= 0.7
      confidence *= 0.8
    }

    // Check for outdated information indicators
    const outdatedIndicators = [
      /(?:old|previous|former|past) (?:research|studies?|trials?)/gi,
      /\b(?:19|20)\d{2}\b/g // Years that might be too old
    ]

    for (const pattern of outdatedIndicators) {
      const matches = content.match(pattern)
      if (matches) {
        // Check if years are recent (within 10 years)
        const years = content.match(/\b(19|20)\d{2}\b/g)
        if (years) {
          const currentYear = new Date().getFullYear()
          const oldYears = years.filter(year => currentYear - parseInt(year) > 10)
          if (oldYears.length > 0) {
            issues.push({
              type: 'fact',
              severity: 'medium',
              message: `Content references potentially outdated research: ${oldYears.join(', ')}`,
              recommendation: 'Verify if more recent research is available'
            })
            qualityFactor *= 0.9
          }
        }
      }
    }

    // Check for unsupported superlatives
    const superlatives = [
      /\b(?:best|worst|most effective|least effective|always|never|all|none)\b/gi
    ]

    for (const pattern of superlatives) {
      const matches = content.match(pattern)
      if (matches && matches.length > 2) {
        issues.push({
          type: 'fact',
          severity: 'medium',
          message: 'Content contains multiple unsupported absolute statements',
          recommendation: 'Use more qualified language like "studies suggest" or "evidence indicates"'
        })
        qualityFactor *= 0.85
      }
    }

    return { issues, qualityFactor, confidence }
  }

  // Peer review quality check
  private checkPeerReviewQuality(content: string): { issues: ValidationIssue[], qualityFactor: number } {
    const issues: ValidationIssue[] = []
    let qualityFactor = 1.0

    // Check for peer-review indicators
    const peerReviewIndicators = [
      /peer[\s-]reviewed?/gi,
      /published in/gi,
      /journal of/gi,
      /clinical trial/gi,
      /randomized controlled trial/gi
    ]

    const hasPeerReviewIndicators = peerReviewIndicators.some(pattern => pattern.test(content))
    
    if (content.length > 300 && !hasPeerReviewIndicators) {
      issues.push({
        type: 'review',
        severity: 'medium',
        message: 'Content lacks references to peer-reviewed sources',
        recommendation: 'Include references to peer-reviewed medical literature'
      })
      qualityFactor *= 0.8
    }

    // Check for low-quality source indicators
    const lowQualityIndicators = [
      /blog/gi,
      /social media/gi,
      /unverified/gi,
      /rumor/gi,
      /anecdotal/gi
    ]

    for (const pattern of lowQualityIndicators) {
      if (pattern.test(content)) {
        issues.push({
          type: 'review',
          severity: 'high',
          message: 'Content may reference low-quality or unverified sources',
          recommendation: 'Replace with peer-reviewed medical literature references'
        })
        qualityFactor *= 0.6
      }
    }

    return { issues, qualityFactor }
  }

  // Structure validation
  private validateStructure(content: string): { issues: ValidationIssue[], qualityFactor: number } {
    const issues: ValidationIssue[] = []
    let qualityFactor = 1.0

    // Check length
    if (content.length > this.config.maxResponseLength) {
      issues.push({
        type: 'confidence',
        severity: 'medium',
        message: `Content exceeds recommended length (${content.length}/${this.config.maxResponseLength} characters)`,
        recommendation: 'Consider condensing the response while maintaining key information'
      })
      qualityFactor *= 0.9
    }

    // Check for proper medical disclaimers
    const hasDisclaimer = /(?:consult|speak with|contact) (?:your )?(?:doctor|physician|healthcare provider|medical professional)/gi.test(content)
    
    if (content.length > 200 && this.containsMedicalInformation(content) && !hasDisclaimer) {
      issues.push({
        type: 'safety',
        severity: 'medium',
        message: 'Medical content lacks appropriate disclaimer',
        recommendation: 'Add disclaimer to consult healthcare professionals'
      })
      qualityFactor *= 0.8
    }

    return { issues, qualityFactor }
  }

  // Multiple source validation
  private validateMultipleSources(content: string, context: AgentContext): { 
    issues: ValidationIssue[], 
    qualityFactor: number 
  } {
    const issues: ValidationIssue[] = []
    let qualityFactor = 1.0

    // Count distinct citations/sources
    const citations = this.extractCitations(content)
    
    if (content.length > 400 && citations.length < 2) {
      issues.push({
        type: 'source',
        severity: 'medium',
        message: 'Substantial medical content should cite multiple sources',
        recommendation: 'Include additional peer-reviewed sources to support claims'
      })
      qualityFactor *= 0.8
    }

    return { issues, qualityFactor }
  }

  // Helper methods
  private extractMedicalClaims(content: string): string[] {
    const claims: string[] = []
    const sentences = content.split(/[.!?]+/)

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase()
      
      // Check if sentence contains medical terminology
      if (Array.from(this.medicalTerminology).some(term => lowerSentence.includes(term))) {
        claims.push(sentence.trim())
      }

      // Check for statistical claims
      if (/\d+%|\d+\s*(?:fold|times)|significant|improved|reduced/gi.test(sentence)) {
        claims.push(sentence.trim())
      }
    }

    return claims
  }

  private hasNearByCitation(content: string, claim: string): boolean {
    const claimIndex = content.indexOf(claim)
    if (claimIndex === -1) return false

    // Check 150 characters before and after the claim
    const contextStart = Math.max(0, claimIndex - 150)
    const contextEnd = Math.min(content.length, claimIndex + claim.length + 150)
    const context = content.substring(contextStart, contextEnd)

    return this.citationPatterns.some(pattern => pattern.test(context))
  }

  private findContradictions(content: string): string[] {
    const contradictions: string[] = []
    
    // Simple contradiction detection
    const sentences = content.split(/[.!?]+/)
    const positiveKeywords = ['effective', 'safe', 'beneficial', 'improved', 'successful']
    const negativeKeywords = ['ineffective', 'unsafe', 'harmful', 'worsened', 'failed']

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].toLowerCase()
      
      for (let j = i + 1; j < sentences.length; j++) {
        const otherSentence = sentences[j].toLowerCase()
        
        // Check for positive vs negative statements about the same topic
        if (positiveKeywords.some(keyword => sentence.includes(keyword)) &&
            negativeKeywords.some(keyword => otherSentence.includes(keyword))) {
          // Basic check if they're about the same topic (share common words)
          const words1 = sentence.split(/\s+/).filter(w => w.length > 3)
          const words2 = otherSentence.split(/\s+/).filter(w => w.length > 3)
          const commonWords = words1.filter(w => words2.includes(w))
          
          if (commonWords.length > 1) {
            contradictions.push(`"${sentences[i].trim()}" vs "${sentences[j].trim()}"`)
          }
        }
      }
    }

    return contradictions
  }

  private extractCitations(content: string): string[] {
    const citations: string[] = []
    
    for (const pattern of this.citationPatterns) {
      const matches = content.match(pattern)
      if (matches) {
        citations.push(...matches)
      }
    }

    return [...new Set(citations)] // Remove duplicates
  }

  private containsMedicalInformation(content: string): boolean {
    const lowerContent = content.toLowerCase()
    const medicalIndicators = [
      'treatment', 'therapy', 'medication', 'drug', 'clinical', 'medical',
      'patient', 'symptoms', 'diagnosis', 'disease', 'condition', 'study'
    ]

    return medicalIndicators.some(indicator => lowerContent.includes(indicator))
  }

  private generateRecommendations(issues: ValidationIssue[], content: string): string[] {
    const recommendations: string[] = []

    // General recommendations based on issue patterns
    const issueTypes = new Set(issues.map(issue => issue.type))

    if (issueTypes.has('citation')) {
      recommendations.push('Add more peer-reviewed citations to support medical claims')
    }

    if (issueTypes.has('safety')) {
      recommendations.push('Review content for medical advice and add appropriate disclaimers')
    }

    if (issueTypes.has('fact')) {
      recommendations.push('Verify facts against recent medical literature')
    }

    if (issues.some(issue => issue.severity === 'critical')) {
      recommendations.push('Address critical issues before publication')
    }

    // Add specific recommendations from issues
    const specificRecs = issues
      .map(issue => issue.recommendation)
      .filter((rec, index, arr) => arr.indexOf(rec) === index) // Remove duplicates

    recommendations.push(...specificRecs)

    return recommendations.slice(0, 5) // Limit to 5 recommendations
  }

  private calculateAverageQuality(): number {
    if (this.validationHistory.length === 0) return 1.0

    const recent = this.validationHistory.slice(-20)
    const sum = recent.reduce((acc, entry) => acc + entry.result.qualityScore, 0)
    return sum / recent.length
  }

  private recordValidation(content: string, result: ValidationResult, source: string): void {
    this.validationHistory.push({
      timestamp: new Date(),
      contentHash: this.simpleHash(content),
      result,
      source
    })

    // Keep only last 100 validations
    if (this.validationHistory.length > 100) {
      this.validationHistory.splice(0, this.validationHistory.length - 100)
    }
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  // Public methods for analytics
  getValidationStats(): any {
    const stats = {
      totalValidations: this.validationHistory.length,
      passRate: 0,
      averageQuality: this.calculateAverageQuality(),
      commonIssues: {} as Record<string, number>,
      severityDistribution: { low: 0, medium: 0, high: 0, critical: 0 }
    }

    if (this.validationHistory.length > 0) {
      const passed = this.validationHistory.filter(v => v.result.isValid).length
      stats.passRate = passed / this.validationHistory.length

      // Count common issues
      this.validationHistory.forEach(validation => {
        validation.result.issues.forEach(issue => {
          stats.commonIssues[issue.type] = (stats.commonIssues[issue.type] || 0) + 1
          stats.severityDistribution[issue.severity]++
        })
      })
    }

    return stats
  }
}
