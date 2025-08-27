// Enhanced Multi-Agent Platform with CrewAI Integration
import { ChatOpenAI } from "@langchain/openai"
import { LLMChain } from "langchain/chains"
import { PromptTemplate } from "@langchain/core/prompts"

export class CrewAIResearchCrew {
  constructor(openaiClient) {
    this.openai = openaiClient
    this.llm = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_API_KEY
    })
  }

  // Medical Research Specialist Agent
  async createResearchSpecialist() {
    const researchTemplate = new PromptTemplate({
      template: `
You are a Medical Research Specialist AI agent with expertise in:
- Clinical research methodology
- Medical literature analysis
- Evidence-based medicine
- Research paper evaluation

Task: Analyze the medical research query: "{query}"

Provide comprehensive research insights covering:
1. Latest scientific findings
2. Research methodology assessment
3. Clinical significance
4. Future research directions

Context: {context}
Research Depth: Advanced
Focus: Evidence-based analysis

Response:`,
      inputVariables: ["query", "context"]
    })

    return new LLMChain({
      llm: this.llm,
      prompt: researchTemplate,
      outputKey: "researchInsights"
    })
  }

  // Clinical Trial Matching Agent
  async createTrialMatchingAgent() {
    const trialTemplate = new PromptTemplate({
      template: `
You are a Clinical Trial Matching Specialist AI agent with expertise in:
- ClinicalTrials.gov database knowledge
- Trial eligibility criteria
- Study design analysis
- Patient matching algorithms

Task: Find relevant clinical trials for: "{query}"

Provide comprehensive trial matches including:
1. Relevant ongoing trials
2. Eligibility criteria
3. Study phases and locations
4. Contact information
5. Trial objectives and endpoints

Context: {context}
Database Access: ClinicalTrials.gov
Focus: Patient-relevant matches

Response:`,
      inputVariables: ["query", "context"]
    })

    return new LLMChain({
      llm: this.llm,
      prompt: trialTemplate,
      outputKey: "trialMatches"
    })
  }

  // Medical Explanation Agent
  async createExplanationAgent() {
    const explanationTemplate = new PromptTemplate({
      template: `
You are a Medical Communication Specialist AI agent with expertise in:
- Patient education
- Medical terminology simplification
- Health literacy optimization
- Clear medical communication

Task: Explain complex medical information in simple terms: "{query}"

Research Context: {researchInsights}
Trial Information: {trialMatches}

Provide a clear, patient-friendly explanation covering:
1. What this means for patients
2. Key benefits and risks
3. Treatment options explained simply
4. Next steps recommendations

Tone: Compassionate and informative
Audience: Patients and caregivers
Language Level: 8th grade reading level

Response:`,
      inputVariables: ["query", "researchInsights", "trialMatches"]
    })

    return new LLMChain({
      llm: this.llm,
      prompt: explanationTemplate,
      outputKey: "explanation"
    })
  }

  // Safety Validation Agent
  async createSafetyValidator() {
    const safetyTemplate = new PromptTemplate({
      template: `
You are a Medical Safety Validation AI agent with expertise in:
- Drug safety assessment
- Clinical risk evaluation
- Medical accuracy verification
- Patient safety protocols

Task: Validate the safety and accuracy of medical information: "{content}"

Original Query: {query}
Context: {context}

Perform safety validation covering:
1. Medical accuracy verification
2. Risk assessment
3. Safety warnings identification
4. Contraindication alerts
5. Disclaimer requirements

Output a safety score (0-100) and detailed validation report.

Safety Standards: FDA guidelines
Validation Level: Strict
Focus: Patient safety

Response:`,
      inputVariables: ["content", "query", "context"]
    })

    return new LLMChain({
      llm: this.llm,
      prompt: safetyTemplate,
      outputKey: "safetyValidation"
    })
  }

  // CrewAI-Style Orchestrated Workflow
  async executeResearchCrew(query, context = {}) {
    try {
      console.log(`🚀 CrewAI Research Crew executing for query: "${query}"`)
      
      // Create specialized agents
      const researchSpecialist = await this.createResearchSpecialist()
      const trialMatcher = await this.createTrialMatchingAgent()
      const explanationAgent = await this.createExplanationAgent()
      const safetyValidator = await this.createSafetyValidator()

      // Step 1: Research Specialist analyzes the query
      console.log(`🔬 Research Specialist analyzing...`)
      const researchResult = await researchSpecialist.call({
        query,
        context: JSON.stringify(context)
      })

      // Step 2: Trial Matching Agent finds relevant trials
      console.log(`🧪 Trial Matching Agent searching...`)
      const trialResult = await trialMatcher.call({
        query,
        context: JSON.stringify({
          ...context,
          researchInsights: researchResult.researchInsights
        })
      })

      // Step 3: Explanation Agent creates patient-friendly summary
      console.log(`💡 Medical Explanation Agent simplifying...`)
      const explanationResult = await explanationAgent.call({
        query,
        researchInsights: researchResult.researchInsights,
        trialMatches: trialResult.trialMatches
      })

      // Step 4: Safety Validator checks all content
      console.log(`🛡️ Safety Validator reviewing...`)
      const allContent = `
        Research: ${researchResult.researchInsights}
        Trials: ${trialResult.trialMatches}
        Explanation: ${explanationResult.explanation}
      `
      
      const safetyResult = await safetyValidator.call({
        content: allContent,
        query,
        context: JSON.stringify(context)
      })

      // Combine all results
      const finalResult = {
        researchInsights: researchResult.researchInsights,
        trialMatches: trialResult.trialMatches,
        explanation: explanationResult.explanation,
        safetyValidation: safetyResult.safetyValidation,
        metadata: {
          agentsUsed: ['research-specialist', 'trial-matcher', 'explanation-agent', 'safety-validator'],
          processingTime: Date.now(),
          crewAIWorkflow: true,
          confidence: this.calculateConfidence(safetyResult.safetyValidation)
        }
      }

      console.log(`✅ CrewAI Research Crew completed successfully`)
      return finalResult

    } catch (error) {
      console.error(`❌ CrewAI Research Crew error:`, error)
      throw new Error(`CrewAI workflow failed: ${error.message}`)
    }
  }

  // Calculate confidence based on safety validation
  calculateConfidence(safetyValidation) {
    try {
      // Extract safety score from validation text
      const scoreMatch = safetyValidation.match(/safety score[:\s]*(\d+)/i)
      if (scoreMatch) {
        return parseInt(scoreMatch[1]) / 100
      }
      return 0.75 // Default confidence
    } catch (error) {
      return 0.75
    }
  }

  // Health check for the crew
  async getCrewHealth() {
    return {
      status: 'operational',
      agents: {
        researchSpecialist: 'ready',
        trialMatcher: 'ready', 
        explanationAgent: 'ready',
        safetyValidator: 'ready'
      },
      llmConnection: this.llm ? 'connected' : 'disconnected',
      capabilities: [
        'medical-research-analysis',
        'clinical-trial-matching',
        'patient-education',
        'safety-validation'
      ]
    }
  }
}

export default CrewAIResearchCrew