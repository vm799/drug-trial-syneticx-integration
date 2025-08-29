// server/agents/FileSuggestionAgent.js

/**
 * File Suggestion Agent - Analyzes documents and suggests optimal processing strategies
 * Part of the multi-agent knowledge graph construction system
 */
class FileSuggestionAgent {
  constructor(openaiService) {
    this.openaiService = openaiService;
    this.supportedFormats = [
      'pdf', 'txt', 'md', 'html', 'docx', 'rtf', // Unstructured
      'json', 'csv', 'xml', 'xlsx', 'tsv', 'yaml' // Structured
    ];
  }

  /**
   * Suggest processing strategy for a set of documents
   * @param {Array} documents - Array of document objects
   * @param {Object} userIntent - User intent analysis
   */
  async suggestProcessingStrategy(documents, userIntent) {
    try {
      console.log('📁 File Suggestion Agent: Analyzing documents for processing strategy...');

      // Analyze each document
      const documentAnalyses = await this.analyzeDocuments(documents);
      
      // Determine optimal processing order
      const processingOrder = this.determineProcessingOrder(documentAnalyses, userIntent);
      
      // Suggest processing methods
      const processingMethods = this.suggestProcessingMethods(documentAnalyses, userIntent);
      
      // Identify potential challenges
      const challenges = this.identifyProcessingChallenges(documentAnalyses);
      
      // Generate processing recommendations
      const recommendations = await this.generateProcessingRecommendations(
        documentAnalyses, 
        userIntent, 
        challenges
      );

      return {
        documentAnalyses,
        processingOrder,
        processingMethods,
        challenges,
        recommendations,
        structured: processingMethods.structured,
        unstructured: processingMethods.unstructured,
        estimatedProcessingTime: this.estimateProcessingTime(documentAnalyses),
        resourceRequirements: this.calculateResourceRequirements(documentAnalyses)
      };

    } catch (error) {
      console.error('❌ File Suggestion Agent Error:', error);
      return this.getFallbackProcessingStrategy(documents);
    }
  }

  /**
   * Analyze individual documents
   */
  async analyzeDocuments(documents) {
    const analyses = [];

    for (const doc of documents) {
      try {
        const analysis = await this.analyzeDocument(doc);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Error analyzing document ${doc.metadata?.title}:`, error);
        analyses.push(this.getBasicDocumentAnalysis(doc));
      }
    }

    return analyses;
  }

  /**
   * Analyze a single document
   */
  async analyzeDocument(document) {
    const basicAnalysis = this.getBasicDocumentAnalysis(document);
    
    try {
      // Use AI for deeper content analysis
      const aiAnalysis = await this.performAIDocumentAnalysis(document);
      
      return {
        ...basicAnalysis,
        ...aiAnalysis,
        confidence: Math.min((basicAnalysis.confidence + aiAnalysis.confidence) / 2, 1.0)
      };

    } catch (error) {
      console.error('AI document analysis failed:', error);
      return basicAnalysis;
    }
  }

  /**
   * Get basic document analysis without AI
   */
  getBasicDocumentAnalysis(document) {
    const title = document.metadata?.title || 'Unknown';
    const type = document.type?.toLowerCase() || 'unknown';
    const contentLength = document.content?.length || 0;
    
    return {
      id: document.metadata?.id || Math.random().toString(36),
      title,
      type,
      contentLength,
      isStructured: this.isStructuredFormat(type),
      isUnstructured: this.isUnstructuredFormat(type),
      medicalContent: this.containsMedicalContent(document.content),
      complexity: this.assessDocumentComplexity(document),
      processingPriority: this.assignProcessingPriority(document),
      confidence: 0.7
    };
  }

  /**
   * Perform AI-powered document analysis
   */
  async performAIDocumentAnalysis(document) {
    try {
      const contentSample = document.content?.slice(0, 1000) || '';
      
      const prompt = `Analyze this document for knowledge graph construction:

Document Title: ${document.metadata?.title || 'Unknown'}
Document Type: ${document.type}
Content Sample (first 1000 chars):
"""
${contentSample}
"""

Analyze and return JSON:
{
  "medicalDomain": "cardiology|oncology|neurology|general|etc",
  "dataStructure": "highly_structured|semi_structured|unstructured",
  "entityDensity": "high|medium|low", 
  "relationshipComplexity": "complex|moderate|simple",
  "qualityScore": 0.8,
  "processingDifficulty": "easy|moderate|hard",
  "expectedEntities": 50,
  "expectedRelationships": 25,
  "specialRequirements": ["medical_ner", "citation_parsing"],
  "confidence": 0.85
}`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.1,
        maxTokens: 400
      });

      return JSON.parse(response.content);

    } catch (error) {
      console.error('AI document analysis error:', error);
      return {
        medicalDomain: 'general',
        dataStructure: 'unstructured',
        entityDensity: 'medium',
        relationshipComplexity: 'moderate',
        qualityScore: 0.6,
        processingDifficulty: 'moderate',
        expectedEntities: 20,
        expectedRelationships: 10,
        specialRequirements: [],
        confidence: 0.5
      };
    }
  }

  /**
   * Determine optimal processing order
   */
  determineProcessingOrder(documentAnalyses, userIntent) {
    // Sort by processing priority and complexity
    const orderedDocs = [...documentAnalyses].sort((a, b) => {
      // Higher priority first
      if (a.processingPriority !== b.processingPriority) {
        return b.processingPriority - a.processingPriority;
      }
      
      // For same priority, easier docs first if not urgent
      if (userIntent.urgency?.level !== 'high') {
        const difficultyScore = {
          'easy': 1,
          'moderate': 2,
          'hard': 3
        };
        
        return (difficultyScore[a.processingDifficulty] || 2) - 
               (difficultyScore[b.processingDifficulty] || 2);
      }
      
      // For urgent requests, process by expected output size
      return (b.expectedEntities || 0) - (a.expectedEntities || 0);
    });

    return {
      recommendedOrder: orderedDocs.map(doc => ({
        id: doc.id,
        title: doc.title,
        priority: doc.processingPriority,
        reasoning: this.getOrderingReasoning(doc, userIntent)
      })),
      parallelProcessing: this.shouldUseParallelProcessing(documentAnalyses, userIntent),
      batchSize: this.recommendBatchSize(documentAnalyses)
    };
  }

  /**
   * Suggest processing methods for structured vs unstructured documents
   */
  suggestProcessingMethods(documentAnalyses, userIntent) {
    const structured = [];
    const unstructured = [];
    const hybrid = [];

    for (const analysis of documentAnalyses) {
      if (analysis.isStructured) {
        structured.push(analysis.type);
      } else if (analysis.isUnstructured) {
        unstructured.push(analysis.type);
      } else {
        hybrid.push(analysis.type);
      }
    }

    return {
      structured: [...new Set(structured)],
      unstructured: [...new Set(unstructured)],
      hybrid: [...new Set(hybrid)],
      recommendedAgents: this.recommendAgentAllocation(documentAnalyses),
      processingMethods: this.getProcessingMethodDetails(documentAnalyses)
    };
  }

  /**
   * Identify potential processing challenges
   */
  identifyProcessingChallenges(documentAnalyses) {
    const challenges = [];
    
    // Large document challenges
    const largeDocuments = documentAnalyses.filter(doc => doc.contentLength > 100000);
    if (largeDocuments.length > 0) {
      challenges.push({
        type: 'large_documents',
        count: largeDocuments.length,
        impact: 'high',
        description: 'Documents exceed optimal processing size',
        recommendation: 'Consider chunking or parallel processing'
      });
    }

    // Complex medical terminology
    const complexDocs = documentAnalyses.filter(doc => doc.processingDifficulty === 'hard');
    if (complexDocs.length > 0) {
      challenges.push({
        type: 'complex_terminology',
        count: complexDocs.length,
        impact: 'medium',
        description: 'Documents contain complex medical terminology',
        recommendation: 'Use specialized medical NER models'
      });
    }

    // Mixed format challenges
    const formatTypes = [...new Set(documentAnalyses.map(doc => doc.type))];
    if (formatTypes.length > 3) {
      challenges.push({
        type: 'format_diversity',
        count: formatTypes.length,
        impact: 'medium',
        description: 'Multiple different document formats detected',
        recommendation: 'Standardize processing pipeline for each format'
      });
    }

    // Low quality documents
    const lowQualityDocs = documentAnalyses.filter(doc => doc.qualityScore < 0.6);
    if (lowQualityDocs.length > 0) {
      challenges.push({
        type: 'data_quality',
        count: lowQualityDocs.length,
        impact: 'high',
        description: 'Some documents have low quality scores',
        recommendation: 'Apply additional cleaning and validation steps'
      });
    }

    return challenges;
  }

  /**
   * Generate AI-powered processing recommendations
   */
  async generateProcessingRecommendations(documentAnalyses, userIntent, challenges) {
    try {
      const prompt = `Generate processing recommendations for knowledge graph construction:

Document Summary:
- Total Documents: ${documentAnalyses.length}
- Structured: ${documentAnalyses.filter(d => d.isStructured).length}
- Unstructured: ${documentAnalyses.filter(d => d.isUnstructured).length}

User Intent:
${JSON.stringify(userIntent, null, 2)}

Identified Challenges:
${JSON.stringify(challenges, null, 2)}

Generate specific recommendations:
{
  "processingStrategy": "parallel|sequential|hybrid",
  "priorityOrder": ["strategy1", "strategy2"],
  "resourceAllocation": {"structured_agent": "30%", "unstructured_agent": "60%", "validation": "10%"},
  "timeEstimate": "2-4 hours",
  "qualityOptimizations": ["recommendation1", "recommendation2"],
  "riskMitigation": ["risk1_mitigation", "risk2_mitigation"]
}`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.2,
        maxTokens: 600
      });

      return JSON.parse(response.content);

    } catch (error) {
      console.error('Recommendation generation error:', error);
      return this.getFallbackRecommendations(documentAnalyses, userIntent);
    }
  }

  // Helper methods

  isStructuredFormat(type) {
    return ['json', 'csv', 'xml', 'xlsx', 'tsv', 'yaml', 'database'].includes(type);
  }

  isUnstructuredFormat(type) {
    return ['pdf', 'txt', 'md', 'html', 'docx', 'rtf'].includes(type);
  }

  containsMedicalContent(content) {
    if (!content) return false;
    
    const medicalKeywords = [
      'patient', 'diagnosis', 'treatment', 'medication', 'symptoms', 'disease',
      'clinical', 'medical', 'therapeutic', 'drug', 'therapy', 'study',
      'trial', 'research', 'healthcare', 'hospital', 'doctor', 'physician'
    ];
    
    const lowerContent = content.toLowerCase();
    return medicalKeywords.some(keyword => lowerContent.includes(keyword));
  }

  assessDocumentComplexity(document) {
    let complexity = 'medium';
    
    if (!document.content) return 'low';
    
    const length = document.content.length;
    const sentences = document.content.split(/[.!?]+/).length;
    const avgSentenceLength = length / sentences;
    
    if (length < 1000 && avgSentenceLength < 20) {
      complexity = 'low';
    } else if (length > 50000 || avgSentenceLength > 40) {
      complexity = 'high';
    }
    
    return complexity;
  }

  assignProcessingPriority(document) {
    let priority = 1; // Default priority
    
    // Higher priority for medical content
    if (this.containsMedicalContent(document.content)) {
      priority += 2;
    }
    
    // Higher priority for structured data
    if (this.isStructuredFormat(document.type)) {
      priority += 1;
    }
    
    // Lower priority for very large documents
    if (document.content && document.content.length > 100000) {
      priority -= 1;
    }
    
    return Math.max(1, Math.min(5, priority));
  }

  shouldUseParallelProcessing(documentAnalyses, userIntent) {
    // Use parallel processing if:
    // 1. More than 3 documents
    // 2. User intent indicates urgency
    // 3. Documents are of moderate complexity
    
    return documentAnalyses.length > 3 ||
           userIntent.urgency?.level === 'high' ||
           documentAnalyses.some(doc => doc.complexity === 'high');
  }

  recommendBatchSize(documentAnalyses) {
    const totalDocs = documentAnalyses.length;
    const avgComplexity = documentAnalyses.reduce((sum, doc) => {
      const complexityScore = { low: 1, medium: 2, high: 3 };
      return sum + (complexityScore[doc.complexity] || 2);
    }, 0) / totalDocs;
    
    if (avgComplexity > 2.5) return 2; // High complexity: smaller batches
    if (totalDocs > 10) return 5;      // Many docs: medium batches
    return Math.min(totalDocs, 3);     // Default: small batches
  }

  getOrderingReasoning(doc, userIntent) {
    const reasons = [];
    
    if (doc.medicalContent) reasons.push('Contains medical content');
    if (doc.isStructured) reasons.push('Structured format for faster processing');
    if (doc.processingPriority > 3) reasons.push('High priority content');
    if (doc.qualityScore > 0.8) reasons.push('High quality document');
    
    return reasons.join('; ') || 'Standard processing order';
  }

  recommendAgentAllocation(documentAnalyses) {
    const structured = documentAnalyses.filter(doc => doc.isStructured);
    const unstructured = documentAnalyses.filter(doc => doc.isUnstructured);
    
    return {
      structuredAgent: {
        allocation: `${Math.round(structured.length / documentAnalyses.length * 100)}%`,
        documents: structured.length
      },
      unstructuredAgent: {
        allocation: `${Math.round(unstructured.length / documentAnalyses.length * 100)}%`,
        documents: unstructured.length
      }
    };
  }

  getProcessingMethodDetails(documentAnalyses) {
    const methods = {};
    
    for (const doc of documentAnalyses) {
      if (!methods[doc.type]) {
        methods[doc.type] = {
          agent: doc.isStructured ? 'StructuredDataAgent' : 'UnstructuredDataAgent',
          specialRequirements: doc.specialRequirements || [],
          estimatedTime: this.estimateDocumentProcessingTime(doc)
        };
      }
    }
    
    return methods;
  }

  estimateProcessingTime(documentAnalyses) {
    const totalComplexity = documentAnalyses.reduce((sum, doc) => {
      const complexityMultiplier = { low: 1, medium: 2, high: 3 };
      return sum + (complexityMultiplier[doc.complexity] || 2);
    }, 0);
    
    const baseTimeMinutes = totalComplexity * 2; // 2 minutes per complexity point
    
    return {
      estimated: `${Math.round(baseTimeMinutes)}-${Math.round(baseTimeMinutes * 1.5)} minutes`,
      factors: {
        documentCount: documentAnalyses.length,
        totalComplexity,
        parallelProcessing: this.shouldUseParallelProcessing(documentAnalyses, {})
      }
    };
  }

  estimateDocumentProcessingTime(documentAnalysis) {
    const complexityTime = { low: 1, medium: 2, high: 4 };
    return `${complexityTime[documentAnalysis.complexity] || 2} minutes`;
  }

  calculateResourceRequirements(documentAnalyses) {
    const totalSize = documentAnalyses.reduce((sum, doc) => sum + doc.contentLength, 0);
    
    return {
      memory: `${Math.round(totalSize / (1024 * 1024))}MB`,
      processingPower: documentAnalyses.length > 5 ? 'High' : 'Medium',
      estimatedTokens: Math.round(totalSize / 4), // Rough token estimation
      concurrency: this.recommendBatchSize(documentAnalyses)
    };
  }

  getFallbackProcessingStrategy(documents) {
    return {
      structured: documents.filter(doc => this.isStructuredFormat(doc.type)).map(doc => doc.type),
      unstructured: documents.filter(doc => this.isUnstructuredFormat(doc.type)).map(doc => doc.type),
      processingOrder: { recommendedOrder: documents.map((doc, index) => ({ id: index, title: doc.metadata?.title || 'Unknown' })) },
      estimatedProcessingTime: { estimated: `${documents.length * 2}-${documents.length * 3} minutes` }
    };
  }

  getFallbackRecommendations(documentAnalyses, userIntent) {
    return {
      processingStrategy: documentAnalyses.length > 3 ? 'parallel' : 'sequential',
      priorityOrder: ['entity_extraction', 'relationship_discovery'],
      resourceAllocation: { 
        structured_agent: '40%', 
        unstructured_agent: '50%', 
        validation: '10%' 
      },
      timeEstimate: `${documentAnalyses.length * 2}-${documentAnalyses.length * 4} minutes`,
      qualityOptimizations: ['Apply domain-specific NER', 'Use confidence thresholding'],
      riskMitigation: ['Process in batches', 'Validate outputs']
    };
  }
}

export default FileSuggestionAgent;