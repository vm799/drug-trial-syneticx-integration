// server/agents/PatentMonitoringAgent.js

/**
 * Patent Monitoring Agent - Advanced pharmaceutical patent analysis and cliff monitoring
 * Integrates with USPTO database and provides real-time patent intelligence
 */
class PatentMonitoringAgent {
  constructor(openaiService) {
    this.openaiService = openaiService;
    this.name = 'Patent Monitoring Agent';
    this.description = 'Analyzes patent portfolios, monitors patent cliffs, and provides competitive patent intelligence';
    this.capabilities = [
      'patent_cliff_analysis',
      'competitive_patent_tracking',
      'patent_valuation',
      'expiry_prediction',
      'generic_threat_assessment',
      'patent_landscape_mapping'
    ];
  }

  /**
   * Analyze patent cliff risks for a specific drug or company
   * @param {Object} params - Analysis parameters
   * @param {string} params.drugName - Name of the drug to analyze
   * @param {string} params.company - Company name (optional)
   * @param {string} params.timeframe - Analysis timeframe (default: '24-months')
   * @param {Object} context - Additional context for analysis
   */
  async analyzePatentCliff(params, context = {}) {
    try {
      console.log(`🔍 Patent Monitoring Agent: Analyzing patent cliff for ${params.drugName}`);
      
      // Step 1: Search for relevant patents
      const patentData = await this.searchPatents(params.drugName, params.company);
      
      // Step 2: Get FDA exclusivity data
      const exclusivityData = await this.getFDAExclusivityData(params.drugName);
      
      // Step 3: Analyze market impact
      const marketAnalysis = await this.analyzeMarketImpact(params.drugName, patentData);
      
      // Step 4: Assess generic threat
      const genericThreat = await this.assessGenericThreat(params.drugName, patentData);
      
      // Step 5: Generate AI-powered insights
      const aiInsights = await this.generatePatentInsights({
        drugName: params.drugName,
        patents: patentData,
        exclusivity: exclusivityData,
        market: marketAnalysis,
        threat: genericThreat
      }, context);
      
      const cliffAnalysis = {
        drugName: params.drugName,
        company: params.company || 'Multiple',
        analysisDate: new Date(),
        timeframe: params.timeframe || '24-months',
        
        // Patent details
        patentPortfolio: {
          totalPatents: patentData.length,
          keyPatents: patentData.filter(p => p.importance === 'high'),
          expiringPatents: patentData.filter(p => this.isExpiringWithinTimeframe(p, params.timeframe)),
          patentTypes: this.categorizePatents(patentData)
        },
        
        // Cliff risk assessment
        cliffRisk: {
          overallRisk: this.calculateOverallCliffRisk(patentData, exclusivityData),
          nearTermRisk: this.calculateNearTermRisk(patentData, '12-months'),
          mediumTermRisk: this.calculateMediumTermRisk(patentData, '24-months'),
          longTermRisk: this.calculateLongTermRisk(patentData, '60-months'),
          confidenceScore: aiInsights.confidenceScore
        },
        
        // Market impact
        marketImpact: {
          estimatedRevenueAtRisk: marketAnalysis.revenueAtRisk,
          marketSize: marketAnalysis.totalMarketSize,
          competitiveLandscape: marketAnalysis.competitors,
          genericPenetrationForecast: this.forecastGenericPenetration(genericThreat)
        },
        
        // Generic threat assessment
        genericThreat: {
          threatLevel: genericThreat.level,
          likelyEntrants: genericThreat.potentialCompetitors,
          timeToGenericEntry: genericThreat.estimatedEntryTime,
          regulatoryBarriers: genericThreat.regulatoryComplexity
        },
        
        // AI insights and recommendations
        insights: aiInsights.insights,
        recommendations: aiInsights.recommendations,
        riskMitigation: aiInsights.riskMitigation,
        
        // Timeline analysis
        timeline: this.generateCliffTimeline(patentData, exclusivityData),
        
        // Competitive intelligence
        competitiveIntel: await this.gatherCompetitiveIntelligence(params.drugName, patentData),
        
        metadata: {
          agent: this.name,
          analysisId: this.generateAnalysisId(),
          confidence: aiInsights.confidenceScore,
          dataFreshness: this.getDataFreshness(),
          sources: ['USPTO', 'FDA', 'Market Research', 'AI Analysis']
        }
      };
      
      // Store analysis for future reference
      await this.storePatentAnalysis(cliffAnalysis);
      
      console.log(`✅ Patent cliff analysis completed for ${params.drugName}`);
      return cliffAnalysis;
      
    } catch (error) {
      console.error('❌ Patent Monitoring Agent error:', error);
      return this.generateFallbackAnalysis(params, error);
    }
  }

  /**
   * Search patents using mock USPTO integration
   * In production, this would connect to USPTO API
   */
  async searchPatents(drugName, company = null) {
    // Mock patent data - replace with actual USPTO API integration
    const mockPatents = [
      {
        patentNumber: 'US10,123,456',
        title: `Pharmaceutical composition of ${drugName}`,
        assignee: company || 'Pharmaceutical Company Inc.',
        filingDate: new Date('2015-03-15'),
        grantDate: new Date('2018-11-20'),
        expiryDate: new Date('2035-03-15'), // 20 years from filing
        patentType: 'composition',
        claims: [
          'A pharmaceutical composition comprising the active ingredient',
          'Method of treatment using the composition',
          'Dosage forms and formulations'
        ],
        importance: 'high',
        marketImpact: 850000000, // $850M
        status: 'active',
        family: {
          continuations: ['US10,234,567', 'US10,345,678'],
          divisionals: ['US10,456,789'],
          international: ['EP2945678', 'WO2016123456']
        }
      },
      {
        patentNumber: 'US10,234,567',
        title: `Method of manufacturing ${drugName}`,
        assignee: company || 'Pharmaceutical Company Inc.',
        filingDate: new Date('2016-08-10'),
        grantDate: new Date('2019-05-15'),
        expiryDate: new Date('2036-08-10'),
        patentType: 'method',
        importance: 'medium',
        marketImpact: 125000000, // $125M
        status: 'active'
      },
      {
        patentNumber: 'US9,876,543',
        title: `Extended release formulation of ${drugName}`,
        assignee: company || 'Pharmaceutical Company Inc.',
        filingDate: new Date('2012-01-20'),
        grantDate: new Date('2015-09-08'),
        expiryDate: new Date('2032-01-20'),
        patentType: 'formulation',
        importance: 'high',
        marketImpact: 320000000, // $320M
        status: 'active'
      }
    ];

    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockPatents.map(patent => ({
      ...patent,
      yearsToExpiry: this.calculateYearsToExpiry(patent.expiryDate),
      cliffRisk: this.assessPatentCliffRisk(patent),
      strategicValue: this.assessStrategicValue(patent)
    }));
  }

  /**
   * Get FDA exclusivity data for a drug
   */
  async getFDAExclusivityData(drugName) {
    // Mock FDA exclusivity data - replace with actual FDA API integration
    return {
      drugName,
      exclusivities: [
        {
          type: 'New Chemical Entity',
          grantDate: new Date('2018-11-20'),
          expiryDate: new Date('2023-11-20'),
          yearsRemaining: this.calculateYearsToExpiry(new Date('2023-11-20')),
          status: 'expired'
        },
        {
          type: 'Pediatric Exclusivity',
          grantDate: new Date('2020-03-15'),
          expiryDate: new Date('2026-03-15'),
          yearsRemaining: this.calculateYearsToExpiry(new Date('2026-03-15')),
          status: 'active'
        }
      ],
      totalExclusivityYears: 7.5,
      remainingExclusivity: 1.5
    };
  }

  /**
   * Analyze market impact of patent expiries
   */
  async analyzeMarketImpact(drugName, patentData) {
    const totalPatentValue = patentData.reduce((sum, patent) => sum + (patent.marketImpact || 0), 0);
    
    return {
      totalMarketSize: totalPatentValue,
      revenueAtRisk: totalPatentValue * 0.85, // Assume 85% revenue at risk
      marketSegments: [
        { segment: 'Primary indication', value: totalPatentValue * 0.7 },
        { segment: 'Secondary indications', value: totalPatentValue * 0.2 },
        { segment: 'Off-label use', value: totalPatentValue * 0.1 }
      ],
      competitors: [
        'Generic Manufacturer A',
        'Generic Manufacturer B', 
        'Biosimilar Developer C'
      ],
      marketDynamics: {
        currentCompetition: 'low',
        expectedCompetition: 'high',
        priceErosion: '80-90%',
        timeToFullErosion: '18-24 months'
      }
    };
  }

  /**
   * Assess generic threat level
   */
  async assessGenericThreat(drugName, patentData) {
    const criticalPatents = patentData.filter(p => p.importance === 'high');
    const nearExpiryPatents = patentData.filter(p => this.calculateYearsToExpiry(p.expiryDate) < 2);
    
    let threatLevel = 'low';
    if (criticalPatents.some(p => this.calculateYearsToExpiry(p.expiryDate) < 3)) {
      threatLevel = 'high';
    } else if (nearExpiryPatents.length > 0) {
      threatLevel = 'medium';
    }

    return {
      level: threatLevel,
      potentialCompetitors: [
        'Teva Pharmaceuticals',
        'Sandoz',
        'Mylan',
        'Dr. Reddy\'s'
      ],
      estimatedEntryTime: threatLevel === 'high' ? '12-18 months' : '24-36 months',
      regulatoryComplexity: this.assessRegulatoryComplexity(drugName),
      marketBarriers: this.assessMarketBarriers(drugName),
      developmentChallenges: this.assessDevelopmentChallenges(patentData)
    };
  }

  /**
   * Generate AI-powered patent insights using OpenAI
   */
  async generatePatentInsights(data, context) {
    try {
      const prompt = `You are a pharmaceutical patent expert analyzing patent cliff risks. 

Drug: ${data.drugName}
Patents: ${data.patents.length} patents including ${data.patents.filter(p => p.importance === 'high').length} critical patents
Earliest Key Patent Expiry: ${this.getEarliestKeyPatentExpiry(data.patents)}
Market Size: $${Math.round(data.market.totalMarketSize / 1000000)}M
Generic Threat Level: ${data.threat.level}

Provide analysis in JSON format:
{
  "insights": [
    "Key insight about patent cliff timing and impact",
    "Analysis of competitive landscape and generic threats", 
    "Market dynamics and revenue impact assessment"
  ],
  "recommendations": [
    "Strategic recommendation for patent portfolio management",
    "Risk mitigation strategy",
    "Competitive positioning advice"
  ],
  "riskMitigation": [
    "Specific action to reduce patent cliff impact",
    "Timeline for implementation",
    "Expected outcome"
  ],
  "confidenceScore": 0.85,
  "keyRisks": ["Primary risk factor", "Secondary concern"],
  "opportunities": ["Strategic opportunity 1", "Market opportunity 2"]
}`;

      const response = await this.openaiService.generateResponse([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.3,
        maxTokens: 1500,
        context: { ...context, specialization: 'patent_analysis' }
      });

      return JSON.parse(response.content);
      
    } catch (error) {
      console.error('AI insights generation error:', error);
      return this.getFallbackInsights(data);
    }
  }

  /**
   * Generate patent cliff timeline
   */
  generateCliffTimeline(patentData, exclusivityData) {
    const events = [];
    
    // Add patent expiry events
    patentData.forEach(patent => {
      events.push({
        date: patent.expiryDate,
        type: 'patent_expiry',
        description: `${patent.patentType} patent expires (${patent.patentNumber})`,
        impact: patent.importance,
        estimatedImpact: patent.marketImpact
      });
    });
    
    // Add exclusivity expiry events
    exclusivityData.exclusivities.forEach(exclusivity => {
      if (exclusivity.status === 'active') {
        events.push({
          date: exclusivity.expiryDate,
          type: 'exclusivity_expiry',
          description: `${exclusivity.type} exclusivity expires`,
          impact: 'high',
          estimatedImpact: 'market_entry_possible'
        });
      }
    });
    
    // Sort by date and return
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Gather competitive intelligence around patents
   */
  async gatherCompetitiveIntelligence(drugName, patentData) {
    return {
      competitorPatents: [
        {
          competitor: 'Competitor A',
          patentCount: 3,
          keyPatents: ['US9,999,999'],
          threatLevel: 'medium',
          focus: 'alternative_formulation'
        }
      ],
      whitespace: [
        'Novel delivery mechanism',
        'Pediatric formulation',
        'Combination therapy'
      ],
      designAround: [
        'Modified release profile',
        'Different salt form',
        'Alternative synthesis route'
      ],
      defensiveOpportunities: [
        'File continuation applications',
        'Explore new indications',
        'Develop next-generation compounds'
      ]
    };
  }

  // Utility methods
  calculateYearsToExpiry(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
    return Math.max(0, Math.round(diffYears * 10) / 10);
  }

  isExpiringWithinTimeframe(patent, timeframe) {
    const years = parseInt(timeframe.split('-')[0]) / 12; // Convert months to years
    return this.calculateYearsToExpiry(patent.expiryDate) <= years;
  }

  calculateOverallCliffRisk(patentData, exclusivityData) {
    const criticalPatents = patentData.filter(p => p.importance === 'high');
    const nearExpiryCount = criticalPatents.filter(p => this.calculateYearsToExpiry(p.expiryDate) < 3).length;
    const totalCritical = criticalPatents.length;
    
    if (totalCritical === 0) return 'low';
    const riskRatio = nearExpiryCount / totalCritical;
    
    if (riskRatio > 0.6) return 'high';
    if (riskRatio > 0.3) return 'medium';
    return 'low';
  }

  calculateNearTermRisk(patentData, timeframe) {
    const nearTermPatents = patentData.filter(p => this.isExpiringWithinTimeframe(p, timeframe));
    const totalValue = nearTermPatents.reduce((sum, p) => sum + (p.marketImpact || 0), 0);
    return { patentCount: nearTermPatents.length, marketImpact: totalValue };
  }

  calculateMediumTermRisk(patentData, timeframe) {
    const mediumTermPatents = patentData.filter(p => {
      const years = this.calculateYearsToExpiry(p.expiryDate);
      return years > 1 && years <= 2;
    });
    const totalValue = mediumTermPatents.reduce((sum, p) => sum + (p.marketImpact || 0), 0);
    return { patentCount: mediumTermPatents.length, marketImpact: totalValue };
  }

  calculateLongTermRisk(patentData, timeframe) {
    const longTermPatents = patentData.filter(p => {
      const years = this.calculateYearsToExpiry(p.expiryDate);
      return years > 2 && years <= 5;
    });
    const totalValue = longTermPatents.reduce((sum, p) => sum + (p.marketImpact || 0), 0);
    return { patentCount: longTermPatents.length, marketImpact: totalValue };
  }

  categorizePatents(patentData) {
    const categories = {};
    patentData.forEach(patent => {
      categories[patent.patentType] = (categories[patent.patentType] || 0) + 1;
    });
    return categories;
  }

  forecastGenericPenetration(genericThreat) {
    const penetrationRates = {
      'high': { '6months': 15, '12months': 45, '24months': 80 },
      'medium': { '6months': 8, '12months': 25, '24months': 60 },
      'low': { '6months': 3, '12months': 12, '24months': 35 }
    };
    
    return penetrationRates[genericThreat.level] || penetrationRates['medium'];
  }

  getEarliestKeyPatentExpiry(patents) {
    const keyPatents = patents.filter(p => p.importance === 'high');
    if (keyPatents.length === 0) return 'No key patents';
    
    const earliestExpiry = keyPatents.reduce((earliest, patent) => {
      return new Date(patent.expiryDate) < new Date(earliest.expiryDate) ? patent : earliest;
    });
    
    return earliestExpiry.expiryDate.toISOString().split('T')[0];
  }

  assessPatentCliffRisk(patent) {
    const yearsToExpiry = this.calculateYearsToExpiry(patent.expiryDate);
    if (yearsToExpiry < 2 && patent.importance === 'high') return 'critical';
    if (yearsToExpiry < 3 && patent.importance === 'high') return 'high';
    if (yearsToExpiry < 5) return 'medium';
    return 'low';
  }

  assessStrategicValue(patent) {
    if (patent.importance === 'high' && patent.marketImpact > 500000000) return 'critical';
    if (patent.importance === 'high') return 'high';
    if (patent.marketImpact > 100000000) return 'medium';
    return 'low';
  }

  assessRegulatoryComplexity(drugName) {
    // Mock assessment - in production, analyze actual regulatory data
    return 'medium';
  }

  assessMarketBarriers(drugName) {
    return ['FDA bioequivalence requirements', 'Manufacturing complexity', 'Distribution challenges'];
  }

  assessDevelopmentChallenges(patentData) {
    const complexPatents = patentData.filter(p => p.patentType === 'formulation' || p.patentType === 'method');
    return complexPatents.length > 0 ? 'high' : 'medium';
  }

  generateAnalysisId() {
    return `PA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDataFreshness() {
    return new Date().toISOString();
  }

  async storePatentAnalysis(analysis) {
    // In production, store in database
    console.log(`📁 Storing patent analysis: ${analysis.metadata.analysisId}`);
  }

  getFallbackInsights(data) {
    return {
      insights: [
        `Patent cliff analysis for ${data.drugName} shows ${data.patents.length} patents in portfolio`,
        'Generic competition expected based on patent expiry timeline',
        'Market impact assessment indicates significant revenue at risk'
      ],
      recommendations: [
        'Monitor patent expiry dates and generic entry timing',
        'Develop lifecycle management strategies',
        'Consider defensive patent filing opportunities'
      ],
      riskMitigation: [
        'File patent term extensions where applicable',
        'Explore new indication development',
        'Develop authorized generics strategy'
      ],
      confidenceScore: 0.7,
      keyRisks: ['Patent expiry', 'Generic competition'],
      opportunities: ['Lifecycle management', 'Market expansion']
    };
  }

  generateFallbackAnalysis(params, error) {
    console.log(`⚠️ Generating fallback analysis due to error: ${error.message}`);
    return {
      drugName: params.drugName,
      company: params.company || 'Unknown',
      error: 'Analysis failed - using fallback data',
      basicAnalysis: {
        status: 'limited_data',
        recommendation: 'Manual review required',
        confidence: 0.3
      },
      metadata: {
        agent: this.name,
        analysisId: this.generateAnalysisId(),
        error: error.message,
        timestamp: new Date()
      }
    };
  }
}

export default PatentMonitoringAgent;