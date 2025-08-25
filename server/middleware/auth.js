import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import logger from '../utils/logger.js'

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      logger.securityEvent('MISSING_TOKEN', { ip: req.ip, path: req.path })
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      logger.securityEvent('INVALID_USER', {
        userId: decoded.id,
        ip: req.ip,
        path: req.path,
      })
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
      })
    }

    if (!user.isActive) {
      logger.securityEvent('INACTIVE_USER_ACCESS', {
        userId: user._id,
        ip: req.ip,
        path: req.path,
      })
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.',
      })
    }

    // Update last activity
    user.lastActivity = new Date()
    await user.save()

    req.user = user
    next()
  } catch (error) {
    logger.securityEvent('AUTH_ERROR', {
      error: error.message,
      ip: req.ip,
      path: req.path,
    })

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.',
      })
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error.',
    })
  }
}

// Admin role middleware
export const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      logger.securityEvent('UNAUTHORIZED_ADMIN_ACCESS', {
        userId: req.user._id,
        ip: req.ip,
        path: req.path,
      })
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      })
    }
    next()
  } catch (error) {
    logger.error('Admin auth error:', error)
    res.status(500).json({
      success: false,
      message: 'Authorization error.',
    })
  }
}

// Premium user middleware
export const premiumAuth = async (req, res, next) => {
  try {
    if (!['premium', 'admin'].includes(req.user.subscription)) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required for this feature.',
      })
    }
    next()
  } catch (error) {
    logger.error('Premium auth error:', error)
    res.status(500).json({
      success: false,
      message: 'Authorization error.',
    })
  }
}

export default authMiddleware
