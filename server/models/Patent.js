// server/models/Patent.js
import mongoose from 'mongoose';

/**
 * Patent Model - Comprehensive patent data for pharmaceutical intelligence
 * Supports patent cliff analysis, competitive intelligence, and market opportunity identification
 */
const PatentSchema = new mongoose.Schema({
  // Basic Patent Information
  patentNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    uppercase: true
  },
  
  title: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  
  abstract: {
    type: String,
    trim: true
  },
  
  // Patent Dates
  filingDate: {
    type: Date,
    required: true,
    index: true
  },
  
  grantDate: {
    type: Date,
    index: true
  },
  
  expiryDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Patent Classification
  patentType: {
    type: String,
    enum: [
      'composition',      // Active ingredient composition
      'method',          // Method of treatment
      'formulation',     // Drug formulation
      'manufacturing',   // Manufacturing process
      'combination',     // Combination therapy
      'delivery',        // Drug delivery system
      'crystalline',     // Crystal form
      'salt',           // Salt form
      'other'
    ],
    required: true,
    index: true
  },
  
  patentFamily: {
    parentApplication: String,
    continuations: [String],
    divisionals: [String],
    continuationsInPart: [String],
    internationalFilings: [String]
  },
  
  // Ownership Information
  assignee: {
    name: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['company', 'individual', 'university', 'government', 'other'],
      default: 'company'
    },
    country: String,
    parent_company: String
  },
  
  inventors: [{
    name: {
      type: String,
      required: true
    },
    location: String,
    affiliation: String
  }],
  
  // Drug/Product Association
  drugInfo: {
    drugName: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    genericName: String,
    brandNames: [String],
    therapeuticArea: {
      type: String,
      enum: [
        'cardiovascular',
        'oncology', 
        'neurology',
        'diabetes',
        'respiratory',
        'immunology',
        'infectious_disease',
        'gastroenterology',
        'dermatology',
        'ophthalmology',
        'psychiatry',
        'rheumatology',
        'other'
      ],
      index: true
    },
    indication: [String],
    dosageForm: String,
    strength: String
  },
  
  // Patent Claims Analysis
  claims: {
    independent: [{
      claimNumber: Number,
      claimText: String,
      scope: {
        type: String,
        enum: ['broad', 'medium', 'narrow'],
        default: 'medium'
      }
    }],
    dependent: [{
      claimNumber: Number,
      claimText: String,
      dependsOn: [Number]
    }],
    totalClaims: {
      type: Number,
      default: 0
    }
  },
  
  // Market & Financial Impact
  marketImpact: {
    estimatedRevenue: {
      type: Number,
      default: 0,
      index: true
    },
    marketShare: {
      type: Number,
      min: 0,
      max: 100
    },
    revenueSource: {
      type: String,
      enum: ['actual', 'estimated', 'industry_report', 'ai_prediction']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Strategic Importance Assessment
  strategicValue: {
    importance: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      index: true
    },
    blockingPotential: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    designAroundDifficulty: {
      type: String,
      enum: ['very_difficult', 'difficult', 'moderate', 'easy'],
      default: 'moderate'
    },
    competitiveThreat: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium'
    }
  },
  
  // Patent Status
  status: {
    legal: {
      type: String,
      enum: ['pending', 'granted', 'expired', 'abandoned', 'invalidated', 'under_reexamination'],
      default: 'granted',
      index: true
    },
    enforcement: {
      litigationHistory: [{
        case: String,
        opponent: String,
        outcome: String,
        date: Date
      }],
      licensingDeals: [{
        licensee: String,
        terms: String,
        date: Date,
        value: Number
      }]
    },
    maintenance: {
      feesPaid: Boolean,
      nextFeeDate: Date,
      feesOwed: Number
    }
  },
  
  // Patent Cliff Analysis
  cliffAnalysis: {
    yearsToExpiry: {
      type: Number,
      index: true
    },
    cliffRisk: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      index: true
    },
    genericThreat: {
      level: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium'
      },
      potentialEntrants: [String],
      timeToEntry: String,
      regulatoryBarriers: [String]
    },
    exclusivityOverlap: {
      hasExclusivity: Boolean,
      exclusivityType: [String],
      exclusivityExpiry: Date
    },
    lastAnalyzed: {
      type: Date,
      default: Date.now
    }
  },
  
  // Competitive Intelligence
  competitive: {
    competitorPatents: [{
      patentNumber: String,
      assignee: String,
      relation: {
        type: String,
        enum: ['blocking', 'circumventing', 'complementary', 'competing']
      },
      threatLevel: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low']
      }
    }],
    whiteSpace: [String], // Areas not covered by patents
    designAround: [String], // Potential design-around strategies
    defensiveOpportunities: [String]
  },
  
  // AI Analysis Results
  aiAnalysis: {
    summaryGenerated: {
      type: Boolean,
      default: false
    },
    summary: String,
    keyInsights: [String],
    recommendations: [String],
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    lastAnalyzed: {
      type: Date,
      default: Date.now
    },
    analysisVersion: {
      type: String,
      default: '1.0'
    }
  },
  
  // Data Sources and Validation
  dataSources: {
    uspto: {
      verified: Boolean,
      lastSync: Date,
      dataQuality: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      }
    },
    thirdParty: [{
      source: String,
      verified: Boolean,
      lastSync: Date
    }],
    manual: {
      verified: Boolean,
      verifiedBy: String,
      verifiedDate: Date
    }
  },
  
  // Tracking and Analytics
  tracking: {
    views: {
      type: Number,
      default: 0
    },
    analyses: {
      type: Number,
      default: 0
    },
    bookmarked: {
      type: Number,
      default: 0
    },
    lastViewed: Date,
    alertsSet: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      alertType: {
        type: String,
        enum: ['expiry_warning', 'status_change', 'competitive_threat']
      },
      threshold: String
    }]
  }
}, {
  timestamps: true,
  
  // Indexes for performance
  index: [
    { 'drugInfo.drugName': 1, 'expiryDate': 1 },
    { 'assignee.name': 1, 'drugInfo.therapeuticArea': 1 },
    { 'cliffAnalysis.cliffRisk': 1, 'cliffAnalysis.yearsToExpiry': 1 },
    { 'strategicValue.importance': 1, 'marketImpact.estimatedRevenue': -1 },
    { 'status.legal': 1, 'patentType': 1 }
  ]
});

// Virtual fields
PatentSchema.virtual('isExpiring').get(function() {
  const now = new Date();
  const threeYears = new Date();
  threeYears.setFullYear(now.getFullYear() + 3);
  return this.expiryDate <= threeYears;
});

PatentSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

PatentSchema.virtual('daysToExpiry').get(function() {
  const now = new Date();
  const diffTime = this.expiryDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

PatentSchema.virtual('patentAge').get(function() {
  const now = new Date();
  const diffTime = now - this.filingDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
});

// Methods
PatentSchema.methods.calculateCliffRisk = function() {
  const yearsToExpiry = (this.expiryDate - new Date()) / (1000 * 60 * 60 * 24 * 365);
  
  if (yearsToExpiry < 0) return 'expired';
  if (yearsToExpiry < 2 && this.strategicValue.importance === 'critical') return 'critical';
  if (yearsToExpiry < 3 && ['critical', 'high'].includes(this.strategicValue.importance)) return 'high';
  if (yearsToExpiry < 5) return 'medium';
  return 'low';
};

PatentSchema.methods.updateCliffAnalysis = function() {
  const yearsToExpiry = (this.expiryDate - new Date()) / (1000 * 60 * 60 * 24 * 365);
  this.cliffAnalysis.yearsToExpiry = Math.max(0, Math.round(yearsToExpiry * 10) / 10);
  this.cliffAnalysis.cliffRisk = this.calculateCliffRisk();
  this.cliffAnalysis.lastAnalyzed = new Date();
};

PatentSchema.methods.generateSummary = function() {
  return `${this.patentType} patent for ${this.drugInfo.drugName} (${this.patentNumber}) owned by ${this.assignee.name}, expires ${this.expiryDate.toDateString()}`;
};

PatentSchema.methods.assessMarketImpact = function() {
  const yearsToExpiry = this.cliffAnalysis.yearsToExpiry || 0;
  const importance = this.strategicValue.importance;
  const revenue = this.marketImpact.estimatedRevenue || 0;
  
  let impact = 'low';
  if (yearsToExpiry < 3 && importance === 'critical' && revenue > 500000000) impact = 'critical';
  else if (yearsToExpiry < 5 && ['critical', 'high'].includes(importance) && revenue > 100000000) impact = 'high';
  else if (revenue > 50000000) impact = 'medium';
  
  return impact;
};

// Pre-save middleware
PatentSchema.pre('save', function(next) {
  // Update cliff analysis automatically
  this.updateCliffAnalysis();
  
  // Ensure patent number is uppercase
  if (this.patentNumber) {
    this.patentNumber = this.patentNumber.toUpperCase();
  }
  
  next();
});

// Static methods
PatentSchema.statics.findExpiringPatents = function(months = 24) {
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + months);
  
  return this.find({
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate
    },
    'status.legal': 'granted'
  }).sort({ expiryDate: 1 });
};

PatentSchema.statics.findByDrug = function(drugName) {
  return this.find({
    'drugInfo.drugName': new RegExp(drugName, 'i')
  }).sort({ 'strategicValue.importance': -1, expiryDate: 1 });
};

PatentSchema.statics.findByCompany = function(companyName) {
  return this.find({
    'assignee.name': new RegExp(companyName, 'i')
  }).sort({ expiryDate: 1 });
};

PatentSchema.statics.findHighRiskCliffs = function() {
  return this.find({
    'cliffAnalysis.cliffRisk': { $in: ['critical', 'high'] },
    'status.legal': 'granted'
  }).sort({ 'cliffAnalysis.yearsToExpiry': 1 });
};

PatentSchema.statics.getPatentStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalPatents: { $sum: 1 },
        expiringIn2Years: {
          $sum: {
            $cond: [
              { $lte: ['$cliffAnalysis.yearsToExpiry', 2] },
              1,
              0
            ]
          }
        },
        criticalPatents: {
          $sum: {
            $cond: [
              { $eq: ['$strategicValue.importance', 'critical'] },
              1,
              0
            ]
          }
        },
        totalMarketValue: { $sum: '$marketImpact.estimatedRevenue' }
      }
    }
  ]);
  
  return stats[0] || {
    totalPatents: 0,
    expiringIn2Years: 0,
    criticalPatents: 0,
    totalMarketValue: 0
  };
};

const Patent = mongoose.model('Patent', PatentSchema);

export default Patent;