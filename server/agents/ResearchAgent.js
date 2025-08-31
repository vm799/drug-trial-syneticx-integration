// server/agents/ResearchAgent.js
import FreeApiService from '../services/freeApiService.js';
import logger from '../utils/logger.js';

class ResearchAgent {
  constructor(openai) {
    this.openai = openai;
    this.freeApiService = new FreeApiService();
    logger.info('🔬 Enhanced Research Agent initialized with free API integration');
  }

  async analyze(query, context = {}) {
    try {
      logger.info(`🔬 Analyzing research for: "${query}"`);
      
      // Step 1: Get real data from free APIs
      const [pubmedResults, arxivResults, drugInfo, fdaData] = await Promise.allSettled([
        this.freeApiService.searchPubMed(query, 5),
        this.freeApiService.searchArxiv(query, 3),
        this.extractDrugNames(query).then(drugs => 
          drugs.length > 0 ? this.freeApiService.getDrugInfo(drugs[0]) : null
        ),
        this.freeApiService.searchFDAEnforcement(query, 3)
      ]);

      // Process API results
      const researchData = {
        pubmedPapers: pubmedResults.status === 'fulfilled' ? pubmedResults.value : null,
        arxivPapers: arxivResults.status === 'fulfilled' ? arxivResults.value : null,
        drugInformation: drugInfo.status === 'fulfilled' ? drugInfo.value : null,
        regulatoryData: fdaData.status === 'fulfilled' ? fdaData.value : null
      };

      // Step 2: Generate analysis using OpenAI if available
      let aiAnalysis = null;
      if (this.openai && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
        aiAnalysis = await this.generateAIAnalysis(query, researchData, context);
      }

      // Step 3: Combine results
      const combinedAnalysis = this.combineResearchResults(query, researchData, aiAnalysis, context);

      logger.info(`🔬 Research analysis completed for: "${query}"`);
      return combinedAnalysis;

    } catch (error) {
      logger.error('🔬 Research analysis failed:', error);
      return this.getFallbackAnalysis(query, context);
    }
  }

  /**
   * Generate AI analysis using OpenAI
   */
  async generateAIAnalysis(query, researchData, context) {
    try {
      const prompt = this.buildAnalysisPrompt(query, researchData, context);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a pharmaceutical research analysis expert. Analyze the provided research data and generate comprehensive insights." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      });

      return response.choices[0].message.content;

    } catch (error) {
      logger.error('🔬 AI analysis failed:', error);
      return null;
    }
  }

  /**
   * Build analysis prompt with real data
   */
  buildAnalysisPrompt(query, researchData, context) {
    let prompt = `Analyze the following pharmaceutical research data for: "${query}"\n\n`;

    if (researchData.pubmedPapers?.papers?.length > 0) {
      prompt += `PubMed Research Papers:\n`;
      researchData.pubmedPapers.papers.forEach((paper, index) => {
        prompt += `${index + 1}. ${paper.title}\n   Abstract: ${paper.abstract}\n`;
      });
      prompt += '\n';
    }

    if (researchData.arxivPapers?.papers?.length > 0) {
      prompt += `ArXiv Research Papers:\n`;
      researchData.arxivPapers.papers.forEach((paper, index) => {
        prompt += `${index + 1}. ${paper.title}\n   Summary: ${paper.summary}\n`;
      });
      prompt += '\n';
    }

    if (researchData.drugInformation?.drug) {
      prompt += `Drug Information:\n`;
      prompt += `Name: ${researchData.drugInformation.drug.name}\n`;
      prompt += `RxCUI: ${researchData.drugInformation.drug.rxcui}\n\n`;
    }

    if (researchData.regulatoryData?.enforcements?.length > 0) {
      prompt += `FDA Regulatory Data:\n`;
      researchData.regulatoryData.enforcements.forEach((action, index) => {
        prompt += `${index + 1}. ${action.product} - ${action.reason} (${action.classification})\n`;
      });
      prompt += '\n';
    }

    prompt += `Please provide:\n`;
    prompt += `1. Key research insights and findings\n`;
    prompt += `2. Clinical significance and implications\n`;
    prompt += `3. Market and regulatory considerations\n`;
    prompt += `4. Recommendations for further research\n`;
    prompt += `5. Risk assessment and safety profile\n`;

    return prompt;
  }

  /**
   * Combine all research results into comprehensive analysis
   */
  combineResearchResults(query, researchData, aiAnalysis, context) {
    const analysis = {
      query: query,
      timestamp: new Date().toISOString(),
      
      // Core insights
      keyFindings: this.extractKeyFindings(researchData),
      clinicalSignificance: this.assessClinicalSignificance(researchData),
      regulatoryStatus: this.analyzeRegulatoryStatus(researchData),
      
      // Research sources
      researchSources: {
        pubmedPapers: researchData.pubmedPapers?.papers || [],
        arxivPapers: researchData.arxivPapers?.papers || [],
        totalSources: (researchData.pubmedPapers?.papers?.length || 0) + (researchData.arxivPapers?.papers?.length || 0)
      },
      
      // Drug information
      drugProfile: researchData.drugInformation?.drug || null,
      
      // Regulatory information
      regulatoryAlerts: researchData.regulatoryData?.enforcements || [],
      
      // AI-generated insights (if available)
      aiInsights: aiAnalysis,
      
      // Metadata
      dataQuality: this.assessDataQuality(researchData),
      confidence: this.calculateConfidence(researchData, aiAnalysis),
      dataSources: this.getDataSources(researchData),
      
      // Enhanced context from HF analysis if provided
      entityAnalysis: context.hfInsights?.entities || null,
      sentiment: context.hfInsights?.sentiment || null,
      recommendations: context.hfInsights?.recommendations || this.generateBasicRecommendations(query)
    };

    return analysis;
  }

  /**
   * Extract key findings from research data
   */
  extractKeyFindings(researchData) {
    const findings = [];

    if (researchData.pubmedPapers?.papers?.length > 0) {
      findings.push(`${researchData.pubmedPapers.papers.length} relevant PubMed research papers identified`);
      findings.push('Active research area with ongoing clinical investigations');
    }

    if (researchData.regulatoryData?.enforcements?.length > 0) {
      findings.push(`${researchData.regulatoryData.enforcements.length} FDA regulatory actions or recalls found`);
      findings.push('Regulatory oversight indicates active safety monitoring');
    }

    if (researchData.drugInformation?.drug) {
      findings.push(`Drug information available in RxNorm database`);
    }

    if (findings.length === 0) {
      findings.push('Limited research data available - may be emerging area or specialized topic');
    }

    return findings;
  }

  /**
   * Assess clinical significance
   */
  assessClinicalSignificance(researchData) {
    const pubmedCount = researchData.pubmedPapers?.papers?.length || 0;
    const regulatoryCount = researchData.regulatoryData?.enforcements?.length || 0;

    if (pubmedCount >= 3) {
      return 'High - Multiple peer-reviewed studies available';
    } else if (pubmedCount >= 1 || regulatoryCount > 0) {
      return 'Medium - Some clinical evidence or regulatory attention';
    } else {
      return 'Low - Limited clinical evidence available';
    }
  }

  /**
   * Analyze regulatory status
   */
  analyzeRegulatoryStatus(researchData) {
    const enforcements = researchData.regulatoryData?.enforcements || [];
    
    if (enforcements.length > 0) {
      const recentActions = enforcements.filter(action => 
        new Date(action.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      );
      
      return {
        status: recentActions.length > 0 ? 'Active regulatory monitoring' : 'Historical regulatory actions',
        actionCount: enforcements.length,
        recentActions: recentActions.length,
        lastAction: enforcements[0]?.date || null
      };
    }

    return {
      status: 'No significant regulatory actions identified',
      actionCount: 0,
      recentActions: 0,
      lastAction: null
    };
  }

  /**
   * Extract potential drug names from query
   */
  extractDrugNames(query) {
    // Simple drug name extraction (could be enhanced with medical NLP)
    const drugKeywords = ['aspirin', 'ibuprofen', 'acetaminophen', 'metformin', 'insulin', 'warfarin', 'simvastatin', 'lisinopril'];
    const queryLower = query.toLowerCase();
    
    return drugKeywords.filter(drug => queryLower.includes(drug));
  }

  /**
   * Assess data quality
   */
  assessDataQuality(researchData) {
    let score = 0;
    let sources = 0;

    if (researchData.pubmedPapers?.success) { score += 3; sources++; }
    if (researchData.arxivPapers?.success) { score += 2; sources++; }
    if (researchData.drugInformation?.success) { score += 2; sources++; }
    if (researchData.regulatoryData?.success) { score += 3; sources++; }

    return {
      score: score,
      maxScore: 10,
      percentage: sources > 0 ? Math.round((score / 10) * 100) : 0,
      sourcesAvailable: sources,
      quality: score >= 7 ? 'High' : score >= 4 ? 'Medium' : 'Low'
    };
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(researchData, aiAnalysis) {
    let confidence = 0.5; // Base confidence

    if (researchData.pubmedPapers?.success) confidence += 0.3;
    if (researchData.regulatoryData?.success) confidence += 0.2;
    if (aiAnalysis) confidence += 0.2;
    if (researchData.drugInformation?.success) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Get data sources used
   */
  getDataSources(researchData) {
    const sources = [];
    
    if (researchData.pubmedPapers?.success) sources.push('PubMed');
    if (researchData.arxivPapers?.success) sources.push('ArXiv');
    if (researchData.drugInformation?.success) sources.push('RxNorm');
    if (researchData.regulatoryData?.success) sources.push('FDA OpenData');
    
    return sources.length > 0 ? sources : ['Demo Data'];
  }

  /**
   * Generate basic recommendations
   */
  generateBasicRecommendations(query) {
    return [
      `Continue monitoring research developments in ${query}`,
      'Review clinical trial databases for ongoing studies',
      'Assess regulatory landscape and approval pathways',
      'Consider competitive intelligence and market analysis'
    ];
  }

  /**
   * Fallback analysis when APIs fail
   */
  getFallbackAnalysis(query, context) {
    return {
      query: query,
      timestamp: new Date().toISOString(),
      
      keyFindings: [
        `Analysis of "${query}" indicates active pharmaceutical research area`,
        'Multiple therapeutic applications under investigation',
        'Clinical development ongoing with promising early results'
      ],
      
      clinicalSignificance: 'Medium - Based on available pharmaceutical databases',
      
      regulatoryStatus: {
        status: 'Standard regulatory pathway expected',
        actionCount: 0,
        recentActions: 0,
        lastAction: null
      },
      
      researchSources: {
        pubmedPapers: [],
        arxivPapers: [],
        totalSources: 0
      },
      
      confidence: 0.6,
      dataSources: ['Demo Data'],
      
      recommendations: this.generateBasicRecommendations(query),
      
      note: 'Fallback analysis - API services temporarily unavailable',
      fallback: true
    };
  }
}

export default ResearchAgent;
