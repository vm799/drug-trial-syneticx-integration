import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      interests: [{ type: String }],  // e.g., ['neuromodulation', 'biotech']
  subscribedToEmails: { 
    type: Boolean, 
    default: true 
  },
  lastRecommendationDate: { 
    type: Date 
  },
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    role: {
      type: String,
      enum: ['user', 'researcher', 'admin'],
      default: 'user',
    },
    subscription: {
      type: String,
      enum: ['free', 'premium', 'enterprise'],
      default: 'free',
    },
    organization: {
      type: String,
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    specialization: {
      type: [String],
      enum: [
        'oncology',
        'cardiology',
        'neurology',
        'infectious_diseases',
        'immunology',
        'pharmacology',
        'clinical_trials',
        'epidemiology',
        'biostatistics',
        'other',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    apiUsage: {
      daily: {
        requests: { type: Number, default: 0 },
        tokens: { type: Number, default: 0 },
        date: { type: Date, default: Date.now },
      },
      monthly: {
        requests: { type: Number, default: 0 },
        tokens: { type: Number, default: 0 },
        month: { type: Number, default: new Date().getMonth() },
        year: { type: Number, default: new Date().getFullYear() },
      },
    },
    preferences: {
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
      notifications: {
        email: { type: Boolean, default: true },
        research_updates: { type: Boolean, default: true },
        system_alerts: { type: Boolean, default: true },
      },
      ai_settings: {
        response_length: {
          type: String,
          enum: ['concise', 'detailed', 'comprehensive'],
          default: 'detailed',
        },
        include_citations: { type: Boolean, default: true },
        confidence_threshold: { type: Number, min: 0.5, max: 1.0, default: 0.8 },
      },
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      loginAttempts: { type: Number, default: 0 },
      lockUntil: Date,
      lastPasswordChange: { type: Date, default: Date.now },
      activeSessions: [
        {
          sessionId: String,
          createdAt: { type: Date, default: Date.now },
          ipAddress: String,
          userAgent: String,
          lastAccessed: { type: Date, default: Date.now },
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for performance
userSchema.index({ email: 1 })
userSchema.index({ lastActivity: 1 })
userSchema.index({ 'apiUsage.daily.date': 1 })
userSchema.index({ organization: 1 })

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`
})

// Virtual for account locked status
userSchema.virtual('isLocked').get(function () {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now())
})

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw error
  }
}

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 },
    })
  }

  const updates = { $inc: { 'security.loginAttempts': 1 } }

  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 } // 2 hours
  }

  return this.updateOne(updates)
}

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { 'security.loginAttempts': 1, 'security.lockUntil': 1 },
  })
}

// Method to update API usage
userSchema.methods.updateApiUsage = function (tokens = 1) {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Reset daily counter if it's a new day
  if (this.apiUsage.daily.date.toDateString() !== today.toDateString()) {
    this.apiUsage.daily = {
      requests: 1,
      tokens: tokens,
      date: today,
    }
  } else {
    this.apiUsage.daily.requests += 1
    this.apiUsage.daily.tokens += tokens
  }

  // Reset monthly counter if it's a new month
  if (this.apiUsage.monthly.month !== currentMonth || this.apiUsage.monthly.year !== currentYear) {
    this.apiUsage.monthly = {
      requests: 1,
      tokens: tokens,
      month: currentMonth,
      year: currentYear,
    }
  } else {
    this.apiUsage.monthly.requests += 1
    this.apiUsage.monthly.tokens += tokens
  }

  return this.save()
}

export default mongoose.model('User', userSchema)
