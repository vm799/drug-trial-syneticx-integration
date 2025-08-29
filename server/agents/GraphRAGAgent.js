// server/agents/GraphRAGAgent.js

/**
 * GraphRAG Agent - Retrieval Augmented Generation using Knowledge Graph
 * Handles querying and reasoning over the constructed knowledge graph
 */
class GraphRAGAgent {
  constructor(openaiService, neo4jDriver = null) {
    this.openaiService = openaiService;
    this.neo4jDriver = neo4jDriver;
    this.queryCache = new Map();
  }

  /**
   * Query the knowledge graph using RAG approach
   * @param {string} query - User's query
   * @param {Object} knowledgeGraph - In-memory knowledge graph
   * @param {Object} context - Additional context
   */
  async query(query, knowledgeGraph, context = {}) {
    try {
      console.log('🔍 GraphRAG Agent: Processing query:', query);

      // Step 1: Understand the query intent and extract entities
      const queryAnalysis = await this.analyzeQuery(query, context);
      
      // Step 2: Retrieve relevant subgraph
      const relevantSubgraph = await this.retrieveRelevantSubgraph(
        queryAnalysis, 
        knowledgeGraph
      );
      
      // Step 3: Rank and filter results
      const rankedResults = this.rankGraphResults(relevantSubgraph, queryAnalysis);
      
      // Step 4: Generate response using retrieved knowledge
      const response = await this.generateRAGResponse(
        query, 
        rankedResults, 
        queryAnalysis, 
        context
      );

      return {
        success: true,
        query: query,
        queryAnalysis,
        retrievedKnowledge: rankedResults,
        response: response,
        metadata: {
          nodesRetrieved: rankedResults.nodes.length,
          relationshipsRetrieved: rankedResults.relationships.length,
          queryTime: Date.now()
        }
      };

    } catch (error) {
      console.error('❌ GraphRAG Query Error:', error);
      return {
        success: false,
        error: error.message,
        query: query,
        response: "I apologize, but I encountered an error while searching the knowledge graph."
      };
    }
  }

  /**
   * Analyze the user's query to understand intent and extract key entities
   */
  async analyzeQuery(query, context) {
    try {
      const prompt = `Analyze this medical research query to understand what the user is looking for:

Query: "${query}"

Context: ${JSON.stringify(context, null, 2)}

Analyze and return JSON with:
1. queryType: What type of query (entity_lookup, relationship_search, path_finding, aggregation, comparison)
2. medicalDomain: Primary medical area (cardiology, oncology, neurology, etc.)
3. keyEntities: List of medical entities mentioned
4. relationshipTypes: What relationships to look for
5. queryIntent: What the user wants to know
6. searchDepth: How deep to search (1=direct, 2=neighbors, 3=extended)

Format:
{
  "queryType": "relationship_search",
  "medicalDomain": "cardiology", 
  "keyEntities": ["aspirin", "heart disease"],
  "relationshipTypes": ["treats", "prevents", "associated_with"],
  "queryIntent": "Find how aspirin relates to heart disease",
  "searchDepth": 2,
  "expectedAnswerType": "relationship_explanation"
}`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.1,
        maxTokens: 500
      });

      return JSON.parse(response.content);

    } catch (error) {
      console.error('Query analysis error:', error);
      // Fallback analysis
      return {
        queryType: "entity_lookup",
        medicalDomain: "general",
        keyEntities: this.extractEntitiesFromQuery(query),
        relationshipTypes: ["related_to", "associated_with"],
        queryIntent: query,
        searchDepth: 2,
        expectedAnswerType: "general_information"
      };
    }
  }

  /**
   * Retrieve relevant subgraph based on query analysis
   */
  async retrieveRelevantSubgraph(queryAnalysis, knowledgeGraph) {
    const relevantNodes = new Map();
    const relevantRelationships = new Map();
    const visitedNodes = new Set();

    try {
      // Find seed nodes (entities mentioned in query)
      const seedNodes = this.findSeedNodes(queryAnalysis.keyEntities, knowledgeGraph);
      
      // Expand from seed nodes based on search depth
      for (const seedNode of seedNodes) {
        await this.expandFromNode(
          seedNode, 
          queryAnalysis.searchDepth, 
          queryAnalysis.relationshipTypes,
          knowledgeGraph,
          relevantNodes,
          relevantRelationships,
          visitedNodes
        );
      }

      // If no seed nodes found, do broader search
      if (seedNodes.length === 0) {
        const broaderResults = this.broadSearch(queryAnalysis, knowledgeGraph);
        broaderResults.nodes.forEach((node, id) => relevantNodes.set(id, node));
        broaderResults.relationships.forEach((rel, id) => relevantRelationships.set(id, rel));
      }

      return {
        nodes: Array.from(relevantNodes.values()),
        relationships: Array.from(relevantRelationships.values()),
        searchStats: {
          seedNodesFound: seedNodes.length,
          totalNodesRetrieved: relevantNodes.size,
          totalRelationshipsRetrieved: relevantRelationships.size
        }
      };

    } catch (error) {
      console.error('Subgraph retrieval error:', error);
      return { nodes: [], relationships: [], searchStats: {} };
    }
  }

  /**
   * Find nodes that match the query entities
   */
  findSeedNodes(keyEntities, knowledgeGraph) {
    const seedNodes = [];
    
    for (const [nodeId, node] of knowledgeGraph.nodes) {
      for (const entity of keyEntities) {
        if (this.entityMatches(node.label, entity) || 
            this.entityMatches(node.type, entity)) {
          seedNodes.push({ id: nodeId, ...node });
          break;
        }
      }
    }

    return seedNodes;
  }

  /**
   * Expand from a seed node to find related nodes
   */
  async expandFromNode(seedNode, depth, relationshipTypes, knowledgeGraph, 
                      relevantNodes, relevantRelationships, visitedNodes, currentDepth = 0) {
    
    if (currentDepth >= depth || visitedNodes.has(seedNode.id)) {
      return;
    }

    visitedNodes.add(seedNode.id);
    relevantNodes.set(seedNode.id, seedNode);

    // Find connected relationships
    for (const [relId, relationship] of knowledgeGraph.edges) {
      if (relationship.source === seedNode.id || relationship.target === seedNode.id) {
        
        // Check if relationship type is relevant
        if (relationshipTypes.length === 0 || 
            relationshipTypes.some(type => 
              relationship.type.toLowerCase().includes(type.toLowerCase()))) {
          
          relevantRelationships.set(relId, relationship);
          
          // Get the connected node
          const connectedNodeId = relationship.source === seedNode.id ? 
            relationship.target : relationship.source;
          
          if (knowledgeGraph.nodes.has(connectedNodeId)) {
            const connectedNode = knowledgeGraph.nodes.get(connectedNodeId);
            
            // Recursively expand if within depth limit
            if (currentDepth < depth - 1) {
              await this.expandFromNode(
                { id: connectedNodeId, ...connectedNode },
                depth,
                relationshipTypes,
                knowledgeGraph,
                relevantNodes,
                relevantRelationships,
                visitedNodes,
                currentDepth + 1
              );
            } else {
              relevantNodes.set(connectedNodeId, connectedNode);
            }
          }
        }
      }
    }
  }

  /**
   * Broader search when no specific entities found
   */
  broadSearch(queryAnalysis, knowledgeGraph) {
    const nodes = new Map();
    const relationships = new Map();
    const queryTerms = queryAnalysis.queryIntent.toLowerCase().split(/\s+/);
    
    // Search by node labels and types
    for (const [nodeId, node] of knowledgeGraph.nodes) {
      const nodeText = `${node.label} ${node.type}`.toLowerCase();
      
      if (queryTerms.some(term => nodeText.includes(term))) {
        nodes.set(nodeId, node);
      }
    }

    // Add relationships for found nodes
    for (const [relId, relationship] of knowledgeGraph.edges) {
      if (nodes.has(relationship.source) || nodes.has(relationship.target)) {
        relationships.set(relId, relationship);
        
        // Add connected nodes
        if (!nodes.has(relationship.source) && knowledgeGraph.nodes.has(relationship.source)) {
          nodes.set(relationship.source, knowledgeGraph.nodes.get(relationship.source));
        }
        if (!nodes.has(relationship.target) && knowledgeGraph.nodes.has(relationship.target)) {
          nodes.set(relationship.target, knowledgeGraph.nodes.get(relationship.target));
        }
      }
    }

    return { nodes, relationships };
  }

  /**
   * Rank and filter graph results by relevance
   */
  rankGraphResults(subgraph, queryAnalysis) {
    // Score nodes by relevance
    const scoredNodes = subgraph.nodes.map(node => ({
      ...node,
      relevanceScore: this.calculateNodeRelevance(node, queryAnalysis)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Score relationships by relevance
    const scoredRelationships = subgraph.relationships.map(rel => ({
      ...rel,
      relevanceScore: this.calculateRelationshipRelevance(rel, queryAnalysis)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return top results
    return {
      nodes: scoredNodes.slice(0, 20), // Top 20 nodes
      relationships: scoredRelationships.slice(0, 15), // Top 15 relationships
      searchStats: subgraph.searchStats
    };
  }

  /**
   * Calculate node relevance score
   */
  calculateNodeRelevance(node, queryAnalysis) {
    let score = 0;

    // Entity name match
    for (const entity of queryAnalysis.keyEntities) {
      if (this.entityMatches(node.label, entity)) {
        score += 10;
      }
    }

    // Type relevance
    const queryText = queryAnalysis.queryIntent.toLowerCase();
    if (queryText.includes(node.type.toLowerCase())) {
      score += 5;
    }

    // Confidence score
    score += (node.confidence || 0.5) * 3;

    // Medical domain match
    if (node.properties && node.properties.domain === queryAnalysis.medicalDomain) {
      score += 3;
    }

    return score;
  }

  /**
   * Calculate relationship relevance score
   */
  calculateRelationshipRelevance(relationship, queryAnalysis) {
    let score = 0;

    // Relationship type match
    for (const relType of queryAnalysis.relationshipTypes) {
      if (relationship.type.toLowerCase().includes(relType.toLowerCase())) {
        score += 8;
      }
    }

    // Confidence score
    score += (relationship.confidence || 0.5) * 3;

    return score;
  }

  /**
   * Generate RAG response using retrieved knowledge
   */
  async generateRAGResponse(query, rankedResults, queryAnalysis, context) {
    try {
      const knowledgeContext = this.formatKnowledgeForRAG(rankedResults);
      
      const prompt = `You are a medical research expert. Answer the user's question using ONLY the provided knowledge graph information.

User Question: "${query}"

Knowledge Graph Information:
${knowledgeContext}

Query Analysis: ${JSON.stringify(queryAnalysis, null, 2)}

Instructions:
1. Answer the question directly using only the provided knowledge graph data
2. Cite specific entities and relationships from the graph
3. If the information is insufficient, clearly state what's missing
4. Maintain medical accuracy and avoid speculation
5. Structure the response clearly with sections if needed
6. Include confidence levels where appropriate

Response:`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.2,
        maxTokens: 1000
      });

      const aiResponse = response.content;

      // Add knowledge graph citations
      const responseWithCitations = this.addKnowledgeCitations(aiResponse, rankedResults);

      return {
        answer: responseWithCitations,
        knowledgeUsed: {
          entitiesReferenced: rankedResults.nodes.length,
          relationshipsReferenced: rankedResults.relationships.length
        },
        confidence: this.calculateResponseConfidence(rankedResults),
        limitations: this.identifyResponseLimitations(rankedResults, queryAnalysis)
      };

    } catch (error) {
      console.error('RAG response generation error:', error);
      return {
        answer: "I found relevant information in the knowledge graph but encountered an error generating the response.",
        error: error.message
      };
    }
  }

  /**
   * Format knowledge for RAG prompt
   */
  formatKnowledgeForRAG(rankedResults) {
    let context = "ENTITIES:\n";
    
    for (const node of rankedResults.nodes.slice(0, 10)) {
      context += `- ${node.label} (${node.type}): ${JSON.stringify(node.properties || {})}\n`;
    }

    context += "\nRELATIONSHIPS:\n";
    
    for (const rel of rankedResults.relationships.slice(0, 10)) {
      context += `- ${rel.source} ${rel.type.toUpperCase()} ${rel.target}`;
      if (rel.properties && Object.keys(rel.properties).length > 0) {
        context += ` [${JSON.stringify(rel.properties)}]`;
      }
      context += "\n";
    }

    return context;
  }

  /**
   * Add knowledge graph citations to response
   */
  addKnowledgeCitations(response, rankedResults) {
    let citedResponse = response;
    
    // Add entity citations
    for (const node of rankedResults.nodes.slice(0, 5)) {
      const regex = new RegExp(node.label, 'gi');
      citedResponse = citedResponse.replace(regex, `${node.label} [KG Entity]`);
    }

    return citedResponse;
  }

  /**
   * Calculate response confidence based on knowledge quality
   */
  calculateResponseConfidence(rankedResults) {
    if (rankedResults.nodes.length === 0) return 0.1;
    
    const avgNodeConfidence = rankedResults.nodes.reduce((sum, node) => 
      sum + (node.confidence || 0.5), 0) / rankedResults.nodes.length;
    
    const avgRelConfidence = rankedResults.relationships.length > 0 ?
      rankedResults.relationships.reduce((sum, rel) => 
        sum + (rel.confidence || 0.5), 0) / rankedResults.relationships.length : 0.5;
    
    return Math.min(0.95, (avgNodeConfidence + avgRelConfidence) / 2);
  }

  /**
   * Identify limitations in the response
   */
  identifyResponseLimitations(rankedResults, queryAnalysis) {
    const limitations = [];
    
    if (rankedResults.nodes.length === 0) {
      limitations.push("No relevant entities found in knowledge graph");
    }
    
    if (rankedResults.relationships.length === 0) {
      limitations.push("No relationships found between entities");
    }
    
    if (queryAnalysis.keyEntities.length > 0 && rankedResults.nodes.length < queryAnalysis.keyEntities.length) {
      limitations.push("Some queried entities not found in knowledge graph");
    }
    
    return limitations;
  }

  // Helper methods
  entityMatches(label, queryEntity) {
    const labelLower = label.toLowerCase();
    const queryLower = queryEntity.toLowerCase();
    
    return labelLower === queryLower || 
           labelLower.includes(queryLower) ||
           queryLower.includes(labelLower);
  }

  extractEntitiesFromQuery(query) {
    // Simple entity extraction from query text
    const medicalTerms = query.match(/\b(?:aspirin|cancer|diabetes|heart|blood|pressure|treatment|drug|disease|symptom|therapy|clinical|trial|study|patient|medication|dosage)\b/gi);
    return medicalTerms || [];
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.queryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.queryCache.size,
      keys: Array.from(this.queryCache.keys())
    };
  }
}

export default GraphRAGAgent;