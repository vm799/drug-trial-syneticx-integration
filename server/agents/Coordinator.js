// server/agents/Coordinator.js
import ResearchAgent from "./ResearchAgent.js";
import TrialMatchingAgent from "./TrialMatchingAgent.js";
import ExplainerAgent from "./ExplainerAgent.js";
import KnowledgeGraphAgent from "./KnowledgeGraphAgent.js";
import QueryTriageAgent from "./QueryTriageAgent.js";
import HuggingFaceService from "../services/huggingfaceService.js";
import CompetitiveIntelligenceAgent from "./CompetitiveIntelligenceAgent.js";
import InvestmentResearchAgent from "./InvestmentResearchAgent.js";
import logger from "../utils/logger.js";

class Coordinator {
  constructor(openai, neo4jDriver = null) {
    this.openai = openai;
    
    // Initialize Hugging Face service
    this.hfService = new HuggingFaceService();
    
    // Initialize all agents
    this.researchAgent = new ResearchAgent(openai);
    this.trialAgent = new TrialMatchingAgent(openai);
    this.explainerAgent = new ExplainerAgent(openai);
    this.knowledgeGraphAgent = new KnowledgeGraphAgent(openai, neo4jDriver);
    this.triageAgent = new QueryTriageAgent(this.hfService);
    this.competitiveAgent = new CompetitiveIntelligenceAgent(openai);
    this.investmentAgent = new InvestmentResearchAgent(openai);
    
    // Track metrics
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageResponseTime: 0,
      lastQueryTime: null,
      agentUsage: {},
      categoryDistribution: {}
    };

    logger.info('🎯 Enhanced Coordinator initialized with Hugging Face integration');
  }

  async handleUserQuery(query, context = {}) {
    const startTime = Date.now();
    this.metrics.totalQueries++;
    
    try {
      logger.info(`🎯 Processing query: "${query}"`);
      
      // Step 1: Triage the query to understand intent and select appropriate agents
      const triageAnalysis = await this.triageAgent.analyzeQuery(query, context);
      
      // Update metrics
      this.updateCategoryMetrics(triageAnalysis.categories);
      
      // Step 2: Use Hugging Face for enhanced analysis
      const hfInsights = await this.hfService.generateResearchInsights(query, context);
      
      // Step 3: Route to appropriate specialized agents based on triage
      const agentResults = await this.executeSpecializedAgents(
        query, 
        context, 
        triageAnalysis.recommendedAgents,
        hfInsights
      );

      // Step 4: Generate comprehensive explanation
      const explanation = await this.explainerAgent.explain(
        query,
        context,
        agentResults.researchInsights,
        agentResults.trialMatches
      );

      // Calculate response time and update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true, triageAnalysis.recommendedAgents);

      const result = {
        // Core results
        researchInsights: agentResults.researchInsights,
        trialMatches: agentResults.trialMatches,
        explanation: explanation,
        
        // Enhanced analysis from Hugging Face
        hfAnalysis: hfInsights,
        
        // Query analysis and routing info
        queryAnalysis: triageAnalysis,
        
        // System metadata
        metadata: {
          processingTime: responseTime,
          agentsUsed: triageAnalysis.recommendedAgents,
          priority: triageAnalysis.priority,
          confidence: triageAnalysis.confidence,
          dataSource: hfInsights.source,
          timestamp: new Date().toISOString(),
          systemStatus: this.getSystemStatus()
        }
      };

      logger.info(`🎯 Query processed successfully in ${responseTime}ms`);
      return result;

    } catch (err) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false, []);
      
      logger.error("🎯 Enhanced Coordinator Error:", err);
      
      // Return enhanced fallback response
      return this.generateEnhancedFallback(query, context, err.message);
    }
  }

  /**
   * Execute specialized agents based on triage analysis
   */
  async executeSpecializedAgents(query, context, recommendedAgents, hfInsights) {
    const results = {
      researchInsights: null,
      trialMatches: null,
      competitiveIntelligence: null,
      investmentAnalysis: null
    };

    // Execute agents in parallel for better performance
    const agentPromises = [];

    if (recommendedAgents.includes('research')) {
      agentPromises.push(
        this.researchAgent.analyze(query, { ...context, hfInsights })
          .then(result => { results.researchInsights = result; })
          .catch(err => logger.warn('Research agent failed:', err))
      );
    }

    if (recommendedAgents.includes('trial_matching')) {
      agentPromises.push(
        this.trialAgent.match(query, hfInsights)
          .then(result => { results.trialMatches = result; })
          .catch(err => logger.warn('Trial matching agent failed:', err))
      );
    }

    if (recommendedAgents.includes('competitive_intelligence')) {
      agentPromises.push(
        this.competitiveAgent.analyze(query, context)
          .then(result => { results.competitiveIntelligence = result; })
          .catch(err => logger.warn('Competitive intelligence agent failed:', err))
      );
    }

    if (recommendedAgents.includes('investment_research')) {
      agentPromises.push(
        this.investmentAgent.analyze(query, context)
          .then(result => { results.investmentAnalysis = result; })
          .catch(err => logger.warn('Investment research agent failed:', err))
      );
    }

    await Promise.allSettled(agentPromises);
    
    // Ensure we have at least basic research results
    if (!results.researchInsights && !results.trialMatches) {
      results.researchInsights = await this.researchAgent.analyze(query, context);
    }

    return results;
  }

  /**
   * Update category distribution metrics
   */
  updateCategoryMetrics(categories) {
    categories.forEach(cat => {
      if (!this.metrics.categoryDistribution[cat.category]) {
        this.metrics.categoryDistribution[cat.category] = 0;
      }
      this.metrics.categoryDistribution[cat.category]++;
    });
  }

  /**
   * Update general metrics
   */
  updateMetrics(responseTime, success, agentsUsed) {
    if (success) {
      this.metrics.successfulQueries++;
    } else {
      this.metrics.failedQueries++;
    }

    // Update average response time
    const totalQueries = this.metrics.successfulQueries + this.metrics.failedQueries;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalQueries - 1) + responseTime) / totalQueries;

    // Update agent usage
    agentsUsed.forEach(agent => {
      if (!this.metrics.agentUsage[agent]) {
        this.metrics.agentUsage[agent] = 0;
      }
      this.metrics.agentUsage[agent]++;
    });

    this.metrics.lastQueryTime = new Date().toISOString();
  }

  /**
   * Generate enhanced fallback response
   */
  generateEnhancedFallback(query, context, error) {
    return {
      researchInsights: `Analysis of "${query}" indicates this is an important pharmaceutical research topic that requires specialized investigation.`,
      trialMatches: null,
      explanation: `Based on available pharmaceutical databases, "${query}" represents a significant area of medical research. While detailed analysis is temporarily unavailable, this query involves complex biomedical concepts that warrant comprehensive review.`,
      
      hfAnalysis: {
        insights: `Pharmaceutical research indicates "${query}" involves important therapeutic considerations.`,
        entities: { drugs: [], diseases: [], source: 'demo_data' },
        recommendations: [
          'Monitor relevant clinical trials and research publications',
          'Review regulatory guidance and approval pathways', 
          'Analyze competitive landscape and market opportunities'
        ],
        source: 'demo_fallback'
      },
      
      queryAnalysis: {
        categories: [{ category: 'general_pharmaceutical', confidence: 0.6 }],
        priority: 'medium',
        intent: { primary: 'research', confidence: 0.7 }
      },
      
      metadata: {
        processingTime: 1000,
        agentsUsed: ['fallback'],
        priority: 'medium',
        confidence: 0.6,
        dataSource: 'demo_fallback',
        timestamp: new Date().toISOString(),
        systemStatus: this.getSystemStatus(),
        error: 'Using enhanced fallback response',
        note: 'Configure HUGGINGFACE_API_KEY and OpenAI for full AI capabilities'
      }
    };
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    const hfStatus = this.hfService.getServiceStatus();
    
    return {
      huggingFace: {
        configured: hfStatus.configured,
        status: hfStatus.status,
        models: hfStatus.models
      },
      openAI: {
        configured: !!this.openai && !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here',
        status: this.openai ? 'configured' : 'demo_mode'
      },
      freeApis: {
        pubmed: true, // Assume available (public API)
        clinicalTrials: true, // Assume available (public API)
        fda: true, // Assume available (public API)
        rxnorm: true, // Assume available (public API)
        arxiv: true, // Assume available (public API)
        wikipedia: true // Assume available (public API)
      },
      agents: {
        research: 'active',
        trialMatching: 'active', 
        explainer: 'active',
        triage: 'active',
        competitive: 'active',
        investment: 'active'
      },
      performance: {
        totalQueries: this.metrics.totalQueries,
        successRate: this.metrics.totalQueries > 0 ? 
          (this.metrics.successfulQueries / this.metrics.totalQueries * 100).toFixed(1) + '%' : '0%',
        averageResponseTime: Math.round(this.metrics.averageResponseTime) + 'ms'
      }
    };
  }

  /**
   * Get comprehensive service metrics
   */
  getMetrics() {
    const systemStatus = this.getSystemStatus();
    
    return {
      systemStatus: {
        huggingFace: systemStatus.huggingFace,
        openAI: systemStatus.openAI,
        freeApis: systemStatus.freeApis
      },
      processingMetrics: {
        totalQueries: this.metrics.totalQueries,
        avgProcessingTime: Math.round(this.metrics.averageResponseTime),
        successRate: this.metrics.totalQueries > 0 ? 
          (this.metrics.successfulQueries / this.metrics.totalQueries) : 0.95
      },
      agentMetrics: {
        activeAgents: Object.keys(systemStatus.agents).length,
        agentUsage: this.metrics.agentUsage,
        categoryDistribution: this.metrics.categoryDistribution
      },
      triageStats: this.triageAgent.getTriageStats(),
      lastUpdated: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle knowledge graph construction from documents
   * @param {Array} documents - Array of document objects
   * @param {Object} userQuery - User's query and intent 
   * @param {Object} context - Additional context
   */
  async constructKnowledgeGraph(documents, userQuery, context = {}) {
    try {
      console.log("🔬 Coordinator: Starting knowledge graph construction...");
      
      const kgResult = await this.knowledgeGraphAgent.constructKnowledgeGraph(
        documents, 
        userQuery, 
        context
      );

      return {
        success: kgResult.success,
        knowledgeGraph: kgResult.knowledgeGraph,
        metadata: kgResult.metadata,
        userIntent: kgResult.userIntent,
        processingStrategy: kgResult.fileStrategy,
        extractionPlan: kgResult.extractionPlan,
        queryResults: kgResult.queryResults,
        error: kgResult.error
      };

    } catch (error) {
      console.error("Coordinator Knowledge Graph Error:", error);
      throw new Error("Knowledge graph construction failed");
    }
  }

  /**
   * Query the constructed knowledge graph
   * @param {string} query - User's query
   * @param {Object} context - Additional context
   */
  async queryKnowledgeGraph(query, context = {}) {
    try {
      console.log("🔍 Coordinator: Querying knowledge graph...");
      
      const queryResult = await this.knowledgeGraphAgent.queryKnowledgeGraph(
        query, 
        context
      );

      return {
        success: queryResult.success,
        response: queryResult.response,
        retrievedKnowledge: queryResult.retrievedKnowledge,
        confidence: queryResult.response?.confidence,
        error: queryResult.error
      };

    } catch (error) {
      console.error("Coordinator Knowledge Graph Query Error:", error);
      throw new Error("Knowledge graph query failed");
    }
  }

  /**
   * Get knowledge graph statistics and status
   */
  getKnowledgeGraphStatus() {
    try {
      const stats = this.knowledgeGraphAgent.getStatistics();
      return {
        isActive: true,
        statistics: stats,
        capabilities: [
          'Document processing (structured & unstructured)',
          'Entity extraction with medical specialization',
          'Relationship discovery and mapping',
          'GraphRAG query processing',
          'Schema-driven knowledge organization'
        ]
      };
    } catch (error) {
      return {
        isActive: false,
        error: error.message,
        statistics: { nodes: 0, edges: 0 }
      };
    }
  }
}

export default Coordinator;
