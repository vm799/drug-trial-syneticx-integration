// server/agents/CompetitiveIntelligenceAgent.js - Competitive Intelligence Automation Agent

import logger from '../utils/logger.js'
import CompetitiveIntelligence from '../models/CompetitiveIntelligence.js'
import Patent from '../models/Patent.js'
import { EventEmitter } from 'events'

class CompetitiveIntelligenceAgent extends EventEmitter {
  constructor(openaiService) {
    super()
    this.openaiService = openaiService
    this.capabilities = [
      'competitor_analysis',
      'market_positioning',
      'pipeline_monitoring',
      'strategic_threat_assessment',
      'acquisition_analysis',
      'partnership_monitoring'
    ]
    
    // Intelligence sources
    this.dataSources = {
      patents: 'USPTO Patent Database',
      clinicalTrials: 'ClinicalTrials.gov',
      secFilings: 'SEC EDGAR Database',
      newsFeeds: 'Pharmaceutical News APIs',
      earnings: 'Financial Data Providers',
      conferences: 'Scientific Conference Abstracts'
    }

    // Analysis parameters
    this.analysisConfig = {
      threatThresholds: {
        critical: { score: 80, revenue: 1000000000 },
        high: { score: 60, revenue: 500000000 },
        medium: { score: 40, revenue: 100000000 },
        low: { score: 20, revenue: 50000000 }
      },
      monitoringFrequency: {
        realtime: 3600000, // 1 hour
        daily: 86400000,   // 24 hours
        weekly: 604800000  // 7 days
      }
    }

    logger.info('Competitive Intelligence Agent initialized')
  }

  /**
   * Comprehensive competitor analysis
   */
  async analyzeCompetitor(companyName, context = {}) {
    try {
      logger.info(`Starting comprehensive competitor analysis for: ${companyName}`)
      
      const startTime = Date.now()
      const analysis = {
        companyName,
        analysisTimestamp: new Date(),
        threatAssessment: {},
        patentPortfolio: {},
        pipelineAnalysis: {},
        financialMetrics: {},
        strategicPositioning: {},
        recentActivities: [],
        competitiveThreat: {},
        recommendations: [],
        metadata: {}
      }

      // Step 1: Get or create competitor record
      let competitor = await CompetitiveIntelligence.findOne({ 
        'companyInfo.name': new RegExp(companyName, 'i') 
      })

      if (!competitor) {
        competitor = await this.createCompetitorProfile(companyName, context)
      }

      // Step 2: Analyze patent portfolio
      logger.debug('Analyzing patent portfolio...')
      analysis.patentPortfolio = await this.analyzePatentPortfolio(companyName)

      // Step 3: Assess pipeline strength
      logger.debug('Assessing pipeline strength...')
      analysis.pipelineAnalysis = await this.assessPipelineStrength(competitor)

      // Step 4: Calculate threat score
      logger.debug('Calculating competitive threat score...')
      analysis.threatAssessment = await this.calculateThreatScore(competitor, analysis)

      // Step 5: Analyze recent activities
      logger.debug('Analyzing recent competitive activities...')
      analysis.recentActivities = await this.analyzeRecentActivities(competitor)

      // Step 6: Strategic positioning analysis
      logger.debug('Analyzing strategic positioning...')
      analysis.strategicPositioning = await this.analyzeStrategicPositioning(competitor, analysis)

      // Step 7: Generate AI insights and recommendations
      logger.debug('Generating AI insights...')
      const aiInsights = await this.generateCompetitiveInsights(companyName, analysis, context)
      analysis.recommendations = aiInsights.recommendations
      analysis.keyInsights = aiInsights.keyInsights

      // Step 8: Update competitor record
      await this.updateCompetitorIntelligence(competitor, analysis)

      const processingTime = Date.now() - startTime
      analysis.metadata = {
        processingTime,
        dataSourcesUsed: Object.keys(this.dataSources),
        confidenceScore: this.calculateConfidenceScore(analysis),
        lastUpdated: new Date(),
        analysisVersion: '2.0'
      }

      logger.info(`Competitor analysis completed for ${companyName} in ${processingTime}ms`)
      
      // Emit event for real-time updates
      this.emit('competitorAnalysisCompleted', {
        companyName,
        threatLevel: analysis.threatAssessment.overallThreat,
        analysis
      })

      return {
        success: true,
        analysis,
        competitor: competitor.toObject()
      }

    } catch (error) {
      logger.error(`Competitive intelligence analysis error for ${companyName}:`, error)
      return {
        success: false,
        error: error.message,
        analysis: null
      }
    }
  }

  /**
   * Monitor competitive landscape for changes
   */
  async monitorCompetitiveLandscape(therapeuticArea, options = {}) {
    try {
      logger.info(`Monitoring competitive landscape for: ${therapeuticArea}`)
      
      const monitoring = {
        therapeuticArea,
        monitoringPeriod: options.period || 'daily',
        competitors: [],
        marketChanges: [],
        threatAlerts: [],
        opportunitySignals: [],
        summary: {}
      }

      // Get active competitors in therapeutic area
      const competitors = await CompetitiveIntelligence.find({
        'therapeuticFocus': therapeuticArea,
        'monitoringStatus.active': true
      })

      for (const competitor of competitors) {
        try {
          // Check for significant changes
          const changes = await this.detectCompetitorChanges(competitor, options.lookbackDays || 7)
          
          if (changes.significantChanges) {
            monitoring.competitors.push({
              company: competitor.companyInfo.name,
              changes: changes.changes,
              impact: changes.impact,
              threatLevel: competitor.overallThreat
            })

            // Generate alerts for critical changes
            if (changes.impact === 'critical') {
              monitoring.threatAlerts.push({
                company: competitor.companyInfo.name,
                alert: changes.alertMessage,
                severity: 'critical',
                timestamp: new Date()
              })
            }
          }

          // Identify market opportunities
          const opportunities = await this.identifyMarketOpportunities(competitor, therapeuticArea)
          monitoring.opportunitySignals.push(...opportunities)

        } catch (error) {
          logger.error(`Error monitoring competitor ${competitor.companyInfo.name}:`, error)
        }
      }

      // Generate market summary
      monitoring.summary = await this.generateMarketSummary(monitoring, therapeuticArea)

      logger.info(`Competitive landscape monitoring completed for ${therapeuticArea}`)
      
      // Emit monitoring update
      this.emit('competitiveLandscapeUpdated', monitoring)

      return monitoring

    } catch (error) {
      logger.error('Competitive landscape monitoring error:', error)
      throw error
    }
  }

  /**
   * Assess acquisition targets and opportunities
   */
  async assessAcquisitionTargets(criteria = {}, context = {}) {
    try {
      logger.info('Assessing potential acquisition targets')
      
      const assessment = {
        criteria,
        targets: [],
        marketAnalysis: {},
        valuationInsights: {},
        strategicFit: {},
        riskFactors: [],
        recommendations: []
      }

      // Build search criteria for potential targets
      const searchCriteria = this.buildAcquisitionCriteria(criteria)
      
      // Find potential targets
      const potentialTargets = await CompetitiveIntelligence.find(searchCriteria)
        .sort({ 'financialMetrics.marketCap': 1 }) // Ascending - smaller companies first

      for (const target of potentialTargets) {
        try {
          // Analyze acquisition attractiveness
          const targetAssessment = await this.analyzeAcquisitionTarget(target, criteria)
          
          if (targetAssessment.attractivenessScore > criteria.minScore || 50) {
            assessment.targets.push({
              company: target.companyInfo.name,
              ticker: target.companyInfo.ticker,
              marketCap: target.financialMetrics.marketCap,
              attractivenessScore: targetAssessment.attractivenessScore,
              strategicValue: targetAssessment.strategicValue,
              synergies: targetAssessment.synergies,
              risks: targetAssessment.risks,
              estimatedValuation: targetAssessment.estimatedValuation
            })
          }

        } catch (error) {
          logger.error(`Error assessing acquisition target ${target.companyInfo.name}:`, error)
        }
      }

      // Sort by attractiveness score
      assessment.targets.sort((a, b) => b.attractivenessScore - a.attractivenessScore)

      // Generate AI-powered insights
      const aiInsights = await this.generateAcquisitionInsights(assessment, context)
      assessment.recommendations = aiInsights.recommendations
      assessment.marketAnalysis = aiInsights.marketAnalysis

      logger.info(`Acquisition assessment completed: ${assessment.targets.length} targets identified`)

      return assessment

    } catch (error) {
      logger.error('Acquisition assessment error:', error)
      throw error
    }
  }

  /**
   * Track strategic partnerships and alliances
   */
  async trackStrategicPartnerships(companyName = null, options = {}) {
    try {
      logger.info(`Tracking strategic partnerships${companyName ? ` for ${companyName}` : ' across industry'}`)
      
      const partnerships = {
        timeframe: options.timeframe || 'last_12_months',
        totalPartnerships: 0,
        partnershipTypes: {},
        majorDeals: [],
        trendAnalysis: {},
        impactAssessment: {}
      }

      // Query partnerships from competitive intelligence records
      const query = companyName ? 
        { 'companyInfo.name': new RegExp(companyName, 'i') } : 
        { 'partnerships.0': { $exists: true } }

      const competitors = await CompetitiveIntelligence.find(query)
        .populate('partnerships')

      for (const competitor of competitors) {
        for (const partnership of competitor.partnerships || []) {
          // Filter by timeframe
          if (this.isWithinTimeframe(partnership.announcementDate, options.timeframe)) {
            partnerships.totalPartnerships++
            
            // Categorize partnership type
            const type = partnership.type || 'strategic'
            partnerships.partnershipTypes[type] = (partnerships.partnershipTypes[type] || 0) + 1
            
            // Identify major deals
            if (partnership.value && partnership.value > (options.majorDealThreshold || 100000000)) {
              partnerships.majorDeals.push({
                company1: competitor.companyInfo.name,
                company2: partnership.partnerCompany,
                type: partnership.type,
                value: partnership.value,
                description: partnership.description,
                announcementDate: partnership.announcementDate,
                therapeuticArea: partnership.therapeuticArea
              })
            }
          }
        }
      }

      // Analyze trends
      partnerships.trendAnalysis = await this.analyzePartnershipTrends(partnerships)
      
      // Assess market impact
      partnerships.impactAssessment = await this.assessPartnershipImpact(partnerships)

      logger.info(`Partnership tracking completed: ${partnerships.totalPartnerships} partnerships analyzed`)

      return partnerships

    } catch (error) {
      logger.error('Partnership tracking error:', error)
      throw error
    }
  }

  // Private helper methods

  async analyzePatentPortfolio(companyName) {
    const patents = await Patent.findByCompany(companyName)
    
    const portfolio = {
      totalPatents: patents.length,
      activePatents: patents.filter(p => p.status.legal === 'granted').length,
      patentsByType: {},
      therapeuticAreas: {},
      expiringPatents: patents.filter(p => p.isExpiring).length,
      portfolioStrength: 'medium'
    }

    // Categorize patents
    patents.forEach(patent => {
      // By type
      const type = patent.patentType || 'other'
      portfolio.patentsByType[type] = (portfolio.patentsByType[type] || 0) + 1
      
      // By therapeutic area
      const area = patent.drugInfo?.therapeuticArea || 'unknown'
      portfolio.therapeuticAreas[area] = (portfolio.therapeuticAreas[area] || 0) + 1
    })

    // Calculate portfolio strength
    if (portfolio.totalPatents > 100 && portfolio.activePatents > 80) {
      portfolio.portfolioStrength = 'strong'
    } else if (portfolio.totalPatents > 50 && portfolio.activePatents > 40) {
      portfolio.portfolioStrength = 'medium'
    } else {
      portfolio.portfolioStrength = 'weak'
    }

    return portfolio
  }

  async assessPipelineStrength(competitor) {
    const pipeline = competitor.pipelineAnalysis || {}
    
    const assessment = {
      totalAssets: pipeline.totalAssets || 0,
      phaseDistribution: pipeline.phaseDistribution || {},
      therapeuticDiversity: 0,
      riskProfile: 'medium',
      pipelineValue: pipeline.totalValue || 0,
      strength: 'medium'
    }

    // Calculate therapeutic diversity
    const therapeuticAreas = Object.keys(pipeline.therapeuticAreas || {})
    assessment.therapeuticDiversity = therapeuticAreas.length

    // Assess overall strength
    if (assessment.totalAssets > 50 && assessment.therapeuticDiversity > 5) {
      assessment.strength = 'strong'
    } else if (assessment.totalAssets > 20 && assessment.therapeuticDiversity > 2) {
      assessment.strength = 'medium'
    } else {
      assessment.strength = 'weak'
    }

    return assessment
  }

  async calculateThreatScore(competitor, analysis) {
    let threatScore = 0
    
    // Patent portfolio weight (30%)
    const patentScore = this.scorePatentPortfolio(analysis.patentPortfolio)
    threatScore += patentScore * 0.30
    
    // Pipeline strength weight (25%)
    const pipelineScore = this.scorePipelineStrength(analysis.pipelineAnalysis)
    threatScore += pipelineScore * 0.25
    
    // Financial strength weight (20%)
    const financialScore = this.scoreFinancialStrength(competitor.financialMetrics)
    threatScore += financialScore * 0.20
    
    // Market position weight (15%)
    const marketScore = this.scoreMarketPosition(competitor)
    threatScore += marketScore * 0.15
    
    // Recent activity weight (10%)
    const activityScore = this.scoreRecentActivity(analysis.recentActivities)
    threatScore += activityScore * 0.10

    // Determine threat level
    let threatLevel = 'low'
    if (threatScore >= 80) threatLevel = 'critical'
    else if (threatScore >= 60) threatLevel = 'high'
    else if (threatScore >= 40) threatLevel = 'medium'

    return {
      overallThreat: threatLevel,
      threatScore: Math.round(threatScore),
      components: {
        patentPortfolio: Math.round(patentScore),
        pipelineStrength: Math.round(pipelineScore),
        financialStrength: Math.round(financialScore),
        marketPosition: Math.round(marketScore),
        recentActivity: Math.round(activityScore)
      },
      lastCalculated: new Date()
    }
  }

  async analyzeRecentActivities(competitor) {
    const activities = []
    
    // Check for recent patent filings, partnerships, clinical trials, etc.
    // This would integrate with various data sources
    
    // Mock recent activities for demonstration
    const mockActivities = [
      {
        type: 'patent_filing',
        description: 'Filed 3 new patents in oncology',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        impact: 'medium',
        source: 'uspto'
      },
      {
        type: 'clinical_trial',
        description: 'Initiated Phase III trial for lead compound',
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        impact: 'high',
        source: 'clinicaltrials.gov'
      }
    ]

    return mockActivities
  }

  async analyzeStrategicPositioning(competitor, analysis) {
    return {
      marketPosition: competitor.marketPosition?.ranking || 'unknown',
      competitiveAdvantages: competitor.competitiveAdvantages || [],
      vulnerabilities: competitor.vulnerabilities || [],
      strategicFocus: competitor.strategicFocus || [],
      marketShare: competitor.marketPosition?.marketShare || 0
    }
  }

  async generateCompetitiveInsights(companyName, analysis, context) {
    try {
      const prompt = `Analyze the competitive intelligence data for ${companyName} and provide strategic insights.
      
      Company: ${companyName}
      Patent Portfolio: ${analysis.patentPortfolio.totalPatents} patents, strength: ${analysis.patentPortfolio.portfolioStrength}
      Pipeline: ${analysis.pipelineAnalysis.totalAssets} assets, strength: ${analysis.pipelineAnalysis.strength}
      Threat Score: ${analysis.threatAssessment.threatScore}/100
      
      Provide:
      1. Key competitive insights (3-5 points)
      2. Strategic recommendations (3-5 actionable items)
      3. Potential opportunities and threats
      4. Market positioning assessment
      
      Format as JSON with keys: keyInsights, recommendations, opportunities, threats, positioning`

      const response = await this.openaiService.generateResponse(
        [{ role: 'user', content: prompt }],
        {
          type: 'competitive_intelligence',
          company: companyName,
          analysisData: analysis
        }
      )

      // Parse AI response
      let insights
      try {
        insights = JSON.parse(response.content)
      } catch (parseError) {
        // Fallback if JSON parsing fails
        insights = {
          keyInsights: ['Comprehensive competitive analysis completed'],
          recommendations: ['Continue monitoring competitive activities'],
          opportunities: ['Monitor for strategic partnership opportunities'],
          threats: ['Track patent cliff risks'],
          positioning: 'Position requires continued analysis'
        }
      }

      return {
        ...insights,
        metadata: {
          tokensUsed: response.metadata?.tokens || 0,
          confidence: 0.85,
          generatedAt: new Date()
        }
      }

    } catch (error) {
      logger.error('AI insights generation error:', error)
      return {
        keyInsights: ['Analysis completed with limited AI insights'],
        recommendations: ['Continue monitoring'],
        opportunities: [],
        threats: [],
        positioning: 'Requires manual assessment'
      }
    }
  }

  async updateCompetitorIntelligence(competitor, analysis) {
    const updates = {
      'lastAnalyzed': analysis.analysisTimestamp,
      'threatScore': analysis.threatAssessment.threatScore,
      'overallThreat': analysis.threatAssessment.overallThreat,
      'patentPortfolio': analysis.patentPortfolio,
      'pipelineAnalysis': analysis.pipelineAnalysis,
      'recentActivities': analysis.recentActivities,
      'aiInsights.lastGenerated': new Date(),
      'aiInsights.keyInsights': analysis.keyInsights || [],
      'aiInsights.recommendations': analysis.recommendations || []
    }

    await CompetitiveIntelligence.findByIdAndUpdate(competitor._id, updates)
  }

  calculateConfidenceScore(analysis) {
    let confidence = 0.5 // Base confidence
    
    // Increase confidence based on data availability
    if (analysis.patentPortfolio.totalPatents > 0) confidence += 0.15
    if (analysis.pipelineAnalysis.totalAssets > 0) confidence += 0.15
    if (analysis.recentActivities.length > 0) confidence += 0.1
    if (analysis.recommendations.length > 0) confidence += 0.1
    
    return Math.min(0.95, confidence) // Cap at 95%
  }

  // Scoring helper methods
  scorePatentPortfolio(portfolio) {
    let score = 0
    
    if (portfolio.portfolioStrength === 'strong') score = 85
    else if (portfolio.portfolioStrength === 'medium') score = 60
    else score = 30
    
    // Adjust for expiring patents
    const expiryRatio = portfolio.expiringPatents / (portfolio.totalPatents || 1)
    if (expiryRatio > 0.3) score -= 20
    
    return Math.max(0, Math.min(100, score))
  }

  scorePipelineStrength(pipeline) {
    let score = 0
    
    if (pipeline.strength === 'strong') score = 85
    else if (pipeline.strength === 'medium') score = 60
    else score = 30
    
    return score
  }

  scoreFinancialStrength(financialMetrics) {
    if (!financialMetrics) return 50
    
    let score = 50 // Base score
    
    // Adjust based on market cap, revenue, etc.
    if (financialMetrics.marketCap > 10000000000) score += 20
    if (financialMetrics.revenue > 5000000000) score += 15
    if (financialMetrics.profitMargin > 0.2) score += 15
    
    return Math.min(100, score)
  }

  scoreMarketPosition(competitor) {
    // Basic market position scoring
    const ranking = competitor.marketPosition?.ranking || 10
    return Math.max(0, 100 - (ranking * 10))
  }

  scoreRecentActivity(activities) {
    if (!activities || activities.length === 0) return 30
    
    let score = 50 // Base score for having activities
    
    // Add points for high-impact activities
    const highImpactActivities = activities.filter(a => a.impact === 'high').length
    score += highImpactActivities * 15
    
    return Math.min(100, score)
  }

  async createCompetitorProfile(companyName, context) {
    const profile = new CompetitiveIntelligence({
      companyInfo: {
        name: companyName,
        type: 'pharmaceutical',
        headquarters: 'Unknown',
        founded: null,
        employees: null,
        website: null
      },
      threatScore: 50,
      overallThreat: 'medium',
      lastAnalyzed: new Date(),
      monitoringStatus: {
        active: true,
        frequency: 'weekly',
        lastUpdate: new Date()
      },
      dataSources: {
        patents: { enabled: true, lastSync: new Date() },
        clinicalTrials: { enabled: true, lastSync: new Date() },
        financials: { enabled: true, lastSync: new Date() }
      }
    })

    return await profile.save()
  }

  // Additional helper methods for other functionalities
  async detectCompetitorChanges(competitor, lookbackDays) {
    // Implementation for detecting significant competitor changes
    return {
      significantChanges: false,
      changes: [],
      impact: 'low',
      alertMessage: null
    }
  }

  async identifyMarketOpportunities(competitor, therapeuticArea) {
    // Implementation for identifying market opportunities
    return []
  }

  async generateMarketSummary(monitoring, therapeuticArea) {
    // Implementation for generating market summary
    return {
      totalCompetitors: monitoring.competitors.length,
      threatLevel: 'medium',
      marketActivity: 'normal'
    }
  }

  buildAcquisitionCriteria(criteria) {
    // Build MongoDB query for acquisition targets
    const query = {
      'companyInfo.type': 'pharmaceutical',
      'financialMetrics.marketCap': { 
        $gte: criteria.minMarketCap || 0,
        $lte: criteria.maxMarketCap || 10000000000 
      }
    }

    if (criteria.therapeuticArea) {
      query.therapeuticFocus = criteria.therapeuticArea
    }

    return query
  }

  async analyzeAcquisitionTarget(target, criteria) {
    // Implementation for analyzing acquisition attractiveness
    return {
      attractivenessScore: 65,
      strategicValue: 'high',
      synergies: ['Pipeline complementarity', 'Geographic expansion'],
      risks: ['Regulatory approval risk'],
      estimatedValuation: target.financialMetrics.marketCap * 1.3
    }
  }

  async generateAcquisitionInsights(assessment, context) {
    // Generate AI insights for acquisition opportunities
    return {
      recommendations: ['Focus on pipeline-rich targets'],
      marketAnalysis: { trend: 'consolidation' }
    }
  }

  isWithinTimeframe(date, timeframe) {
    const now = new Date()
    const targetDate = new Date(date)
    
    switch (timeframe) {
      case 'last_12_months':
        return now - targetDate <= 365 * 24 * 60 * 60 * 1000
      case 'last_6_months':
        return now - targetDate <= 180 * 24 * 60 * 60 * 1000
      case 'last_3_months':
        return now - targetDate <= 90 * 24 * 60 * 60 * 1000
      default:
        return true
    }
  }

  async analyzePartnershipTrends(partnerships) {
    // Analyze partnership trends over time
    return {
      growthRate: 15, // percentage
      commonTypes: ['licensing', 'joint_venture', 'research_collaboration'],
      averageValue: partnerships.majorDeals.reduce((sum, deal) => sum + deal.value, 0) / partnerships.majorDeals.length || 0
    }
  }

  async assessPartnershipImpact(partnerships) {
    // Assess the impact of partnerships on market dynamics
    return {
      marketConcentration: 'increasing',
      competitiveBalance: 'shifting',
      innovationAcceleration: 'moderate'
    }
  }
}

export default CompetitiveIntelligenceAgent