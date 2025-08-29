// Load environment variables first
import dotenv from 'dotenv'
dotenv.config()

// Environment variables loaded successfully

import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Import custom modules
import connectDB, { dbConnected } from './config/database.js'
import logger from './utils/logger.js'
import errorHandler from './middleware/errorHandler.js'
import authMiddleware from './middleware/auth.js'

// Import routes
import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'
import enhancedChatRoutes from './routes/enhanced-chat.js'
import researchRoutes from './routes/research.js'
import analyticsRoutes from './routes/analytics.js'
import userRoutes from './routes/user.js'
import subscriptionRoutes from './routes/subscriptions.js'
import knowledgeGraphRoutes from './routes/knowledge-graph.js'
import patentRoutes from './routes/patents.js'
import competitiveIntelligenceRoutes from './routes/competitive-intelligence.js'
import investmentResearchRoutes from './routes/investment-research.js'
import researchInsightsRoutes from './routes/research-insights.js'
import dataManagementRoutes from './routes/data-management.js'
import rssFeedRoutes from './routes/rss-feeds.js'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    // Reflect request origin (safest for single-origin deployments)
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

const PORT = process.env.PORT || 3001
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0' // Allow network access

// Connect to MongoDB
connectDB()

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", 'https://api.openai.com'],
      },
    },
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 chat requests per minute
  message: 'Too many chat requests, please slow down.',
})

app.use(limiter)
app.use('/api/chat', chatLimiter)

// Body parsing & security middleware
app.use(compression())
app.use(
  cors({
    // Reflect request origin so same-origin deployments work without hardcoding
    origin: true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(mongoSanitize())

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`)
  next()
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dbConnected,
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes) // Basic chat - temporarily removed auth for testing
app.use('/api/chat', enhancedChatRoutes) // Enhanced multi-agent chat with LangChain + CrewAI
app.use('/api/research', authMiddleware, researchRoutes)
app.use('/api/analytics', authMiddleware, analyticsRoutes)
app.use('/api/user', authMiddleware, userRoutes)
app.use('/api/subscriptions', subscriptionRoutes) // Email subscription routes
app.use('/api/knowledge-graph', knowledgeGraphRoutes) // Knowledge graph construction and querying
app.use('/api/patents', patentRoutes) // Patent cliff monitoring and USPTO integration
app.use('/api/competitive-intelligence', competitiveIntelligenceRoutes) // Competitive intelligence automation
app.use('/api/investment-research', investmentResearchRoutes) // Investment research analytics engine
app.use('/api/research-insights', researchInsightsRoutes) // Comprehensive research insights and analysis
app.use('/api/data-management', dataManagementRoutes) // Data source management and knowledge graph operations
app.use('/api/rss-feeds', rssFeedRoutes)

// Serve frontend (single-URL deployment)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistPath = path.resolve(__dirname, '../dist')

// Static assets
app.use(express.static(frontendDistPath))

// SPA fallback for non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'))
})

// Socket.io for real-time chat
io.use((socket, next) => {
  // Add socket authentication middleware here
  next()
})

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`)

  socket.on('join-room', (roomId) => {
    socket.join(roomId)
    logger.info(`Socket ${socket.id} joined room ${roomId}`)
  })

  socket.on('chat-message', async (data) => {
    try {
      // Handle real-time chat messages
      const { roomId, message, userId } = data

      // Emit to room members
      socket.to(roomId).emit('new-message', {
        message,
        userId,
        timestamp: new Date().toISOString(),
      })

      // Log chat activity
      logger.info(`Chat message in room ${roomId} from user ${userId}`)
    } catch (error) {
      logger.error('Socket chat error:', error)
      socket.emit('error', 'Failed to process message')
    }
  })

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`)
  })
})

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})

server.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running on ${HOST}:${PORT}`)
  logger.info(`📱 Health check: http://localhost:${PORT}/health`)
  logger.info(`📱 Network access: http://192.168.0.96:${PORT}/health`)
})

export default app
