// Load environment variables first
import dotenv from 'dotenv'
dotenv.config()

// Environment variables loaded successfully

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Import custom modules
import connectDB from './config/database.js'
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

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

const PORT = process.env.PORT || 3001

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
    origin: 'http://localhost:3000',
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
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes) // Basic chat - temporarily removed auth for testing
app.use('/api/chat', enhancedChatRoutes) // Enhanced multi-agent chat with LangChain + CrewAI
app.use('/api/research', authMiddleware, researchRoutes)
app.use('/api/analytics', authMiddleware, analyticsRoutes)
app.use('/api/user', authMiddleware, userRoutes)

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

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`)
  logger.info(`📱 Health check: http://localhost:${PORT}/health`)
})


import cron from 'node-cron';
import User from './models/User.js';
import { fetchNewRecommendations } from './utils/recommender.js';
import { sendRecommendationEmail } from './utils/email.js';

cron.schedule('0 9 * * 1', async () => {  // Every Monday at 9 AM
  const users = await User.find({ subscribedToEmails: true });
  for (const user of users) {
    const recommendations = await fetchNewRecommendations(user);
    if (recommendations.length > 0) {
      await sendRecommendationEmail(user.email, 'New Research Recommendations', recommendations);
    } else {
      // Optional: Send "No new updates" or skip to save resources
    }
  }
}, {
  timezone: 'UTC',
});

export default app
