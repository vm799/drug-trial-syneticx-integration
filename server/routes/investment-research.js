// server/routes/investment-research.js - Investment Research Analytics API Routes

import express from 'express'
import { body, query, param, validationResult } from 'express-validator'
import InvestmentResearchAgent from '../agents/InvestmentResearchAgent.js'
import getOpenAIService from '../services/openaiService.js'
import auth, { premiumAuth } from '../middleware/auth.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Initialize services
const openaiService = getOpenAIService()
const investmentAgent = new InvestmentResearchAgent(openaiService)

// @route   POST /api/investment-research/patent-cliff-impact
// @desc    Analyze patent cliff impact for investment decisions
// @access  Private (Premium)
router.post('/patent-cliff-impact',
  premiumAuth,
  [
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('analysisTimeframe').optional().isInt({ min: 1, max: 20 }),
    body('discountRate').optional().isNumeric(),
    body('includeScenarios').optional().isBoolean()
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
        analysisTimeframe = 10,
        discountRate,
        includeScenarios = true 
      } = req.body

      logger.info(`Patent cliff impact analysis requested for: ${companyName}`)

      const portfolioParameters = {
        timeframe: analysisTimeframe,
        discountRate: discountRate || 0.12,
        includeScenarios
      }

      const startTime = Date.now()
      const analysis = await investmentAgent.analyzePatentCliffImpact(
        companyName,
        portfolioParameters,
        { userId: req.user._id, requestId: `pcl_${Date.now()}` }
      )

      const processingTime = Date.now() - startTime

      if (analysis.success) {
        // Update user API usage
        const tokensUsed = analysis.analysis.metadata?.tokensUsed || 300
        await req.user.updateApiUsage(tokensUsed)

        logger.apiUsage(req.user._id, 'patent_cliff_impact_analysis', processingTime, tokensUsed)

        res.json({
          success: true,
          data: {
            analysis: analysis.analysis,
            metadata: {
              processingTime,
              companyName,
              analysisTimeframe,
              generatedAt: new Date().toISOString()
            }
          }
        })
      } else {
        res.status(400).json({
          success: false,
          message: analysis.error || 'Patent cliff impact analysis failed'
        })
      }

    } catch (error) {
      logger.error('Patent cliff impact analysis error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to analyze patent cliff impact'
      })
    }
  }
)

// @route   POST /api/investment-research/market-opportunities
// @desc    Assess market opportunities for investment
// @access  Private (Premium)
router.post('/market-opportunities',
  premiumAuth,
  [
    body('therapeuticArea').notEmpty().withMessage('Therapeutic area is required'),
    body('investmentCriteria').optional().isObject(),
    body('riskTolerance').optional().isIn(['low', 'medium', 'high']),
    body('investmentHorizon').optional().isInt({ min: 1, max: 20 })
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
        investmentCriteria = {},
        riskTolerance = 'medium',
        investmentHorizon = 5
      } = req.body

      logger.info(`Market opportunity assessment requested for: ${therapeuticArea}`)

      const enhancedCriteria = {
        ...investmentCriteria,
        riskTolerance,
        investmentHorizon,
        userId: req.user._id
      }

      const assessment = await investmentAgent.assessMarketOpportunities(
        therapeuticArea,
        enhancedCriteria,
        { userId: req.user._id }
      )

      // Update user API usage
      await req.user.updateApiUsage(200) // Fixed cost for market assessment

      logger.apiUsage(req.user._id, 'market_opportunity_assessment', 0, 200)

      res.json({
        success: true,
        data: assessment
      })

    } catch (error) {
      logger.error('Market opportunity assessment error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to assess market opportunities'
      })
    }
  }
)

// @route   POST /api/investment-research/risk-score
// @desc    Calculate comprehensive investment risk score
// @access  Private (Premium)
router.post('/risk-score',
  premiumAuth,
  [
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('investmentHorizon').optional().isInt({ min: 1, max: 20 }),
    body('riskCategories').optional().isArray()
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
        investmentHorizon = 5,
        riskCategories
      } = req.body

      logger.info(`Risk score calculation requested for: ${companyName}`)

      const riskScore = await investmentAgent.calculateInvestmentRiskScore(
        companyName,
        investmentHorizon,
        { 
          userId: req.user._id,
          requestedCategories: riskCategories
        }
      )

      // Update user API usage
      await req.user.updateApiUsage(150) // Fixed cost for risk assessment

      logger.apiUsage(req.user._id, 'investment_risk_score', 0, 150)

      res.json({
        success: true,
        data: riskScore
      })

    } catch (error) {
      logger.error('Investment risk score calculation error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to calculate investment risk score'
      })
    }
  }
)

// @route   POST /api/investment-research/investment-thesis
// @desc    Generate comprehensive investment thesis
// @access  Private (Premium)
router.post('/investment-thesis',
  premiumAuth,
  [
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('analysisType').optional().isIn(['basic', 'comprehensive', 'deep_dive']),
    body('focusAreas').optional().isArray()
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
        analysisType = 'comprehensive',
        focusAreas = []
      } = req.body

      logger.info(`Investment thesis generation requested for: ${companyName}`)

      const thesis = await investmentAgent.generateInvestmentThesis(
        companyName,
        analysisType,
        {
          userId: req.user._id,
          focusAreas,
          requestType: 'investment_thesis'
        }
      )

      // Update user API usage based on analysis depth
      const tokenCosts = {
        basic: 400,
        comprehensive: 800,
        deep_dive: 1200
      }
      const tokensUsed = tokenCosts[analysisType] || 800
      await req.user.updateApiUsage(tokensUsed)

      logger.apiUsage(req.user._id, 'investment_thesis_generation', 0, tokensUsed)

      res.json({
        success: true,
        data: {
          thesis,
          metadata: {
            companyName,
            analysisType,
            generatedAt: new Date().toISOString(),
            tokensUsed
          }
        }
      })

    } catch (error) {
      logger.error('Investment thesis generation error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to generate investment thesis'
      })
    }
  }
)

// @route   GET /api/investment-research/portfolio-analysis
// @desc    Get portfolio-level investment analysis
// @access  Private (Premium)
router.get('/portfolio-analysis',
  premiumAuth,
  [
    query('companies').notEmpty().withMessage('Company list is required'),
    query('weights').optional().isString(),
    query('rebalanceFrequency').optional().isIn(['monthly', 'quarterly', 'annually']),
    query('benchmarkIndex').optional().isString()
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
        companies,
        weights,
        rebalanceFrequency = 'quarterly',
        benchmarkIndex
      } = req.query

      const companyList = companies.split(',').map(name => name.trim())
      const weightsList = weights ? weights.split(',').map(w => parseFloat(w.trim())) : null

      logger.info(`Portfolio analysis requested for ${companyList.length} companies`)

      // Perform individual company analyses
      const companyAnalyses = []
      for (let i = 0; i < companyList.length; i++) {
        try {
          const company = companyList[i]
          const riskScore = await investmentAgent.calculateInvestmentRiskScore(company, 5)
          
          companyAnalyses.push({
            companyName: company,
            weight: weightsList ? (weightsList[i] || 0) : (1 / companyList.length),
            riskScore: riskScore.overallRiskScore,
            riskCategories: riskScore.riskCategories
          })
        } catch (error) {
          logger.warn(`Failed to analyze ${companyList[i]}:`, error.message)
        }
      }

      // Calculate portfolio-level metrics
      const portfolioAnalysis = {
        companies: companyAnalyses,
        portfolioMetrics: {
          weightedRiskScore: companyAnalyses.reduce((sum, company) => 
            sum + (company.riskScore * company.weight), 0
          ),
          diversificationScore: this.calculateDiversificationScore(companyAnalyses),
          rebalanceFrequency,
          benchmarkIndex
        },
        riskContribution: companyAnalyses.map(company => ({
          companyName: company.companyName,
          riskContribution: company.riskScore * company.weight,
          relativeRisk: company.riskScore / companyAnalyses.reduce((sum, c) => 
            sum + c.riskScore, 0
          )
        })),
        recommendations: [
          'Monitor high-risk positions closely',
          'Consider rebalancing based on risk contribution',
          'Diversify across therapeutic areas'
        ]
      }

      // Update user API usage
      const tokensUsed = companyList.length * 100
      await req.user.updateApiUsage(tokensUsed)

      logger.apiUsage(req.user._id, 'portfolio_analysis', 0, tokensUsed)

      res.json({
        success: true,
        data: portfolioAnalysis
      })

    } catch (error) {
      logger.error('Portfolio analysis error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to perform portfolio analysis'
      })
    }
  }
)

// @route   GET /api/investment-research/market-trends
// @desc    Get investment-focused market trend analysis
// @access  Private
router.get('/market-trends',
  [
    query('therapeuticArea').optional().isString(),
    query('timeframe').optional().isIn(['1M', '3M', '6M', '1Y', '2Y']),
    query('metricType').optional().isIn(['valuation', 'patent_activity', 'pipeline', 'ma_activity'])
  ],
  auth,
  async (req, res) => {
    try {
      const {
        therapeuticArea,
        timeframe = '1Y',
        metricType = 'valuation'
      } = req.query

      // Mock market trend data for investment purposes
      const trends = {
        valuation: {
          averageMultiple: 4.2, // P/E ratio
          trend: 'increasing',
          volatility: 'moderate',
          keyDrivers: [
            'Patent cliff concerns driving valuations down',
            'Pipeline strength premiums',
            'Regulatory approval success rates'
          ]
        },
        patent_activity: {
          newFilings: 1247,
          expirations: 89,
          netChange: 1158,
          trend: 'increasing',
          hotAreas: ['oncology', 'rare_diseases', 'gene_therapy']
        },
        pipeline: {
          totalAssets: 3456,
          phaseAdvancement: 0.23, // 23% advancement rate
          successRate: {
            'Phase I': 0.63,
            'Phase II': 0.31,
            'Phase III': 0.58,
            'FDA Approval': 0.85
          },
          investmentAttraction: 'high'
        },
        ma_activity: {
          totalDeals: 45,
          totalValue: 125000000000, // $125B
          averagePremium: 0.35, // 35% premium
          trend: 'increasing',
          topTargets: ['Biotech companies', 'Gene therapy specialists', 'Rare disease focused']
        }
      }

      // Filter by metric type if specified
      const responseData = metricType ? { [metricType]: trends[metricType] } : trends

      logger.apiUsage(req.user._id, 'investment_market_trends', 0, 0)

      res.json({
        success: true,
        data: {
          trends: responseData,
          filters: {
            therapeuticArea,
            timeframe,
            metricType
          },
          metadata: {
            generatedAt: new Date(),
            timeframe,
            dataPoints: Object.keys(responseData).length
          }
        }
      })

    } catch (error) {
      logger.error('Investment market trends error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch investment market trends'
      })
    }
  }
)

// @route   GET /api/investment-research/peer-comparison
// @desc    Compare companies for investment analysis
// @access  Private
router.get('/peer-comparison',
  [
    query('targetCompany').notEmpty().withMessage('Target company is required'),
    query('peerCompanies').notEmpty().withMessage('Peer companies are required'),
    query('metrics').optional().isString()
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
        targetCompany,
        peerCompanies,
        metrics = 'risk,valuation,pipeline'
      } = req.query

      const peerList = peerCompanies.split(',').map(name => name.trim())
      const allCompanies = [targetCompany, ...peerList]
      const metricList = metrics.split(',').map(m => m.trim())

      logger.info(`Peer comparison requested: ${targetCompany} vs ${peerList.length} peers`)

      const comparison = {
        targetCompany,
        peerCompanies: peerList,
        metrics: {},
        rankings: {},
        summary: {}
      }

      // Gather risk scores for all companies
      if (metricList.includes('risk')) {
        const riskScores = {}
        for (const company of allCompanies) {
          try {
            const riskScore = await investmentAgent.calculateInvestmentRiskScore(company, 5)
            riskScores[company] = riskScore.overallRiskScore
          } catch (error) {
            riskScores[company] = null
          }
        }
        comparison.metrics.riskScores = riskScores
        
        // Rank by risk (lower is better)
        const validRisks = Object.entries(riskScores).filter(([_, score]) => score !== null)
        validRisks.sort((a, b) => a[1] - b[1])
        comparison.rankings.riskRanking = validRisks.map(([company, score], index) => ({
          rank: index + 1,
          company,
          score
        }))
      }

      // Mock additional metrics for demonstration
      if (metricList.includes('valuation')) {
        comparison.metrics.peRatios = allCompanies.reduce((acc, company) => {
          acc[company] = Math.random() * 15 + 5 // Random P/E between 5-20
          return acc
        }, {})
      }

      if (metricList.includes('pipeline')) {
        comparison.metrics.pipelineStrength = allCompanies.reduce((acc, company) => {
          acc[company] = Math.floor(Math.random() * 50) + 20 // Random pipeline score 20-70
          return acc
        }, {})
      }

      // Generate summary
      comparison.summary = {
        targetPosition: `${targetCompany} ranks in the middle of peer group`,
        keyStrengths: ['Patent portfolio protection', 'Market position'],
        keyWeaknesses: ['Pipeline dependency', 'Patent cliff exposure'],
        investmentRecommendation: 'Neutral to positive outlook'
      }

      // Update user API usage
      const tokensUsed = allCompanies.length * 50
      await req.user.updateApiUsage(tokensUsed)

      logger.apiUsage(req.user._id, 'peer_comparison', 0, tokensUsed)

      res.json({
        success: true,
        data: comparison
      })

    } catch (error) {
      logger.error('Peer comparison error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to perform peer comparison'
      })
    }
  }
)

// @route   GET /api/investment-research/alerts
// @desc    Get investment research alerts and notifications
// @access  Private
router.get('/alerts', auth, async (req, res) => {
  try {
    const { alertType, severity, limit = 20 } = req.query

    // Mock alert data - in production this would come from monitoring systems
    let alerts = [
      {
        id: 1,
        type: 'patent_cliff_warning',
        severity: 'high',
        company: 'PharmaCorp',
        message: 'Critical patent expires in 18 months - $2.5B revenue at risk',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        actionRequired: true
      },
      {
        id: 2,
        type: 'competitive_intelligence',
        severity: 'medium',
        company: 'BioInnovate',
        message: 'Competitor filed blocking patent in key therapeutic area',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        actionRequired: false
      },
      {
        id: 3,
        type: 'market_opportunity',
        severity: 'low',
        company: 'Generic Co',
        message: 'New market opportunity identified in biosimilars',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        actionRequired: false
      },
      {
        id: 4,
        type: 'risk_score_change',
        severity: 'medium',
        company: 'MegaPharma',
        message: 'Investment risk score increased from 45 to 62',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        actionRequired: true
      }
    ]

    // Filter alerts
    if (alertType) {
      alerts = alerts.filter(alert => alert.type === alertType)
    }
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity)
    }

    // Limit results
    alerts = alerts.slice(0, parseInt(limit))

    logger.apiUsage(req.user._id, 'investment_alerts', 0, 0)

    res.json({
      success: true,
      data: {
        alerts,
        summary: {
          total: alerts.length,
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length,
          actionRequired: alerts.filter(a => a.actionRequired).length
        },
        filters: {
          alertType,
          severity,
          limit
        }
      }
    })

  } catch (error) {
    logger.error('Investment research alerts error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investment alerts'
    })
  }
})

// Helper function for portfolio analysis
function calculateDiversificationScore(companies) {
  // Simple diversification score based on risk distribution
  if (companies.length < 2) return 0
  
  const riskScores = companies.map(c => c.riskScore)
  const avgRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length
  const riskVariance = riskScores.reduce((sum, score) => sum + Math.pow(score - avgRisk, 2), 0) / riskScores.length
  
  // Higher variance indicates better diversification
  return Math.min(100, riskVariance * 2)
}

export default router