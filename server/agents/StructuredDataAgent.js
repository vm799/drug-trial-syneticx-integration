// server/agents/StructuredDataAgent.js

/**
 * Structured Data Agent - Processes structured documents (CSV, JSON, XML, databases)
 * Part of the multi-agent knowledge graph construction system
 */
class StructuredDataAgent {
  constructor(openaiService) {
    this.openaiService = openaiService;
    this.supportedFormats = ['json', 'csv', 'xml', 'xlsx', 'database', 'api'];
  }

  /**
   * Process a structured document and extract entities and relationships
   * @param {Object} document - Document object with content, type, and metadata
   * @param {Object} schema - Proposed schema for the knowledge graph
   */
  async processDocument(document, schema) {
    try {
      console.log(`📊 Structured Data Agent: Processing ${document.type} document`);

      // Parse the structured data based on format
      const parsedData = await this.parseStructuredData(document);
      
      // Extract entities from structured data
      const entities = await this.extractStructuredEntities(parsedData, document, schema);
      
      // Extract relationships from structured data
      const relationships = await this.extractStructuredRelationships(parsedData, document, schema);
      
      // Validate and clean the extracted data
      const validatedEntities = await this.validateEntities(entities);
      const validatedRelationships = await this.validateRelationships(relationships);

      return {
        success: true,
        documentId: document.metadata?.id || document.type,
        entities: validatedEntities,
        relationships: validatedRelationships,
        parsedData: parsedData,
        processingMetadata: {
          format: document.type,
          entitiesFound: validatedEntities.length,
          relationshipsFound: validatedRelationships.length,
          processingTime: Date.now()
        }
      };

    } catch (error) {
      console.error('❌ Structured Data Agent Error:', error);
      return {
        success: false,
        error: error.message,
        entities: [],
        relationships: []
      };
    }
  }

  /**
   * Parse structured data based on format
   */
  async parseStructuredData(document) {
    switch (document.type.toLowerCase()) {
      case 'json':
        return this.parseJSON(document.content);
      case 'csv':
        return this.parseCSV(document.content);
      case 'xml':
        return this.parseXML(document.content);
      case 'xlsx':
        return this.parseExcel(document.content);
      case 'database':
        return this.parseDatabaseSchema(document.content);
      case 'api':
        return this.parseAPIResponse(document.content);
      default:
        // Try to auto-detect format
        return this.autoParseStructuredData(document.content);
    }
  }

  /**
   * Extract entities from parsed structured data
   */
  async extractStructuredEntities(parsedData, document, schema) {
    const entities = [];
    const medicalEntityTypes = schema.entityTypes || this.getDefaultMedicalEntityTypes();

    try {
      // Handle different data structures
      if (Array.isArray(parsedData)) {
        // Array of objects (like CSV rows or JSON array)
        for (const item of parsedData) {
          entities.push(...this.extractEntitiesFromObject(item, medicalEntityTypes, document));
        }
      } else if (typeof parsedData === 'object' && parsedData !== null) {
        // Single object or nested structure
        entities.push(...this.extractEntitiesFromObject(parsedData, medicalEntityTypes, document));
      }

      // Use AI to enhance entity extraction for medical context
      const aiEnhancedEntities = await this.aiEnhanceStructuredEntities(entities, parsedData, schema);
      
      return aiEnhancedEntities;

    } catch (error) {
      console.error('Entity extraction error:', error);
      return entities;
    }
  }

  /**
   * Extract relationships from parsed structured data
   */
  async extractStructuredRelationships(parsedData, document, schema) {
    const relationships = [];
    const medicalRelationTypes = schema.relationshipTypes || this.getDefaultMedicalRelationshipTypes();

    try {
      if (Array.isArray(parsedData)) {
        for (const item of parsedData) {
          relationships.push(...this.extractRelationshipsFromObject(item, medicalRelationTypes, document));
        }
      } else if (typeof parsedData === 'object') {
        relationships.push(...this.extractRelationshipsFromObject(parsedData, medicalRelationTypes, document));
      }

      // Use AI to identify implicit relationships
      const aiEnhancedRelationships = await this.aiEnhanceStructuredRelationships(
        relationships, 
        parsedData, 
        schema
      );

      return aiEnhancedRelationships;

    } catch (error) {
      console.error('Relationship extraction error:', error);
      return relationships;
    }
  }

  /**
   * Extract entities from a single object
   */
  extractEntitiesFromObject(obj, entityTypes, document) {
    const entities = [];
    const sourceDoc = document.metadata?.title || document.type;

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined || value === '') continue;

      const entityType = this.determineEntityType(key, value, entityTypes);
      if (entityType) {
        entities.push({
          label: String(value),
          type: entityType,
          properties: {
            sourceField: key,
            dataType: typeof value,
            originalValue: value
          },
          sourceDocument: sourceDoc,
          confidence: this.calculateEntityConfidence(key, value, entityType)
        });
      }
    }

    return entities;
  }

  /**
   * Extract relationships from a single object
   */
  extractRelationshipsFromObject(obj, relationTypes, document) {
    const relationships = [];
    const sourceDoc = document.metadata?.title || document.type;
    const keys = Object.keys(obj);

    // Look for foreign key relationships and associations
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const key1 = keys[i];
        const key2 = keys[j];
        const value1 = obj[key1];
        const value2 = obj[key2];

        const relationshipType = this.determineRelationshipType(key1, key2, value1, value2, relationTypes);
        
        if (relationshipType) {
          relationships.push({
            source: String(value1),
            target: String(value2),
            type: relationshipType,
            properties: {
              sourceField1: key1,
              sourceField2: key2,
              strength: this.calculateRelationshipStrength(key1, key2, value1, value2)
            },
            sourceDocument: sourceDoc,
            confidence: this.calculateRelationshipConfidence(key1, key2, relationshipType)
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Use AI to enhance entity extraction with medical context
   */
  async aiEnhanceStructuredEntities(entities, parsedData, schema) {
    try {
      const prompt = `You are a medical knowledge extraction expert. Analyze this structured data and the extracted entities to:

1. Identify additional medical entities that might have been missed
2. Improve entity type classification for medical domain
3. Extract compound entities (e.g., "Stage IV Lung Cancer" as single entity)
4. Identify medical codes (ICD-10, CPT, etc.)

Structured Data Sample:
${JSON.stringify(parsedData, null, 2).slice(0, 1000)}

Current Entities:
${JSON.stringify(entities.slice(0, 10), null, 2)}

Schema Context:
${JSON.stringify(schema, null, 2)}

Return a JSON array of additional or improved entities in this format:
[{
  "label": "entity name",
  "type": "medical_entity_type",
  "properties": {"relevant": "properties"},
  "confidence": 0.8,
  "reasoning": "why this entity is important"
}]

Focus on medical relevance and accuracy.`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.3,
        maxTokens: 1500
      });

      const aiEntities = JSON.parse(response.content);
      
      // Merge AI-enhanced entities with original entities
      const enhancedEntities = [...entities];
      for (const aiEntity of aiEntities) {
        aiEntity.sourceDocument = entities[0]?.sourceDocument || 'structured_data';
        aiEntity.aiEnhanced = true;
        enhancedEntities.push(aiEntity);
      }

      return enhancedEntities;

    } catch (error) {
      console.error('AI entity enhancement error:', error);
      return entities; // Return original entities if AI enhancement fails
    }
  }

  /**
   * Use AI to enhance relationship extraction
   */
  async aiEnhanceStructuredRelationships(relationships, parsedData, schema) {
    try {
      const prompt = `You are a medical knowledge extraction expert. Analyze this structured data to identify important relationships:

1. Medical relationships (treats, causes, prevents, etc.)
2. Hierarchical relationships (is_type_of, part_of, etc.)
3. Temporal relationships (precedes, follows, etc.)
4. Statistical relationships (correlates_with, associated_with, etc.)

Structured Data Sample:
${JSON.stringify(parsedData, null, 2).slice(0, 1000)}

Current Relationships:
${JSON.stringify(relationships.slice(0, 5), null, 2)}

Return a JSON array of additional relationships in this format:
[{
  "source": "source_entity",
  "target": "target_entity", 
  "type": "relationship_type",
  "properties": {"strength": 0.8, "context": "explanation"},
  "confidence": 0.7
}]

Focus on medically meaningful relationships.`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.3,
        maxTokens: 1000
      });

      const aiRelationships = JSON.parse(response.content);
      
      const enhancedRelationships = [...relationships];
      for (const aiRel of aiRelationships) {
        aiRel.sourceDocument = relationships[0]?.sourceDocument || 'structured_data';
        aiRel.aiEnhanced = true;
        enhancedRelationships.push(aiRel);
      }

      return enhancedRelationships;

    } catch (error) {
      console.error('AI relationship enhancement error:', error);
      return relationships;
    }
  }

  // Data parsing methods
  parseJSON(content) {
    try {
      return typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  parseCSV(content) {
    // Simple CSV parser - in production, use a proper CSV library
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    
    return rows;
  }

  parseXML(content) {
    // Simplified XML parsing - in production, use proper XML parser
    const entities = [];
    const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      entities.push({
        tag: match[1],
        value: match[2]
      });
    }
    
    return entities;
  }

  parseExcel(content) {
    // Placeholder for Excel parsing - would use library like xlsx
    throw new Error('Excel parsing not implemented - use CSV format');
  }

  parseDatabaseSchema(content) {
    // Parse database schema or query results
    return typeof content === 'string' ? JSON.parse(content) : content;
  }

  parseAPIResponse(content) {
    return this.parseJSON(content);
  }

  autoParseStructuredData(content) {
    // Try to auto-detect format
    try {
      return this.parseJSON(content);
    } catch {
      try {
        return this.parseCSV(content);
      } catch {
        return { raw: content };
      }
    }
  }

  // Helper methods
  getDefaultMedicalEntityTypes() {
    return [
      'Drug', 'Disease', 'Symptom', 'Treatment', 'Patient', 'Study',
      'Gene', 'Protein', 'Dosage', 'SideEffect', 'ClinicalTrial',
      'MedicalDevice', 'Procedure', 'Laboratory', 'Biomarker'
    ];
  }

  getDefaultMedicalRelationshipTypes() {
    return [
      'treats', 'causes', 'prevents', 'interacts_with', 'associated_with',
      'part_of', 'is_type_of', 'precedes', 'follows', 'correlates_with',
      'contraindicated_with', 'indicated_for', 'metabolized_by'
    ];
  }

  determineEntityType(key, value, entityTypes) {
    const lowerKey = key.toLowerCase();
    const lowerValue = String(value).toLowerCase();
    
    // Medical field mapping
    if (lowerKey.includes('drug') || lowerKey.includes('medication') || lowerKey.includes('compound')) {
      return 'Drug';
    }
    if (lowerKey.includes('disease') || lowerKey.includes('condition') || lowerKey.includes('diagnosis')) {
      return 'Disease';
    }
    if (lowerKey.includes('patient') || lowerKey.includes('subject')) {
      return 'Patient';
    }
    if (lowerKey.includes('gene') || lowerKey.includes('genetic')) {
      return 'Gene';
    }
    if (lowerKey.includes('trial') || lowerKey.includes('study')) {
      return 'Study';
    }
    if (lowerKey.includes('dose') || lowerKey.includes('dosage')) {
      return 'Dosage';
    }
    
    return null; // Let AI determine if no clear mapping
  }

  determineRelationshipType(key1, key2, value1, value2, relationTypes) {
    const lowerKey1 = key1.toLowerCase();
    const lowerKey2 = key2.toLowerCase();
    
    // Medical relationship patterns
    if ((lowerKey1.includes('drug') && lowerKey2.includes('disease')) ||
        (lowerKey1.includes('medication') && lowerKey2.includes('condition'))) {
      return 'treats';
    }
    if (lowerKey1.includes('patient') && lowerKey2.includes('study')) {
      return 'participates_in';
    }
    if (lowerKey1.includes('dose') && lowerKey2.includes('drug')) {
      return 'dosage_of';
    }
    
    return null;
  }

  calculateEntityConfidence(key, value, entityType) {
    // Simple confidence scoring
    let confidence = 0.6;
    
    if (key.toLowerCase().includes(entityType.toLowerCase())) {
      confidence += 0.2;
    }
    
    if (typeof value === 'string' && value.length > 0) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  calculateRelationshipConfidence(key1, key2, relationshipType) {
    // Simple confidence scoring for relationships
    return 0.7;
  }

  calculateRelationshipStrength(key1, key2, value1, value2) {
    // Calculate relationship strength based on data
    return 0.8;
  }

  async validateEntities(entities) {
    // Basic validation - in production, implement comprehensive validation
    return entities.filter(entity => 
      entity.label && 
      entity.label.trim().length > 0 && 
      entity.type
    );
  }

  async validateRelationships(relationships) {
    // Basic validation
    return relationships.filter(rel => 
      rel.source && 
      rel.target && 
      rel.type &&
      rel.source !== rel.target
    );
  }
}

export default StructuredDataAgent;