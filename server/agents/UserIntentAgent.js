// server/agents/UserIntentAgent.js

/**
 * User Intent Agent - Analyzes user queries to understand intent and requirements
 * Part of the multi-agent knowledge graph construction system
 */
class UserIntentAgent {
  constructor(openaiService) {
    this.openaiService = openaiService;
    this.intentTypes = [
      'knowledge_graph_construction',
      'document_analysis',
      'entity_extraction',
      'relationship_discovery',
      'research_synthesis',
      'clinical_insights',
      'drug_discovery',
      'treatment_analysis'
    ];
  }

  /**
   * Analyze user intent from query and context
   * @param {Object} userQuery - User's query object
   * @param {Object} context - Additional context
   */
  async analyzeIntent(userQuery, context = {}) {
    try {
      console.log('🎯 User Intent Agent: Analyzing intent...');

      const intentAnalysis = await this.performIntentAnalysis(userQuery, context);
      const processingRequirements = this.determineProcessingRequirements(intentAnalysis);
      const expectedOutputs = this.defineExpectedOutputs(intentAnalysis);

      return {
        primaryIntent: intentAnalysis.primaryIntent,
        secondaryIntents: intentAnalysis.secondaryIntents,
        medicalFocus: intentAnalysis.medicalFocus,
        processingRequirements,
        expectedOutputs,
        confidenceLevel: intentAnalysis.confidence,
        complexity: this.assessComplexity(intentAnalysis),
        urgency: this.assessUrgency(userQuery, context),
        domainSpecialization: this.identifyDomainSpecialization(intentAnalysis)
      };

    } catch (error) {
      console.error('❌ User Intent Analysis Error:', error);
      return this.getFallbackIntent(userQuery);
    }
  }

  /**
   * Perform detailed intent analysis using AI
   */
  async performIntentAnalysis(userQuery, context) {
    try {
      const prompt = `You are an expert at understanding user intent in medical research contexts. Analyze this user request:

User Query: ${JSON.stringify(userQuery, null, 2)}
Context: ${JSON.stringify(context, null, 2)}

Determine:
1. Primary intent (what is the main goal?)
2. Secondary intents (what else do they need?)
3. Medical focus area (cardiology, oncology, etc.)
4. Analysis depth required (surface, detailed, comprehensive)
5. Output format preferences (structured data, narrative, visualizations)
6. Domain expertise level (novice, intermediate, expert)
7. Time sensitivity (urgent, normal, research)

Respond in JSON format:
{
  "primaryIntent": "knowledge_graph_construction",
  "secondaryIntents": ["entity_extraction", "relationship_discovery"],
  "medicalFocus": "cardiology",
  "analysisDepth": "comprehensive", 
  "outputFormat": "structured_data",
  "expertiseLevel": "intermediate",
  "timeSensitivity": "normal",
  "confidence": 0.85,
  "reasoning": "User wants to build knowledge graph from medical documents"
}`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.1,
        maxTokens: 600
      });

      return JSON.parse(response.content);

    } catch (error) {
      console.error('Intent analysis error:', error);
      return this.getBasicIntentAnalysis(userQuery);
    }
  }

  /**
   * Determine processing requirements based on intent
   */
  determineProcessingRequirements(intentAnalysis) {
    const requirements = {
      needsStructuredDataProcessing: false,
      needsUnstructuredDataProcessing: false,
      needsEntityExtraction: false,
      needsRelationshipExtraction: false,
      needsKnowledgeGraphConstruction: false,
      needsSemanticAnalysis: false,
      needsStatisticalAnalysis: false,
      needsVisualization: false,
      needsClinicalValidation: false,
      needsLiteratureReview: false
    };

    // Map intents to requirements
    switch (intentAnalysis.primaryIntent) {
      case 'knowledge_graph_construction':
        requirements.needsStructuredDataProcessing = true;
        requirements.needsUnstructuredDataProcessing = true;
        requirements.needsEntityExtraction = true;
        requirements.needsRelationshipExtraction = true;
        requirements.needsKnowledgeGraphConstruction = true;
        break;

      case 'document_analysis':
        requirements.needsUnstructuredDataProcessing = true;
        requirements.needsEntityExtraction = true;
        requirements.needsSemanticAnalysis = true;
        break;

      case 'entity_extraction':
        requirements.needsEntityExtraction = true;
        requirements.needsSemanticAnalysis = true;
        break;

      case 'relationship_discovery':
        requirements.needsEntityExtraction = true;
        requirements.needsRelationshipExtraction = true;
        break;

      case 'research_synthesis':
        requirements.needsUnstructuredDataProcessing = true;
        requirements.needsLiteratureReview = true;
        requirements.needsStatisticalAnalysis = true;
        break;

      case 'clinical_insights':
        requirements.needsClinicalValidation = true;
        requirements.needsStatisticalAnalysis = true;
        requirements.needsVisualization = true;
        break;

      case 'drug_discovery':
        requirements.needsKnowledgeGraphConstruction = true;
        requirements.needsRelationshipExtraction = true;
        requirements.needsClinicalValidation = true;
        break;

      case 'treatment_analysis':
        requirements.needsEntityExtraction = true;
        requirements.needsRelationshipExtraction = true;
        requirements.needsClinicalValidation = true;
        break;
    }

    // Add secondary intent requirements
    for (const secondaryIntent of intentAnalysis.secondaryIntents || []) {
      if (secondaryIntent === 'visualization') {
        requirements.needsVisualization = true;
      }
      if (secondaryIntent === 'validation') {
        requirements.needsClinicalValidation = true;
      }
    }

    return requirements;
  }

  /**
   * Define expected outputs based on intent
   */
  defineExpectedOutputs(intentAnalysis) {
    const outputs = {
      knowledgeGraph: false,
      entityList: false,
      relationshipMap: false,
      analyticalReport: false,
      visualizations: false,
      recommendations: false,
      citations: false,
      confidenceScores: false,
      statisticalSummary: false,
      clinicalInsights: false
    };

    // Primary intent outputs
    switch (intentAnalysis.primaryIntent) {
      case 'knowledge_graph_construction':
        outputs.knowledgeGraph = true;
        outputs.entityList = true;
        outputs.relationshipMap = true;
        outputs.confidenceScores = true;
        break;

      case 'document_analysis':
        outputs.analyticalReport = true;
        outputs.entityList = true;
        outputs.citations = true;
        break;

      case 'entity_extraction':
        outputs.entityList = true;
        outputs.confidenceScores = true;
        break;

      case 'relationship_discovery':
        outputs.relationshipMap = true;
        outputs.entityList = true;
        outputs.confidenceScores = true;
        break;

      case 'research_synthesis':
        outputs.analyticalReport = true;
        outputs.citations = true;
        outputs.statisticalSummary = true;
        break;

      case 'clinical_insights':
        outputs.clinicalInsights = true;
        outputs.recommendations = true;
        outputs.statisticalSummary = true;
        break;

      case 'drug_discovery':
        outputs.knowledgeGraph = true;
        outputs.relationshipMap = true;
        outputs.recommendations = true;
        outputs.clinicalInsights = true;
        break;

      case 'treatment_analysis':
        outputs.relationshipMap = true;
        outputs.clinicalInsights = true;
        outputs.recommendations = true;
        outputs.confidenceScores = true;
        break;
    }

    // Output format preferences
    if (intentAnalysis.outputFormat === 'visualizations') {
      outputs.visualizations = true;
    }

    return outputs;
  }

  /**
   * Assess complexity of the user's request
   */
  assessComplexity(intentAnalysis) {
    let complexity = 'medium';

    const complexityFactors = {
      analysisDepth: {
        'surface': 1,
        'detailed': 2,
        'comprehensive': 3
      },
      primaryIntent: {
        'entity_extraction': 1,
        'document_analysis': 2,
        'relationship_discovery': 2,
        'knowledge_graph_construction': 3,
        'research_synthesis': 3,
        'clinical_insights': 3,
        'drug_discovery': 4,
        'treatment_analysis': 3
      }
    };

    const depthScore = complexityFactors.analysisDepth[intentAnalysis.analysisDepth] || 2;
    const intentScore = complexityFactors.primaryIntent[intentAnalysis.primaryIntent] || 2;
    const secondaryScore = (intentAnalysis.secondaryIntents?.length || 0) * 0.5;

    const totalScore = depthScore + intentScore + secondaryScore;

    if (totalScore <= 3) complexity = 'low';
    else if (totalScore <= 6) complexity = 'medium';
    else if (totalScore <= 8) complexity = 'high';
    else complexity = 'very_high';

    return {
      level: complexity,
      score: totalScore,
      factors: {
        analysisDepth: depthScore,
        primaryIntent: intentScore,
        secondaryIntents: secondaryScore
      }
    };
  }

  /**
   * Assess urgency of the request
   */
  assessUrgency(userQuery, context) {
    const urgencyIndicators = {
      high: ['urgent', 'asap', 'emergency', 'critical', 'immediate'],
      medium: ['soon', 'priority', 'important', 'deadline'],
      low: ['research', 'explore', 'investigate', 'study']
    };

    const queryText = JSON.stringify(userQuery).toLowerCase();
    
    for (const [level, indicators] of Object.entries(urgencyIndicators)) {
      if (indicators.some(indicator => queryText.includes(indicator))) {
        return {
          level: level,
          reasoning: `Query contains urgency indicator: ${indicators.find(i => queryText.includes(i))}`
        };
      }
    }

    return {
      level: 'normal',
      reasoning: 'No specific urgency indicators found'
    };
  }

  /**
   * Identify domain specialization requirements
   */
  identifyDomainSpecialization(intentAnalysis) {
    const specializations = [];

    // Medical domain mapping
    const medicalDomains = {
      'cardiology': ['heart', 'cardiac', 'cardiovascular', 'hypertension'],
      'oncology': ['cancer', 'tumor', 'chemotherapy', 'radiation'],
      'neurology': ['brain', 'neurological', 'alzheimer', 'parkinson'],
      'endocrinology': ['diabetes', 'insulin', 'hormone', 'thyroid'],
      'pharmacology': ['drug', 'medication', 'dosage', 'pharmaceutical'],
      'genetics': ['gene', 'genetic', 'dna', 'mutation', 'genomic']
    };

    const focusText = intentAnalysis.medicalFocus?.toLowerCase() || '';
    
    for (const [domain, keywords] of Object.entries(medicalDomains)) {
      if (keywords.some(keyword => focusText.includes(keyword))) {
        specializations.push(domain);
      }
    }

    return {
      primary: intentAnalysis.medicalFocus || 'general_medicine',
      additional: specializations,
      expertiseRequired: intentAnalysis.expertiseLevel || 'intermediate'
    };
  }

  /**
   * Get fallback intent when AI analysis fails
   */
  getFallbackIntent(userQuery) {
    return {
      primaryIntent: 'document_analysis',
      secondaryIntents: ['entity_extraction'],
      medicalFocus: 'general_medicine',
      processingRequirements: {
        needsUnstructuredDataProcessing: true,
        needsEntityExtraction: true,
        needsSemanticAnalysis: true
      },
      expectedOutputs: {
        analyticalReport: true,
        entityList: true,
        citations: true
      },
      confidenceLevel: 0.5,
      complexity: {
        level: 'medium',
        score: 4
      },
      urgency: {
        level: 'normal',
        reasoning: 'Fallback assessment'
      },
      domainSpecialization: {
        primary: 'general_medicine',
        additional: [],
        expertiseRequired: 'intermediate'
      }
    };
  }

  /**
   * Get basic intent analysis when AI fails
   */
  getBasicIntentAnalysis(userQuery) {
    const queryText = JSON.stringify(userQuery).toLowerCase();
    
    let primaryIntent = 'document_analysis';
    
    if (queryText.includes('knowledge graph') || queryText.includes('graph')) {
      primaryIntent = 'knowledge_graph_construction';
    } else if (queryText.includes('entities') || queryText.includes('extract')) {
      primaryIntent = 'entity_extraction';
    } else if (queryText.includes('relationship') || queryText.includes('connection')) {
      primaryIntent = 'relationship_discovery';
    }

    return {
      primaryIntent,
      secondaryIntents: [],
      medicalFocus: 'general_medicine',
      analysisDepth: 'detailed',
      outputFormat: 'structured_data',
      expertiseLevel: 'intermediate',
      timeSensitivity: 'normal',
      confidence: 0.6,
      reasoning: 'Basic text-based intent detection'
    };
  }

  /**
   * Update intent based on processing progress
   */
  updateIntent(originalIntent, processingResults) {
    const updatedIntent = { ...originalIntent };
    
    // Adjust requirements based on what was found
    if (processingResults.documentsProcessed && processingResults.documentsProcessed > 0) {
      updatedIntent.processingRequirements.needsDocumentProcessing = true;
    }
    
    if (processingResults.entitiesFound && processingResults.entitiesFound > 50) {
      updatedIntent.complexity.level = 'high';
    }

    return updatedIntent;
  }

  /**
   * Get intent processing recommendations
   */
  getProcessingRecommendations(intent) {
    const recommendations = [];

    if (intent.complexity.level === 'very_high') {
      recommendations.push('Consider breaking down into smaller subtasks');
      recommendations.push('Use parallel processing for multiple documents');
    }

    if (intent.urgency.level === 'high') {
      recommendations.push('Prioritize quick entity extraction over comprehensive analysis');
      recommendations.push('Use cached results where available');
    }

    if (intent.domainSpecialization.primary !== 'general_medicine') {
      recommendations.push(`Use ${intent.domainSpecialization.primary}-specific processing models`);
      recommendations.push('Apply domain-specific validation rules');
    }

    return recommendations;
  }
}

export default UserIntentAgent;