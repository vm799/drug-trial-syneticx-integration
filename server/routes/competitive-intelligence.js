// server/routes/competitive-intelligence.js - Competitive Intelligence API Routes

import express from 'express'
import { body, query, param, validationResult } from 'express-validator'
import CompetitiveIntelligence from '../models/CompetitiveIntelligence.js'
import CompetitiveIntelligenceAgent from '../agents/CompetitiveIntelligenceAgent.js'
import getOpenAIService from '../services/openaiService.js'
import auth, { premiumAuth } from '../middleware/auth.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Initialize services
const openaiService = getOpenAIService()
const competitiveAgent = new CompetitiveIntelligenceAgent(openaiService)

// @route   GET /api/competitive-intelligence/dashboard
// @desc    Get competitive intelligence dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { threatLevel, sortBy = 'threat', limit = 20 } = req.query

    // Build query
    const query = { 'monitoringStatus.active': true }
    if (threatLevel) {
      query.overallThreat = threatLevel
    }

    // Build sort criteria
    let sortCriteria = {}
    switch (sortBy) {
      case 'threat':
        sortCriteria = { threatScore: -1 }
        break
      case 'marketCap':
        sortCriteria = { 'financialMetrics.marketCap': -1 }
        break
      case 'pipeline':
        sortCriteria = { 'pipelineAnalysis.totalAssets': -1 }
        break
      case 'lastUpdated':
        sortCriteria = { lastAnalyzed: -1 }
        break
      default:
        sortCriteria = { threatScore: -1 }
    }

    // Get competitors
    const competitors = await CompetitiveIntelligence.find(query)
      .sort(sortCriteria)
      .limit(parseInt(limit))
      .select(`
        companyInfo threatScore overallThreat financialMetrics 
        pipelineAnalysis patentPortfolio recentActivities lastAnalyzed
      `)

    // Calculate threat summary
    const allCompetitors = await CompetitiveIntelligence.find({ 'monitoringStatus.active': true })
    const threatSummary = allCompetitors.reduce((acc, comp) => {
      acc[comp.overallThreat] = (acc[comp.overallThreat] || 0) + 1
      return acc
    }, { critical: 0, high: 0, medium: 0, low: 0 })

    // Calculate total market metrics
    const totalMarketCap = allCompetitors.reduce((sum, comp) => 
      sum + (comp.financialMetrics?.marketCap || 0), 0
    )
    
    const totalPipelineAssets = allCompetitors.reduce((sum, comp) => 
      sum + (comp.pipelineAnalysis?.totalAssets || 0), 0
    )

    // Get recent market activities
    const recentActivities = []
    competitors.forEach(comp => {
      if (comp.recentActivities && comp.recentActivities.length > 0) {
        comp.recentActivities.slice(0, 2).forEach(activity => {
          recentActivities.push({
            ...activity,
            company: comp.companyInfo.name
          })
        })
      }
    })

    // Sort recent activities by date
    recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Mock data for recent acquisitions, partnerships, and pipeline advancements
    const recentAcquisitions = [
      {
        id: 1,
        acquirer: 'PharmaCorp',
        target: 'BioInnovate',
        value: 2500000000,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        therapeuticArea: 'oncology'
      },
      {
        id: 2,
        acquirer: 'MegaPharma',
        target: 'GeneTherapy Inc',
        value: 1800000000,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        therapeuticArea: 'rare_diseases'
      }
    ]

    const strategicPartnerships = [
      {
        id: 1,
        company1: 'GlobalBio',
        company2: 'TechPharma',
        type: 'research_collaboration',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        therapeuticArea: 'neurology'
      },
      {
        id: 2,
        company1: 'InnovateMed',
        company2: 'BigPharma',
        type: 'licensing_agreement',
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        therapeuticArea: 'immunology'
      }
    ]

    const pipelineAdvancements = [
      {
        id: 1,
        company: 'PharmaCorp',
        drug: 'PC-2024',
        newPhase: 'Phase III',
        previousPhase: 'Phase II',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        therapeuticArea: 'oncology'
      },
      {
        id: 2,
        company: 'BioAdvance',
        drug: 'BA-401',
        newPhase: 'FDA Approval',
        previousPhase: 'Phase III',
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        therapeuticArea: 'cardiology'
      }
    ]

    // Format competitor data
    const formattedCompetitors = competitors.map(comp => ({
      id: comp._id,
      companyName: comp.companyInfo.name,
      ticker: comp.companyInfo.ticker,
      threatScore: comp.threatScore,
      overallThreat: comp.overallThreat,
      marketCap: comp.financialMetrics?.marketCap || 0,
      pipelineAssets: comp.pipelineAnalysis?.totalAssets || 0,
      patentCount: comp.patentPortfolio?.totalPatents || 0,
      recentActivities: comp.recentActivities || [],
      lastAnalyzed: comp.lastAnalyzed
    }))

    logger.apiUsage(req.user._id, 'competitive_intelligence_dashboard', 0, 0)

    res.json({
      success: true,
      data: {
        summary: {
          totalCompetitors: allCompetitors.length,
          threatBreakdown: threatSummary,
          totalMarketCap,
          totalPipelineAssets
        },
        competitors: formattedCompetitors,
        marketActivity: {
          recentAcquisitions,
          strategicPartnerships,
          pipelineAdvancements
        },
        metadata: {
          lastUpdated: new Date(),
          filters: { threatLevel, sortBy, limit }
        }
      }
    })

  } catch (error) {
    logger.error('Competitive intelligence dashboard error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch competitive intelligence data'
    })
  }
})

// @route   POST /api/competitive-intelligence/analyze-competitor
// @desc    Perform comprehensive competitor analysis
// @access  Private (Premium)
router.post('/analyze-competitor',
  premiumAuth,
  [
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('analysisDepth').optional().isIn(['basic', 'comprehensive']),
    body('includeFinancials').optional().isBoolean(),
    body('includePipeline').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        })
      }

      const { 
        companyName, 
        analysisDepth = 'comprehensive',
        includeFinancials = true,
        includePipeline = true 
      } = req.body

      logger.info(`Starting competitive analysis for: ${companyName}`)

      const startTime = Date.now()
      const analysis = await competitiveAgent.analyzeCompetitor(companyName, {
        depth: analysisDepth,
        includeFinancials,
        includePipeline,
        userId: req.user._id
      })

      const processingTime = Date.now() - startTime

      if (analysis.success) {
        // Update user API usage
        const tokensUsed = analysis.analysis.metadata?.tokensUsed || 200
        await req.user.updateApiUsage(tokensUsed)

        // Log usage
        logger.apiUsage(req.user._id, 'competitor_analysis', processingTime, tokensUsed)

        res.json({
          success: true,
          data: {
            analysis: analysis.analysis,
            competitor: analysis.competitor,
            metadata: {
              processingTime,
              analysisDepth,
              companyName,
              generatedAt: new Date().toISOString()
            }
          }
        })
      } else {
        res.status(400).json({
          success: false,
          message: analysis.error || 'Competitor analysis failed'
        })
      }

    } catch (error) {
      logger.error('Competitor analysis error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to analyze competitor'
      })
    }
  }
)

// @route   POST /api/competitive-intelligence/monitor-landscape
// @desc    Monitor competitive landscape for changes
// @access  Private (Premium)
router.post('/monitor-landscape',
  premiumAuth,
  [
    body('therapeuticArea').notEmpty().withMessage('Therapeutic area is required'),
    body('period').optional().isIn(['realtime', 'daily', 'weekly']),
    body('lookbackDays').optional().isInt({ min: 1, max: 365 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        })
      }

      const { 
        therapeuticArea, 
        period = 'daily',
        lookbackDays = 7 
      } = req.body

      logger.info(`Monitoring competitive landscape for: ${therapeuticArea}`)

      const monitoring = await competitiveAgent.monitorCompetitiveLandscape(therapeuticArea, {
        period,
        lookbackDays
      })

      // Update user API usage
      await req.user.updateApiUsage(50) // Fixed cost for monitoring

      logger.apiUsage(req.user._id, 'landscape_monitoring', 0, 50)

      res.json({
        success: true,
        data: monitoring
      })

    } catch (error) {
      logger.error('Competitive landscape monitoring error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to monitor competitive landscape'
      })
    }
  }
)

// @route   POST /api/competitive-intelligence/assess-acquisitions
// @desc    Assess potential acquisition targets
// @access  Private (Premium)
router.post('/assess-acquisitions',
  premiumAuth,
  [
    body('criteria').isObject().withMessage('Assessment criteria required'),
    body('criteria.therapeuticArea').optional().isString(),
    body('criteria.maxMarketCap').optional().isNumeric(),
    body('criteria.minScore').optional().isNumeric(),
    body('limit').optional().isInt({ min: 1, max: 50 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        })
      }

      const { criteria, limit = 20 } = req.body

      logger.info(`Assessing acquisition targets with criteria:`, criteria)

      const assessment = await competitiveAgent.assessAcquisitionTargets(criteria, {
        userId: req.user._id,
        limit
      })

      // Update user API usage
      await req.user.updateApiUsage(100) // Fixed cost for acquisition assessment

      logger.apiUsage(req.user._id, 'acquisition_assessment', 0, 100)

      res.json({
        success: true,
        data: assessment
      })

    } catch (error) {
      logger.error('Acquisition assessment error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to assess acquisition targets'
      })
    }
  }
)

// @route   GET /api/competitive-intelligence/partnerships
// @desc    Track strategic partnerships and alliances
// @access  Private
router.get('/partnerships',
  [
    query('companyName').optional().isString(),
    query('timeframe').optional().isIn(['last_3_months', 'last_6_months', 'last_12_months']),
    query('partnershipType').optional().isString(),
    query('minValue').optional().isNumeric()
  ],
  auth,
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        })
      }

      const {
        companyName,
        timeframe = 'last_12_months',
        partnershipType,
        minValue
      } = req.query

      const partnerships = await competitiveAgent.trackStrategicPartnerships(companyName, {
        timeframe,
        partnershipType,
        majorDealThreshold: minValue || 100000000
      })

      logger.apiUsage(req.user._id, 'partnership_tracking', 0, 0)

      res.json({
        success: true,
        data: partnerships
      })

    } catch (error) {
      logger.error('Partnership tracking error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to track partnerships'
      })
    }
  }
)

// @route   GET /api/competitive-intelligence/competitors/:id
// @desc    Get detailed competitor information
// @access  Private
router.get('/competitors/:id',
  param('id').isMongoId(),
  auth,
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid competitor ID'
        })
      }

      const competitor = await CompetitiveIntelligence.findById(req.params.id)

      if (!competitor) {
        return res.status(404).json({
          success: false,
          message: 'Competitor not found'
        })
      }

      // Increment view count
      competitor.tracking = competitor.tracking || {}
      competitor.tracking.views = (competitor.tracking.views || 0) + 1
      competitor.tracking.lastViewed = new Date()
      await competitor.save()

      logger.apiUsage(req.user._id, 'competitor_detail', 0, 0)

      res.json({
        success: true,
        data: { competitor }
      })

    } catch (error) {
      logger.error('Competitor detail fetch error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch competitor details'
      })
    }
  }
)

// @route   PUT /api/competitive-intelligence/competitors/:id/monitoring
// @desc    Update competitor monitoring settings
// @access  Private
router.put('/competitors/:id/monitoring',
  [
    param('id').isMongoId(),
    body('active').isBoolean(),
    body('frequency').optional().isIn(['realtime', 'daily', 'weekly']),
    body('alertThresholds').optional().isObject()
  ],
  auth,
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        })
      }

      const { active, frequency, alertThresholds } = req.body
      const updates = {
        'monitoringStatus.active': active,
        'monitoringStatus.lastUpdate': new Date()
      }

      if (frequency) {
        updates['monitoringStatus.frequency'] = frequency
      }

      if (alertThresholds) {
        updates.alertThresholds = alertThresholds
      }

      const competitor = await CompetitiveIntelligence.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      )

      if (!competitor) {
        return res.status(404).json({
          success: false,
          message: 'Competitor not found'
        })
      }

      logger.apiUsage(req.user._id, 'competitor_monitoring_update', 0, 0)

      res.json({
        success: true,
        message: 'Monitoring settings updated successfully',
        data: {
          competitor: competitor.companyInfo.name,
          monitoringStatus: competitor.monitoringStatus
        }
      })

    } catch (error) {
      logger.error('Competitor monitoring update error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update monitoring settings'
      })
    }
  }
)

// @route   GET /api/competitive-intelligence/market-trends
// @desc    Get market trend analysis
// @access  Private
router.get('/market-trends',
  [
    query('therapeuticArea').optional().isString(),
    query('timeRange').optional().isInt({ min: 1, max: 60 }),
    query('trendType').optional().isIn(['acquisitions', 'partnerships', 'pipeline', 'patents'])
  ],
  auth,
  async (req, res) => {
    try {
      const {
        therapeuticArea,
        timeRange = 12,
        trendType
      } = req.query

      // Mock market trends data for demonstration
      const trends = {
        acquisitions: {
          growth: 15,
          totalValue: 45000000000,
          count: 23,
          averageValue: 1956521739,
          topDeals: [
            {
              acquirer: 'MegaPharma Inc',
              target: 'BioInnovate LLC',
              value: 2500000000,
              therapeuticArea: 'oncology'
            }
          ]
        },
        partnerships: {
          growth: 8,
          count: 67,
          types: {
            research_collaboration: 28,
            licensing: 22,
            joint_venture: 17
          }
        },
        pipeline: {
          advancementRate: 22,
          newTrials: 156,
          approvals: 12,
          byPhase: {
            'Phase I': 45,
            'Phase II': 62,
            'Phase III': 37,
            'FDA Review': 12
          }
        },
        patents: {
          newFilings: 1247,
          growth: 12,
          expirations: 89,
          disputes: 23
        }
      }

      // Filter by trend type if specified
      const responseData = trendType ? { [trendType]: trends[trendType] } : trends

      logger.apiUsage(req.user._id, 'market_trends', 0, 0)

      res.json({
        success: true,
        data: {
          trends: responseData,
          filters: {
            therapeuticArea,
            timeRange,
            trendType
          },
          metadata: {
            generatedAt: new Date(),
            timeRangeMonths: parseInt(timeRange)
          }
        }
      })

    } catch (error) {
      logger.error('Market trends error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch market trends'
      })
    }
  }
)

export default router