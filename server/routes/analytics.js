import express from 'express'
import { query, validationResult } from 'express-validator'
import ChatSession from '../models/ChatSession.js'
import ResearchPaper from '../models/ResearchPaper.js'
import User from '../models/User.js'
import logger from '../utils/logger.js'
import { adminAuth } from '../middleware/auth.js'

const router = express.Router()

// @route   GET /api/analytics/dashboard
// @desc    Get user dashboard analytics
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id
    const { days = 30 } = req.query

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get user's chat sessions analytics
    const chatAnalytics = await ChatSession.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: '$metrics.totalMessages' },
          totalTokens: { $sum: '$metrics.totalTokens' },
          avgResponseTime: { $avg: '$metrics.averageResponseTime' },
          avgSatisfaction: { $avg: '$metrics.userSatisfaction' },
        },
      },
    ])

    // Get daily activity
    const dailyActivity = await ChatSession.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          sessions: { $sum: 1 },
          messages: { $sum: '$metrics.totalMessages' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // Get research paper interactions
    const paperInteractions = await ResearchPaper.aggregate([
      {
        $match: {
          'interactions.views': { $gte: 1 },
        },
      },
      {
        $lookup: {
          from: 'chatsessions',
          localField: '_id',
          foreignField: 'context.researchPaper',
          as: 'chatSessions',
        },
      },
      {
        $match: {
          'chatSessions.userId': userId,
          'chatSessions.createdAt': { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          papersAnalyzed: { $sum: 1 },
          totalInteractions: { $sum: '$interactions.views' },
        },
      },
    ])

    // Get most used medical fields
    const medicalFieldsUsage = await ChatSession.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate },
          'context.specialization': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$context.specialization',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ])

    const analytics = {
      overview: chatAnalytics[0] || {
        totalSessions: 0,
        totalMessages: 0,
        totalTokens: 0,
        avgResponseTime: 0,
        avgSatisfaction: 0,
      },
      dailyActivity,
      paperInteractions: paperInteractions[0] || {
        papersAnalyzed: 0,
        totalInteractions: 0,
      },
      medicalFieldsUsage,
      period: {
        days: parseInt(days),
        startDate,
        endDate: new Date(),
      },
    }

    res.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    logger.error('Dashboard analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
    })
  }
})

// @route   GET /api/analytics/usage
// @desc    Get detailed usage analytics
// @access  Private
router.get(
  '/usage',
  [
    query('period').optional().isIn(['day', 'week', 'month', 'year']),
    query('groupBy').optional().isIn(['hour', 'day', 'week', 'month']),
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

      const userId = req.user._id
      const { period = 'month', groupBy = 'day' } = req.query

      // Calculate date range based on period
      const periods = {
        day: 1,
        week: 7,
        month: 30,
        year: 365,
      }

      const startDate = new Date(Date.now() - periods[period] * 24 * 60 * 60 * 1000)

      // Define date format based on groupBy
      const dateFormats = {
        hour: '%Y-%m-%d %H:00',
        day: '%Y-%m-%d',
        week: '%Y-W%U',
        month: '%Y-%m',
      }

      const usage = await ChatSession.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: dateFormats[groupBy], date: '$createdAt' },
            },
            sessions: { $sum: 1 },
            messages: { $sum: '$metrics.totalMessages' },
            tokens: { $sum: '$metrics.totalTokens' },
            avgResponseTime: { $avg: '$metrics.averageResponseTime' },
            avgSatisfaction: { $avg: '$metrics.userSatisfaction' },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])

      // Get API usage breakdown
      const apiUsage = {
        daily: req.user.apiUsage.daily,
        monthly: req.user.apiUsage.monthly,
        limits: {
          daily: getUsageLimit(req.user.subscription, 'daily'),
          monthly: getUsageLimit(req.user.subscription, 'monthly'),
        },
      }

      res.json({
        success: true,
        data: {
          usage,
          apiUsage,
          period,
          groupBy,
        },
      })
    } catch (error) {
      logger.error('Usage analytics error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch usage analytics',
      })
    }
  },
)

// @route   GET /api/analytics/research-insights
// @desc    Get research-specific insights
// @access  Private
router.get('/research-insights', async (req, res) => {
  try {
    const userId = req.user._id
    const { days = 30 } = req.query

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get most analyzed research types
    const researchTypes = await ChatSession.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate },
          'context.type': 'paper_analysis',
        },
      },
      {
        $lookup: {
          from: 'researchpapers',
          localField: 'context.researchPaper',
          foreignField: '_id',
          as: 'paper',
        },
      },
      {
        $unwind: '$paper',
      },
      {
        $group: {
          _id: '$paper.researchType',
          count: { $sum: 1 },
          avgQuality: { $avg: '$paper.qualityScore' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    // Get journal preferences
    const journalPreferences = await ChatSession.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate },
          'context.type': 'paper_analysis',
        },
      },
      {
        $lookup: {
          from: 'researchpapers',
          localField: 'context.researchPaper',
          foreignField: '_id',
          as: 'paper',
        },
      },
      {
        $unwind: '$paper',
      },
      {
        $group: {
          _id: '$paper.journal.name',
          count: { $sum: 1 },
          avgImpactFactor: { $avg: '$paper.journal.impactFactor' },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ])

    // Get research timeline (papers by publication year)
    const researchTimeline = await ChatSession.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate },
          'context.type': 'paper_analysis',
        },
      },
      {
        $lookup: {
          from: 'researchpapers',
          localField: 'context.researchPaper',
          foreignField: '_id',
          as: 'paper',
        },
      },
      {
        $unwind: '$paper',
      },
      {
        $group: {
          _id: { $year: '$paper.publicationDate' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ])

    // Get quality score distribution
    const qualityDistribution = await ChatSession.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate },
          'context.type': 'paper_analysis',
        },
      },
      {
        $lookup: {
          from: 'researchpapers',
          localField: 'context.researchPaper',
          foreignField: '_id',
          as: 'paper',
        },
      },
      {
        $unwind: '$paper',
      },
      {
        $bucket: {
          groupBy: '$paper.qualityScore',
          boundaries: [0, 2, 4, 6, 8, 10],
          default: 'Other',
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ])

    res.json({
      success: true,
      data: {
        researchTypes,
        journalPreferences,
        researchTimeline,
        qualityDistribution,
        period: {
          days: parseInt(days),
          startDate,
          endDate: new Date(),
        },
      },
    })
  } catch (error) {
    logger.error('Research insights error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch research insights',
    })
  }
})

// @route   GET /api/analytics/admin/overview
// @desc    Get admin dashboard analytics
// @access  Admin only
router.get('/admin/overview', adminAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [{ $gte: ['$lastActivity', startDate] }, 1, 0],
            },
          },
          premiumUsers: {
            $sum: {
              $cond: [{ $in: ['$subscription', ['premium', 'enterprise']] }, 1, 0],
            },
          },
        },
      },
    ])

    // Usage statistics
    const usageStats = await ChatSession.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: '$metrics.totalMessages' },
          totalTokens: { $sum: '$metrics.totalTokens' },
          avgSatisfaction: { $avg: '$metrics.userSatisfaction' },
        },
      },
    ])

    // Research paper statistics
    const paperStats = await ResearchPaper.aggregate([
      {
        $group: {
          _id: null,
          totalPapers: { $sum: 1 },
          recentPapers: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0],
            },
          },
          avgQualityScore: { $avg: '$qualityScore' },
          totalViews: { $sum: '$interactions.views' },
        },
      },
    ])

    // Top medical fields
    const topFields = await ChatSession.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          'context.specialization': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$context.specialization',
          sessions: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          _id: 1,
          sessions: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
        },
      },
      {
        $sort: { sessions: -1 },
      },
      {
        $limit: 10,
      },
    ])

    // Error rates and quality metrics
    const qualityMetrics = await ChatSession.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          avgAccuracy: { $avg: '$quality.accuracyScore' },
          avgCoherence: { $avg: '$quality.coherenceScore' },
          flaggedSessions: {
            $sum: {
              $cond: [{ $eq: ['$quality.flagged', true] }, 1, 0],
            },
          },
        },
      },
    ])

    res.json({
      success: true,
      data: {
        users: userStats[0] || {},
        usage: usageStats[0] || {},
        papers: paperStats[0] || {},
        topFields,
        quality: qualityMetrics[0] || {},
        period: {
          days: parseInt(days),
          startDate,
          endDate: new Date(),
        },
      },
    })
  } catch (error) {
    logger.error('Admin analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin analytics',
    })
  }
})

// @route   GET /api/analytics/admin/users
// @desc    Get detailed user analytics for admin
// @access  Admin only
router.get(
  '/admin/users',
  adminAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('subscription').optional().isIn(['free', 'premium', 'enterprise']),
    query('sortBy').optional().isIn(['created', 'activity', 'usage']),
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

      const { page = 1, limit = 50, subscription, sortBy = 'activity' } = req.query

      const query = {}
      if (subscription) {
        query.subscription = subscription
      }

      let sortCriteria = {}
      switch (sortBy) {
        case 'created':
          sortCriteria = { createdAt: -1 }
          break
        case 'usage':
          sortCriteria = { 'apiUsage.monthly.requests': -1 }
          break
        case 'activity':
        default:
          sortCriteria = { lastActivity: -1 }
          break
      }

      const users = await User.find(query)
        .sort(sortCriteria)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select(
          'email firstName lastName organization subscription role lastActivity apiUsage createdAt',
        )
        .lean()

      const total = await User.countDocuments(query)

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit),
          },
        },
      })
    } catch (error) {
      logger.error('Admin user analytics error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user analytics',
      })
    }
  },
)

// Helper function to get usage limits
function getUsageLimit(subscription, period) {
  const limits = {
    free: { daily: 20, monthly: 500 },
    premium: { daily: 200, monthly: 5000 },
    enterprise: { daily: 1000, monthly: 25000 },
  }

  return limits[subscription]?.[period] || limits.free[period]
}

export default router
