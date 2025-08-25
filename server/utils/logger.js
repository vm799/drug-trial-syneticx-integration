import winston from 'winston'
import path from 'path'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

// Add colors to winston
winston.addColors(colors)

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
)

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: format,
  }),

  // File transport for errors
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  }),

  // Separate file for chat interactions (for audit purposes)
  new winston.transports.File({
    filename: path.join('logs', 'chat-audit.log'),
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  }),
]

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false,
})

// Additional methods for specific logging scenarios
logger.chatAudit = (userId, action, data) => {
  logger.info('CHAT_AUDIT', {
    userId,
    action,
    data: JSON.stringify(data),
    timestamp: new Date().toISOString(),
    type: 'chat_audit',
  })
}

logger.securityEvent = (event, details) => {
  logger.warn('SECURITY_EVENT', {
    event,
    details: JSON.stringify(details),
    timestamp: new Date().toISOString(),
    type: 'security',
  })
}

logger.apiUsage = (userId, endpoint, duration, tokens) => {
  logger.info('API_USAGE', {
    userId,
    endpoint,
    duration,
    tokens,
    timestamp: new Date().toISOString(),
    type: 'usage',
  })
}

export default logger
