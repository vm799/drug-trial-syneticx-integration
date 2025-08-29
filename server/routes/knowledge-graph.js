// server/routes/knowledge-graph.js
import express from 'express';
import Coordinator from '../agents/Coordinator.js';
import getOpenAIService from '../services/openaiService.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Initialize services
const openaiService = getOpenAIService();
const coordinator = new Coordinator(openaiService);

/**
 * POST /api/knowledge-graph/construct
 * Construct knowledge graph from documents
 */
router.post('/construct', auth, async (req, res) => {
  try {
    const { documents, userQuery, context } = req.body;

    // Validate input
    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        error: 'Documents array is required'
      });
    }

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        error: 'User query is required'
      });
    }

    console.log(`🔬 Knowledge Graph Construction Request from user ${req.user.id}`);
    console.log(`📄 Processing ${documents.length} documents`);

    // Process documents and construct knowledge graph
    const result = await coordinator.constructKnowledgeGraph(
      documents,
      userQuery,
      { ...context, userId: req.user.id }
    );

    // Log successful construction
    if (result.success) {
      console.log(`✅ Knowledge graph constructed successfully`);
      console.log(`📊 Entities: ${result.metadata?.entitiesExtracted || 0}`);
      console.log(`🔗 Relationships: ${result.metadata?.relationshipsFound || 0}`);
    }

    res.json({
      success: result.success,
      knowledgeGraph: {
        statistics: {
          entities: result.knowledgeGraph?.metadata?.entityCount || 0,
          relationships: result.knowledgeGraph?.metadata?.relationshipCount || 0,
          documentCount: result.metadata?.documentsProcessed || 0
        },
        schema: result.knowledgeGraph?.schema,
        metadata: result.knowledgeGraph?.metadata
      },
      processingResults: {
        userIntent: result.userIntent,
        processingStrategy: result.processingStrategy,
        extractionPlan: result.extractionPlan,
        processingTime: result.metadata?.processingTime
      },
      error: result.error
    });

  } catch (error) {
    console.error('❌ Knowledge Graph Construction Error:', error);
    res.status(500).json({
      success: false,
      error: 'Knowledge graph construction failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/knowledge-graph/query
 * Query the knowledge graph using GraphRAG
 */
router.post('/query', auth, async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    console.log(`🔍 Knowledge Graph Query from user ${req.user.id}: "${query}"`);

    // Query the knowledge graph
    const result = await coordinator.queryKnowledgeGraph(
      query,
      { ...context, userId: req.user.id }
    );

    console.log(`📊 Query processed, confidence: ${result.confidence || 'N/A'}`);

    res.json({
      success: result.success,
      response: result.response,
      retrievedKnowledge: {
        nodesFound: result.retrievedKnowledge?.nodes?.length || 0,
        relationshipsFound: result.retrievedKnowledge?.relationships?.length || 0,
        searchStats: result.retrievedKnowledge?.searchStats
      },
      confidence: result.confidence,
      error: result.error
    });

  } catch (error) {
    console.error('❌ Knowledge Graph Query Error:', error);
    res.status(500).json({
      success: false,
      error: 'Knowledge graph query failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/knowledge-graph/status
 * Get knowledge graph status and statistics
 */
router.get('/status', auth, async (req, res) => {
  try {
    const status = coordinator.getKnowledgeGraphStatus();
    
    res.json({
      success: true,
      status: status.isActive ? 'active' : 'inactive',
      statistics: status.statistics,
      capabilities: status.capabilities,
      error: status.error
    });

  } catch (error) {
    console.error('❌ Knowledge Graph Status Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get knowledge graph status'
    });
  }
});

/**
 * POST /api/knowledge-graph/export
 * Export knowledge graph in various formats
 */
router.post('/export', auth, async (req, res) => {
  try {
    const { format = 'json' } = req.body;

    if (!coordinator.knowledgeGraphAgent) {
      return res.status(400).json({
        success: false,
        error: 'Knowledge graph not available'
      });
    }

    const exportedGraph = coordinator.knowledgeGraphAgent.exportKnowledgeGraph(format);
    
    let contentType = 'application/json';
    let filename = `knowledge-graph-${Date.now()}.json`;

    switch (format) {
      case 'cypher':
        contentType = 'text/plain';
        filename = `knowledge-graph-${Date.now()}.cypher`;
        break;
      case 'networkx':
        contentType = 'application/json';
        filename = `knowledge-graph-${Date.now()}.networkx.json`;
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (typeof exportedGraph === 'object') {
      res.json({
        success: true,
        data: exportedGraph,
        format,
        exportedAt: new Date().toISOString()
      });
    } else {
      res.send(exportedGraph);
    }

  } catch (error) {
    console.error('❌ Knowledge Graph Export Error:', error);
    res.status(500).json({
      success: false,
      error: 'Knowledge graph export failed'
    });
  }
});

/**
 * POST /api/knowledge-graph/demo
 * Demo endpoint for testing with sample data
 */
router.post('/demo', auth, async (req, res) => {
  try {
    console.log(`🧪 Knowledge Graph Demo Request from user ${req.user.id}`);

    // Sample medical documents for demo
    const sampleDocuments = [
      {
        type: 'json',
        content: JSON.stringify({
          study_id: 'NCT123456',
          title: 'Aspirin for Cardiovascular Prevention',
          drug: 'Aspirin',
          indication: 'Cardiovascular Disease Prevention',
          dosage: '81mg daily',
          participants: 1000,
          phase: 'Phase III',
          primary_outcome: 'Reduction in cardiovascular events',
          side_effects: ['Gastrointestinal bleeding', 'Nausea']
        }),
        metadata: { 
          title: 'Clinical Trial: Aspirin CVD Prevention',
          id: 'demo_structured_1'
        }
      },
      {
        type: 'txt',
        content: `Aspirin is a widely used medication that belongs to the class of nonsteroidal anti-inflammatory drugs (NSAIDs). 
        It is commonly prescribed for cardiovascular disease prevention due to its antiplatelet effects. 
        Studies have shown that low-dose aspirin (75-100 mg daily) can reduce the risk of heart attack and stroke in high-risk patients.
        However, aspirin use is associated with increased risk of gastrointestinal bleeding, particularly in elderly patients.
        The drug works by irreversibly inhibiting cyclooxygenase-1 (COX-1) enzyme, which prevents platelet aggregation.
        Clinical trials have demonstrated that aspirin reduces cardiovascular mortality by approximately 15-20% in patients with established coronary artery disease.`,
        metadata: { 
          title: 'Medical Review: Aspirin in Cardiovascular Prevention',
          id: 'demo_unstructured_1'
        }
      },
      {
        type: 'json',
        content: JSON.stringify({
          drug_name: 'Metformin',
          class: 'Biguanide',
          indication: 'Type 2 Diabetes Mellitus',
          mechanism: 'Decreases hepatic glucose production',
          dosage_range: '500-2000mg daily',
          contraindications: ['Kidney disease', 'Heart failure'],
          drug_interactions: [
            { drug: 'Alcohol', effect: 'Increased risk of lactic acidosis' },
            { drug: 'Contrast media', effect: 'Increased risk of nephrotoxicity' }
          ]
        }),
        metadata: { 
          title: 'Drug Information: Metformin',
          id: 'demo_structured_2'
        }
      }
    ];

    const demoQuery = {
      query: 'Build a knowledge graph from these medical documents',
      primaryIntent: 'knowledge_graph_construction',
      medicalFocus: 'cardiology',
      needsQuerying: true
    };

    // Construct knowledge graph
    const result = await coordinator.constructKnowledgeGraph(
      sampleDocuments,
      demoQuery,
      { demo: true, userId: req.user.id }
    );

    // Also perform a sample query
    let queryResult = null;
    if (result.success) {
      try {
        queryResult = await coordinator.queryKnowledgeGraph(
          'What are the relationships between aspirin and cardiovascular disease?',
          { demo: true, userId: req.user.id }
        );
      } catch (queryError) {
        console.warn('Demo query failed:', queryError.message);
      }
    }

    res.json({
      success: result.success,
      demo: true,
      construction: {
        documentsProcessed: sampleDocuments.length,
        knowledgeGraph: {
          entities: result.knowledgeGraph?.metadata?.entityCount || 0,
          relationships: result.knowledgeGraph?.metadata?.relationshipCount || 0,
          schema: result.knowledgeGraph?.schema
        },
        processingStrategy: result.processingStrategy,
        userIntent: result.userIntent
      },
      sampleQuery: queryResult ? {
        query: 'What are the relationships between aspirin and cardiovascular disease?',
        response: queryResult.response?.answer || 'Query processing failed',
        confidence: queryResult.confidence
      } : null,
      error: result.error
    });

  } catch (error) {
    console.error('❌ Knowledge Graph Demo Error:', error);
    res.status(500).json({
      success: false,
      error: 'Knowledge graph demo failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;