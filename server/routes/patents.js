// server/routes/patents.js - Patent Intelligence API Routes

import express from 'express'
import { body, query, param, validationResult } from 'express-validator'
import Patent from '../models/Patent.js'
import CompetitiveIntelligence from '../models/CompetitiveIntelligence.js'
import USPTOApiService from '../services/usptoApiService.js'
import PatentMonitoringAgent from '../agents/PatentMonitoringAgent.js'
import getOpenAIService from '../services/openaiService.js'
import auth, { premiumAuth } from '../middleware/auth.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Initialize services
const openaiService = getOpenAIService()
const patentMonitoringAgent = new PatentMonitoringAgent(openaiService)
const usptoService = new USPTOApiService()

// @route   GET /api/patents/cliff-monitor
// @desc    Get patent cliff monitoring dashboard data
// @access  Private
router.get('/cliff-monitor', auth, async (req, res) => {
  try {
    const { timeframe = 24, riskLevel, sortBy = 'risk' } = req.query

    // Get expiring patents within timeframe
    const expiringPatents = await Patent.findExpiringPatents(parseInt(timeframe))
    
    // Filter by risk level if specified
    let filteredPatents = expiringPatents
    if (riskLevel) {
      filteredPatents = expiringPatents.filter(patent => 
        patent.cliffAnalysis.cliffRisk === riskLevel
      )
    }

    // Calculate risk summary
    const riskSummary = filteredPatents.reduce((acc, patent) => {
      acc[patent.cliffAnalysis.cliffRisk] = (acc[patent.cliffAnalysis.cliffRisk] || 0) + 1
      return acc
    }, { critical: 0, high: 0, medium: 0, low: 0 })

    // Sort patents
    filteredPatents.sort((a, b) => {
      switch (sortBy) {
        case 'risk':
          const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }
          const riskDiff = riskOrder[b.cliffAnalysis.cliffRisk] - riskOrder[a.cliffAnalysis.cliffRisk]
          if (riskDiff !== 0) return riskDiff
          return b.marketImpact.estimatedRevenue - a.marketImpact.estimatedRevenue
        case 'expiry':
          return new Date(a.expiryDate) - new Date(b.expiryDate)
        case 'revenue':
          return b.marketImpact.estimatedRevenue - a.marketImpact.estimatedRevenue
        default:
          return 0
      }
    })

    // Calculate total revenue at risk
    const totalRevenueAtRisk = filteredPatents.reduce((sum, patent) => 
      sum + (patent.marketImpact.estimatedRevenue || 0), 0
    )

    // Format patents for frontend
    const formattedPatents = filteredPatents.map(patent => ({
      id: patent._id,
      patentNumber: patent.patentNumber,
      drugName: patent.drugInfo.drugName,
      company: patent.assignee.name,
      expiryDate: patent.expiryDate,
      daysToExpiry: patent.daysToExpiry,
      riskLevel: patent.cliffAnalysis.cliffRisk,
      estimatedRevenue: patent.marketImpact.estimatedRevenue || 0,
      genericThreat: {
        level: patent.cliffAnalysis.genericThreat.level || 'medium',
        potentialEntrants: patent.cliffAnalysis.genericThreat.potentialEntrants || []
      },
      strategicImportance: patent.strategicValue.importance,
      therapeuticArea: patent.drugInfo.therapeuticArea
    }))

    logger.apiUsage(req.user._id, 'patent_cliff_monitor', 0, 0)

    res.json({
      success: true,
      data: {
        summary: {
          totalPatents: filteredPatents.length,
          totalRevenueAtRisk,
          riskBreakdown: riskSummary,
          timeframeMonths: parseInt(timeframe)
        },
        patents: formattedPatents
      }
    })

  } catch (error) {
    logger.error('Patent cliff monitor error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patent cliff data'
    })
  }
})

// @route   POST /api/patents/cliff-analysis
// @desc    Perform detailed patent cliff analysis using AI
// @access  Private (Premium)
router.post('/cliff-analysis', 
  premiumAuth,
  [
    body('drugName').notEmpty().withMessage('Drug name is required'),
    body('companyName').optional().isString(),
    body('timeframe').optional().isInt({ min: 1, max: 60 })
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

      const { drugName, companyName, timeframe = 24 } = req.body
      
      logger.info(`Starting patent cliff analysis for ${drugName}`)

      // Use patent monitoring agent for comprehensive analysis
      const analysisParams = {
        drugName,
        company: companyName,
        timeframe,
        analysisDepth: 'comprehensive'
      }

      const startTime = Date.now()
      const cliffAnalysis = await patentMonitoringAgent.analyzePatentCliff(
        analysisParams, 
        { userId: req.user._id }
      )
      const analysisTime = Date.now() - startTime

      // Update user API usage
      await req.user.updateApiUsage(cliffAnalysis.metadata?.tokensUsed || 100)

      // Log usage
      logger.apiUsage(req.user._id, 'patent_cliff_analysis', analysisTime, 
        cliffAnalysis.metadata?.tokensUsed || 100)

      res.json({
        success: true,
        data: {
          analysis: cliffAnalysis,
          metadata: {
            analysisTime,
            drugName,
            companyName,
            timeframe,
            generatedAt: new Date().toISOString()
          }
        }
      })

    } catch (error) {
      logger.error('Patent cliff analysis error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to perform patent cliff analysis'
      })
    }
  }
)

// @route   POST /api/patents/sync-uspto
// @desc    Sync patent data with USPTO database
// @access  Private (Admin/Premium)
router.post('/sync-uspto',
  [
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
    body('includeExpired').optional().isBoolean()
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

      // Check permissions
      if (!['admin', 'premium'].includes(req.user.subscription) && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'USPTO sync requires premium subscription or admin privileges'
        })
      }

      const { companyName, limit = 1000, includeExpired = false } = req.body

      logger.info(`Starting USPTO sync for company: ${companyName}`)

      // Start USPTO synchronization
      const syncPromise = usptoService.syncPatentData(companyName, {
        limit,
        includeExpired
      })

      // Return immediate response with sync started status
      res.json({
        success: true,
        message: 'USPTO synchronization started',
        data: {
          companyName,
          syncStarted: true,
          estimatedDuration: Math.ceil(limit / 60) + ' minutes', // Based on rate limiting
          syncId: `sync_${Date.now()}_${companyName.replace(/\s+/g, '_')}`
        }
      })

      // Handle sync completion asynchronously
      try {
        const syncResult = await syncPromise
        
        logger.info('USPTO sync completed:', syncResult)
        
        // Emit event for real-time updates (if using WebSocket)
        if (req.app.get('io')) {
          req.app.get('io').to(`user_${req.user._id}`).emit('usptoSyncCompleted', {
            companyName,
            result: syncResult
          })
        }

      } catch (syncError) {
        logger.error('USPTO sync failed:', syncError)
        
        if (req.app.get('io')) {
          req.app.get('io').to(`user_${req.user._id}`).emit('usptoSyncError', {
            companyName,
            error: syncError.message
          })
        }
      }

    } catch (error) {
      logger.error('USPTO sync initiation error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to start USPTO synchronization'
      })
    }
  }
)

// @route   GET /api/patents/competitive-landscape
// @desc    Get competitive patent landscape analysis
// @access  Private
router.get('/competitive-landscape',
  [
    query('therapeuticArea').notEmpty().withMessage('Therapeutic area is required'),
    query('timeRange').optional().isInt({ min: 1, max: 50 }),
    query('limit').optional().isInt({ min: 100, max: 10000 })
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
        therapeuticArea, 
        timeRange = 10, 
        limit = 2000 
      } = req.query

      logger.info(`Analyzing competitive landscape for ${therapeuticArea}`)

      const landscape = await usptoService.getCompetitiveLandscape(therapeuticArea, {
        timeRange: parseInt(timeRange),
        limit: parseInt(limit)
      })

      // Convert Maps to Objects for JSON serialization
      const formattedLandscape = {
        ...landscape,
        companies: Object.fromEntries(landscape.companies),
        patentsByYear: Object.fromEntries(landscape.patentsByYear)
      }

      logger.apiUsage(req.user._id, 'competitive_landscape', 0, 0)

      res.json({
        success: true,
        data: formattedLandscape
      })

    } catch (error) {
      logger.error('Competitive landscape analysis error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to analyze competitive landscape'
      })
    }
  }
)

// @route   GET /api/patents/search
// @desc    Search patents by various criteria
// @access  Private
router.get('/search',
  [
    query('drugName').optional().isString(),
    query('companyName').optional().isString(),
    query('therapeuticArea').optional().isString(),
    query('patentType').optional().isString(),
    query('riskLevel').optional().isIn(['critical', 'high', 'medium', 'low']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['expiry', 'revenue', 'risk', 'filing'])
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
        drugName,
        companyName,
        therapeuticArea,
        patentType,
        riskLevel,
        page = 1,
        limit = 20,
        sortBy = 'expiry'
      } = req.query

      // Build search query
      const searchQuery = { 'status.legal': { $in: ['granted', 'pending'] } }

      if (drugName) {
        searchQuery['drugInfo.drugName'] = new RegExp(drugName, 'i')
      }

      if (companyName) {
        searchQuery['assignee.name'] = new RegExp(companyName, 'i')
      }

      if (therapeuticArea) {
        searchQuery['drugInfo.therapeuticArea'] = therapeuticArea
      }

      if (patentType) {
        searchQuery.patentType = patentType
      }

      if (riskLevel) {
        searchQuery['cliffAnalysis.cliffRisk'] = riskLevel
      }

      // Build sort criteria
      let sortCriteria = {}
      switch (sortBy) {
        case 'expiry':
          sortCriteria = { expiryDate: 1 }
          break
        case 'revenue':
          sortCriteria = { 'marketImpact.estimatedRevenue': -1 }
          break
        case 'risk':
          // Custom sort for risk levels
          sortCriteria = { 'cliffAnalysis.yearsToExpiry': 1 }
          break
        case 'filing':
          sortCriteria = { filingDate: -1 }
          break
      }

      // Execute search
      const patents = await Patent.find(searchQuery)
        .sort(sortCriteria)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select(`
          patentNumber title drugInfo assignee expiryDate filingDate 
          marketImpact.estimatedRevenue cliffAnalysis.cliffRisk 
          cliffAnalysis.yearsToExpiry strategicValue.importance
        `)
        .lean()

      const total = await Patent.countDocuments(searchQuery)

      // Format results
      const formattedPatents = patents.map(patent => ({
        id: patent._id,
        patentNumber: patent.patentNumber,
        title: patent.title,
        drugName: patent.drugInfo?.drugName,
        company: patent.assignee?.name,
        expiryDate: patent.expiryDate,
        filingDate: patent.filingDate,
        estimatedRevenue: patent.marketImpact?.estimatedRevenue || 0,
        riskLevel: patent.cliffAnalysis?.cliffRisk || 'medium',
        yearsToExpiry: patent.cliffAnalysis?.yearsToExpiry,
        strategicImportance: patent.strategicValue?.importance || 'medium'
      }))

      logger.apiUsage(req.user._id, 'patent_search', 0, 0)

      res.json({
        success: true,
        data: {
          patents: formattedPatents,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit)
          },
          searchCriteria: {
            drugName,
            companyName,
            therapeuticArea,
            patentType,
            riskLevel,
            sortBy
          }
        }
      })

    } catch (error) {
      logger.error('Patent search error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to search patents'
      })
    }
  }
)

// @route   GET /api/patents/:id
// @desc    Get detailed patent information
// @access  Private
router.get('/:id', 
  param('id').isMongoId(),
  auth,
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid patent ID'
        })
      }

      const patent = await Patent.findById(req.params.id)

      if (!patent) {
        return res.status(404).json({
          success: false,
          message: 'Patent not found'
        })
      }

      // Increment view count
      patent.tracking.views = (patent.tracking.views || 0) + 1
      patent.tracking.lastViewed = new Date()
      await patent.save()

      logger.apiUsage(req.user._id, 'patent_detail', 0, 0)

      res.json({
        success: true,
        data: { patent }
      })

    } catch (error) {
      logger.error('Patent detail fetch error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch patent details'
      })
    }
  }
)

// @route   POST /api/patents/:id/monitor
// @desc    Set up monitoring alert for a patent
// @access  Private
router.post('/:id/monitor',
  [
    param('id').isMongoId(),
    body('alertType').isIn(['expiry_warning', 'status_change', 'competitive_threat']),
    body('threshold').optional().isString()
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

      const { alertType, threshold } = req.body
      const patent = await Patent.findById(req.params.id)

      if (!patent) {
        return res.status(404).json({
          success: false,
          message: 'Patent not found'
        })
      }

      // Check if alert already exists
      const existingAlert = patent.tracking.alertsSet.find(
        alert => alert.userId.equals(req.user._id) && alert.alertType === alertType
      )

      if (existingAlert) {
        return res.status(409).json({
          success: false,
          message: 'Alert already set for this patent and type'
        })
      }

      // Add new alert
      patent.tracking.alertsSet.push({
        userId: req.user._id,
        alertType,
        threshold: threshold || 'default',
        createdAt: new Date()
      })

      await patent.save()

      logger.apiUsage(req.user._id, 'patent_monitor_set', 0, 0)

      res.json({
        success: true,
        message: 'Patent monitoring alert set successfully',
        data: {
          patentId: patent._id,
          patentNumber: patent.patentNumber,
          alertType,
          threshold
        }
      })

    } catch (error) {
      logger.error('Patent monitoring setup error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to set up patent monitoring'
      })
    }
  }
)

// @route   GET /api/patents/statistics/overview
// @desc    Get patent portfolio statistics
// @access  Private
router.get('/statistics/overview', auth, async (req, res) => {
  try {
    const stats = await Patent.getPatentStatistics()
    
    // Additional calculated metrics
    const additionalStats = {
      averagePatentAge: await Patent.aggregate([
        {
          $group: {
            _id: null,
            avgAge: {
              $avg: {
                $divide: [
                  { $subtract: [new Date(), '$filingDate'] },
                  365 * 24 * 60 * 60 * 1000 // Convert to years
                ]
              }
            }
          }
        }
      ]),
      patentsByTherapeuticArea: await Patent.aggregate([
        {
          $group: {
            _id: '$drugInfo.therapeuticArea',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$marketImpact.estimatedRevenue' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      topAssignees: await Patent.aggregate([
        {
          $group: {
            _id: '$assignee.name',
            patentCount: { $sum: 1 },
            totalRevenue: { $sum: '$marketImpact.estimatedRevenue' }
          }
        },
        { $sort: { patentCount: -1 } },
        { $limit: 10 }
      ])
    }

    const combinedStats = {
      ...stats,
      averagePatentAge: additionalStats.averagePatentAge[0]?.avgAge || 0,
      patentsByTherapeuticArea: additionalStats.patentsByTherapeuticArea,
      topAssignees: additionalStats.topAssignees
    }

    logger.apiUsage(req.user._id, 'patent_statistics', 0, 0)

    res.json({
      success: true,
      data: combinedStats
    })

  } catch (error) {
    logger.error('Patent statistics error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patent statistics'
    })
  }
})

export default router