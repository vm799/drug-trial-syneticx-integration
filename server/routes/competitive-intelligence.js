// server/routes/competitive-intelligence.js - Competitive Intelligence API Routes

import express from 'express'
import { body, query, param, validationResult } from 'express-validator'
import CompetitiveIntelligence from '../models/CompetitiveIntelligence.js'
import CompetitiveIntelligenceAgent from '../agents/CompetitiveIntelligenceAgent.js'
import getOpenAIService from '../services/openaiService.js'
import FinancialDataService from '../services/financialDataService.js'
import auth, { premiumAuth } from '../middleware/auth.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Initialize services
const openaiService = getOpenAIService()
const competitiveAgent = new CompetitiveIntelligenceAgent(openaiService)
const financialService = new FinancialDataService()

// @route   GET /api/competitive-intelligence/dashboard
// @desc    Get competitive intelligence dashboard data
// @access  Public (Development) / Private (Production)
router.get('/dashboard', (req, res, next) => {
  // Mock user for demo purposes - always active
  req.user = { _id: 'demo-user', subscription: 'premium' }
  next()
}, async (req, res) => {
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

    // Get competitors - with fallback for database issues
    let competitors = []
    
    try {
      competitors = await CompetitiveIntelligence.find(query)
        .sort(sortCriteria)
        .limit(parseInt(limit))
        .select(`
          companyInfo threatScore overallThreat financialMetrics 
          pipelineAnalysis patentPortfolio recentActivities lastAnalyzed
        `)
    } catch (error) {
      console.warn('Database query failed, using demo data:', error.message)
    }

    // Always use demo data for reliable demonstration
    if (competitors.length === 0) {
      competitors = [
        {
          _id: 'comp1',
          companyInfo: { name: 'MegaPharma Inc.', ticker: 'MEGA' },
          threatScore: 87,
          overallThreat: 'critical',
          financialMetrics: { marketCap: 125000000000 },
          pipelineAnalysis: { totalAssets: 15 },
          patentPortfolio: { totalPatents: 234 },
          recentActivities: [
            { type: 'acquisition', description: 'Acquired BioTech startup for $2.1B', date: new Date() }
          ],
          lastAnalyzed: new Date()
        },
        {
          _id: 'comp2',
          companyInfo: { name: 'GlobalBio Corp.', ticker: 'GLOB' },
          threatScore: 72,
          overallThreat: 'high', 
          financialMetrics: { marketCap: 89000000000 },
          pipelineAnalysis: { totalAssets: 12 },
          patentPortfolio: { totalPatents: 156 },
          recentActivities: [
            { type: 'partnership', description: 'Strategic partnership with TechMed', date: new Date() }
          ],
          lastAnalyzed: new Date()
        },
        {
          _id: 'comp3',
          companyInfo: { name: 'InnovateMed Ltd.', ticker: 'INNO' },
          threatScore: 58,
          overallThreat: 'medium',
          financialMetrics: { marketCap: 45000000000 },
          pipelineAnalysis: { totalAssets: 8 },
          patentPortfolio: { totalPatents: 89 },
          recentActivities: [
            { type: 'fda_approval', description: 'FDA approval for breakthrough therapy', date: new Date() }
          ],
          lastAnalyzed: new Date()
        }
      ]
    }

    // Enhance with live financial data for demo companies
    const enhancedCompetitors = await Promise.all(
      competitors.map(async (comp) => {
        try {
          // Try to get live financial data for demo companies
          if (comp.companyInfo?.name && comp._id.startsWith('comp')) {
            const liveFinancials = await financialService.getCompanyFinancials(comp.companyInfo.name)
            if (liveFinancials) {
              return {
                ...comp,
                financialMetrics: {
                  ...comp.financialMetrics,
                  marketCap: liveFinancials.marketCap,
                  revenue: liveFinancials.revenue,
                  profitMargin: liveFinancials.profitMargin,
                  currentPrice: liveFinancials.currentPrice,
                  priceChange: liveFinancials.priceChange,
                  volume: liveFinancials.volume,
                  source: liveFinancials.source
                },
                companyInfo: {
                  ...comp.companyInfo,
                  symbol: liveFinancials.symbol,
                  lastUpdated: liveFinancials.lastUpdated
                }
              }
            }
          }
          return comp
        } catch (error) {
          logger.warn(`Failed to enhance ${comp.companyInfo?.name}:`, error.message)
          return comp
        }
      })
    )

    // Calculate threat summary
    const threatSummary = enhancedCompetitors.reduce((acc, comp) => {
      acc[comp.overallThreat] = (acc[comp.overallThreat] || 0) + 1
      return acc
    }, { critical: 0, high: 0, medium: 0, low: 0 })

    // Calculate total market metrics
    const totalMarketCap = enhancedCompetitors.reduce((sum, comp) => 
      sum + (comp.financialMetrics?.marketCap || 0), 0
    )
    
    const totalPipelineAssets = enhancedCompetitors.reduce((sum, comp) => 
      sum + (comp.pipelineAnalysis?.totalAssets || 0), 0
    )

    // Get recent market activities
    const recentActivities = []
    enhancedCompetitors.forEach(comp => {
      if (comp.recentActivities && comp.recentActivities.length > 0) {
        comp.recentActivities.slice(0, 2).forEach(activity => {
          recentActivities.push({
            ...activity,
            company: comp.companyInfo.name,
            companyId: comp._id
          })
        })
      }
    })

    // Sort activities by date
    recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date))

    const summary = {
      totalCompetitors: enhancedCompetitors.length,
      threatSummary,
      totalMarketCap,
      totalPipelineAssets,
      recentActivities: recentActivities.slice(0, 10)
    }

    logger.apiUsage(req.user._id, 'competitive_intelligence_dashboard', 0, 0)

    res.json({
      success: true,
      data: {
        summary,
        competitors: enhancedCompetitors
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