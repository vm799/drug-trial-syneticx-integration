import OpenAI from 'openai'
import logger from '../utils/logger.js'
import ResearchPaper from '../models/ResearchPaper.js'

class OpenAIService {
  constructor() {
    this.isEnabled = !!process.env.OPENAI_API_KEY

    if (this.isEnabled) {
      try {
        this.client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        })
        logger.info('OpenAI service initialized successfully')
      } catch (error) {
        logger.error('Failed to initialize OpenAI service:', error)
        this.isEnabled = false
      }
    } else {
      logger.warn('OpenAI API key not provided - running in mock mode')
    }

    // Validation thresholds
    this.thresholds = {
      minConfidence: 0.7,
      maxHallucinationRisk: 0.3,
      requireCitation: true,
    }

    // Initialize model configuration
    this.models = {
      chat: 'gpt-4',
      embedding: 'text-embedding-ada-002'
    }
  }

  // Main chat completion with validation
  async generateResponse(messages, context = {}) {
    try {
      const startTime = Date.now()

      // Add system prompt with validation instructions
      const systemPrompt = this.buildSystemPrompt(context)
      const enhancedMessages = [{ role: 'system', content: systemPrompt }, ...messages]

      const completion = await this.client.chat.completions.create({
        model: this.models.chat,
        messages: enhancedMessages,
        temperature: context.temperature || 0.7,
        max_tokens: context.maxTokens || 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        tools: [
          {
            type: 'function',
            function: {
              name: 'search_research_papers',
              description: 'Search for research papers to support claims',
              parameters: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Search query' },
                  medical_field: { type: 'string', description: 'Medical specialization' },
                },
                required: ['query'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'validate_medical_claim',
              description: 'Validate a medical claim against known research',
              parameters: {
                type: 'object',
                properties: {
                  claim: { type: 'string', description: 'Medical claim to validate' },
                  sources: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Required sources',
                  },
                },
                required: ['claim'],
              },
            },
          },
        ],
        tool_choice: 'auto',
      })

      const responseTime = Date.now() - startTime
      const response = completion.choices[0].message

      // Extract tool calls if any
      const toolCalls = response.tool_calls || []

      // Validate response
      const validation = await this.validateResponse(response.content, context)

      // Search for supporting evidence
      const evidence = await this.findSupportingEvidence(response.content, context)

      // Calculate confidence score
      const confidence = this.calculateConfidence(response.content, validation, evidence)

      return {
        content: response.content,
        metadata: {
          model: this.models.chat,
          tokens: completion.usage.total_tokens,
          responseTime,
          confidence,
          validation,
          evidence,
          toolCalls,
          safety: await this.checkSafety(response.content),
        },
      }
    } catch (error) {
      logger.error('OpenAI API error:', error)
      throw new Error('Failed to generate AI response')
    }
  }

  // Build context-aware system prompt
  buildSystemPrompt(context) {
    const basePrompt = `You are an expert medical research assistant specializing in evidence-based medicine. Your responses must be:

1. ACCURATE: Only provide information supported by peer-reviewed research
2. CITED: Include specific citations for all medical claims
3. CONSERVATIVE: Acknowledge limitations and uncertainties
4. SAFE: Never provide medical advice or diagnosis
5. CURRENT: Prioritize recent, high-quality research

CRITICAL VALIDATION RULES:
- Always cite sources for medical claims
- Use phrases like "according to research by..." or "studies suggest..."
- Include confidence indicators: "strong evidence", "limited evidence", "preliminary findings"
- Flag contradictory findings when they exist
- Acknowledge when information is insufficient

PROHIBITED:
- Making diagnostic or treatment recommendations
- Presenting speculation as fact
- Ignoring contradictory evidence
- Making claims without citations`

    if (context.researchPaper) {
      return `${basePrompt}

CURRENT CONTEXT: You are analyzing the research paper titled "${context.researchPaper.title}" published in ${context.researchPaper.journal?.name}. Focus your responses on this paper while incorporating broader research context when relevant.`
    }

    if (context.specialization) {
      return `${basePrompt}

SPECIALIZATION: Focus on ${context.specialization} research and ensure recommendations align with current best practices in this field.`
    }

    return basePrompt
  }

  // Validate response for hallucinations and accuracy
  async validateResponse(content, context) {
    const validation = {
      hasCitations: this.checkCitations(content, context),
      factChecked: false,
      riskFlags: [],
      confidence: 0.8,
    }

    // Check for medical claims without citations
    const medicalClaims = this.extractMedicalClaims(content)
    for (const claim of medicalClaims) {
      if (!this.hasNearByCitation(content, claim)) {
        validation.riskFlags.push(`Uncited medical claim: ${claim.substring(0, 50)}...`)
      }
    }

    // Check for overconfident language
    const overconfidentPhrases = [
      'definitely',
      'certainly',
      'always',
      'never',
      'guaranteed',
      'proves',
      'confirms',
      'establishes beyond doubt',
    ]

    for (const phrase of overconfidentPhrases) {
      if (content.toLowerCase().includes(phrase)) {
        validation.riskFlags.push(`Overconfident language: "${phrase}"`)
      }
    }

    // Check for diagnostic language
    const diagnosticPhrases = [
      'you have',
      'you should take',
      'i recommend',
      'treatment for you',
      'diagnosis',
      'prescribed',
      'medical advice',
    ]

    for (const phrase of diagnosticPhrases) {
      if (content.toLowerCase().includes(phrase)) {
        validation.riskFlags.push(`Potential medical advice: "${phrase}"`)
      }
    }

    validation.confidence = Math.max(0.1, 1 - validation.riskFlags.length * 0.2)
    validation.factChecked = validation.riskFlags.length === 0

    return validation
  }

  // Check if response contains proper citations
  checkCitations(content) {
    const citationPatterns = [
      /\([^)]*\d{4}[^)]*\)/g, // (Author, 2024)
      /\[[^\]]*\]/g, // [1], [Author et al.]
      /doi:\s*[\d.\/]+/gi, // DOI references
      /pmid:\s*\d+/gi, // PubMed IDs
      /according to [^.]+/gi, // "according to..."
      /studies? (?:show|suggest|indicate|demonstrate)/gi,
    ]

    return citationPatterns.some((pattern) => pattern.test(content))
  }

  // Extract medical claims from text
  extractMedicalClaims(content) {
    const claims = []

    // Simple heuristic: sentences containing medical keywords
    const medicalKeywords = [
      'treatment',
      'therapy',
      'drug',
      'medication',
      'disease',
      'condition',
      'symptom',
      'diagnosis',
      'efficacy',
      'safety',
      'adverse',
      'benefit',
      'risk',
      'outcome',
      'mortality',
      'morbidity',
      'clinical',
      'trial',
    ]

    const sentences = content.split(/[.!?]+/)

    for (const sentence of sentences) {
      if (medicalKeywords.some((keyword) => sentence.toLowerCase().includes(keyword))) {
        claims.push(sentence.trim())
      }
    }

    return claims
  }

  // Check if a claim has a nearby citation
  hasNearByCitation(content, claim) {
    const claimIndex = content.indexOf(claim)
    if (claimIndex === -1) return false

    // Check 200 characters before and after the claim
    const contextStart = Math.max(0, claimIndex - 200)
    const contextEnd = Math.min(content.length, claimIndex + claim.length + 200)
    const context = content.substring(contextStart, contextEnd)

    return this.checkCitations(context)
  }

  // Find supporting evidence in research papers
  async findSupportingEvidence(content, context) {
    try {
      // Extract key concepts for search
      const concepts = await this.extractKeyConcepts(content,context)

      const evidence = []

      for (const concept of concepts.slice(0, 3)) {
        // Limit to top 3 concepts
        const papers = await ResearchPaper.find({
          $text: { $search: concept },
          'validation.peerReviewed': true,
          'validation.retracted': false,
        })
          .limit(3)
          .select('title authors journal publicationDate qualityScore doi')
          .sort({ qualityScore: -1, publicationDate: -1 })

        for (const paper of papers) {
          evidence.push({
            type: 'paper',
            id: paper._id,
            title: paper.title,
            authors: paper.authors.map((a) => a.name).slice(0, 3),
            journal: paper.journal.name,
            year: paper.publicationDate.getFullYear(),
            qualityScore: paper.qualityScore,
            relevanceScore: 0.8, // Would be calculated by semantic similarity
            doi: paper.doi,
          })
        }
      }

      return evidence
    } catch (error) {
      logger.error('Error finding supporting evidence:', error)
      return []
    }
  }

  // Extract key concepts using NLP
  async extractKeyConcepts(text) {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const stopWords = new Set([
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ])

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))

    // Count word frequency
    const frequency = {}
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    // Return top concepts
    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 10)
  }

  // Calculate confidence score
  calculateConfidence(content, validation, evidence) {
    let confidence = 0.8 // Base confidence

    // Adjust for citations
    if (validation.hasCitations) {
      confidence += 0.1
    } else {
      confidence -= 0.2
    }

    // Adjust for risk flags
    confidence -= validation.riskFlags.length * 0.1

    // Adjust for supporting evidence
    const evidenceBonus = Math.min(0.15, evidence.length * 0.05)
    confidence += evidenceBonus

    // Ensure confidence is between 0 and 1
    return Math.max(0.1, Math.min(1.0, confidence))
  }

  // Check content safety
  async checkSafety(content) {
    try {
      const moderation = await this.client.moderations.create({
        input: content,
      })

      const result = moderation.results[0]

      return {
        flagged: result.flagged,
        categories: result.categories,
        categoryScores: result.category_scores,
        safe: !result.flagged,
      }
    } catch (error) {
      logger.error('Safety check error:', error)
      return { flagged: false, safe: true, error: 'Safety check failed' }
    }
  }

  // Generate embeddings for semantic search
  async generateEmbedding(text) {
    try {
      const response = await this.client.embeddings.create({
        model: this.models.embedding,
        input: text,
      })

      return response.data[0].embedding
    } catch (error) {
      logger.error('Embedding generation error:', error)
      throw error
    }
  }

  // Batch process research papers for embeddings
  async processResearchPapers(papers) {
    const results = []

    for (const paper of papers) {
      try {
        const text = `${paper.title} ${paper.abstract}`
        const embedding = await this.generateEmbedding(text)

        await paper.updateAIProcessing({
          embedding,
          summaryGenerated: true,
          confidenceScore: 0.9,
        })

        results.push({ success: true, paperId: paper._id })
      } catch (error) {
        logger.error(`Failed to process paper ${paper._id}:`, error)
        results.push({ success: false, paperId: paper._id, error: error.message })
      }
    }

    return results
  }
}

export default new OpenAIService()
