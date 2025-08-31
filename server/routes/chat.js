// server/routes/chat.js
import express from "express";
import Coordinator from "../agents/Coordinator.js";
import OpenAI from "openai";
import HuggingFaceService from "../services/huggingfaceService.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Initialize services and coordinator
let openai = null;
let coordinator = null;
let huggingFaceService = null;

const initializeAI = () => {
  if (!coordinator) {
    // Initialize OpenAI if available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      logger.info('🤖 OpenAI initialized');
    } else {
      logger.warn('🤖 OpenAI not configured, using demo mode');
    }

    // Initialize Hugging Face service
    huggingFaceService = new HuggingFaceService();
    
    // Initialize coordinator with enhanced capabilities
    coordinator = new Coordinator(openai);
    
    logger.info('🎯 Enhanced AI system initialized');
  }
  return coordinator;
};

router.post("/", async (req, res) => {
  try {
    const { query, context = {} } = req.body;
    
    if (!query || !query.trim()) {
      return res.status(400).json({
        error: 'Query is required',
        message: 'Please provide a research query'
      });
    }

    logger.info(`🎯 Received query: "${query}"`);
    
    // Initialize the enhanced AI system
    const coord = initializeAI();
    
    // Add metadata to context
    const enhancedContext = {
      ...context,
      requestId: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      sessionId: context.sessionId || 'anonymous'
    };
    
    // Process query through enhanced multi-agent system
    const results = await coord.handleUserQuery(query, enhancedContext);
    
    // Add system notices based on configuration status
    const systemNotices = [];
    
    if (!results.metadata.systemStatus.huggingFace.configured) {
      systemNotices.push({
        type: 'info',
        title: 'Enhanced AI Available',
        message: 'Configure HUGGINGFACE_API_KEY for advanced medical NLP and entity extraction capabilities.'
      });
    }
    
    if (!results.metadata.systemStatus.openAI.configured) {
      systemNotices.push({
        type: 'info', 
        title: 'Demo Mode Active',
        message: 'Currently using demo data. Configure OpenAI API key for live pharmaceutical intelligence.'
      });
    }
    
    // Format response for frontend
    const response = {
      // Core research data
      researchInsights: results.researchInsights,
      trialMatches: results.trialMatches,
      explanation: results.explanation,
      
      // Enhanced AI analysis
      hfAnalysis: results.hfAnalysis,
      queryAnalysis: results.queryAnalysis,
      
      // Additional insights from specialized agents
      competitiveIntelligence: results.competitiveIntelligence,
      investmentAnalysis: results.investmentAnalysis,
      
      // System metadata and notices
      metadata: results.metadata,
      systemNotices: systemNotices.length > 0 ? systemNotices : null,
      
      // Success indicators
      success: true,
      processed_at: new Date().toISOString()
    };

    logger.info(`🎯 Query processed successfully: ${results.metadata.processingTime}ms`);
    res.json(response);
    
  } catch (err) {
    logger.error('🎯 Chat route error:', err);
    
    // Return enhanced fallback response with real API status
    const coord = initializeAI();
    const fallbackResponse = coord.generateEnhancedFallback(
      req.body.query || 'pharmaceutical research', 
      req.body.context || {}, 
      err.message
    );
    
    res.json({
      ...fallbackResponse,
      systemNotices: [{
        type: 'warning',
        title: 'Temporary Service Issue',
        message: 'The AI system encountered a temporary issue. Showing enhanced demo data while services recover.'
      }],
      success: false,
      error: 'Service temporarily unavailable',
      processed_at: new Date().toISOString()
    });
  }
});

// Add metrics endpoint
router.get("/metrics", async (req, res) => {
  try {
    const coord = initializeAI();
    const metrics = coord.getMetrics();
    
    res.json({
      success: true,
      metrics: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('🎯 Metrics endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to retrieve metrics',
      message: error.message
    });
  }
});

// Demo response for when OpenAI is not configured
const createDemoResponse = (query) => {
  const demoResponses = {
    'aspirin': {
      summary: 'Aspirin is a widely used nonsteroidal anti-inflammatory drug (NSAID) with multiple therapeutic applications.',
      keyFindings: [
        'Primary prevention of cardiovascular events in high-risk patients',
        'Treatment of acute coronary syndrome',
        'Anti-platelet therapy following stroke',
        'Potential role in cancer prevention'
      ],
      researchPapers: [
        {
          title: 'Aspirin for Primary Prevention of Cardiovascular Disease: Updated Evidence Report',
          authors: 'U.S. Preventive Services Task Force',
          journal: 'Annals of Internal Medicine',
          year: 2022,
          doi: '10.7326/M21-2743',
          pubmedId: '35023745',
          summary: 'Comprehensive review of aspirin for primary prevention of cardiovascular disease.'
        },
        {
          title: 'Low-dose aspirin for preventing recurrent venous thromboembolism',
          authors: 'Brighton TA, et al.',
          journal: 'New England Journal of Medicine',
          year: 2012,
          doi: '10.1056/NEJMoa1210384',
          pubmedId: '23121370',
          summary: 'Study on aspirin efficacy for preventing recurrent venous thromboembolism.'
        }
      ],
      clinicalTrials: [
        {
          title: 'ASPREE: Aspirin in Reducing Events in the Elderly',
          phase: 'Phase 3',
          status: 'Completed',
          participants: '19,114',
          summary: 'Large-scale trial examining aspirin use in healthy elderly adults.'
        }
      ]
    },
    'default': {
      summary: `AI-powered analysis of "${query}" shows promising research developments in medical literature.`,
      keyFindings: [
        'Active research area with multiple ongoing studies',
        'Emerging therapeutic applications being investigated',
        'Clinical trials showing promising early results',
        'Safety and efficacy profiles being established'
      ],
      researchPapers: [
        {
          title: `Recent Advances in ${query} Research`,
          authors: 'Research Consortium',
          journal: 'Medical Research Today',
          year: 2024,
          doi: '10.1000/demo.2024.001',
          pubmedId: '38000001',
          summary: `Comprehensive review of current ${query} research and applications.`
        }
      ],
      clinicalTrials: [
        {
          title: `Clinical Investigation of ${query}`,
          phase: 'Phase 2',
          status: 'Recruiting',
          participants: '500',
          summary: `Multi-center trial investigating the safety and efficacy of ${query}.`
        }
      ]
    }
  };
  
  return demoResponses[query.toLowerCase()] || demoResponses.default;
};

export default router;
