import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  researchAreas: [{
    type: String,
    enum: ['cardiology', 'oncology', 'neurology', 'diabetes', 'general']
  }],
  subscriptionType: {
    type: String,
    enum: ['research_updates', 'clinical_trials', 'all'],
    default: 'research_updates'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'weekly'
  },
  lastSentAt: {
    type: Date,
    default: null
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribeToken: {
    type: String,
    default: () => require('crypto').randomBytes(32).toString('hex')
  },
  metadata: {
    source: {
      type: String,
      default: 'research_results'
    },
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true
})

// Indexes for performance
subscriptionSchema.index({ email: 1 })
subscriptionSchema.index({ isActive: 1, frequency: 1 })
subscriptionSchema.index({ researchAreas: 1 })
subscriptionSchema.index({ lastSentAt: 1 })

// Methods
subscriptionSchema.methods.unsubscribe = function() {
  this.isActive = false
  return this.save()
}

subscriptionSchema.methods.updateLastSent = function() {
  this.lastSentAt = new Date()
  return this.save()
}

// Static methods
subscriptionSchema.statics.getActiveSubscribers = function(frequency = 'weekly', researchArea = null) {
  const query = { isActive: true, frequency: frequency }
  if (researchArea) {
    query.researchAreas = { $in: [researchArea] }
  }
  return this.find(query)
}

subscriptionSchema.statics.getSubscribersForUpdate = function(frequency = 'weekly') {
  const cutoffTime = new Date()
  
  // Calculate cutoff based on frequency
  switch (frequency) {
    case 'daily':
      cutoffTime.setDate(cutoffTime.getDate() - 1)
      break
    case 'weekly':
      cutoffTime.setDate(cutoffTime.getDate() - 7)
      break
    case 'monthly':
      cutoffTime.setMonth(cutoffTime.getMonth() - 1)
      break
  }

  return this.find({
    isActive: true,
    frequency: frequency,
    $or: [
      { lastSentAt: null },
      { lastSentAt: { $lt: cutoffTime } }
    ]
  })
}

const Subscription = mongoose.model('Subscription', subscriptionSchema)

export default Subscription