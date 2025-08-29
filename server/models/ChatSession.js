import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      tokens: Number,
      model: String,
      responseTime: Number, // in milliseconds
      confidence: Number,
      sources: [
        {
          type: { type: String, enum: ['paper', 'database', 'external'] },
          id: String,
          title: String,
          relevanceScore: Number,
        },
      ],
      factCheck: {
        verified: Boolean,
        flags: [String],
        verificationSources: [String],
      },
    },
    // For system messages and validation
    validation: {
      flagged: { type: Boolean, default: false },
      flagReason: String,
      reviewed: { type: Boolean, default: false },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
    },
  },
  { _id: true },
)

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Session context
    context: {
      type: {
        type: String,
        enum: ['research', 'general', 'paper_analysis', 'clinical_trial'],
        default: 'general',
      },
      researchPaper: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchPaper' },
      clinicalTrial: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicalTrial' },
      specialization: String,
      userIntent: String,
    },

    // Messages in the conversation
    messages: [messageSchema],

    // Session metadata
    status: {
      type: String,
      enum: ['active', 'completed', 'archived', 'flagged'],
      default: 'active',
    },
    title: {
      type: String,
      default: 'New Chat Session',
    },
    summary: String,

    // Performance metrics
    metrics: {
      totalMessages: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      averageResponseTime: { type: Number, default: 0 },
      userSatisfaction: { type: Number, min: 1, max: 5 },
      duration: Number, // in seconds
      lastActivity: { type: Date, default: Date.now },
    },

    // AI configuration used
    aiConfig: {
      model: { type: String, default: 'gpt-4' },
      temperature: { type: Number, default: 0.7 },
      maxTokens: { type: Number, default: 1000 },
      systemPrompt: String,
      validationEnabled: { type: Boolean, default: true },
      citationsEnabled: { type: Boolean, default: true },
    },

    // Quality and safety
    quality: {
      coherenceScore: Number,
      relevanceScore: Number,
      accuracyScore: Number,
      safetyScore: Number,
      flagged: { type: Boolean, default: false },
      flagReasons: [String],
      reviewRequired: { type: Boolean, default: false },
    },

    // Research insights generated
    insights: [
      {
        type: { type: String, enum: ['summary', 'contradiction', 'gap', 'recommendation'] },
        content: String,
        confidence: Number,
        sources: [String],
        generatedAt: { type: Date, default: Date.now },
      },
    ],

    // Session settings
    settings: {
      autoSave: { type: Boolean, default: true },
      shareEnabled: { type: Boolean, default: false },
      exportEnabled: { type: Boolean, default: true },
      realTimeProcessing: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for performance
chatSessionSchema.index({ userId: 1, createdAt: -1 })
// sessionId already indexed/unique in schema definition
chatSessionSchema.index({ 'context.type': 1 })
chatSessionSchema.index({ status: 1 })
chatSessionSchema.index({ 'metrics.lastActivity': -1 })
chatSessionSchema.index({ 'quality.flagged': 1 })

// Virtual for session duration
chatSessionSchema.virtual('sessionDuration').get(function () {
  if (this.messages.length < 2) return 0
  const firstMessage = this.messages[0]
  const lastMessage = this.messages[this.messages.length - 1]
  return (lastMessage.timestamp - firstMessage.timestamp) / 1000 // in seconds
})

// Virtual for message count
chatSessionSchema.virtual('messageCount').get(function () {
  return this.messages.length
})

// Virtual for user messages count
chatSessionSchema.virtual('userMessageCount').get(function () {
  return this.messages.filter((msg) => msg.type === 'user').length
})

// Method to add message
chatSessionSchema.methods.addMessage = function (type, content, metadata = {}) {
  const message = {
    type,
    content,
    metadata,
    timestamp: new Date(),
  }

  this.messages.push(message)
  this.metrics.totalMessages = this.messages.length
  this.metrics.lastActivity = new Date()

  if (metadata.tokens) {
    this.metrics.totalTokens += metadata.tokens
  }

  // Auto-generate title if first user message
  if (type === 'user' && this.userMessageCount === 1) {
    this.title = content.substring(0, 50) + (content.length > 50 ? '...' : '')
  }

  return this.save()
}

// Method to update quality scores
chatSessionSchema.methods.updateQuality = function (scores) {
  this.quality = { ...this.quality, ...scores }

  // Flag if any score is below threshold
  const threshold = 0.6
  if (scores.accuracyScore < threshold || scores.safetyScore < threshold) {
    this.quality.flagged = true
    this.quality.reviewRequired = true
  }

  return this.save()
}

// Method to generate summary
chatSessionSchema.methods.generateSummary = function () {
  if (this.messages.length === 0) return ''

  const userMessages = this.messages.filter((msg) => msg.type === 'user')
  const topics = userMessages.map((msg) => msg.content.substring(0, 100)).join(' ')

  this.summary = `Discussion about: ${topics.substring(0, 200)}...`
  return this.save()
}

// Static method to find active sessions for user
chatSessionSchema.statics.findActiveSessions = function (userId) {
  return this.find({
    userId,
    status: 'active',
    'metrics.lastActivity': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
  }).sort({ 'metrics.lastActivity': -1 })
}

// Static method to get user analytics
chatSessionSchema.statics.getUserAnalytics = function (userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalMessages: { $sum: '$metrics.totalMessages' },
        totalTokens: { $sum: '$metrics.totalTokens' },
        avgResponseTime: { $avg: '$metrics.averageResponseTime' },
        avgSatisfaction: { $avg: '$metrics.userSatisfaction' },
      },
    },
  ])
}

export default mongoose.model('ChatSession', chatSessionSchema)
