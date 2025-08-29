import mongoose from 'mongoose'
import logger from '../utils/logger.js'

// Export a lightweight connection status so the server can run in degraded mode
export let dbConnected = false

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI
    
    if (!mongoURI) {
      logger.warn('No MONGODB_URI provided - running in demo mode without database')
      dbConnected = false
      return
    }

    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    })

    logger.info(`🔗 MongoDB Connected: ${conn.connection.host}`)
    dbConnected = true

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err)
      dbConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected')
      dbConnected = false
    })

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected')
      dbConnected = true
    })
  } catch (err) {
    logger.error('Database connection failed (continuing in demo mode):', err?.message || err)
    dbConnected = false
  }
}

export default connectDB
