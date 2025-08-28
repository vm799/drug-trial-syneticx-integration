// server/agents/Coordinator.js
import ResearchAgent from "./ResearchAgent.js";
import TrialMatchingAgent from "./TrialMatchingAgent.js";
import ExplainerAgent from "./ExplainerAgent.js";
import KnowledgeGraphAgent from "./KnowledgeGraphAgent.js";

class Coordinator {
  constructor(openai, neo4jDriver = null) {
    this.openai = openai;
    this.researchAgent = new ResearchAgent(openai);
    this.trialAgent = new TrialMatchingAgent(openai);
    this.explainerAgent = new ExplainerAgent(openai);
    this.knowledgeGraphAgent = new KnowledgeGraphAgent(openai, neo4jDriver);
  }

  async handleUserQuery(query, context = {}) {
    try {
      // Step 1: Analyze research
      const researchInsights = await this.researchAgent.analyze(query, context);

      // Step 2: Match trials
      const trialMatches = await this.trialAgent.match(query, researchInsights);

      // Step 3: Summarize
      const explanation = await this.explainerAgent.explain(
        query,
        context,        researchInsights,
        trialMatches
      );

      return {
        researchInsights,
        trialMatches,
        explanation,
      };
    } catch (err) {
      console.error("Coordinator Error:", err);
      throw new Error("Agent orchestration failed");
    }
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
