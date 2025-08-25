import logger from '../utils/logger.js'

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error(`Error ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id,
    timestamp: new Date().toISOString(),
  })

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ')
    error = { message, statusCode: 400 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, statusCode: 401 }
  }

  // OpenAI API errors
  if (err.response?.status === 429) {
    const message = 'AI service rate limit exceeded. Please try again later.'
    error = { message, statusCode: 429 }
  }

  if (err.response?.status === 401 && err.response?.data?.error?.type === 'invalid_api_key') {
    const message = 'AI service configuration error'
    error = { message, statusCode: 500 }
    logger.error('OpenAI API key error', { error: err.response.data })
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    const message = 'Too many requests. Please slow down.'
    error = { message, statusCode: 429 }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      errorId: generateErrorId(),
    }),
  })
}

// Generate unique error ID for tracking
const generateErrorId = () => {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export default errorHandler
