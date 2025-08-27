// LangChain Enhanced Medical Research Agents
import { ChatOpenAI } from "@langchain/openai"
import { ConversationChain } from "langchain/chains"
import { BufferMemory } from "langchain/memory"
import { PromptTemplate } from "@langchain/core/prompts"
import { LLMChain, SequentialChain } from "langchain/chains"
import { OpenAIEmbeddings } from "@langchain/openai"

export class LangChainMedicalSystem {
  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.1,
      openAIApiKey: process.env.OPENAI_API_KEY
    })

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    })

    this.memory = new BufferMemory({
      memoryKey: "chat_history",
      inputKey: "human_input",
      outputKey: "response"
    })
  }

  // Create a Research Analysis Chain
  async createResearchChain() {
    const researchPrompt = new PromptTemplate({
      template: `
You are a world-class medical research analyst with access to the latest scientific literature.

Human Query: {human_input}
Chat History: {chat_history}
Research Context: {research_context}

Analyze this medical research query and provide:

## 🔬 Scientific Analysis
- Latest research findings
- Methodology assessment
- Clinical significance
- Evidence quality (Level I-V)

## 📊 Data Insights
- Statistical significance
- Sample sizes and populations
- Limitations and biases
- Reproducibility assessment

## 🎯 Clinical Relevance
- Patient impact
- Treatment implications
- Practice-changing potential
- Safety considerations

Provide citations for all claims and rate confidence level (1-10).

Research Analysis:`,
      inputVariables: ["human_input", "chat_history", "research_context"]
    })

    return new LLMChain({
      llm: this.llm,
      prompt: researchPrompt,
      memory: this.memory,
      outputKey: "research_analysis"
    })
  }

  // Create a Clinical Trial Chain
  async createTrialChain() {
    const trialPrompt = new PromptTemplate({
      template: `
You are a clinical trial specialist with comprehensive knowledge of ClinicalTrials.gov and global trial databases.

Query: {human_input}
Research Analysis: {research_analysis}

Find and analyze relevant clinical trials:

## 🧪 Current Trials
- Active recruiting trials
- Phase I, II, III, IV studies
- Inclusion/exclusion criteria
- Primary and secondary endpoints

## 🌍 Global Opportunities  
- Multi-center studies
- International trials
- Compassionate use programs
- Expanded access protocols

## 📋 Patient Matching
- Eligibility assessment
- Required biomarkers/tests
- Geographic accessibility
- Timeline considerations

## 🔗 Contact Information
- Principal investigators
- Study coordinators
- Enrollment contacts
- ClinicalTrials.gov IDs

Trial Analysis:`,
      inputVariables: ["human_input", "research_analysis"]
    })

    return new LLMChain({
      llm: this.llm,
      prompt: trialPrompt,
      outputKey: "trial_analysis"
    })
  }

  // Create Drug Information Chain
  async createDrugInfoChain() {
    const drugPrompt = new PromptTemplate({
      template: `
You are a pharmaceutical specialist with expertise in drug mechanisms, interactions, and safety profiles.

Query: {human_input}
Research Context: {research_analysis}
Trial Context: {trial_analysis}

Provide comprehensive drug information:

## 💊 Mechanism of Action
- Molecular targets
- Pathway interactions
- Pharmacokinetics
- Pharmacodynamics

## ⚠️ Safety Profile
- Common adverse events
- Serious adverse events
- Drug-drug interactions
- Contraindications

## 📈 Efficacy Data
- Clinical trial outcomes
- Real-world evidence
- Comparative effectiveness
- Long-term safety

## 🏥 Clinical Use
- Dosing guidelines
- Administration protocols
- Monitoring requirements
- Patient counseling points

Drug Analysis:`,
      inputVariables: ["human_input", "research_analysis", "trial_analysis"]
    })

    return new LLMChain({
      llm: this.llm,
      prompt: drugPrompt,
      outputKey: "drug_analysis"
    })
  }

  // Create Patient Education Chain
  async createPatientEducationChain() {
    const educationPrompt = new PromptTemplate({
      template: `
You are a patient education specialist skilled at translating complex medical information into clear, actionable guidance.

Original Query: {human_input}
Research Analysis: {research_analysis}
Trial Information: {trial_analysis}
Drug Information: {drug_analysis}

Create patient-friendly educational content:

## 🤔 What This Means for You
- Simple explanation of the condition/treatment
- What patients should know
- Realistic expectations

## 💡 Treatment Options
- Available treatments explained simply
- Benefits and risks in plain language
- How treatments work (simplified)

## ❓ Questions to Ask Your Doctor
- Important questions to discuss
- Tests or evaluations needed
- Treatment decision factors

## 📚 Next Steps
- Immediate actions to take
- Resources for more information
- Support groups or organizations

## ⚠️ Important Safety Information
- When to seek immediate medical care
- Side effects to watch for
- Drug interactions to avoid

Use simple language (8th grade level). Be compassionate and encouraging while being medically accurate.

Patient Education:`,
      inputVariables: ["human_input", "research_analysis", "trial_analysis", "drug_analysis"]
    })

    return new LLMChain({
      llm: this.llm,
      prompt: educationPrompt,
      outputKey: "patient_education"
    })
  }

  // Create Sequential Chain that runs all analyses
  async createMedicalAnalysisSequence() {
    const researchChain = await this.createResearchChain()
    const trialChain = await this.createTrialChain()
    const drugChain = await this.createDrugInfoChain()
    const educationChain = await this.createPatientEducationChain()

    return new SequentialChain({
      chains: [researchChain, trialChain, drugChain, educationChain],
      inputVariables: ["human_input", "research_context"],
      outputVariables: ["research_analysis", "trial_analysis", "drug_analysis", "patient_education"],
      verbose: true
    })
  }

  // Conversation Chain with Memory
  async createConversationalAgent() {
    const conversationPrompt = new PromptTemplate({
      template: `
You are MedResearch AI, an advanced medical research assistant with multi-agent capabilities.

You have access to specialized analysis from:
- Research Analysis Agent
- Clinical Trial Agent  
- Drug Information Agent
- Patient Education Agent

Current conversation:
{chat_history}
Human: {human_input}

I can help you with medical research, clinical trials, drug information, and patient education.
My specialized agents will analyze your query and provide comprehensive, evidence-based insights.

How can I assist you today?

Response:`,
      inputVariables: ["human_input", "chat_history"]
    })

    return new ConversationChain({
      llm: this.llm,
      prompt: conversationPrompt,
      memory: this.memory,
      verbose: true
    })
  }

  // Chain factory method for different use cases
  async createChainByType(type) {
    switch (type.toLowerCase()) {
      case "research":
        return this.createResearchChain()
      case "trials":
        return this.createTrialChain()
      case "drugs":
        return this.createDrugInfoChain()
      case "education":
        return this.createPatientEducationChain()
      case "conversation":
        return this.createConversationalAgent()
      case "sequential":
        return this.createMedicalAnalysisSequence()
      default:
        throw new Error(`Unknown chain type: ${type}`)
    }
  }

  // System health check
  async getSystemHealth() {
    return {
      status: "operational",
      llm: {
        model: this.llm.modelName,
        temperature: this.llm.temperature,
        connected: true
      },
      memory: {
        type: "BufferMemory",
        memoryKey: this.memory.memoryKey,
        inputKey: this.memory.inputKey,
        outputKey: this.memory.outputKey
      },
      embeddings: {
        provider: "OpenAI",
        configured: !!process.env.OPENAI_API_KEY
      },
      chains: {
        research: "available",
        trials: "available",
        drugs: "available",
        education: "available",
        conversation: "available",
        sequential: "available"
      },
      capabilities: [
        "medical-research-analysis",
        "clinical-trial-matching",
        "drug-information-lookup",
        "patient-education-generation",
        "conversational-memory",
        "sequential-processing"
      ]
    }
  }

  // Clear conversation memory
  async clearMemory() {
    await this.memory.clear()
    console.log("🧠 LangChain conversation memory cleared")
  }

  // Get conversation history
  getConversationHistory() {
    return this.memory.chatHistory
  }

  // Update system configuration
  updateConfig(config) {
    if (config.temperature !== undefined) {
      this.llm.temperature = config.temperature
    }
    if (config.modelName) {
      this.llm.modelName = config.modelName
    }
    console.log("🔧 LangChain configuration updated", config)
  }
}

export default LangChainMedicalSystem
