import express from 'express'
import rateLimit from 'express-rate-limit'
import Subscription from '../models/Subscription.js'
import { sendWelcomeEmail, sendResearchUpdateEmail } from '../utils/emailService.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Rate limiting for subscription endpoints
const subscriptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 subscription requests per windowMs
  message: 'Too many subscription attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Subscribe to research updates
router.post('/', subscriptionLimiter, async (req, res) => {
  try {
    const { email, researchAreas, subscriptionType } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      })
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ email })
    
    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.researchAreas = researchAreas || existingSubscription.researchAreas
      existingSubscription.subscriptionType = subscriptionType || existingSubscription.subscriptionType
      existingSubscription.isActive = true
      existingSubscription.metadata = {
        ...existingSubscription.metadata,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        source: 'research_results'
      }
      
      await existingSubscription.save()
      
      logger.info(`Subscription updated for email: ${email}`)
      
      return res.status(200).json({
        success: true,
        message: 'Subscription updated successfully',
        subscription: {
          email: existingSubscription.email,
          researchAreas: existingSubscription.researchAreas,
          frequency: existingSubscription.frequency
        }
      })
    }

    // Create new subscription
    const newSubscription = new Subscription({
      email,
      researchAreas: researchAreas || ['general'],
      subscriptionType: subscriptionType || 'research_updates',
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        source: 'research_results'
      }
    })

    await newSubscription.save()

    // Send welcome email
    try {
      await sendWelcomeEmail(email, {
        researchAreas: newSubscription.researchAreas,
        frequency: newSubscription.frequency,
        unsubscribeToken: newSubscription.unsubscribeToken
      })
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError)
      // Continue - don't fail the subscription if email fails
    }

    logger.info(`New subscription created for email: ${email}`)

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to research updates',
      subscription: {
        email: newSubscription.email,
        researchAreas: newSubscription.researchAreas,
        frequency: newSubscription.frequency
      }
    })

  } catch (error) {
    logger.error('Subscription creation error:', error)
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already subscribed'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    })
  }
})

// Unsubscribe endpoint
router.get('/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params

    const subscription = await Subscription.findOne({ 
      unsubscribeToken: token,
      isActive: true 
    })

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Invalid unsubscribe link'
      })
    }

    await subscription.unsubscribe()

    logger.info(`User unsubscribed: ${subscription.email}`)

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from research updates'
    })

  } catch (error) {
    logger.error('Unsubscribe error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe'
    })
  }
})

// Update subscription preferences
router.put('/preferences/:email', async (req, res) => {
  try {
    const { email } = req.params
    const { researchAreas, frequency, subscriptionType } = req.body

    const subscription = await Subscription.findOne({ email, isActive: true })

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      })
    }

    // Update preferences
    if (researchAreas) subscription.researchAreas = researchAreas
    if (frequency) subscription.frequency = frequency
    if (subscriptionType) subscription.subscriptionType = subscriptionType

    await subscription.save()

    logger.info(`Subscription preferences updated for: ${email}`)

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      subscription: {
        email: subscription.email,
        researchAreas: subscription.researchAreas,
        frequency: subscription.frequency,
        subscriptionType: subscription.subscriptionType
      }
    })

  } catch (error) {
    logger.error('Preference update error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    })
  }
})

// Get subscription statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    const totalSubscriptions = await Subscription.countDocuments({ isActive: true })
    const subscriptionsByArea = await Subscription.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$researchAreas' },
      { $group: { _id: '$researchAreas', count: { $sum: 1 } } }
    ])
    const subscriptionsByFrequency = await Subscription.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$frequency', count: { $sum: 1 } } }
    ])

    res.status(200).json({
      success: true,
      stats: {
        total: totalSubscriptions,
        byArea: subscriptionsByArea,
        byFrequency: subscriptionsByFrequency
      }
    })

  } catch (error) {
    logger.error('Subscription stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription statistics'
    })
  }
})

// Send manual research update (admin only)
router.post('/send-update', async (req, res) => {
  try {
    const { researchArea, frequency, content } = req.body

    if (!content || !content.subject || !content.body) {
      return res.status(400).json({
        success: false,
        message: 'Subject and body content are required'
      })
    }

    // Get subscribers for this update
    const subscribers = await Subscription.getSubscribersForUpdate(frequency)
    const filteredSubscribers = researchArea
      ? subscribers.filter(sub => sub.researchAreas.includes(researchArea))
      : subscribers

    let emailsSent = 0
    let emailsFailed = 0

    for (const subscriber of filteredSubscribers) {
      try {
        await sendResearchUpdateEmail(subscriber.email, {
          subject: content.subject,
          body: content.body,
          researchArea: researchArea,
          unsubscribeToken: subscriber.unsubscribeToken
        })
        
        await subscriber.updateLastSent()
        emailsSent++
      } catch (emailError) {
        logger.error(`Failed to send email to ${subscriber.email}:`, emailError)
        emailsFailed++
      }
    }

    logger.info(`Research update sent: ${emailsSent} successful, ${emailsFailed} failed`)

    res.status(200).json({
      success: true,
      message: 'Research update sent',
      stats: {
        emailsSent,
        emailsFailed,
        totalSubscribers: filteredSubscribers.length
      }
    })

  } catch (error) {
    logger.error('Send update error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send research update'
    })
  }
})

export default router