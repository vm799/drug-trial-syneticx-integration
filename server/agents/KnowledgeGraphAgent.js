// server/agents/KnowledgeGraphAgent.js
import StructuredDataAgent from './StructuredDataAgent.js';
import UnstructuredDataAgent from './UnstructuredDataAgent.js';
import GraphRAGAgent from './GraphRAGAgent.js';
import UserIntentAgent from './UserIntentAgent.js';
import FileSuggestionAgent from './FileSuggestionAgent.js';
import SchemaProposalAgent from './SchemaProposalAgent.js';
import EntityFactTypeProposalAgent from './EntityFactTypeProposalAgent.js';

/**
 * Knowledge Graph Agent - Main orchestrator for knowledge graph construction
 * Based on DeepLearning.AI multi-agent architecture
 */
class KnowledgeGraphAgent {
  constructor(openai, neo4jDriver = null) {
    this.openai = openai;
    this.neo4jDriver = neo4jDriver;
    
    // Initialize sub-agents
    this.structuredDataAgent = new StructuredDataAgent(openai);
    this.unstructuredDataAgent = new UnstructuredDataAgent(openai);
    this.graphRAGAgent = new GraphRAGAgent(openai, neo4jDriver);
    this.userIntentAgent = new UserIntentAgent(openai);
    this.fileSuggestionAgent = new FileSuggestionAgent(openai);
    this.schemaProposalAgent = new SchemaProposalAgent(openai);
    this.entityFactTypeProposalAgent = new EntityFactTypeProposalAgent(openai);
    
    // Knowledge graph store (in-memory if no Neo4j)
    this.knowledgeGraph = {
      nodes: new Map(),
      edges: new Map(),
      schema: {},
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        documentCount: 0,
        entityCount: 0,
        relationshipCount: 0
      }
    };
  }

  /**
   * Main entry point for knowledge graph construction
   * @param {Array} documents - Array of document objects {content, type, metadata}
   * @param {Object} userQuery - User's query and intent
   * @param {Object} context - Additional context
   */
  async constructKnowledgeGraph(documents, userQuery, context = {}) {
    try {
      console.log('🔬 Knowledge Graph Agent: Starting construction process...');
      
      // Step 1: Analyze user intent
      const userIntent = await this.userIntentAgent.analyzeIntent(userQuery, context);
      console.log('🎯 User Intent Analysis:', userIntent);

      // Step 2: Analyze documents and suggest file processing strategy
      const fileStrategy = await this.fileSuggestionAgent.suggestProcessingStrategy(documents, userIntent);
      console.log('📁 File Processing Strategy:', fileStrategy);

      // Step 3: Propose initial schema based on documents and intent
      const proposedSchema = await this.schemaProposalAgent.proposeSchema(documents, userIntent, fileStrategy);
      console.log('📋 Proposed Schema:', proposedSchema);

      // Step 4: Process documents in parallel
      const processResults = await this.processDocuments(documents, fileStrategy, proposedSchema);
      
      // Step 5: Propose entity and fact types based on processed content
      const entityFactTypes = await this.entityFactTypeProposalAgent.proposeTypes(
        processResults.allEntities,
        processResults.allRelationships,
        proposedSchema
      );
      console.log('🔍 Entity & Fact Types:', entityFactTypes);

      // Step 6: Construct the knowledge graph
      const graphConstruction = await this.buildKnowledgeGraph(
        processResults,
        entityFactTypes,
        proposedSchema
      );

      // Step 7: Create knowledge extraction plan
      const extractionPlan = await this.createExtractionPlan(
        graphConstruction,
        userIntent,
        entityFactTypes
      );

      // Step 8: Execute GraphRAG for query answering if needed
      let queryResults = null;
      if (userQuery.needsQuerying) {
        queryResults = await this.graphRAGAgent.query(
          userQuery.query,
          this.knowledgeGraph,
          context
        );
      }

      return {
        success: true,
        userIntent,
        fileStrategy,
        proposedSchema,
        entityFactTypes,
        knowledgeGraph: this.knowledgeGraph,
        extractionPlan,
        queryResults,
        metadata: {
          documentsProcessed: documents.length,
          entitiesExtracted: this.knowledgeGraph.metadata.entityCount,
          relationshipsFound: this.knowledgeGraph.metadata.relationshipCount,
          processingTime: Date.now() - this.knowledgeGraph.metadata.createdAt.getTime()
        }
      };

    } catch (error) {
      console.error('❌ Knowledge Graph Agent Error:', error);
      return {
        success: false,
        error: error.message,
        knowledgeGraph: this.knowledgeGraph
      };
    }
  }

  /**
   * Process documents using structured and unstructured data agents
   */
  async processDocuments(documents, fileStrategy, schema) {
    const structuredResults = [];
    const unstructuredResults = [];
    const allEntities = [];
    const allRelationships = [];

    for (const doc of documents) {
      try {
        if (fileStrategy.structured.includes(doc.type) || this.isStructuredDocument(doc)) {
          console.log(`📊 Processing structured document: ${doc.metadata?.title || 'Unknown'}`);
          const result = await this.structuredDataAgent.processDocument(doc, schema);
          structuredResults.push(result);
          allEntities.push(...result.entities);
          allRelationships.push(...result.relationships);
        } 
        
        if (fileStrategy.unstructured.includes(doc.type) || !this.isStructuredDocument(doc)) {
          console.log(`📄 Processing unstructured document: ${doc.metadata?.title || 'Unknown'}`);
          const result = await this.unstructuredDataAgent.processDocument(doc, schema);
          unstructuredResults.push(result);
          allEntities.push(...result.entities);
          allRelationships.push(...result.relationships);
        }
      } catch (error) {
        console.error(`❌ Error processing document ${doc.metadata?.title}:`, error);
      }
    }

    return {
      structuredResults,
      unstructuredResults,
      allEntities,
      allRelationships
    };
  }

  /**
   * Build the knowledge graph from processed results
   */
  async buildKnowledgeGraph(processResults, entityFactTypes, schema) {
    console.log('🏗️ Building knowledge graph...');

    // Add entities to graph
    for (const entity of processResults.allEntities) {
      const nodeId = this.generateNodeId(entity);
      this.knowledgeGraph.nodes.set(nodeId, {
        id: nodeId,
        type: entity.type,
        label: entity.label,
        properties: entity.properties || {},
        sourceDocument: entity.sourceDocument,
        confidence: entity.confidence || 0.8,
        createdAt: new Date()
      });
    }

    // Add relationships to graph
    for (const rel of processResults.allRelationships) {
      const edgeId = this.generateEdgeId(rel);
      this.knowledgeGraph.edges.set(edgeId, {
        id: edgeId,
        source: rel.source,
        target: rel.target,
        type: rel.type,
        properties: rel.properties || {},
        sourceDocument: rel.sourceDocument,
        confidence: rel.confidence || 0.7,
        createdAt: new Date()
      });
    }

    // Update metadata
    this.knowledgeGraph.metadata.lastUpdated = new Date();
    this.knowledgeGraph.metadata.entityCount = this.knowledgeGraph.nodes.size;
    this.knowledgeGraph.metadata.relationshipCount = this.knowledgeGraph.edges.size;
    this.knowledgeGraph.schema = schema;

    return {
      nodesAdded: this.knowledgeGraph.nodes.size,
      edgesAdded: this.knowledgeGraph.edges.size,
      schema: this.knowledgeGraph.schema
    };
  }

  /**
   * Create knowledge extraction plan
   */
  async createExtractionPlan(graphConstruction, userIntent, entityFactTypes) {
    const plan = {
      graphConstructionPlan: {
        status: 'completed',
        nodesCreated: graphConstruction.nodesAdded,
        relationshipsCreated: graphConstruction.edgesAdded,
        schema: graphConstruction.schema
      },
      knowledgeExtractionPlan: {
        queryTypes: this.determineQueryTypes(userIntent),
        extractionStrategies: this.planExtractionStrategies(entityFactTypes),
        recommendedQueries: this.generateRecommendedQueries(userIntent, entityFactTypes)
      },
      knowledgeGraphConstructionTool: {
        status: 'ready',
        capabilities: [
          'Entity extraction from medical documents',
          'Relationship mapping for clinical research',
          'Semantic search across knowledge graph',
          'Question answering using GraphRAG',
          'Schema evolution and refinement'
        ]
      }
    };

    return plan;
  }

  /**
   * Query the knowledge graph
   */
  async queryKnowledgeGraph(query, context = {}) {
    try {
      return await this.graphRAGAgent.query(query, this.knowledgeGraph, context);
    } catch (error) {
      console.error('❌ Knowledge Graph Query Error:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Get knowledge graph statistics
   */
  getStatistics() {
    return {
      nodes: this.knowledgeGraph.nodes.size,
      edges: this.knowledgeGraph.edges.size,
      entityTypes: [...new Set(Array.from(this.knowledgeGraph.nodes.values()).map(n => n.type))],
      relationshipTypes: [...new Set(Array.from(this.knowledgeGraph.edges.values()).map(e => e.type))],
      metadata: this.knowledgeGraph.metadata
    };
  }

  /**
   * Export knowledge graph in various formats
   */
  exportKnowledgeGraph(format = 'json') {
    switch (format) {
      case 'json':
        return {
          nodes: Array.from(this.knowledgeGraph.nodes.values()),
          edges: Array.from(this.knowledgeGraph.edges.values()),
          schema: this.knowledgeGraph.schema,
          metadata: this.knowledgeGraph.metadata
        };
      case 'cypher':
        return this.generateCypherQueries();
      case 'networkx':
        return this.generateNetworkXFormat();
      default:
        return this.exportKnowledgeGraph('json');
    }
  }

  // Helper methods
  isStructuredDocument(doc) {
    const structuredTypes = ['json', 'csv', 'xlsx', 'xml', 'database'];
    return structuredTypes.some(type => 
      doc.type?.toLowerCase().includes(type) || 
      doc.metadata?.format?.toLowerCase().includes(type)
    );
  }

  generateNodeId(entity) {
    return `node_${entity.type}_${entity.label.replace(/\s+/g, '_').toLowerCase()}`;
  }

  generateEdgeId(relationship) {
    return `edge_${relationship.source}_${relationship.type}_${relationship.target}`;
  }

  determineQueryTypes(userIntent) {
    const queryTypes = [];
    if (userIntent.needsEntityLookup) queryTypes.push('entity_search');
    if (userIntent.needsRelationshipAnalysis) queryTypes.push('relationship_analysis');
    if (userIntent.needsSemanticSearch) queryTypes.push('semantic_search');
    if (userIntent.needsAggregation) queryTypes.push('aggregation');
    return queryTypes;
  }

  planExtractionStrategies(entityFactTypes) {
    return {
      entityExtraction: {
        methods: ['named_entity_recognition', 'pattern_matching', 'ai_classification'],
        targetTypes: entityFactTypes.entityTypes
      },
      relationshipExtraction: {
        methods: ['dependency_parsing', 'pattern_based', 'ai_inference'],
        targetTypes: entityFactTypes.relationshipTypes
      }
    };
  }

  generateRecommendedQueries(userIntent, entityFactTypes) {
    const queries = [
      "What are the key entities in this knowledge graph?",
      "Show me the relationships between different medical concepts",
      "Find all documents related to [specific medical condition]",
      "What are the most important connections in this research?"
    ];
    
    if (userIntent.medicalFocus) {
      queries.push(
        "What clinical trials are related to this research?",
        "Show me drug interactions and relationships",
        "Find treatment protocols and their outcomes"
      );
    }
    
    return queries;
  }

  generateCypherQueries() {
    const nodes = Array.from(this.knowledgeGraph.nodes.values());
    const edges = Array.from(this.knowledgeGraph.edges.values());
    
    let cypher = "// Knowledge Graph Creation Queries\n\n";
    
    // Create nodes
    cypher += "// Create Nodes\n";
    for (const node of nodes) {
      cypher += `CREATE (${node.id}:${node.type} {label: "${node.label}", id: "${node.id}"})\n`;
    }
    
    cypher += "\n// Create Relationships\n";
    for (const edge of edges) {
      cypher += `MATCH (a {id: "${edge.source}"}), (b {id: "${edge.target}"})\n`;
      cypher += `CREATE (a)-[:${edge.type}]->(b)\n`;
    }
    
    return cypher;
  }

  generateNetworkXFormat() {
    return {
      directed: true,
      multigraph: false,
      graph: this.knowledgeGraph.metadata,
      nodes: Array.from(this.knowledgeGraph.nodes.values()).map(node => ({
        id: node.id,
        ...node
      })),
      links: Array.from(this.knowledgeGraph.edges.values()).map(edge => ({
        source: edge.source,
        target: edge.target,
        ...edge
      }))
    };
  }
}

export default KnowledgeGraphAgent;