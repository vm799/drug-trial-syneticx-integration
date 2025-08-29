// server/agents/SchemaProposalAgent.js

/**
 * Schema Proposal Agent - Proposes optimal knowledge graph schema based on documents and intent
 * Part of the multi-agent knowledge graph construction system
 */
class SchemaProposalAgent {
  constructor(openaiService) {
    this.openaiService = openaiService;
    
    // Predefined medical schemas
    this.medicalSchemas = {
      general: {
        entityTypes: ['Drug', 'Disease', 'Symptom', 'Treatment', 'Patient', 'Study'],
        relationshipTypes: ['treats', 'causes', 'prevents', 'associated_with', 'part_of']
      },
      cardiology: {
        entityTypes: ['Cardiovascular_Drug', 'Heart_Disease', 'Cardiac_Symptom', 'Cardiac_Procedure', 'Patient', 'Clinical_Trial'],
        relationshipTypes: ['treats', 'causes', 'prevents', 'indicates', 'contraindicated_with', 'administered_with']
      },
      oncology: {
        entityTypes: ['Chemotherapy_Drug', 'Cancer', 'Tumor', 'Oncological_Procedure', 'Patient', 'Clinical_Trial', 'Biomarker'],
        relationshipTypes: ['treats', 'targets', 'inhibits', 'associated_with', 'prognostic_for', 'predictive_for']
      },
      pharmacology: {
        entityTypes: ['Drug', 'Active_Ingredient', 'Dosage', 'Side_Effect', 'Drug_Interaction', 'Indication'],
        relationshipTypes: ['contains', 'interacts_with', 'causes', 'indicated_for', 'contraindicated_in', 'metabolized_by']
      }
    };
  }

  /**
   * Propose schema for knowledge graph construction
   * @param {Array} documents - Documents to be processed
   * @param {Object} userIntent - User intent analysis
   * @param {Object} fileStrategy - File processing strategy
   */
  async proposeSchema(documents, userIntent, fileStrategy) {
    try {
      console.log('📋 Schema Proposal Agent: Analyzing documents to propose schema...');

      // Analyze document content for schema hints
      const contentAnalysis = await this.analyzeDocumentContent(documents);
      
      // Get base schema for medical domain
      const baseSchema = this.getBaseSchema(userIntent.medicalFocus);
      
      // Generate AI-powered schema enhancements
      const aiEnhancements = await this.generateSchemaEnhancements(
        documents, 
        userIntent, 
        contentAnalysis,
        baseSchema
      );
      
      // Combine and optimize schema
      const proposedSchema = this.combineSchemas(baseSchema, aiEnhancements, contentAnalysis);
      
      // Validate and refine schema
      const validatedSchema = this.validateSchema(proposedSchema, userIntent);
      
      return {
        proposedSchema: validatedSchema,
        baseSchema,
        aiEnhancements,
        contentAnalysis,
        schemaMetadata: {
          confidence: this.calculateSchemaConfidence(validatedSchema, contentAnalysis),
          complexity: this.assessSchemaComplexity(validatedSchema),
          coverage: this.estimateSchemaCoverage(validatedSchema, contentAnalysis),
          adaptability: this.assessSchemaAdaptability(validatedSchema)
        }
      };

    } catch (error) {
      console.error('❌ Schema Proposal Agent Error:', error);
      return this.getFallbackSchema(userIntent.medicalFocus);
    }
  }

  /**
   * Analyze document content to extract schema hints
   */
  async analyzeDocumentContent(documents) {
    const entityHints = new Set();
    const relationshipHints = new Set();
    const domainTerms = new Set();
    
    for (const document of documents.slice(0, 5)) { // Analyze first 5 documents
      try {
        const contentSample = document.content?.slice(0, 2000) || '';
        
        // Extract potential entities and relationships
        const analysis = await this.extractSchemaHints(contentSample, document.type);
        
        analysis.entities.forEach(entity => entityHints.add(entity));
        analysis.relationships.forEach(rel => relationshipHints.add(rel));
        analysis.domainTerms.forEach(term => domainTerms.add(term));
        
      } catch (error) {
        console.error(`Error analyzing document ${document.metadata?.title}:`, error);
      }
    }
    
    return {
      entityHints: Array.from(entityHints),
      relationshipHints: Array.from(relationshipHints),
      domainTerms: Array.from(domainTerms),
      documentCount: documents.length,
      totalContentLength: documents.reduce((sum, doc) => sum + (doc.content?.length || 0), 0)
    };
  }

  /**
   * Extract schema hints from content using AI
   */
  async extractSchemaHints(content, documentType) {
    try {
      const prompt = `Analyze this ${documentType} content to identify potential knowledge graph schema elements:

Content:
"""
${content}
"""

Extract and categorize:
1. Entity types (nouns that represent key concepts)
2. Relationship types (verbs/actions connecting entities)
3. Domain-specific terms (medical/technical terminology)

Return JSON:
{
  "entities": ["Drug", "Disease", "Patient", "Study"],
  "relationships": ["treats", "causes", "participates_in", "associated_with"],
  "domainTerms": ["cardiovascular", "oncology", "pharmacokinetics"],
  "dataStructure": "tabular|hierarchical|narrative|mixed"
}

Focus on medical/healthcare domain relevance.`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.1,
        maxTokens: 400
      });

      return JSON.parse(response.content);

    } catch (error) {
      console.error('Schema hint extraction error:', error);
      return {
        entities: [],
        relationships: [],
        domainTerms: [],
        dataStructure: 'mixed'
      };
    }
  }

  /**
   * Get base schema for medical domain
   */
  getBaseSchema(medicalFocus = 'general') {
    const focus = medicalFocus.toLowerCase();
    
    // Find matching domain schema
    for (const [domain, schema] of Object.entries(this.medicalSchemas)) {
      if (focus.includes(domain) || domain === focus) {
        return { ...schema, domain };
      }
    }
    
    // Return general schema if no specific match
    return { ...this.medicalSchemas.general, domain: 'general' };
  }

  /**
   * Generate AI-powered schema enhancements
   */
  async generateSchemaEnhancements(documents, userIntent, contentAnalysis, baseSchema) {
    try {
      const prompt = `Enhance this knowledge graph schema based on the analysis:

Base Schema:
${JSON.stringify(baseSchema, null, 2)}

Content Analysis:
- Entity hints: ${contentAnalysis.entityHints.join(', ')}
- Relationship hints: ${contentAnalysis.relationshipHints.join(', ')}
- Domain terms: ${contentAnalysis.domainTerms.join(', ')}

User Intent:
- Primary goal: ${userIntent.primaryIntent}
- Medical focus: ${userIntent.medicalFocus}
- Expected outputs: ${JSON.stringify(userIntent.expectedOutputs)}

Propose enhancements:
{
  "additionalEntityTypes": ["Entity1", "Entity2"],
  "additionalRelationshipTypes": ["relationship1", "relationship2"],
  "entityProperties": {
    "Drug": ["name", "dosage", "activeIngredient", "indication"],
    "Disease": ["name", "icd10Code", "category", "prevalence"]
  },
  "relationshipProperties": {
    "treats": ["efficacy", "duration", "evidence_level"],
    "causes": ["probability", "mechanism", "onset_time"]
  },
  "hierarchies": {
    "Drug": ["Prescription_Drug", "OTC_Drug", "Experimental_Drug"],
    "Disease": ["Chronic_Disease", "Acute_Disease", "Genetic_Disease"]
  },
  "constraints": ["unique_drug_names", "valid_dosage_ranges"]
}`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.2,
        maxTokens: 800
      });

      return JSON.parse(response.content);

    } catch (error) {
      console.error('AI schema enhancement error:', error);
      return this.getDefaultEnhancements();
    }
  }

  /**
   * Combine base schema with enhancements
   */
  combineSchemas(baseSchema, aiEnhancements, contentAnalysis) {
    const combinedSchema = {
      domain: baseSchema.domain,
      entityTypes: [
        ...baseSchema.entityTypes,
        ...aiEnhancements.additionalEntityTypes || [],
        ...contentAnalysis.entityHints.filter(hint => 
          !baseSchema.entityTypes.includes(hint)
        ).slice(0, 10) // Limit to 10 additional
      ],
      relationshipTypes: [
        ...baseSchema.relationshipTypes,
        ...aiEnhancements.additionalRelationshipTypes || [],
        ...contentAnalysis.relationshipHints.filter(hint => 
          !baseSchema.relationshipTypes.includes(hint)
        ).slice(0, 10) // Limit to 10 additional
      ],
      entityProperties: aiEnhancements.entityProperties || {},
      relationshipProperties: aiEnhancements.relationshipProperties || {},
      hierarchies: aiEnhancements.hierarchies || {},
      constraints: aiEnhancements.constraints || []
    };

    // Remove duplicates
    combinedSchema.entityTypes = [...new Set(combinedSchema.entityTypes)];
    combinedSchema.relationshipTypes = [...new Set(combinedSchema.relationshipTypes)];

    return combinedSchema;
  }

  /**
   * Validate and refine the proposed schema
   */
  validateSchema(schema, userIntent) {
    const validatedSchema = { ...schema };

    // Ensure minimum required entities for medical domain
    const requiredEntities = ['Drug', 'Disease', 'Patient'];
    for (const entity of requiredEntities) {
      if (!validatedSchema.entityTypes.includes(entity)) {
        validatedSchema.entityTypes.unshift(entity);
      }
    }

    // Ensure minimum required relationships
    const requiredRelationships = ['treats', 'associated_with'];
    for (const rel of requiredRelationships) {
      if (!validatedSchema.relationshipTypes.includes(rel)) {
        validatedSchema.relationshipTypes.push(rel);
      }
    }

    // Add intent-specific schema elements
    if (userIntent.primaryIntent === 'drug_discovery') {
      this.addDrugDiscoverySchema(validatedSchema);
    }
    
    if (userIntent.primaryIntent === 'clinical_insights') {
      this.addClinicalInsightsSchema(validatedSchema);
    }

    // Optimize schema size
    validatedSchema.entityTypes = validatedSchema.entityTypes.slice(0, 20); // Max 20 entity types
    validatedSchema.relationshipTypes = validatedSchema.relationshipTypes.slice(0, 15); // Max 15 relationship types

    return validatedSchema;
  }

  /**
   * Add drug discovery specific schema elements
   */
  addDrugDiscoverySchema(schema) {
    const drugDiscoveryEntities = ['Compound', 'Target', 'Pathway', 'Biomarker', 'Assay'];
    const drugDiscoveryRelations = ['targets', 'modulates', 'inhibits', 'activates', 'binds_to'];

    drugDiscoveryEntities.forEach(entity => {
      if (!schema.entityTypes.includes(entity)) {
        schema.entityTypes.push(entity);
      }
    });

    drugDiscoveryRelations.forEach(relation => {
      if (!schema.relationshipTypes.includes(relation)) {
        schema.relationshipTypes.push(relation);
      }
    });
  }

  /**
   * Add clinical insights specific schema elements
   */
  addClinicalInsightsSchema(schema) {
    const clinicalEntities = ['Clinical_Trial', 'Outcome', 'Population', 'Intervention'];
    const clinicalRelations = ['evaluates', 'demonstrates', 'enrolled_in', 'measured_by'];

    clinicalEntities.forEach(entity => {
      if (!schema.entityTypes.includes(entity)) {
        schema.entityTypes.push(entity);
      }
    });

    clinicalRelations.forEach(relation => {
      if (!schema.relationshipTypes.includes(relation)) {
        schema.relationshipTypes.push(relation);
      }
    });
  }

  /**
   * Calculate schema confidence based on content analysis
   */
  calculateSchemaConfidence(schema, contentAnalysis) {
    let confidence = 0.7; // Base confidence

    // Increase confidence if schema entities match content hints
    const entityMatches = schema.entityTypes.filter(entity => 
      contentAnalysis.entityHints.some(hint => 
        hint.toLowerCase().includes(entity.toLowerCase()) ||
        entity.toLowerCase().includes(hint.toLowerCase())
      )
    ).length;

    const relationshipMatches = schema.relationshipTypes.filter(rel => 
      contentAnalysis.relationshipHints.some(hint => 
        hint.toLowerCase().includes(rel.toLowerCase()) ||
        rel.toLowerCase().includes(hint.toLowerCase())
      )
    ).length;

    confidence += (entityMatches / schema.entityTypes.length) * 0.2;
    confidence += (relationshipMatches / schema.relationshipTypes.length) * 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Assess schema complexity
   */
  assessSchemaComplexity(schema) {
    const entityCount = schema.entityTypes.length;
    const relationshipCount = schema.relationshipTypes.length;
    const hasHierarchies = Object.keys(schema.hierarchies || {}).length > 0;
    const hasProperties = Object.keys(schema.entityProperties || {}).length > 0;

    let complexity = 'medium';

    if (entityCount < 8 && relationshipCount < 6) {
      complexity = 'low';
    } else if (entityCount > 15 || relationshipCount > 12 || hasHierarchies || hasProperties) {
      complexity = 'high';
    }

    return {
      level: complexity,
      entityCount,
      relationshipCount,
      hasHierarchies,
      hasProperties
    };
  }

  /**
   * Estimate how well schema covers the content
   */
  estimateSchemaCoverage(schema, contentAnalysis) {
    if (contentAnalysis.entityHints.length === 0) return 0.8;

    const coveredEntities = contentAnalysis.entityHints.filter(hint =>
      schema.entityTypes.some(entityType => 
        this.entityMatches(hint, entityType)
      )
    ).length;

    const coverage = coveredEntities / contentAnalysis.entityHints.length;
    
    return Math.min(coverage + 0.2, 1.0); // Add base coverage
  }

  /**
   * Assess schema adaptability for future changes
   */
  assessSchemaAdaptability(schema) {
    const hasHierarchies = Object.keys(schema.hierarchies || {}).length > 0;
    const hasFlexibleProperties = Object.keys(schema.entityProperties || {}).length > 0;
    const hasConstraints = (schema.constraints || []).length > 0;

    let adaptability = 'medium';

    if (hasHierarchies && hasFlexibleProperties && !hasConstraints) {
      adaptability = 'high';
    } else if (!hasHierarchies && hasConstraints) {
      adaptability = 'low';
    }

    return {
      level: adaptability,
      hasHierarchies,
      hasFlexibleProperties,
      constraintCount: (schema.constraints || []).length
    };
  }

  /**
   * Get default schema enhancements
   */
  getDefaultEnhancements() {
    return {
      additionalEntityTypes: ['Dosage', 'Side_Effect', 'Medical_Device'],
      additionalRelationshipTypes: ['administered_with', 'contraindicated_with'],
      entityProperties: {
        Drug: ['name', 'dosage', 'indication'],
        Disease: ['name', 'category']
      },
      relationshipProperties: {
        treats: ['efficacy', 'evidence_level']
      },
      hierarchies: {},
      constraints: []
    };
  }

  /**
   * Get fallback schema when AI fails
   */
  getFallbackSchema(medicalFocus = 'general') {
    const baseSchema = this.getBaseSchema(medicalFocus);
    
    return {
      proposedSchema: baseSchema,
      baseSchema,
      aiEnhancements: this.getDefaultEnhancements(),
      contentAnalysis: {
        entityHints: [],
        relationshipHints: [],
        domainTerms: []
      },
      schemaMetadata: {
        confidence: 0.6,
        complexity: { level: 'medium' },
        coverage: 0.7,
        adaptability: { level: 'medium' }
      }
    };
  }

  // Helper methods
  entityMatches(hint, entityType) {
    const hintLower = hint.toLowerCase();
    const entityLower = entityType.toLowerCase();
    
    return hintLower === entityLower ||
           hintLower.includes(entityLower) ||
           entityLower.includes(hintLower);
  }

  /**
   * Export schema in different formats
   */
  exportSchema(schema, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(schema, null, 2);
      case 'cypher':
        return this.generateCypherSchema(schema);
      case 'owl':
        return this.generateOWLSchema(schema);
      default:
        return schema;
    }
  }

  generateCypherSchema(schema) {
    let cypher = "// Knowledge Graph Schema\n\n";
    
    cypher += "// Entity Types\n";
    for (const entityType of schema.entityTypes) {
      cypher += `// :${entityType}\n`;
    }
    
    cypher += "\n// Relationship Types\n";
    for (const relType of schema.relationshipTypes) {
      cypher += `// :${relType.toUpperCase()}\n`;
    }
    
    return cypher;
  }

  generateOWLSchema(schema) {
    let owl = "@prefix : <http://medresearch.ai/ontology#> .\n";
    owl += "@prefix owl: <http://www.w3.org/2002/07/owl#> .\n\n";
    
    owl += "# Classes\n";
    for (const entityType of schema.entityTypes) {
      owl += `:${entityType} rdf:type owl:Class .\n`;
    }
    
    owl += "\n# Object Properties\n";
    for (const relType of schema.relationshipTypes) {
      owl += `:${relType} rdf:type owl:ObjectProperty .\n`;
    }
    
    return owl;
  }
}

export default SchemaProposalAgent;