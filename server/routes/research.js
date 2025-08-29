import express from 'express'
import { body, query, validationResult } from 'express-validator'
import ResearchPaper from '../models/ResearchPaper.js'
import ChatSession from '../models/ChatSession.js'
import getOpenAIService from '../services/openaiService.js'
import logger from '../utils/logger.js'
import { premiumAuth } from '../middleware/auth.js'

const router = express.Router()

// @route   GET /api/research/papers
// @desc    Get research papers with filtering and search
// @access  Private
router.get(
  '/papers',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().trim(),
    query('field').optional().isString(),
    query('type').optional().isString(),
    query('sort').optional().isIn(['relevance', 'date', 'quality', 'citations']),
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

      const { page = 1, limit = 20, search, field, type, sort = 'relevance' } = req.query

      // Build query
      let query = { status: 'active', 'validation.retracted': false }

      // Text search
      if (search) {
        query.$text = { $search: search }
      }

      // Filter by medical field
      if (field) {
        query.medicalFields = field
      }

      // Filter by research type
      if (type) {
        query.researchType = type
      }

      // Build sort criteria
      let sortCriteria = {}
      switch (sort) {
        case 'date':
          sortCriteria = { publicationDate: -1 }
          break
        case 'quality':
          sortCriteria = { qualityScore: -1 }
          break
        case 'citations':
          sortCriteria = { citationCount: -1 }
          break
        case 'relevance':
        default:
          sortCriteria = search ? { score: { $meta: 'textScore' } } : { 'interactions.views': -1 }
          break
      }

      const papers = await ResearchPaper.find(query)
        .sort(sortCriteria)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select(
          'title authors journal publicationDate researchType medicalFields abstract qualityScore citationCount interactions doi',
        )
        .lean()

      const total = await ResearchPaper.countDocuments(query)

      // Track search if provided
      if (search) {
        logger.apiUsage(req.user._id, 'research_search', 0, 0)
      }

      res.json({
        success: true,
        data: {
          papers,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit),
          },
          filters: {
            search,
            field,
            type,
            sort,
          },
        },
      })
    } catch (error) {
      logger.error('Get research papers error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch research papers',
      })
    }
  },
)

// @route   GET /api/research/papers/:id
// @desc    Get specific research paper with full details
// @access  Private
router.get('/papers/:id', async (req, res) => {
  try {
    const paper = await ResearchPaper.findById(req.params.id)

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found',
      })
    }

    // Increment view count
    await paper.incrementViews()

    // Log paper access
    logger.apiUsage(req.user._id, 'paper_view', 0, 0)

    res.json({
      success: true,
      data: { paper },
    })
  } catch (error) {
    logger.error('Get research paper error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch research paper',
    })
  }
})

// @route   POST /api/research/papers/:id/bookmark
// @desc    Bookmark/unbookmark a research paper
// @access  Private
router.post('/papers/:id/bookmark', async (req, res) => {
  try {
    const paper = await ResearchPaper.findById(req.params.id)

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found',
      })
    }

    // Check if user already bookmarked this paper
    const user = req.user
    const isBookmarked = user.bookmarks?.includes(paper._id)

    if (isBookmarked) {
      // Remove bookmark
      user.bookmarks = user.bookmarks.filter((id) => !id.equals(paper._id))
      paper.interactions.bookmarks = Math.max(0, paper.interactions.bookmarks - 1)
    } else {
      // Add bookmark
      if (!user.bookmarks) user.bookmarks = []
      user.bookmarks.push(paper._id)
      paper.interactions.bookmarks += 1
    }

    await Promise.all([user.save(), paper.save()])

    logger.apiUsage(req.user._id, 'paper_bookmark', 0, 0)

    res.json({
      success: true,
      message: isBookmarked ? 'Bookmark removed' : 'Paper bookmarked',
      data: {
        bookmarked: !isBookmarked,
        bookmarkCount: paper.interactions.bookmarks,
      },
    })
  } catch (error) {
    logger.error('Bookmark paper error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to bookmark paper',
    })
  }
})

// @route   GET /api/research/bookmarks
// @desc    Get user's bookmarked papers
// @access  Private
router.get('/bookmarks', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query

    if (!req.user.bookmarks || req.user.bookmarks.length === 0) {
      return res.json({
        success: true,
        data: {
          papers: [],
          pagination: { total: 0, page: 1, pages: 0, limit: parseInt(limit) },
        },
      })
    }

    const papers = await ResearchPaper.find({
      _id: { $in: req.user.bookmarks },
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select(
        'title authors journal publicationDate researchType medicalFields abstract qualityScore',
      )
      .lean()

    const total = req.user.bookmarks.length

    res.json({
      success: true,
      data: {
        papers,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      },
    })
  } catch (error) {
    logger.error('Get bookmarks error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookmarks',
    })
  }
})

// @route   POST /api/research/papers/:id/analyze
// @desc    Start AI analysis of a research paper
// @access  Private (Premium feature)
router.post(
  '/papers/:id/analyze',
  premiumAuth,
  [
    body('analysisType').isIn(['summary', 'methodology', 'findings', 'limitations', 'comparison']),
    body('additionalContext').optional().isString(),
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

      const paper = await ResearchPaper.findById(req.params.id)

      if (!paper) {
        return res.status(404).json({
          success: false,
          message: 'Research paper not found',
        })
      }

      const { analysisType, additionalContext } = req.body

      // Create analysis prompt based on type
      const analysisPrompts = {
        summary: `Please provide a comprehensive summary of this research paper, highlighting the main objectives, methodology, key findings, and conclusions.`,
        methodology: `Analyze the methodology used in this research paper. Discuss the study design, sample size, data collection methods, statistical analyses, and assess the methodological strengths and limitations.`,
        findings: `Examine the key findings and results of this research paper. What are the main discoveries? How significant are they? What evidence supports these findings?`,
        limitations: `Critically evaluate the limitations of this research paper. What are the potential sources of bias? What are the study's constraints? How might these limitations affect the interpretation of results?`,
        comparison: `Compare this research with other studies in the same field. How do the findings align with or contradict existing literature? What unique contributions does this study make?`,
      }

      const prompt = analysisPrompts[analysisType]
      const context = {
        type: 'paper_analysis',
        researchPaper: paper,
        analysisType,
        additionalContext,
        user: {
          specialization: req.user.specialization,
          preferences: req.user.preferences,
        },
      }

      // Generate AI analysis
      const openaiService = getOpenAIService()
      const startTime = Date.now()
      const analysis = await openaiService.generateResponse(
        [{ role: 'user', content: prompt }],
        context,
      )

      const responseTime = Date.now() - startTime

      // Update paper analysis count
      paper.interactions.chatSessions += 1
      await paper.save()

      // Update user API usage
      await req.user.updateApiUsage(analysis.metadata.tokens || 1)

      // Log analysis
      logger.apiUsage(req.user._id, 'paper_analysis', responseTime, analysis.metadata.tokens)

      res.json({
        success: true,
        message: 'Analysis completed',
        data: {
          analysis: {
            type: analysisType,
            content: analysis.content,
            metadata: analysis.metadata,
            paperId: paper._id,
            paperTitle: paper.title,
          },
        },
      })
    } catch (error) {
      logger.error('Paper analysis error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to analyze paper',
      })
    }
  },
)

// @route   GET /api/research/papers/:id/similar
// @desc    Find similar research papers
// @access  Private
router.get('/papers/:id/similar', async (req, res) => {
  try {
    const paper = await ResearchPaper.findById(req.params.id)

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found',
      })
    }

    const { limit = 10 } = req.query

    // Find similar papers based on medical fields and keywords
    const similarPapers = await ResearchPaper.find({
      _id: { $ne: paper._id },
      status: 'active',
      'validation.retracted': false,
      $or: [
        { medicalFields: { $in: paper.medicalFields } },
        { keywords: { $in: paper.keywords } },
        { 'journal.name': paper.journal.name },
      ],
    })
      .sort({ qualityScore: -1, publicationDate: -1 })
      .limit(parseInt(limit))
      .select('title authors journal publicationDate researchType medicalFields qualityScore')
      .lean()

    // If we have embeddings, we could do semantic similarity search here
    if (paper.aiProcessing?.embedding) {
      // This would use vector similarity search in production
      // For now, we'll just return the query-based results
    }

    res.json({
      success: true,
      data: {
        similarPapers,
        basePaper: {
          id: paper._id,
          title: paper.title,
        },
      },
    })
  } catch (error) {
    logger.error('Find similar papers error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to find similar papers',
    })
  }
})

// @route   POST /api/research/papers/bulk-upload
// @desc    Bulk upload research papers (Admin/Enterprise feature)
// @access  Private
router.post(
  '/bulk-upload',
  [
    body('papers').isArray().withMessage('Papers must be an array'),
    body('papers.*.title').notEmpty().withMessage('Title is required'),
    body('papers.*.abstract').notEmpty().withMessage('Abstract is required'),
    body('papers.*.authors').isArray().withMessage('Authors must be an array'),
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

      // Check permissions (admin or enterprise users only)
      if (!['admin', 'enterprise'].includes(req.user.subscription) && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Bulk upload requires enterprise subscription or admin privileges',
        })
      }

      const { papers } = req.body
      const results = []

      for (const paperData of papers) {
        try {
          const paper = new ResearchPaper({
            ...paperData,
            source: 'manual',
            status: 'active',
          })

          await paper.save()
          results.push({ success: true, paperId: paper._id, title: paper.title })
        } catch (error) {
          results.push({
            success: false,
            title: paperData.title,
            error: error.message,
          })
        }
      }

      const successCount = results.filter((r) => r.success).length

      logger.info('Bulk upload completed', {
        userId: req.user._id,
        totalPapers: papers.length,
        successCount,
        failureCount: papers.length - successCount,
      })

      res.json({
        success: true,
        message: `Bulk upload completed: ${successCount}/${papers.length} papers uploaded successfully`,
        data: { results },
      })
    } catch (error) {
      logger.error('Bulk upload error:', error)
      res.status(500).json({
        success: false,
        message: 'Bulk upload failed',
      })
    }
  },
)

// @route   GET /api/research/trending
// @desc    Get trending research papers
// @access  Private
router.get('/trending', async (req, res) => {
  try {
    const { field, days = 30, limit = 20 } = req.query

    const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    let query = {
      status: 'active',
      'validation.retracted': false,
      publicationDate: { $gte: dateThreshold },
    }

    if (field) {
      query.medicalFields = field
    }

    const trendingPapers = await ResearchPaper.find(query)
      .sort({
        'interactions.views': -1,
        'interactions.bookmarks': -1,
        citationCount: -1,
      })
      .limit(parseInt(limit))
      .select(
        'title authors journal publicationDate researchType medicalFields qualityScore interactions citationCount',
      )
      .lean()

    res.json({
      success: true,
      data: {
        papers: trendingPapers,
        filters: { field, days, limit },
      },
    })
  } catch (error) {
    logger.error('Get trending papers error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending papers',
    })
  }
})

export default router
