// server/agents/UnstructuredDataAgent.js

/**
 * Unstructured Data Agent - Processes unstructured documents (PDF, TXT, MD, HTML)
 * Part of the multi-agent knowledge graph construction system
 */
class UnstructuredDataAgent {
  constructor(openaiService) {
    this.openaiService = openaiService;
    this.supportedFormats = ['pdf', 'txt', 'md', 'html', 'docx', 'rtf'];
    
    // Medical NER patterns (simple regex-based patterns)
    this.medicalPatterns = {
      drugs: /\b(?:aspirin|ibuprofen|acetaminophen|metformin|lisinopril|atorvastatin|omeprazole|levothyroxine|amlodipine|metoprolol|hydrochlorothiazide|gabapentin|losartan|sertraline|montelukast)\b/gi,
      diseases: /\b(?:diabetes|hypertension|cancer|pneumonia|influenza|covid-19|alzheimer|parkinson|arthritis|asthma|copd|depression|anxiety|obesity|stroke)\b/gi,
      symptoms: /\b(?:fever|cough|headache|fatigue|nausea|vomiting|diarrhea|pain|swelling|rash|difficulty breathing|chest pain|dizziness)\b/gi,
      dosages: /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?|tablets?|capsules?)\b/gi,
      procedures: /\b(?:surgery|biopsy|chemotherapy|radiation|dialysis|transplant|catheterization|endoscopy|mri|ct scan|x-ray|ultrasound)\b/gi
    };
  }

  /**
   * Process an unstructured document and extract entities and relationships
   * @param {Object} document - Document object with content, type, and metadata
   * @param {Object} schema - Proposed schema for the knowledge graph
   */
  async processDocument(document, schema) {
    try {
      console.log(`📄 Unstructured Data Agent: Processing ${document.type} document`);

      // Clean and preprocess the text
      const processedText = await this.preprocessText(document.content);
      
      // Extract entities using multiple methods
      const entities = await this.extractUnstructuredEntities(processedText, document, schema);
      
      // Extract relationships using NLP and AI
      const relationships = await this.extractUnstructuredRelationships(processedText, entities, document, schema);
      
      // Post-process and validate results
      const validatedEntities = await this.validateEntities(entities);
      const validatedRelationships = await this.validateRelationships(relationships, validatedEntities);

      return {
        success: true,
        documentId: document.metadata?.id || document.type,
        entities: validatedEntities,
        relationships: validatedRelationships,
        processedText: processedText,
        processingMetadata: {
          format: document.type,
          textLength: processedText.length,
          entitiesFound: validatedEntities.length,
          relationshipsFound: validatedRelationships.length,
          processingTime: Date.now()
        }
      };

    } catch (error) {
      console.error('❌ Unstructured Data Agent Error:', error);
      return {
        success: false,
        error: error.message,
        entities: [],
        relationships: []
      };
    }
  }

  /**
   * Preprocess and clean text
   */
  async preprocessText(content) {
    let text = content;
    
    // Remove HTML tags if present
    text = text.replace(/<[^>]*>/g, ' ');
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Remove special characters but keep medical ones
    text = text.replace(/[^\w\s\-.,;:()\/%]/g, ' ');
    
    // Normalize medical abbreviations
    text = this.normalizeMedicalAbbreviations(text);
    
    return text;
  }

  /**
   * Extract entities from unstructured text
   */
  async extractUnstructuredEntities(text, document, schema) {
    const entities = [];
    const sourceDoc = document.metadata?.title || document.type;

    try {
      // Method 1: Pattern-based extraction
      const patternEntities = this.extractEntitiesWithPatterns(text, sourceDoc);
      entities.push(...patternEntities);

      // Method 2: AI-powered Named Entity Recognition
      const aiEntities = await this.extractEntitiesWithAI(text, sourceDoc, schema);
      entities.push(...aiEntities);

      // Method 3: Context-based extraction
      const contextEntities = await this.extractEntitiesWithContext(text, sourceDoc, schema);
      entities.push(...contextEntities);

      // Deduplicate and merge similar entities
      const deduplicatedEntities = this.deduplicateEntities(entities);

      return deduplicatedEntities;

    } catch (error) {
      console.error('Entity extraction error:', error);
      return entities;
    }
  }

  /**
   * Extract entities using pattern matching
   */
  extractEntitiesWithPatterns(text, sourceDoc) {
    const entities = [];

    for (const [entityType, pattern] of Object.entries(this.medicalPatterns)) {
      const matches = [...text.matchAll(pattern)];
      
      for (const match of matches) {
        entities.push({
          label: match[0].trim(),
          type: this.mapPatternTypeToEntityType(entityType),
          properties: {
            extractionMethod: 'pattern_matching',
            position: match.index,
            context: this.extractContext(text, match.index, 50)
          },
          sourceDocument: sourceDoc,
          confidence: 0.8
        });
      }
    }

    return entities;
  }

  /**
   * Extract entities using AI/LLM
   */
  async extractEntitiesWithAI(text, sourceDoc, schema) {
    try {
      const prompt = `You are a medical NER (Named Entity Recognition) expert. Extract medical entities from this text.

Text to analyze:
"""
${text.slice(0, 2000)} ${text.length > 2000 ? '...' : ''}
"""

Extract entities in these categories:
- Drugs/Medications
- Diseases/Conditions
- Symptoms
- Treatments/Procedures
- Medical Devices
- Anatomical Parts
- Lab Results/Values
- Medical Professionals
- Healthcare Facilities
- Clinical Studies/Trials

Return a JSON array of entities in this format:
[{
  "label": "entity text",
  "type": "entity_category",
  "confidence": 0.9,
  "context": "surrounding text for context",
  "properties": {"additional": "relevant properties"}
}]

Focus on medical accuracy and avoid duplicates.`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.2,
        maxTokens: 1500
      });

      const aiEntities = JSON.parse(response.content);
      
      return aiEntities.map(entity => ({
        ...entity,
        sourceDocument: sourceDoc,
        properties: {
          ...entity.properties,
          extractionMethod: 'ai_nlp'
        }
      }));

    } catch (error) {
      console.error('AI entity extraction error:', error);
      return [];
    }
  }

  /**
   * Extract entities using contextual analysis
   */
  async extractEntitiesWithContext(text, sourceDoc, schema) {
    const entities = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    try {
      for (const sentence of sentences.slice(0, 20)) { // Process first 20 sentences
        const contextPrompt = `Analyze this medical sentence for entities:

"${sentence.trim()}"

Extract any medical entities with their relationships to other entities in the sentence. Return JSON:
[{
  "label": "entity",
  "type": "category", 
  "confidence": 0.8,
  "relatedEntities": ["entity1", "entity2"]
}]`;

        const response = await this.openaiService.generateResponse([
          { role: "user", content: contextPrompt }
        ], {
          temperature: 0.1,
          maxTokens: 500
        });

        try {
          const contextEntities = JSON.parse(response.content);
          entities.push(...contextEntities.map(entity => ({
            ...entity,
            sourceDocument: sourceDoc,
            properties: {
              extractionMethod: 'contextual_analysis',
              sourceSentence: sentence.trim(),
              relatedEntities: entity.relatedEntities || []
            }
          })));
        } catch (parseError) {
          // Skip this sentence if JSON parsing fails
          continue;
        }
      }

    } catch (error) {
      console.error('Context entity extraction error:', error);
    }

    return entities;
  }

  /**
   * Extract relationships from unstructured text
   */
  async extractUnstructuredRelationships(text, entities, document, schema) {
    const relationships = [];
    const sourceDoc = document.metadata?.title || document.type;

    try {
      // Method 1: Pattern-based relationship extraction
      const patternRelationships = this.extractRelationshipsWithPatterns(text, entities, sourceDoc);
      relationships.push(...patternRelationships);

      // Method 2: AI-powered relationship extraction
      const aiRelationships = await this.extractRelationshipsWithAI(text, entities, sourceDoc, schema);
      relationships.push(...aiRelationships);

      // Method 3: Co-occurrence based relationships
      const cooccurrenceRelationships = this.extractCooccurrenceRelationships(text, entities, sourceDoc);
      relationships.push(...cooccurrenceRelationships);

      return this.deduplicateRelationships(relationships);

    } catch (error) {
      console.error('Relationship extraction error:', error);
      return relationships;
    }
  }

  /**
   * Extract relationships using patterns
   */
  extractRelationshipsWithPatterns(text, entities, sourceDoc) {
    const relationships = [];
    const relationshipPatterns = [
      { pattern: /(\w+)\s+treats\s+(\w+)/gi, type: 'treats' },
      { pattern: /(\w+)\s+causes\s+(\w+)/gi, type: 'causes' },
      { pattern: /(\w+)\s+is used for\s+(\w+)/gi, type: 'used_for' },
      { pattern: /(\w+)\s+prevents\s+(\w+)/gi, type: 'prevents' },
      { pattern: /(\w+)\s+associated with\s+(\w+)/gi, type: 'associated_with' },
      { pattern: /(\w+)\s+indicated for\s+(\w+)/gi, type: 'indicated_for' },
      { pattern: /(\w+)\s+contraindicated in\s+(\w+)/gi, type: 'contraindicated_in' }
    ];

    for (const { pattern, type } of relationshipPatterns) {
      const matches = [...text.matchAll(pattern)];
      
      for (const match of matches) {
        relationships.push({
          source: match[1].trim(),
          target: match[2].trim(),
          type: type,
          properties: {
            extractionMethod: 'pattern_matching',
            context: this.extractContext(text, match.index, 100),
            confidence: 0.7
          },
          sourceDocument: sourceDoc,
          confidence: 0.7
        });
      }
    }

    return relationships;
  }

  /**
   * Extract relationships using AI
   */
  async extractRelationshipsWithAI(text, entities, sourceDoc, schema) {
    try {
      const entityLabels = entities.map(e => e.label).slice(0, 20); // Limit for context
      
      const prompt = `You are a medical relationship extraction expert. Analyze this text and identify relationships between medical entities.

Text:
"""
${text.slice(0, 1500)}${text.length > 1500 ? '...' : ''}
"""

Key entities found: ${entityLabels.join(', ')}

Extract medical relationships like:
- Drug TREATS Disease
- Disease CAUSES Symptom  
- Drug INTERACTS_WITH Drug
- Treatment INDICATED_FOR Disease
- Drug CONTRAINDICATED_IN Condition
- Gene ASSOCIATED_WITH Disease
- Procedure USED_FOR Treatment

Return JSON array:
[{
  "source": "entity1",
  "target": "entity2", 
  "type": "relationship_type",
  "confidence": 0.8,
  "evidence": "text evidence for this relationship"
}]

Focus on medically accurate relationships with clear evidence.`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.2,
        maxTokens: 1000
      });

      const aiRelationships = JSON.parse(response.content);
      
      return aiRelationships.map(rel => ({
        ...rel,
        sourceDocument: sourceDoc,
        properties: {
          extractionMethod: 'ai_nlp',
          evidence: rel.evidence
        }
      }));

    } catch (error) {
      console.error('AI relationship extraction error:', error);
      return [];
    }
  }

  /**
   * Extract relationships based on co-occurrence
   */
  extractCooccurrenceRelationships(text, entities, sourceDoc) {
    const relationships = [];
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      const sentenceEntities = entities.filter(entity => 
        sentence.toLowerCase().includes(entity.label.toLowerCase())
      );
      
      // Create co-occurrence relationships
      for (let i = 0; i < sentenceEntities.length; i++) {
        for (let j = i + 1; j < sentenceEntities.length; j++) {
          const entity1 = sentenceEntities[i];
          const entity2 = sentenceEntities[j];
          
          relationships.push({
            source: entity1.label,
            target: entity2.label,
            type: 'co_occurs_with',
            properties: {
              extractionMethod: 'co_occurrence',
              context: sentence.trim(),
              strength: this.calculateCooccurrenceStrength(entity1, entity2, sentence)
            },
            sourceDocument: sourceDoc,
            confidence: 0.6
          });
        }
      }
    }
    
    return relationships;
  }

  // Helper methods
  mapPatternTypeToEntityType(patternType) {
    const mapping = {
      drugs: 'Drug',
      diseases: 'Disease', 
      symptoms: 'Symptom',
      dosages: 'Dosage',
      procedures: 'Procedure'
    };
    return mapping[patternType] || 'Entity';
  }

  extractContext(text, position, length) {
    const start = Math.max(0, position - length);
    const end = Math.min(text.length, position + length);
    return text.slice(start, end);
  }

  normalizeMedicalAbbreviations(text) {
    const abbreviations = {
      'bp': 'blood pressure',
      'hr': 'heart rate',
      'rr': 'respiratory rate',
      'temp': 'temperature',
      'wbc': 'white blood cell',
      'rbc': 'red blood cell',
      'hgb': 'hemoglobin',
      'hct': 'hematocrit'
    };
    
    let normalizedText = text;
    for (const [abbr, full] of Object.entries(abbreviations)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      normalizedText = normalizedText.replace(regex, full);
    }
    
    return normalizedText;
  }

  deduplicateEntities(entities) {
    const uniqueEntities = new Map();
    
    for (const entity of entities) {
      const key = `${entity.label.toLowerCase()}_${entity.type}`;
      
      if (!uniqueEntities.has(key)) {
        uniqueEntities.set(key, entity);
      } else {
        // Merge properties and keep highest confidence
        const existing = uniqueEntities.get(key);
        if (entity.confidence > existing.confidence) {
          uniqueEntities.set(key, {
            ...entity,
            properties: { ...existing.properties, ...entity.properties }
          });
        }
      }
    }
    
    return Array.from(uniqueEntities.values());
  }

  deduplicateRelationships(relationships) {
    const uniqueRelationships = new Map();
    
    for (const rel of relationships) {
      const key = `${rel.source.toLowerCase()}_${rel.type}_${rel.target.toLowerCase()}`;
      
      if (!uniqueRelationships.has(key)) {
        uniqueRelationships.set(key, rel);
      } else {
        // Keep relationship with higher confidence
        const existing = uniqueRelationships.get(key);
        if (rel.confidence > existing.confidence) {
          uniqueRelationships.set(key, rel);
        }
      }
    }
    
    return Array.from(uniqueRelationships.values());
  }

  calculateCooccurrenceStrength(entity1, entity2, sentence) {
    const words = sentence.split(/\s+/);
    const pos1 = words.findIndex(w => w.toLowerCase().includes(entity1.label.toLowerCase()));
    const pos2 = words.findIndex(w => w.toLowerCase().includes(entity2.label.toLowerCase()));
    
    if (pos1 === -1 || pos2 === -1) return 0.3;
    
    const distance = Math.abs(pos1 - pos2);
    return Math.max(0.3, 1.0 - (distance / words.length));
  }

  async validateEntities(entities) {
    return entities.filter(entity => 
      entity.label && 
      entity.label.trim().length > 1 && 
      entity.type &&
      entity.confidence >= 0.5
    );
  }

  async validateRelationships(relationships, entities) {
    const entityLabels = new Set(entities.map(e => e.label.toLowerCase()));
    
    return relationships.filter(rel => 
      rel.source && 
      rel.target && 
      rel.type &&
      rel.source !== rel.target &&
      rel.confidence >= 0.5 &&
      (entityLabels.has(rel.source.toLowerCase()) || entityLabels.has(rel.target.toLowerCase()))
    );
  }
}

export default UnstructuredDataAgent;