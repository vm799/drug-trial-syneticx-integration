// Enterprise-grade input validation schemas
import { body, param, query, validationResult } from 'express-validator'

// Custom validators for medical data
const medicalSpecializations = [
  'oncology', 'cardiology', 'neurology', 'infectious_diseases', 'immunology',
  'pharmacology', 'surgery', 'pediatrics', 'geriatrics', 'psychiatry',
  'dermatology', 'endocrinology', 'clinical_trials', 'epidemiology', 'biostatistics', 'other'
]

const researchTypes = [
  'clinical_trial', 'systematic_review', 'meta_analysis', 'case_study',
  'cohort_study', 'randomized_controlled_trial', 'observational_study',
  'laboratory_study', 'review_article', 'other'
]

// Authentication validation
export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
    .custom(async (value) => {
      const User = (await import('../models/User.js')).default
      const existingUser = await User.findOne({ email: value })
      if (existingUser) {
        throw new Error('Email already registered')
      }
      return true
    }),

  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),

  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required (1-50 characters)')
    .matches(/^[A-Za-z\s\-\.\']+$/)
    .withMessage('First name contains invalid characters'),

  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required (1-50 characters)')
    .matches(/^[A-Za-z\s\-\.\']+$/)
    .withMessage('Last name contains invalid characters'),

  body('organization')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Organization name too long'),

  body('specialization')
    .optional()
    .isArray()
    .custom((value) => {
      if (value && value.some(spec => !medicalSpecializations.includes(spec))) {
        throw new Error('Invalid medical specialization')
      }
      return true
    }),
]

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .notEmpty()
    .withMessage('Password required'),
]

// Chat validation
export const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be 1-5000 characters')
    .custom((value) => {
      // Check for potentially harmful content patterns
      const suspiciousPatterns = [
        /prompt.*injection/i,
        /ignore.*instructions/i,
        /system.*override/i,
        /<script/i,
        /javascript:/i,
      ]
      
      if (suspiciousPatterns.some(pattern => pattern.test(value))) {
        throw new Error('Message contains potentially harmful content')
      }
      return true
    }),

  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),

  body('context.researchPaper')
    .optional()
    .isMongoId()
    .withMessage('Invalid research paper ID'),

  body('context.analysisType')
    .optional()
    .isIn(['summary', 'methodology', 'findings', 'implications', 'critique'])
    .withMessage('Invalid analysis type'),
]

export const validateSessionCreation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Session title too long'),

  body('context.type')
    .isIn(['research', 'general', 'paper_analysis'])
    .withMessage('Invalid session type'),

  body('context.specialization')
    .optional()
    .isIn(medicalSpecializations)
    .withMessage('Invalid specialization'),
]

// Research paper validation
export const validateResearchPaper = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Title must be 5-500 characters'),

  body('abstract')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Abstract must be 50-5000 characters'),

  body('authors')
    .isArray({ min: 1 })
    .withMessage('At least one author required'),

  body('authors.*.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be 2-100 characters'),

  body('authors.*.orcid')
    .optional()
    .matches(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/)
    .withMessage('Invalid ORCID format'),

  body('journal.name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Journal name required'),

  body('journal.impactFactor')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Impact factor must be 0-100'),

  body('publicationDate')
    .isISO8601()
    .toDate()
    .withMessage('Valid publication date required')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Publication date cannot be in the future')
      }
      return true
    }),

  body('researchType')
    .isIn(researchTypes)
    .withMessage('Invalid research type'),

  body('medicalFields')
    .isArray()
    .custom((value) => {
      if (!value.every(field => medicalSpecializations.includes(field))) {
        throw new Error('Invalid medical field')
      }
      return true
    }),

  body('doi')
    .optional()
    .matches(/^10\.\d{4,}\/\S+/)
    .withMessage('Invalid DOI format'),

  body('pubmedId')
    .optional()
    .isNumeric()
    .withMessage('PubMed ID must be numeric'),
]

// Search validation
export const validatePaperSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Search query must be 2-200 characters'),

  query('field')
    .optional()
    .isIn(medicalSpecializations)
    .withMessage('Invalid field filter'),

  query('type')
    .optional()
    .isIn(researchTypes)
    .withMessage('Invalid type filter'),

  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .toInt()
    .withMessage('Page must be 1-1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be 1-100'),

  query('sort')
    .optional()
    .isIn(['relevance', 'date', 'quality', 'citations'])
    .withMessage('Invalid sort option'),

  query('dateFrom')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid from date'),

  query('dateTo')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid to date'),
]

// User profile validation
export const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be 1-50 characters'),

  body('organization')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Organization name too long'),

  body('specialization')
    .optional()
    .isArray()
    .custom((value) => {
      if (value && !value.every(spec => medicalSpecializations.includes(spec))) {
        throw new Error('Invalid specialization')
      }
      return true
    }),

  body('preferences.language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'pt', 'it', 'zh', 'ja'])
    .withMessage('Invalid language preference'),

  body('preferences.ai_settings.response_length')
    .optional()
    .isIn(['concise', 'detailed', 'comprehensive'])
    .withMessage('Invalid response length setting'),

  body('preferences.ai_settings.confidence_threshold')
    .optional()
    .isFloat({ min: 0.5, max: 1.0 })
    .withMessage('Confidence threshold must be 0.5-1.0'),
]

// Analytics validation
export const validateAnalyticsQuery = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .toInt()
    .withMessage('Days must be 1-365'),

  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'quarter', 'year'])
    .withMessage('Invalid period'),

  query('groupBy')
    .optional()
    .isIn(['hour', 'day', 'week', 'month'])
    .withMessage('Invalid groupBy'),

  query('metric')
    .optional()
    .isIn(['requests', 'tokens', 'sessions', 'papers'])
    .withMessage('Invalid metric'),
]

// Parameter validation
export const validateMongoId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID format`),
]

// Validation result handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }))

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    })
  }
  
  next()
}

// Rate limiting validation for API usage
export const validateApiUsage = async (req, res, next) => {
  try {
    const user = req.user
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    // Define limits by subscription tier
    const limits = {
      free: { daily: 50, hourly: 10, burst: 3 },
      premium: { daily: 500, hourly: 100, burst: 20 },
      enterprise: { daily: 5000, hourly: 1000, burst: 100 },
    }

    const userLimits = limits[user.subscription] || limits.free

    // Check daily limit
    if (user.apiUsage.daily.requests >= userLimits.daily) {
      return res.status(429).json({
        success: false,
        message: 'Daily API limit exceeded',
        resetTime: new Date(user.apiUsage.daily.date.getTime() + 24 * 60 * 60 * 1000),
      })
    }

    // Check burst rate (requests in last minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const recentRequests = user.security.activeSessions.filter(
      session => session.lastAccessed > oneMinuteAgo
    ).length

    if (recentRequests >= userLimits.burst) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: 60,
      })
    }

    next()
  } catch (error) {
    console.error('API usage validation error:', error)
    next(error)
  }
}

// Security validation for sensitive operations
export const validateSecureOperation = [
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Current password required for security'),

  body('twoFactorCode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Valid 2FA code required'),
]

// File upload validation
export const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'File upload required',
    })
  }

  const allowedTypes = ['application/pdf', 'text/plain', 'application/json']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only PDF, TXT, and JSON allowed.',
    })
  }

  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum 10MB allowed.',
    })
  }

  next()
}

// Export all validators
export const validators = {
  auth: {
    register: validateRegistration,
    login: validateLogin,
  },
  chat: {
    message: validateChatMessage,
    session: validateSessionCreation,
  },
  research: {
    paper: validateResearchPaper,
    search: validatePaperSearch,
  },
  user: {
    profile: validateProfileUpdate,
    secure: validateSecureOperation,
  },
  analytics: {
    query: validateAnalyticsQuery,
  },
  params: {
    mongoId: validateMongoId,
  },
  middleware: {
    handleErrors: handleValidationErrors,
    apiUsage: validateApiUsage,
    fileUpload: validateFileUpload,
  },
}