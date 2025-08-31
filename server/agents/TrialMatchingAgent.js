// server/agents/TrialMatchingAgent.js
import FreeApiService from '../services/freeApiService.js';
import logger from '../utils/logger.js';

class TrialMatchingAgent {
  constructor(openai) {
    this.openai = openai;
    this.freeApiService = new FreeApiService();
    logger.info('🧪 Enhanced Trial Matching Agent initialized with ClinicalTrials.gov API');
  }

  async match(query, researchInsights) {
    try {
      logger.info(`🧪 Matching clinical trials for: "${query}"`);
      
      // Step 1: Search real clinical trials data
      const trialsData = await this.freeApiService.searchClinicalTrials(query, 10);
      
      // Step 2: Filter and rank trials based on relevance
      const rankedTrials = this.rankTrials(trialsData.trials || [], query, researchInsights);
      
      // Step 3: Generate AI analysis if OpenAI is available
      let aiAnalysis = null;
      if (this.openai && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
        aiAnalysis = await this.generateTrialAnalysis(query, rankedTrials, researchInsights);
      }
      
      // Step 4: Combine results
      const matchResults = this.combineTrialResults(query, rankedTrials, aiAnalysis, trialsData);
      
      logger.info(`🧪 Found ${rankedTrials.length} matching clinical trials`);
      return matchResults;

    } catch (error) {
      logger.error('🧪 Trial matching failed:', error);
      return this.getFallbackTrials(query, researchInsights);
    }
  }

  /**
   * Rank trials based on relevance to query and research insights
   */
  rankTrials(trials, query, researchInsights) {
    if (!Array.isArray(trials) || trials.length === 0) {
      return [];
    }

    return trials.map(trial => {
      let relevanceScore = 0;
      const queryLower = query.toLowerCase();
      
      // Score based on title match
      if (trial.title && trial.title.toLowerCase().includes(queryLower)) {
        relevanceScore += 3;
      }
      
      // Score based on condition match
      if (trial.condition && trial.condition.toLowerCase().includes(queryLower)) {
        relevanceScore += 2;
      }
      
      // Score based on status (recruiting trials are more relevant)
      if (trial.status === 'Recruiting' || trial.status === 'Not yet recruiting') {
        relevanceScore += 2;
      } else if (trial.status === 'Active, not recruiting') {
        relevanceScore += 1;
      }
      
      // Score based on phase (later phases are often more relevant)
      if (trial.phase) {
        if (trial.phase.includes('3') || trial.phase.includes('III')) {
          relevanceScore += 2;
        } else if (trial.phase.includes('2') || trial.phase.includes('II')) {
          relevanceScore += 1.5;
        } else if (trial.phase.includes('1') || trial.phase.includes('I')) {
          relevanceScore += 1;
        }
      }
      
      // Score based on recent start dates
      if (trial.startDate) {
        const startDate = new Date(trial.startDate);
        const currentDate = new Date();
        const daysDiff = (currentDate - startDate) / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 365) { // Started within last year
          relevanceScore += 1;
        }
      }

      return {
        ...trial,
        relevanceScore: relevanceScore,
        matchReasons: this.generateMatchReasons(trial, query, relevanceScore)
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Generate reasons why a trial matches the query
   */
  generateMatchReasons(trial, query, score) {
    const reasons = [];
    const queryLower = query.toLowerCase();
    
    if (trial.title && trial.title.toLowerCase().includes(queryLower)) {
      reasons.push('Title contains search terms');
    }
    
    if (trial.condition && trial.condition.toLowerCase().includes(queryLower)) {
      reasons.push('Condition matches query');
    }
    
    if (trial.status === 'Recruiting') {
      reasons.push('Currently recruiting participants');
    }
    
    if (trial.phase && (trial.phase.includes('3') || trial.phase.includes('III'))) {
      reasons.push('Late-stage (Phase 3) trial');
    }
    
    if (score >= 5) {
      reasons.push('High relevance score');
    } else if (score >= 3) {
      reasons.push('Medium relevance score');
    }
    
    return reasons.length > 0 ? reasons : ['General therapeutic area match'];
  }

  /**
   * Generate AI analysis of trial matches
   */
  async generateTrialAnalysis(query, trials, researchInsights) {
    try {
      const prompt = this.buildTrialAnalysisPrompt(query, trials, researchInsights);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a clinical trial analysis expert. Analyze the provided trials and generate insights about their relevance and significance." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      return response.choices[0].message.content;

    } catch (error) {
      logger.error('🧪 Trial AI analysis failed:', error);
      return null;
    }
  }

  /**
   * Build analysis prompt for AI
   */
  buildTrialAnalysisPrompt(query, trials, researchInsights) {
    let prompt = `Analyze the following clinical trials for: "${query}"\n\n`;

    prompt += `Research Context: ${JSON.stringify(researchInsights, null, 2)}\n\n`;

    if (trials.length > 0) {
      prompt += `Clinical Trials Found:\n`;
      trials.slice(0, 5).forEach((trial, index) => {
        prompt += `${index + 1}. ${trial.title}\n`;
        prompt += `   Status: ${trial.status}\n`;
        prompt += `   Phase: ${trial.phase}\n`;
        prompt += `   Condition: ${trial.condition}\n`;
        prompt += `   Sponsor: ${trial.sponsor}\n`;
        prompt += `   Relevance Score: ${trial.relevanceScore}\n\n`;
      });
    }

    prompt += `Please provide:\n`;
    prompt += `1. Overall assessment of trial landscape for this query\n`;
    prompt += `2. Most promising trials and why\n`;
    prompt += `3. Gaps in current research that need attention\n`;
    prompt += `4. Timeline expectations for results\n`;
    prompt += `5. Patient enrollment opportunities\n`;

    return prompt;
  }

  /**
   * Combine trial results into comprehensive response
   */
  combineTrialResults(query, rankedTrials, aiAnalysis, originalData) {
    return {
      query: query,
      timestamp: new Date().toISOString(),
      
      // Trial matches
      matchedTrials: rankedTrials.slice(0, 8), // Top 8 most relevant
      totalTrialsFound: rankedTrials.length,
      
      // Summary statistics
      trialSummary: this.generateTrialSummary(rankedTrials),
      
      // Phase distribution
      phaseDistribution: this.analyzePhaseDistribution(rankedTrials),
      
      // Status analysis
      statusAnalysis: this.analyzeTrialStatus(rankedTrials),
      
      // Recruitment opportunities
      recruitmentOpportunities: rankedTrials.filter(trial => 
        trial.status === 'Recruiting' || trial.status === 'Not yet recruiting'
      ).slice(0, 3),
      
      // AI insights (if available)
      aiAnalysis: aiAnalysis,
      
      // Data quality and sources
      dataQuality: {
        source: originalData.source || 'clinicaltrials_gov',
        success: originalData.success !== false,
        lastUpdated: originalData.timestamp,
        confidence: this.calculateTrialConfidence(rankedTrials, originalData.success)
      },
      
      // Recommendations
      recommendations: this.generateTrialRecommendations(rankedTrials, query)
    };
  }

  /**
   * Generate trial summary statistics
   */
  generateTrialSummary(trials) {
    if (!trials || trials.length === 0) {
      return {
        totalTrials: 0,
        activeTrials: 0,
        recruitingTrials: 0,
        completedTrials: 0,
        averageEnrollment: 0
      };
    }

    const activeTrials = trials.filter(t => t.status && t.status.includes('Active')).length;
    const recruitingTrials = trials.filter(t => t.status === 'Recruiting').length;
    const completedTrials = trials.filter(t => t.status === 'Completed').length;
    
    const enrollments = trials
      .map(t => parseInt(t.enrollment))
      .filter(e => !isNaN(e));
    const averageEnrollment = enrollments.length > 0 
      ? Math.round(enrollments.reduce((a, b) => a + b, 0) / enrollments.length) 
      : 0;

    return {
      totalTrials: trials.length,
      activeTrials,
      recruitingTrials,
      completedTrials,
      averageEnrollment
    };
  }

  /**
   * Analyze phase distribution
   */
  analyzePhaseDistribution(trials) {
    const phases = {};
    
    trials.forEach(trial => {
      const phase = trial.phase || 'Not specified';
      phases[phase] = (phases[phase] || 0) + 1;
    });

    return phases;
  }

  /**
   * Analyze trial status distribution
   */
  analyzeTrialStatus(trials) {
    const statuses = {};
    
    trials.forEach(trial => {
      const status = trial.status || 'Unknown';
      statuses[status] = (statuses[status] || 0) + 1;
    });

    return statuses;
  }

  /**
   * Calculate confidence score for trial data
   */
  calculateTrialConfidence(trials, apiSuccess) {
    let confidence = 0.5; // Base confidence
    
    if (apiSuccess) confidence += 0.3;
    if (trials && trials.length >= 5) confidence += 0.2;
    if (trials && trials.some(t => t.relevanceScore >= 5)) confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Generate recommendations based on trial analysis
   */
  generateTrialRecommendations(trials, query) {
    const recommendations = [];
    
    if (!trials || trials.length === 0) {
      recommendations.push('Consider broadening search terms to find more trials');
      recommendations.push('Check for trials in related therapeutic areas');
      return recommendations;
    }

    const recruitingTrials = trials.filter(t => t.status === 'Recruiting');
    if (recruitingTrials.length > 0) {
      recommendations.push(`${recruitingTrials.length} trials currently recruiting - consider patient enrollment opportunities`);
    }

    const phase3Trials = trials.filter(t => t.phase && (t.phase.includes('3') || t.phase.includes('III')));
    if (phase3Trials.length > 0) {
      recommendations.push(`${phase3Trials.length} Phase 3 trials identified - monitor for upcoming results`);
    }

    const recentTrials = trials.filter(t => {
      if (!t.startDate) return false;
      const startDate = new Date(t.startDate);
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      return startDate > oneYearAgo;
    });

    if (recentTrials.length > 0) {
      recommendations.push(`${recentTrials.length} trials started recently - active research area`);
    }

    recommendations.push(`Monitor trial progression and results publication timelines`);
    recommendations.push(`Consider partnerships with leading trial sponsors`);

    return recommendations;
  }

  /**
   * Fallback trial results when API fails
   */
  getFallbackTrials(query, researchInsights) {
    return {
      query: query,
      timestamp: new Date().toISOString(),
      
      matchedTrials: [
        {
          nctId: 'NCT00000001',
          title: `Phase 2 Study of ${query} in Patients`,
          status: 'Recruiting',
          phase: 'Phase 2',
          condition: query,
          sponsor: 'Academic Medical Center',
          enrollment: '200',
          summary: `A randomized controlled trial investigating ${query}`,
          relevanceScore: 4,
          matchReasons: ['Condition matches query', 'Currently recruiting']
        }
      ],
      
      totalTrialsFound: 1,
      
      trialSummary: {
        totalTrials: 1,
        activeTrials: 1,
        recruitingTrials: 1,
        completedTrials: 0,
        averageEnrollment: 200
      },
      
      dataQuality: {
        source: 'demo_fallback',
        success: false,
        confidence: 0.6,
        note: 'Demo data - ClinicalTrials.gov API temporarily unavailable'
      },
      
      recommendations: [
        'Real clinical trial data temporarily unavailable',
        'Check ClinicalTrials.gov directly for latest information',
        'Consider consulting with clinical research coordinators'
      ],
      
      fallback: true
    };
  }
}

export default TrialMatchingAgent;
