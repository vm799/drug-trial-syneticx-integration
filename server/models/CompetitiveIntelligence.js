// server/models/CompetitiveIntelligence.js
import mongoose from 'mongoose';

/**
 * Competitive Intelligence Model - Tracks competitor activities and market intelligence
 * Supports competitive analysis, threat assessment, and market opportunity identification
 */
const CompetitiveIntelligenceSchema = new mongoose.Schema({
  // Company Information
  company: {
    name: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    ticker: {
      type: String,
      index: true,
      uppercase: true,
      trim: true
    },
    sector: {
      type: String,
      enum: [
        'big_pharma',
        'biotech',
        'generic',
        'specialty_pharma',
        'biosimilar',
        'medical_device',
        'cro',
        'other'
      ],
      index: true
    },
    headquarters: {
      country: String,
      city: String,
      region: String
    },
    size: {
      type: String,
      enum: ['large', 'medium', 'small', 'startup'],
      index: true
    },
    publicStatus: {
      type: String,
      enum: ['public', 'private', 'subsidiary'],
      default: 'public'
    }
  },
  
  // Analysis Period
  analysisDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  analysisType: {
    type: String,
    enum: ['quarterly', 'annual', 'ad_hoc', 'triggered_by_event'],
    default: 'quarterly'
  },
  
  timeframe: {
    from: Date,
    to: Date,
    period: {
      type: String,
      enum: ['1_month', '3_months', '6_months', '12_months', '24_months'],
      default: '12_months'
    }
  },
  
  // Therapeutic Focus
  therapeuticAreas: [{
    area: {
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
        'rare_diseases',
        'vaccines',
        'other'
      ]
    },
    focus_level: {
      type: String,
      enum: ['primary', 'secondary', 'emerging'],
      default: 'primary'
    },
    market_share: Number,
    revenue_contribution: Number
  }],
  
  // Patent Portfolio Analysis
  patentPortfolio: {
    totalPatents: {
      type: Number,
      default: 0
    },
    patentsByType: {
      composition: Number,
      method: Number,
      formulation: Number,
      manufacturing: Number,
      combination: Number,
      delivery: Number,
      other: Number
    },
    expiringPatents: [{
      patentNumber: String,
      drugName: String,
      expiryDate: Date,
      estimatedImpact: Number,
      marketShare: Number,
      replacement_ready: Boolean
    }],
    newFilings: [{
      patentNumber: String,
      drugName: String,
      filingDate: Date,
      technology_area: String,
      strategic_significance: {
        type: String,
        enum: ['high', 'medium', 'low']
      }
    }],
    patentCliffRisk: {
      nearTerm: { // 0-2 years
        patents: Number,
        estimatedRevenue: Number,
        riskLevel: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low']
        }
      },
      mediumTerm: { // 2-5 years
        patents: Number,
        estimatedRevenue: Number,
        riskLevel: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low']
        }
      },
      longTerm: { // 5+ years
        patents: Number,
        estimatedRevenue: Number,
        riskLevel: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low']
        }
      }
    }
  },
  
  // Pipeline Analysis
  pipelineAnalysis: {
    totalPrograms: Number,
    programsByPhase: {
      discovery: Number,
      preclinical: Number,
      phase_1: Number,
      phase_2: Number,
      phase_3: Number,
      regulatory_review: Number,
      approved: Number
    },
    keyPrograms: [{
      programName: String,
      indication: String,
      phase: String,
      expectedLaunch: Date,
      peakSalesEstimate: Number,
      competitiveAdvantage: String,
      riskFactors: [String],
      developmentPartners: [String]
    }],
    recentMilestones: [{
      date: Date,
      milestone: String,
      program: String,
      impact: {
        type: String,
        enum: ['positive', 'negative', 'neutral']
      },
      market_reaction: String
    }],
    pipelineValue: {
      totalNPV: Number,
      riskAdjustedValue: Number,
      probability_of_success: Number,
      time_to_market: Number
    }
  },
  
  // Financial Intelligence
  financialMetrics: {
    revenue: {
      total: Number,
      rd_revenue: Number,
      pharma_revenue: Number,
      growth_rate: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    rd_spending: {
      total: Number,
      percentage_of_revenue: Number,
      focus_areas: [String],
      outsourced_percentage: Number
    },
    profitability: {
      gross_margin: Number,
      operating_margin: Number,
      net_margin: Number,
      ebitda: Number
    },
    market_cap: Number,
    enterprise_value: Number,
    debt_to_equity: Number,
    cash_position: Number
  },
  
  // Strategic Activities
  strategicActivities: {
    mergers_acquisitions: [{
      date: Date,
      target: String,
      deal_value: Number,
      rationale: String,
      therapeutic_areas: [String],
      integration_status: {
        type: String,
        enum: ['announced', 'pending', 'completed', 'terminated']
      }
    }],
    partnerships: [{
      date: Date,
      partner: String,
      deal_type: {
        type: String,
        enum: ['licensing', 'collaboration', 'joint_venture', 'distribution']
      },
      therapeutic_area: String,
      deal_value: Number,
      terms: String,
      strategic_importance: {
        type: String,
        enum: ['high', 'medium', 'low']
      }
    }],
    divestitures: [{
      date: Date,
      asset: String,
      buyer: String,
      deal_value: Number,
      rationale: String
    }]
  },
  
  // Competitive Positioning
  competitivePosition: {
    market_position: {
      ranking: Number,
      market_share: Number,
      competitive_moat: {
        type: String,
        enum: ['strong', 'moderate', 'weak']
      }
    },
    competitive_advantages: [String],
    competitive_weaknesses: [String],
    key_differentiators: [String],
    threats: [{
      threat_type: {
        type: String,
        enum: ['new_entrant', 'patent_expiry', 'regulatory_change', 'technology_disruption', 'pricing_pressure']
      },
      description: String,
      severity: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low']
      },
      timeline: String,
      mitigation_strategies: [String]
    }],
    opportunities: [{
      opportunity_type: {
        type: String,
        enum: ['market_expansion', 'new_indication', 'cost_reduction', 'acquisition', 'partnership']
      },
      description: String,
      potential_impact: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      investment_required: Number,
      timeline: String
    }]
  },
  
  // Market Intelligence
  marketIntelligence: {
    addressable_market: {
      tam: Number, // Total Addressable Market
      sam: Number, // Serviceable Addressable Market
      som: Number  // Serviceable Obtainable Market
    },
    market_dynamics: {
      growth_rate: Number,
      key_drivers: [String],
      regulatory_environment: String,
      reimbursement_trends: String,
      competitive_intensity: {
        type: String,
        enum: ['high', 'medium', 'low']
      }
    },
    customer_segments: [{
      segment: String,
      size: Number,
      growth_rate: Number,
      key_needs: [String],
      decision_makers: [String]
    }]
  },
  
  // Regulatory Intelligence
  regulatoryIntelligence: {
    regulatory_approvals: [{
      date: Date,
      drug: String,
      indication: String,
      agency: String,
      approval_type: String,
      market_exclusivity: String,
      competitive_impact: {
        type: String,
        enum: ['high', 'medium', 'low']
      }
    }],
    regulatory_setbacks: [{
      date: Date,
      drug: String,
      issue: String,
      agency: String,
      impact: String,
      resolution_timeline: String
    }],
    regulatory_strategy: {
      orphan_designations: Number,
      breakthrough_designations: Number,
      fast_track_designations: Number,
      priority_reviews: Number
    }
  },
  
  // AI Analysis & Insights
  aiAnalysis: {
    overall_threat_level: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      index: true
    },
    competitive_score: {
      type: Number,
      min: 0,
      max: 100
    },
    key_insights: [String],
    strategic_recommendations: [String],
    risk_assessment: [{
      risk_category: String,
      risk_level: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low']
      },
      description: String,
      mitigation_strategy: String
    }],
    opportunities_identified: [{
      opportunity: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      timeline: String,
      investment_required: String
    }],
    confidence_score: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7
    },
    last_analyzed: {
      type: Date,
      default: Date.now
    }
  },
  
  // News & Events Tracking
  newsAndEvents: {
    recent_news: [{
      date: Date,
      headline: String,
      source: String,
      sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral']
      },
      impact_score: {
        type: Number,
        min: -10,
        max: 10
      },
      category: {
        type: String,
        enum: ['earnings', 'rd_update', 'regulatory', 'partnership', 'acquisition', 'leadership', 'other']
      }
    }],
    executive_changes: [{
      date: Date,
      executive: String,
      position: String,
      change_type: {
        type: String,
        enum: ['appointment', 'departure', 'promotion']
      },
      background: String,
      strategic_impact: String
    }],
    conference_calls: [{
      date: Date,
      event_type: String,
      key_announcements: [String],
      guidance_changes: String,
      market_reaction: String
    }]
  },
  
  // Social Media & Digital Intelligence
  digitalIntelligence: {
    social_sentiment: {
      overall_score: {
        type: Number,
        min: -100,
        max: 100
      },
      platforms: {
        twitter: Number,
        linkedin: Number,
        news_mentions: Number
      },
      trending_topics: [String],
      key_influencers: [String]
    },
    digital_presence: {
      website_traffic_rank: Number,
      search_volume_trends: [String],
      content_marketing_score: Number,
      thought_leadership_score: Number
    }
  },
  
  // Data Sources & Quality
  dataSources: {
    sec_filings: {
      last_10k: Date,
      last_10q: Date,
      proxy_statements: [Date],
      data_quality: {
        type: String,
        enum: ['high', 'medium', 'low']
      }
    },
    patent_databases: {
      uspto: Boolean,
      wipo: Boolean,
      epo: Boolean,
      last_sync: Date
    },
    clinical_trials: {
      clinicaltrials_gov: Boolean,
      ema: Boolean,
      last_sync: Date
    },
    news_sources: [String],
    third_party_reports: [{
      source: String,
      report_date: Date,
      reliability_score: Number
    }]
  },
  
  // Tracking & Notifications
  tracking: {
    subscribers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      alert_types: [String],
      last_notified: Date
    }],
    views: {
      type: Number,
      default: 0
    },
    analysis_count: {
      type: Number,
      default: 0
    },
    last_viewed: Date,
    priority_level: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
      index: true
    }
  }
}, {
  timestamps: true,
  
  // Compound indexes for performance
  index: [
    { 'company.name': 1, 'analysisDate': -1 },
    { 'therapeuticAreas.area': 1, 'aiAnalysis.overall_threat_level': 1 },
    { 'company.sector': 1, 'tracking.priority_level': 1 },
    { 'patentPortfolio.patentCliffRisk.nearTerm.riskLevel': 1 }
  ]
});

// Virtual fields
CompetitiveIntelligenceSchema.virtual('isHighThreat').get(function() {
  return ['critical', 'high'].includes(this.aiAnalysis.overall_threat_level);
});

CompetitiveIntelligenceSchema.virtual('hasRecentActivity').get(function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.updatedAt > thirtyDaysAgo;
});

CompetitiveIntelligenceSchema.virtual('totalPipelineValue').get(function() {
  return this.pipelineAnalysis.pipelineValue?.totalNPV || 0;
});

CompetitiveIntelligenceSchema.virtual('recentNewsCount').get(function() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return this.newsAndEvents.recent_news?.filter(news => news.date > sevenDaysAgo).length || 0;
});

// Methods
CompetitiveIntelligenceSchema.methods.calculateThreatScore = function() {
  let score = 0;
  
  // Patent cliff risk scoring (40% weight)
  const nearTermRisk = this.patentPortfolio.patentCliffRisk?.nearTerm?.riskLevel;
  if (nearTermRisk === 'critical') score += 40;
  else if (nearTermRisk === 'high') score += 30;
  else if (nearTermRisk === 'medium') score += 15;
  
  // Pipeline strength (30% weight)
  const pipelinePrograms = this.pipelineAnalysis.totalPrograms || 0;
  const lateStagePrograms = (this.pipelineAnalysis.programsByPhase?.phase_3 || 0) + 
                           (this.pipelineAnalysis.programsByPhase?.regulatory_review || 0);
  if (lateStagePrograms > 5) score += 30;
  else if (lateStagePrograms > 2) score += 20;
  else if (pipelinePrograms > 10) score += 10;
  
  // Financial strength (20% weight)
  const rdSpending = this.financialMetrics.rd_spending?.total || 0;
  if (rdSpending > 5000000000) score += 20; // $5B+
  else if (rdSpending > 1000000000) score += 15; // $1B+
  else if (rdSpending > 500000000) score += 10; // $500M+
  
  // Recent strategic activities (10% weight)
  const recentMAs = this.strategicActivities.mergers_acquisitions?.filter(ma => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return ma.date > sixMonthsAgo;
  }).length || 0;
  
  if (recentMAs > 0) score += 10;
  
  return Math.min(100, score);
};

CompetitiveIntelligenceSchema.methods.generateExecutiveSummary = function() {
  const threatLevel = this.aiAnalysis.overall_threat_level;
  const totalPatents = this.patentPortfolio.totalPatents;
  const pipelinePrograms = this.pipelineAnalysis.totalPrograms;
  const revenue = this.financialMetrics.revenue?.total || 0;
  
  return `${this.company.name} poses a ${threatLevel} competitive threat with ${totalPatents} patents, ${pipelinePrograms} pipeline programs, and $${Math.round(revenue/1000000)}M annual revenue. Recent analysis identifies key risks and opportunities requiring strategic attention.`;
};

CompetitiveIntelligenceSchema.methods.getTopThreats = function() {
  return this.competitivePosition.threats
    ?.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    })
    .slice(0, 3) || [];
};

CompetitiveIntelligenceSchema.methods.getTopOpportunities = function() {
  return this.competitivePosition.opportunities
    ?.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.potential_impact] - impactOrder[a.potential_impact];
    })
    .slice(0, 3) || [];
};

// Static methods
CompetitiveIntelligenceSchema.statics.findHighThreatCompetitors = function() {
  return this.find({
    'aiAnalysis.overall_threat_level': { $in: ['critical', 'high'] }
  }).sort({ 'aiAnalysis.competitive_score': -1 });
};

CompetitiveIntelligenceSchema.statics.findByTherapeuticArea = function(area) {
  return this.find({
    'therapeuticAreas.area': area
  }).sort({ 'aiAnalysis.competitive_score': -1 });
};

CompetitiveIntelligenceSchema.statics.getIndustryOverview = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$company.sector',
        companies: { $sum: 1 },
        avgThreatScore: { $avg: '$aiAnalysis.competitive_score' },
        totalPatents: { $sum: '$patentPortfolio.totalPatents' },
        totalPipelineValue: { $sum: '$pipelineAnalysis.pipelineValue.totalNPV' }
      }
    },
    { $sort: { avgThreatScore: -1 } }
  ]);
  
  return stats;
};

CompetitiveIntelligenceSchema.statics.findRecentActivity = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    $or: [
      { 'newsAndEvents.recent_news.date': { $gte: cutoffDate } },
      { 'strategicActivities.mergers_acquisitions.date': { $gte: cutoffDate } },
      { 'strategicActivities.partnerships.date': { $gte: cutoffDate } },
      { 'regulatoryIntelligence.regulatory_approvals.date': { $gte: cutoffDate } }
    ]
  }).sort({ updatedAt: -1 });
};

// Pre-save middleware
CompetitiveIntelligenceSchema.pre('save', function(next) {
  // Update competitive score
  this.aiAnalysis.competitive_score = this.calculateThreatScore();
  
  // Update threat level based on score
  if (this.aiAnalysis.competitive_score >= 80) this.aiAnalysis.overall_threat_level = 'critical';
  else if (this.aiAnalysis.competitive_score >= 60) this.aiAnalysis.overall_threat_level = 'high';
  else if (this.aiAnalysis.competitive_score >= 40) this.aiAnalysis.overall_threat_level = 'medium';
  else this.aiAnalysis.overall_threat_level = 'low';
  
  next();
});

const CompetitiveIntelligence = mongoose.model('CompetitiveIntelligence', CompetitiveIntelligenceSchema);

export default CompetitiveIntelligence;