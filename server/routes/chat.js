import express from 'express'
import { body, validationResult } from 'express-validator'
import ChatSession from '../models/ChatSession.js'
import ResearchPaper from '../models/ResearchPaper.js'
import openaiService from '../services/openaiService.js'
import logger from '../utils/logger.js'
import { premiumAuth } from '../middleware/auth.js'

const router = express.Router()

// @route   POST /api/chat/sessions
// @desc    Create a new chat session
// @access  Private
router.post(
  '/sessions',
  [
    body('context.type')
      .optional()
      .isIn(['research', 'general', 'paper_analysis', 'clinical_trial']),
    body('context.researchPaper').optional().isMongoId(),
    body('context.specialization').optional().isString(),
    body('title').optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        })
      }

      const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const sessionData = {
        sessionId,
        userId: req.user._id,
        context: req.body.context || { type: 'general' },
        title: req.body.title || 'New Chat Session',
        aiConfig: {
          model: 'gpt-4',
          temperature: req.user.preferences?.ai_settings?.response_length === 'concise' ? 0.3 : 0.7,
          maxTokens:
            req.user.preferences?.ai_settings?.response_length === 'comprehensive' ? 1500 : 1000,
          validationEnabled: true,
          citationsEnabled: req.user.preferences?.ai_settings?.include_citations !== false,
        },
      }

      // If analyzing a specific paper, load it
      if (req.body.context?.researchPaper) {
        const paper = await ResearchPaper.findById(req.body.context.researchPaper)
        if (!paper) {
          return res.status(404).json({
            success: false,
            message: 'Research paper not found',
          })
        }
        sessionData.context.researchPaper = paper._id
      }

      const session = new ChatSession(sessionData)
      await session.save()

      // Add welcome message
      const welcomeMessage = generateWelcomeMessage(sessionData.context, req.user)
      await session.addMessage('system', welcomeMessage)

      logger.chatAudit(req.user._id, 'SESSION_CREATED', {
        sessionId,
        context: sessionData.context,
      })

      res.status(201).json({
        success: true,
        message: 'Chat session created',
        data: { session },
      })
    } catch (error) {
      logger.error('Create chat session error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create chat session',
      })
    }
  },
)

// @route   GET /api/chat/sessions
// @desc    Get user's chat sessions
// @access  Private
router.get('/sessions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'active' } = req.query

    const query = { userId: req.user._id }
    if (status !== 'all') {
      query.status = status
    }

    const sessions = await ChatSession.find(query)
      .sort({ 'metrics.lastActivity': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('context.researchPaper', 'title authors journal')
      .select('-messages') // Exclude messages for list view

    const total = await ChatSession.countDocuments(query)

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      },
    })
  } catch (error) {
    logger.error('Get chat sessions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat sessions',
    })
  }
})

// @route   GET /api/chat/sessions/:sessionId
// @desc    Get specific chat session with messages
// @access  Private
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
      userId: req.user._id,
    }).populate('context.researchPaper', 'title authors journal abstract')

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      })
    }

    // Update last activity
    session.metrics.lastActivity = new Date()
    await session.save()

    res.json({
      success: true,
      data: { session },
    })
  } catch (error) {
    logger.error('Get chat session error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat session',
    })
  }
})

// @route   POST /api/chat/sessions/:sessionId/messages
// @desc    Send message in chat session
// @access  Private
router.post(
  '/sessions/:sessionId/messages',
  [
    body('message')
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be 1-2000 characters'),
    body('context').optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        })
      }

      const session = await ChatSession.findOne({
        sessionId: req.params.sessionId,
        userId: req.user._id,
      }).populate('context.researchPaper')

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found',
        })
      }

      // Check rate limits based on subscription
      const rateLimits = {
        free: { daily: 20, hourly: 5 },
        premium: { daily: 200, hourly: 50 },
        enterprise: { daily: 1000, hourly: 200 },
      }

      const userLimit = rateLimits[req.user.subscription] || rateLimits.free

      // Check if user has exceeded limits
      if (req.user.apiUsage.daily.requests >= userLimit.daily) {
        return res.status(429).json({
          success: false,
          message: 'Daily message limit exceeded. Please upgrade your subscription.',
        })
      }

      const { message, context } = req.body

      // Add user message to session
      await session.addMessage('user', message)

      // Prepare context for AI
      const aiContext = {
        ...session.context.toObject(),
        ...context,
        user: {
          specialization: req.user.specialization,
          subscription: req.user.subscription,
          preferences: req.user.preferences,
        },
      }

      // Prepare conversation history
      const conversationHistory = session.messages
        .filter((msg) => msg.type !== 'system')
        .slice(-10) // Last 10 messages for context
        .map((msg) => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }))

      // Generate AI response
      const startTime = Date.now()
      const aiResponse = await openaiService.generateResponse(conversationHistory, aiContext)
      const responseTime = Date.now() - startTime

      // Validate response quality
      const qualityScore = calculateQualityScore(aiResponse)

      // Add AI response to session
      await session.addMessage('assistant', aiResponse.content, {
        ...aiResponse.metadata,
        responseTime,
      })

      // Update session quality metrics
      await session.updateQuality({
        coherenceScore: qualityScore.coherence,
        relevanceScore: qualityScore.relevance,
        accuracyScore: aiResponse.metadata.confidence,
        safetyScore: aiResponse.metadata.safety.safe ? 1.0 : 0.0,
      })

      // Update user API usage
      await req.user.updateApiUsage(aiResponse.metadata.tokens || 1)

      // Log chat interaction
      logger.chatAudit(req.user._id, 'MESSAGE_SENT', {
        sessionId: session.sessionId,
        messageLength: message.length,
        responseTime,
        tokens: aiResponse.metadata.tokens,
        confidence: aiResponse.metadata.confidence,
      })

      // Log API usage
      logger.apiUsage(req.user._id, 'chat_message', responseTime, aiResponse.metadata.tokens)

      res.json({
        success: true,
        message: 'Message sent successfully',
        data: {
          response: {
            content: aiResponse.content,
            metadata: aiResponse.metadata,
          },
          session: {
            id: session.sessionId,
            messageCount: session.messageCount,
            lastActivity: session.metrics.lastActivity,
          },
        },
      })
    } catch (error) {
      logger.error('Send message error:', error)

      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          message: 'AI service is currently busy. Please try again in a moment.',
        })
      }

      res.status(500).json({
        success: false,
        message: 'Failed to send message',
      })
    }
  },
)

// @route   POST /api/chat/sessions/:sessionId/feedback
// @desc    Submit feedback for AI response
// @access  Private
router.post(
  '/sessions/:sessionId/feedback',
  [
    body('messageId').isString().withMessage('Message ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1-5'),
    body('feedback').optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        })
      }

      const session = await ChatSession.findOne({
        sessionId: req.params.sessionId,
        userId: req.user._id,
      })

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found',
        })
      }

      const { messageId, rating, feedback } = req.body

      // Find the message and update it
      const message = session.messages.id(messageId)
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
        })
      }

      // Add feedback to message metadata
      if (!message.metadata) message.metadata = {}
      message.metadata.userFeedback = {
        rating,
        feedback,
        submittedAt: new Date(),
      }

      // Update session satisfaction score
      const ratings = session.messages
        .filter((msg) => msg.metadata?.userFeedback?.rating)
        .map((msg) => msg.metadata.userFeedback.rating)

      if (ratings.length > 0) {
        session.metrics.userSatisfaction = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      }

      await session.save()

      logger.chatAudit(req.user._id, 'FEEDBACK_SUBMITTED', {
        sessionId: session.sessionId,
        messageId,
        rating,
        hasFeedback: !!feedback,
      })

      res.json({
        success: true,
        message: 'Feedback submitted successfully',
      })
    } catch (error) {
      logger.error('Submit feedback error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
      })
    }
  },
)

// @route   DELETE /api/chat/sessions/:sessionId
// @desc    Delete chat session
// @access  Private
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const session = await ChatSession.findOneAndDelete({
      sessionId: req.params.sessionId,
      userId: req.user._id,
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      })
    }

    logger.chatAudit(req.user._id, 'SESSION_DELETED', {
      sessionId: session.sessionId,
      messageCount: session.messageCount,
    })

    res.json({
      success: true,
      message: 'Chat session deleted successfully',
    })
  } catch (error) {
    logger.error('Delete chat session error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat session',
    })
  }
})

// @route   POST /api/chat/sessions/:sessionId/export
// @desc    Export chat session
// @access  Private (Premium feature)
router.post('/sessions/:sessionId/export', premiumAuth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      sessionId: req.params.sessionId,
      userId: req.user._id,
    }).populate('context.researchPaper', 'title authors journal')

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      })
    }

    // Generate export data
    const exportData = {
      session: {
        id: session.sessionId,
        title: session.title,
        createdAt: session.createdAt,
        context: session.context,
        summary: session.summary,
      },
      messages: session.messages.map((msg) => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: {
          confidence: msg.metadata?.confidence,
          sources: msg.metadata?.evidence,
        },
      })),
      user: {
        name: req.user.fullName,
        organization: req.user.organization,
      },
      exportedAt: new Date(),
      format: 'json',
    }

    logger.chatAudit(req.user._id, 'SESSION_EXPORTED', {
      sessionId: session.sessionId,
    })

    res.json({
      success: true,
      data: exportData,
    })
  } catch (error) {
    logger.error('Export chat session error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to export chat session',
    })
  }
})

// Helper functions
function generateWelcomeMessage(context, user) {
  const userName = user.firstName

  if (context.type === 'paper_analysis' && context.researchPaper) {
    return `Welcome ${userName}! I'm ready to help you analyze this research paper. You can ask me about the methodology, findings, limitations, or how this research relates to other studies in the field.`
  }

  if (context.type === 'clinical_trial') {
    return `Hello ${userName}! I'm here to assist with clinical trial research. I can help you understand trial designs, analyze results, compare interventions, and explore regulatory considerations.`
  }

  if (context.specialization) {
    return `Hi ${userName}! I'm specialized in ${context.specialization} research. How can I help you explore the latest findings and evidence in this field today?`
  }

  return `Welcome to MedResearch AI, ${userName}! I'm your research assistant, ready to help you explore medical literature, analyze research papers, and answer evidence-based questions. How can I assist you today?`
}

function calculateQualityScore(aiResponse) {
  let coherence = 0.8
  let relevance = 0.8

  // Basic quality metrics (would be more sophisticated in production)
  const content = aiResponse.content

  // Check for coherence indicators
  if (
    content.includes('however') ||
    content.includes('furthermore') ||
    content.includes('therefore')
  ) {
    coherence += 0.1
  }

  // Check for medical terminology (indicates relevance)
  const medicalTerms = [
    'study',
    'research',
    'clinical',
    'trial',
    'patient',
    'treatment',
    'efficacy',
  ]
  const termCount = medicalTerms.filter((term) => content.toLowerCase().includes(term)).length
  relevance = Math.min(1.0, 0.5 + termCount * 0.1)

  return {
    coherence: Math.min(1.0, coherence),
    relevance: Math.min(1.0, relevance),
  }
}

export default router
