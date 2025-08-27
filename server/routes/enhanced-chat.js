// Enhanced Multi-Agent Chat Route with LangChain + CrewAI
import express from "express"
import CrewAIResearchCrew from "../agents/CrewAIIntegration.js"
import { LangChainMedicalSystem } from "../agents/LangChainMedicalAgents.js"
import OpenAI from "openai"

const router = express.Router()

// Initialize systems
let crewAI = null
let langChain = null
let openai = null

const initializeEnhancedAI = () => {
  if (!crewAI || !langChain) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    crewAI = new CrewAIResearchCrew(openai)
    langChain = new LangChainMedicalSystem()
  }
  return { crewAI, langChain, openai }
}

// Enhanced Multi-Agent Endpoint
router.post("/enhanced", async (req, res) => {
  try {
    const { query, context = {}, workflow = "crewai" } = req.body
    
    if (!query) {
      return res.status(400).json({
        error: "Query is required",
        usage: "POST /api/chat/enhanced with { query: 'your question', workflow: 'crewai' | 'langchain' | 'hybrid' }"
      })
    }

    const { crewAI, langChain } = initializeEnhancedAI()
    
    console.log(`🤖 Enhanced Multi-Agent Processing: ${workflow.toUpperCase()} workflow`)
    const startTime = Date.now()

    let result = {}

    switch (workflow) {
      case "crewai":
        console.log("🚀 Executing CrewAI Research Crew...")
        result = await crewAI.executeResearchCrew(query, context)
        result.workflow = "CrewAI Multi-Agent System"
        break

      case "langchain":
        console.log("🔗 Executing LangChain Sequential Analysis...")
        const sequence = await langChain.createMedicalAnalysisSequence()
        const langChainResult = await sequence.call({
          human_input: query,
          research_context: JSON.stringify(context)
        })
        
        result = {
          researchInsights: langChainResult.research_analysis,
          trialMatches: langChainResult.trial_analysis,
          drugInformation: langChainResult.drug_analysis,
          explanation: langChainResult.patient_education,
          workflow: "LangChain Sequential Processing"
        }
        break

      case "hybrid":
        console.log("🌟 Executing Hybrid CrewAI + LangChain System...")
        
        // Use CrewAI for initial analysis
        const crewResult = await crewAI.executeResearchCrew(query, context)
        
        // Use LangChain for enhanced patient education
        const educationChain = await langChain.createPatientEducationChain()
        const enhancedEducation = await educationChain.call({
          human_input: query,
          research_analysis: crewResult.researchInsights,
          trial_analysis: crewResult.trialMatches,
          drug_analysis: "Enhanced drug analysis from CrewAI workflow"
        })
        
        result = {
          ...crewResult,
          enhancedEducation: enhancedEducation.patient_education,
          workflow: "Hybrid CrewAI + LangChain System"
        }
        break

      default:
        return res.status(400).json({
          error: "Invalid workflow specified",
          availableWorkflows: ["crewai", "langchain", "hybrid"]
        })
    }

    const processingTime = Date.now() - startTime

    // Enhanced response with workflow metadata
    const enhancedResponse = {
      ...result,
      metadata: {
        ...result.metadata,
        workflow,
        processingTime,
        enhancedMultiAgent: true,
        timestamp: new Date().toISOString(),
        capabilities: [
          "research-analysis",
          "clinical-trials",
          "drug-information", 
          "patient-education",
          "safety-validation"
        ]
      }
    }

    console.log(`✅ Enhanced multi-agent processing completed in ${processingTime}ms`)
    res.json(enhancedResponse)

  } catch (error) {
    console.error('Enhanced chat error:', error)
    res.status(500).json({
      error: error.message,
      workflow: req.body.workflow || 'unknown',
      timestamp: new Date().toISOString(),
      suggestion: "Try a different workflow or check your query format"
    })
  }
})

// System Status for Enhanced Agents
router.get("/enhanced/status", async (req, res) => {
  try {
    const { crewAI, langChain } = initializeEnhancedAI()
    
    const crewHealth = await crewAI.getCrewHealth()
    
    res.json({
      status: "operational",
      systems: {
        crewAI: crewHealth,
        langChain: {
          status: "operational",
          chains: ["research", "trials", "drugs", "education", "conversation"],
          memory: "buffer-memory-enabled",
          embeddings: "openai-embeddings"
        }
      },
      workflows: {
        crewai: "Specialized medical research crew with role-based agents",
        langchain: "Sequential chain analysis with memory",
        hybrid: "Combined CrewAI + LangChain for enhanced results"
      },
      capabilities: [
        "multi-agent-orchestration",
        "research-analysis",
        "clinical-trial-matching",
        "drug-information-analysis", 
        "patient-education-generation",
        "safety-validation",
        "conversation-memory",
        "sequential-processing"
      ],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Workflow Comparison Endpoint
router.post("/enhanced/compare", async (req, res) => {
  try {
    const { query, context = {} } = req.body
    
    if (!query) {
      return res.status(400).json({ error: "Query is required for comparison" })
    }

    const { crewAI, langChain } = initializeEnhancedAI()
    
    console.log("🔄 Running workflow comparison...")
    
    // Run all three workflows in parallel
    const [crewResult, langChainSequence, hybridPromise] = await Promise.allSettled([
      // CrewAI workflow
      crewAI.executeResearchCrew(query, context),
      
      // LangChain workflow
      (async () => {
        const sequence = await langChain.createMedicalAnalysisSequence()
        return sequence.call({
          human_input: query,
          research_context: JSON.stringify(context)
        })
      })(),
      
      // Hybrid workflow
      (async () => {
        const crewResult = await crewAI.executeResearchCrew(query, context)
        const educationChain = await langChain.createPatientEducationChain()
        const enhancedEducation = await educationChain.call({
          human_input: query,
          research_analysis: crewResult.researchInsights,
          trial_analysis: crewResult.trialMatches,
          drug_analysis: "Enhanced analysis"
        })
        return { ...crewResult, enhancedEducation: enhancedEducation.patient_education }
      })()
    ])

    res.json({
      query,
      comparison: {
        crewai: {
          status: crewResult.status,
          result: crewResult.status === 'fulfilled' ? crewResult.value : null,
          error: crewResult.status === 'rejected' ? crewResult.reason.message : null
        },
        langchain: {
          status: langChainSequence.status,
          result: langChainSequence.status === 'fulfilled' ? langChainSequence.value : null,
          error: langChainSequence.status === 'rejected' ? langChainSequence.reason.message : null
        },
        hybrid: {
          status: hybridPromise.status,
          result: hybridPromise.status === 'fulfilled' ? hybridPromise.value : null,
          error: hybridPromise.status === 'rejected' ? hybridPromise.reason.message : null
        }
      },
      recommendation: "Compare the outputs to see which workflow best fits your use case",
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

export default router