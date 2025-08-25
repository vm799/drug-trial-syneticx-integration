import express from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import logger from '../utils/logger.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  })
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('organization').optional().trim(),
    body('specialization').optional().isArray(),
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

      const { email, password, firstName, lastName, organization, specialization } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        logger.securityEvent('DUPLICATE_REGISTRATION', { email, ip: req.ip })
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        })
      }

      // Create new user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        organization,
        specialization: specialization || [],
      })

      await user.save()

      // Generate token
      const token = generateToken(user._id)

      // Log successful registration
      logger.info('User registered successfully', {
        userId: user._id,
        email: user.email,
        organization: user.organization,
        ip: req.ip,
      })

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            subscription: user.subscription,
            organization: user.organization,
            specialization: user.specialization,
          },
        },
      })
    } catch (error) {
      logger.error('Registration error:', error)
      res.status(500).json({
        success: false,
        message: 'Registration failed',
      })
    }
  },
)

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
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

      const { email, password } = req.body

      // Find user and include password for comparison
      const user = await User.findOne({ email }).select('+password')
      if (!user) {
        logger.securityEvent('LOGIN_ATTEMPT_INVALID_EMAIL', { email, ip: req.ip })
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        })
      }

      // Check if account is locked
      if (user.isLocked) {
        logger.securityEvent('LOGIN_ATTEMPT_LOCKED_ACCOUNT', {
          userId: user._id,
          email,
          ip: req.ip,
        })
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts',
        })
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incLoginAttempts()

        logger.securityEvent('LOGIN_ATTEMPT_INVALID_PASSWORD', {
          userId: user._id,
          email,
          ip: req.ip,
          attempts: user.security.loginAttempts + 1,
        })

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        })
      }

      // Check if account is active
      if (!user.isActive) {
        logger.securityEvent('LOGIN_ATTEMPT_INACTIVE_ACCOUNT', {
          userId: user._id,
          email,
          ip: req.ip,
        })
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
        })
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts()

      // Generate token
      const token = generateToken(user._id)

      // Create session record
      const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      user.security.activeSessions.push({
        sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        lastAccessed: new Date(),
      })

      // Limit active sessions (keep last 5)
      if (user.security.activeSessions.length > 5) {
        user.security.activeSessions = user.security.activeSessions.slice(-5)
      }

      await user.save()

      // Log successful login
      logger.info('User logged in successfully', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        sessionId,
      })

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          sessionId,
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            role: user.role,
            subscription: user.subscription,
            organization: user.organization,
            specialization: user.specialization,
            preferences: user.preferences,
            lastActivity: user.lastActivity,
          },
        },
      })
    } catch (error) {
      logger.error('Login error:', error)
      res.status(500).json({
        success: false,
        message: 'Login failed',
      })
    }
  },
)

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate session)
// @access  Private
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const sessionId = req.header('X-Session-ID')

    if (sessionId) {
      // Remove session from active sessions
      req.user.security.activeSessions = req.user.security.activeSessions.filter(
        (session) => session.sessionId !== sessionId,
      )
      await req.user.save()
    }

    logger.info('User logged out', {
      userId: req.user._id,
      sessionId,
      ip: req.ip,
    })

    res.json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          subscription: user.subscription,
          organization: user.organization,
          specialization: user.specialization,
          preferences: user.preferences,
          lastActivity: user.lastActivity,
          apiUsage: user.apiUsage,
          emailVerified: user.emailVerified,
        },
      },
    })
  } catch (error) {
    logger.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    })
  }
})

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    authMiddleware,
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('organization').optional().trim(),
    body('specialization').optional().isArray(),
    body('preferences').optional().isObject(),
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

      const updates = {}
      const allowedFields = [
        'firstName',
        'lastName',
        'organization',
        'specialization',
        'preferences',
      ]

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field]
        }
      })

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      })

      logger.info('User profile updated', {
        userId: user._id,
        updatedFields: Object.keys(updates),
        ip: req.ip,
      })

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            role: user.role,
            subscription: user.subscription,
            organization: user.organization,
            specialization: user.specialization,
            preferences: user.preferences,
          },
        },
      })
    } catch (error) {
      logger.error('Profile update error:', error)
      res.status(500).json({
        success: false,
        message: 'Profile update failed',
      })
    }
  },
)

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post(
  '/change-password',
  [
    authMiddleware,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
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

      const { currentPassword, newPassword } = req.body

      // Get user with password
      const user = await User.findById(req.user._id).select('+password')

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword)
      if (!isCurrentPasswordValid) {
        logger.securityEvent('PASSWORD_CHANGE_INVALID_CURRENT', {
          userId: user._id,
          ip: req.ip,
        })
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        })
      }

      // Update password
      user.password = newPassword
      user.security.lastPasswordChange = new Date()

      // Invalidate all sessions except current
      user.security.activeSessions = []

      await user.save()

      logger.info('Password changed successfully', {
        userId: user._id,
        ip: req.ip,
      })

      res.json({
        success: true,
        message: 'Password changed successfully',
      })
    } catch (error) {
      logger.error('Password change error:', error)
      res.status(500).json({
        success: false,
        message: 'Password change failed',
      })
    }
  },
)

export default router
