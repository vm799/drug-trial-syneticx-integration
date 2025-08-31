/**
 * Query Triage Agent
 * Analyzes user queries and routes them to appropriate specialized agents
 */

import logger from '../utils/logger.js';

class QueryTriageAgent {
  constructor(huggingFaceService) {
    this.hfService = huggingFaceService;
    
    // Query categories and their keywords
    this.categories = {
      drug_research: {
        keywords: ['drug', 'medication', 'pharmaceutical', 'compound', 'molecule', 'therapy', 'treatment'],
        confidence_threshold: 0.7,
        agents: ['research', 'trial_matching'],
        priority: 'high'
      },
      clinical_trials: {
        keywords: ['trial', 'study', 'clinical', 'phase', 'patient', 'efficacy', 'safety', 'endpoint'],
        confidence_threshold: 0.8,
        agents: ['trial_matching', 'research'],
        priority: 'high'
      },
      regulatory: {
        keywords: ['fda', 'approval', 'regulation', 'compliance', 'warning letter', 'recall'],
        confidence_threshold: 0.9,
        agents: ['research', 'competitive_intelligence'],
        priority: 'critical'
      },
      patent_ip: {
        keywords: ['patent', 'intellectual property', 'ip', 'exclusivity', 'generic', 'biosimilar'],
        confidence_threshold: 0.8,
        agents: ['competitive_intelligence', 'research'],
        priority: 'high'
      },
      competitive_intelligence: {
        keywords: ['competitor', 'market', 'competition', 'landscape', 'share', 'positioning'],
        confidence_threshold: 0.7,
        agents: ['competitive_intelligence', 'research'],
        priority: 'medium'
      },
      financial_investment: {
        keywords: ['investment', 'revenue', 'financial', 'valuation', 'merger', 'acquisition'],
        confidence_threshold: 0.7,
        agents: ['investment_research', 'competitive_intelligence'],
        priority: 'medium'
      },
      disease_research: {
        keywords: ['disease', 'condition', 'syndrome', 'disorder', 'pathology', 'diagnosis'],
        confidence_threshold: 0.6,
        agents: ['research', 'trial_matching'],
        priority: 'medium'
      },
      safety_adverse_events: {
        keywords: ['safety', 'adverse', 'side effect', 'toxicity', 'risk', 'contraindication'],
        confidence_threshold: 0.8,
        agents: ['research', 'explainer'],
        priority: 'critical'
      }
    };

    logger.info('🎯 Query Triage Agent initialized');
  }

  /**
   * Analyze and categorize user query
   */
  async analyzeQuery(query, context = {}) {
    try {
      logger.info(`🎯 Analyzing query: "${query}"`);
      
      const analysis = {
        originalQuery: query,
        timestamp: new Date().toISOString(),
        categories: [],
        priority: 'medium',
        recommendedAgents: [],
        entities: null,
        intent: null,
        confidence: 0
      };

      // Step 1: Extract medical entities using Hugging Face
      const entities = await this.hfService.extractMedicalEntities(query);
      analysis.entities = entities;

      // Step 2: Keyword-based categorization
      const keywordCategories = this.categorizeByKeywords(query);
      
      // Step 3: Entity-based categorization
      const entityCategories = this.categorizeByEntities(entities);
      
      // Step 4: Combine and score categories
      const combinedCategories = this.combineCategories(keywordCategories, entityCategories);
      
      // Step 5: Determine intent and priority
      analysis.categories = combinedCategories;
      analysis.intent = this.determineIntent(query, combinedCategories);
      analysis.priority = this.determinePriority(combinedCategories);
      analysis.recommendedAgents = this.selectAgents(combinedCategories);
      analysis.confidence = this.calculateConfidence(combinedCategories);

      // Step 6: Generate processing strategy
      analysis.processingStrategy = this.generateProcessingStrategy(analysis);

      logger.info(`🎯 Query categorized as: ${analysis.categories.map(c => c.category).join(', ')}`);
      logger.info(`🎯 Priority: ${analysis.priority}, Agents: ${analysis.recommendedAgents.join(', ')}`);

      return analysis;

    } catch (error) {
      logger.error('🎯 Query analysis failed:', error);
      return this.getFallbackAnalysis(query);
    }
  }

  /**
   * Categorize query based on keyword matching
   */
  categorizeByKeywords(query) {
    const queryLower = query.toLowerCase();
    const categories = [];

    for (const [categoryName, config] of Object.entries(this.categories)) {
      let score = 0;
      let matchedKeywords = [];

      config.keywords.forEach(keyword => {
        if (queryLower.includes(keyword.toLowerCase())) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      });

      if (score > 0) {
        const confidence = Math.min(score / config.keywords.length, 1.0);
        
        if (confidence >= config.confidence_threshold * 0.5) { // Lower threshold for keyword matching
          categories.push({
            category: categoryName,
            confidence: confidence,
            matchedKeywords: matchedKeywords,
            method: 'keyword_matching'
          });
        }
      }
    }

    return categories.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Categorize query based on extracted entities
   */
  categorizeByEntities(entities) {
    const categories = [];

    if (entities.drugs && entities.drugs.length > 0) {
      categories.push({
        category: 'drug_research',
        confidence: 0.9,
        entities: entities.drugs,
        method: 'entity_extraction'
      });
    }

    if (entities.diseases && entities.diseases.length > 0) {
      categories.push({
        category: 'disease_research',
        confidence: 0.8,
        entities: entities.diseases,
        method: 'entity_extraction'
      });
    }

    return categories;
  }

  /**
   * Combine keyword and entity-based categories
   */
  combineCategories(keywordCategories, entityCategories) {
    const categoryMap = new Map();

    // Add keyword categories
    keywordCategories.forEach(cat => {
      categoryMap.set(cat.category, cat);
    });

    // Merge entity categories
    entityCategories.forEach(entityCat => {
      if (categoryMap.has(entityCat.category)) {
        const existing = categoryMap.get(entityCat.category);
        existing.confidence = Math.max(existing.confidence, entityCat.confidence);
        existing.entities = entityCat.entities;
        existing.method = 'combined';
      } else {
        categoryMap.set(entityCat.category, entityCat);
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Determine user intent from query and categories
   */
  determineIntent(query, categories) {
    const queryLower = query.toLowerCase();
    
    // Specific intent patterns
    const intentPatterns = {
      search: ['find', 'search', 'look for', 'show me', 'what is', 'tell me about'],
      compare: ['compare', 'versus', 'vs', 'difference between', 'better than'],
      analyze: ['analyze', 'analysis', 'evaluate', 'assessment', 'review'],
      monitor: ['monitor', 'track', 'watch', 'alert', 'notify'],
      research: ['research', 'study', 'investigate', 'explore', 'understand'],
      predict: ['predict', 'forecast', 'project', 'estimate', 'future'],
      recommend: ['recommend', 'suggest', 'advise', 'best', 'should']
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => queryLower.includes(pattern))) {
        return {
          primary: intent,
          confidence: 0.8,
          patterns_matched: patterns.filter(pattern => queryLower.includes(pattern))
        };
      }
    }

    // Default intent based on top category
    const topCategory = categories[0];
    if (topCategory) {
      return {
        primary: 'research',
        confidence: 0.6,
        inferred_from_category: topCategory.category
      };
    }

    return {
      primary: 'general_inquiry',
      confidence: 0.5
    };
  }

  /**
   * Determine priority based on categories
   */
  determinePriority(categories) {
    if (categories.length === 0) return 'low';

    const priorityScores = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    let maxPriority = 'low';
    let maxScore = 0;

    categories.forEach(cat => {
      const categoryConfig = this.categories[cat.category];
      if (categoryConfig) {
        const score = priorityScores[categoryConfig.priority] || 1;
        if (score > maxScore) {
          maxScore = score;
          maxPriority = categoryConfig.priority;
        }
      }
    });

    return maxPriority;
  }

  /**
   * Select appropriate agents based on categories
   */
  selectAgents(categories) {
    const agentSet = new Set();

    categories.forEach(cat => {
      const categoryConfig = this.categories[cat.category];
      if (categoryConfig && categoryConfig.agents) {
        categoryConfig.agents.forEach(agent => agentSet.add(agent));
      }
    });

    // Default agents if no specific match
    if (agentSet.size === 0) {
      agentSet.add('research');
      agentSet.add('explainer');
    }

    return Array.from(agentSet);
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidence(categories) {
    if (categories.length === 0) return 0.3;

    // Weighted average with higher weight for top categories
    let totalScore = 0;
    let totalWeight = 0;

    categories.forEach((cat, index) => {
      const weight = 1 / (index + 1); // Decreasing weight for lower-ranked categories
      totalScore += cat.confidence * weight;
      totalWeight += weight;
    });

    return Math.min(totalScore / totalWeight, 1.0);
  }

  /**
   * Generate processing strategy based on analysis
   */
  generateProcessingStrategy(analysis) {
    const strategy = {
      approach: 'standard',
      agents_sequence: analysis.recommendedAgents,
      special_handling: [],
      estimated_processing_time: '5-15 seconds',
      data_sources: ['internal_knowledge', 'rss_feeds']
    };

    // Adjust strategy based on priority and categories
    if (analysis.priority === 'critical') {
      strategy.approach = 'high_priority';
      strategy.estimated_processing_time = '3-8 seconds';
      strategy.special_handling.push('priority_queue');
    }

    // Add specific data sources based on categories
    analysis.categories.forEach(cat => {
      switch (cat.category) {
        case 'clinical_trials':
          strategy.data_sources.push('clinicaltrials_gov');
          break;
        case 'regulatory':
          strategy.data_sources.push('fda_api');
          break;
        case 'patent_ip':
          strategy.data_sources.push('uspto_api');
          break;
        case 'financial_investment':
          strategy.data_sources.push('financial_apis');
          break;
      }
    });

    return strategy;
  }

  /**
   * Get fallback analysis when main processing fails
   */
  getFallbackAnalysis(query) {
    return {
      originalQuery: query,
      timestamp: new Date().toISOString(),
      categories: [
        {
          category: 'general_pharmaceutical',
          confidence: 0.5,
          method: 'fallback'
        }
      ],
      priority: 'medium',
      recommendedAgents: ['research', 'explainer'],
      entities: null,
      intent: {
        primary: 'general_inquiry',
        confidence: 0.5
      },
      confidence: 0.5,
      processingStrategy: {
        approach: 'fallback',
        agents_sequence: ['research', 'explainer'],
        special_handling: ['error_recovery'],
        estimated_processing_time: '10-20 seconds',
        data_sources: ['internal_knowledge']
      },
      error: 'Using fallback analysis - full triage unavailable'
    };
  }

  /**
   * Get service statistics and performance metrics
   */
  getTriageStats() {
    return {
      categories_available: Object.keys(this.categories).length,
      total_keywords: Object.values(this.categories).reduce((sum, cat) => sum + cat.keywords.length, 0),
      service_status: 'operational',
      last_analysis: new Date().toISOString()
    };
  }
}

export default QueryTriageAgent;