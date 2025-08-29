// server/agents/EntityFactTypeProposalAgent.js

/**
 * Entity & Fact Type Proposal Agent - Proposes refined entity and fact types based on processed content
 * Part of the multi-agent knowledge graph construction system
 */
class EntityFactTypeProposalAgent {
  constructor(openaiService) {
    this.openaiService = openaiService;
    
    // Medical entity type hierarchies
    this.medicalHierarchies = {
      'Drug': {
        subtypes: ['Prescription_Drug', 'OTC_Drug', 'Experimental_Drug', 'Controlled_Substance'],
        properties: ['name', 'active_ingredient', 'dosage_form', 'strength', 'manufacturer', 'approval_date']
      },
      'Disease': {
        subtypes: ['Chronic_Disease', 'Acute_Disease', 'Genetic_Disease', 'Infectious_Disease', 'Autoimmune_Disease'],
        properties: ['name', 'icd10_code', 'category', 'prevalence', 'mortality_rate', 'symptoms']
      },
      'Treatment': {
        subtypes: ['Medication_Treatment', 'Surgical_Treatment', 'Therapy_Treatment', 'Preventive_Treatment'],
        properties: ['name', 'type', 'duration', 'efficacy_rate', 'side_effects', 'cost']
      },
      'Clinical_Trial': {
        subtypes: ['Phase_I_Trial', 'Phase_II_Trial', 'Phase_III_Trial', 'Phase_IV_Trial'],
        properties: ['trial_id', 'phase', 'status', 'participants', 'primary_outcome', 'sponsor']
      }
    };

    // Medical relationship type patterns
    this.relationshipPatterns = {
      'treats': {
        domain: ['Drug', 'Treatment', 'Procedure'],
        range: ['Disease', 'Symptom', 'Condition'],
        properties: ['efficacy', 'evidence_level', 'mechanism_of_action', 'duration']
      },
      'causes': {
        domain: ['Disease', 'Drug', 'Environmental_Factor'],
        range: ['Symptom', 'Side_Effect', 'Complication'],
        properties: ['probability', 'mechanism', 'onset_time', 'severity']
      },
      'prevents': {
        domain: ['Drug', 'Treatment', 'Intervention'],
        range: ['Disease', 'Condition', 'Complication'],
        properties: ['prevention_rate', 'evidence_quality', 'population']
      }
    };
  }

  /**
   * Propose entity and fact types based on extracted content
   * @param {Array} entities - Entities extracted from documents
   * @param {Array} relationships - Relationships extracted from documents
   * @param {Object} proposedSchema - Initially proposed schema
   */
  async proposeTypes(entities, relationships, proposedSchema) {
    try {
      console.log('🔍 Entity & Fact Type Proposal Agent: Analyzing extracted content...');

      // Analyze entity patterns and propose refined types
      const entityTypeAnalysis = await this.analyzeEntityTypes(entities, proposedSchema);
      
      // Analyze relationship patterns and propose fact types
      const relationshipTypeAnalysis = await this.analyzeRelationshipTypes(relationships, proposedSchema);
      
      // Generate AI-powered type refinements
      const aiRefinements = await this.generateTypeRefinements(
        entities, 
        relationships, 
        entityTypeAnalysis, 
        relationshipTypeAnalysis
      );
      
      // Create final type proposals
      const finalTypeProposals = this.createFinalTypeProposals(
        entityTypeAnalysis,
        relationshipTypeAnalysis,
        aiRefinements
      );

      return {
        entityTypes: finalTypeProposals.entityTypes,
        relationshipTypes: finalTypeProposals.relationshipTypes,
        typeHierarchies: finalTypeProposals.typeHierarchies,
        typeProperties: finalTypeProposals.typeProperties,
        analysisMetadata: {
          entitiesAnalyzed: entities.length,
          relationshipsAnalyzed: relationships.length,
          newEntityTypesProposed: finalTypeProposals.newEntityTypes.length,
          newRelationshipTypesProposed: finalTypeProposals.newRelationshipTypes.length,
          confidence: this.calculateTypeConfidence(finalTypeProposals, entities, relationships)
        }
      };

    } catch (error) {
      console.error('❌ Entity & Fact Type Proposal Agent Error:', error);
      return this.getFallbackTypeProposals(proposedSchema);
    }
  }

  /**
   * Analyze entity types from extracted entities
   */
  async analyzeEntityTypes(entities, proposedSchema) {
    const typeFrequency = new Map();
    const typeExamples = new Map();
    const typeVariations = new Map();

    // Count entity types and collect examples
    for (const entity of entities) {
      const entityType = entity.type || 'Unknown';
      
      // Count frequency
      typeFrequency.set(entityType, (typeFrequency.get(entityType) || 0) + 1);
      
      // Collect examples
      if (!typeExamples.has(entityType)) {
        typeExamples.set(entityType, []);
      }
      if (typeExamples.get(entityType).length < 5) {
        typeExamples.get(entityType).push({
          label: entity.label,
          properties: entity.properties || {},
          confidence: entity.confidence || 0.5
        });
      }

      // Track variations in entity labels for same type
      if (!typeVariations.has(entityType)) {
        typeVariations.set(entityType, new Set());
      }
      typeVariations.get(entityType).add(entity.label.toLowerCase());
    }

    // Analyze type patterns
    const typeAnalysis = {};
    for (const [entityType, frequency] of typeFrequency) {
      typeAnalysis[entityType] = {
        frequency,
        examples: typeExamples.get(entityType) || [],
        variations: Array.from(typeVariations.get(entityType) || []),
        avgConfidence: this.calculateAverageConfidence(
          entities.filter(e => e.type === entityType)
        ),
        proposedSubtypes: this.proposeSubtypes(entityType, typeExamples.get(entityType) || []),
        suggestedProperties: this.suggestProperties(entityType, typeExamples.get(entityType) || [])
      };
    }

    return typeAnalysis;
  }

  /**
   * Analyze relationship types from extracted relationships
   */
  async analyzeRelationshipTypes(relationships, proposedSchema) {
    const relationshipFrequency = new Map();
    const relationshipExamples = new Map();
    const domainRangePatterns = new Map();

    // Analyze relationship patterns
    for (const relationship of relationships) {
      const relType = relationship.type || 'Unknown';
      
      // Count frequency
      relationshipFrequency.set(relType, (relationshipFrequency.get(relType) || 0) + 1);
      
      // Collect examples
      if (!relationshipExamples.has(relType)) {
        relationshipExamples.set(relType, []);
      }
      if (relationshipExamples.get(relType).length < 5) {
        relationshipExamples.get(relType).push({
          source: relationship.source,
          target: relationship.target,
          properties: relationship.properties || {},
          confidence: relationship.confidence || 0.5
        });
      }

      // Track domain/range patterns
      if (!domainRangePatterns.has(relType)) {
        domainRangePatterns.set(relType, { domains: new Set(), ranges: new Set() });
      }
      // Note: In real implementation, you'd map source/target to their entity types
      domainRangePatterns.get(relType).domains.add(relationship.source);
      domainRangePatterns.get(relType).ranges.add(relationship.target);
    }

    // Analyze relationship patterns
    const relationshipAnalysis = {};
    for (const [relType, frequency] of relationshipFrequency) {
      relationshipAnalysis[relType] = {
        frequency,
        examples: relationshipExamples.get(relType) || [],
        domainTypes: Array.from(domainRangePatterns.get(relType)?.domains || []).slice(0, 10),
        rangeTypes: Array.from(domainRangePatterns.get(relType)?.ranges || []).slice(0, 10),
        avgConfidence: this.calculateAverageConfidence(
          relationships.filter(r => r.type === relType)
        ),
        suggestedProperties: this.suggestRelationshipProperties(
          relType, 
          relationshipExamples.get(relType) || []
        )
      };
    }

    return relationshipAnalysis;
  }

  /**
   * Generate AI-powered type refinements
   */
  async generateTypeRefinements(entities, relationships, entityAnalysis, relationshipAnalysis) {
    try {
      const prompt = `As a medical ontology expert, refine these entity and relationship types based on extracted medical data:

ENTITY TYPE ANALYSIS:
${Object.entries(entityAnalysis).slice(0, 10).map(([type, analysis]) => 
  `${type}: ${analysis.frequency} instances, examples: ${analysis.examples.map(e => e.label).join(', ')}`
).join('\n')}

RELATIONSHIP TYPE ANALYSIS:
${Object.entries(relationshipAnalysis).slice(0, 8).map(([type, analysis]) => 
  `${type}: ${analysis.frequency} instances`
).join('\n')}

Provide refinements in JSON:
{
  "refinedEntityTypes": {
    "Drug": {
      "subtypes": ["Prescription_Drug", "OTC_Drug"],
      "properties": ["name", "dosage", "active_ingredient"],
      "reasoning": "Found prescription and over-counter drug patterns"
    }
  },
  "refinedRelationshipTypes": {
    "treats": {
      "constraints": {"domain": ["Drug"], "range": ["Disease"]},
      "properties": ["efficacy_rate", "evidence_level"],
      "reasoning": "Strong drug-disease treatment patterns"
    }
  },
  "newEntityTypes": [
    {
      "type": "Biomarker",
      "parent": "Entity",
      "reasoning": "Found many biological marker references",
      "expectedFrequency": "medium"
    }
  ],
  "newRelationshipTypes": [
    {
      "type": "biomarker_for",
      "domain": ["Biomarker"],
      "range": ["Disease"],
      "reasoning": "Clear biomarker-disease associations found"
    }
  ]
}`;

      const response = await this.openaiService.generateResponse([
        { role: "user", content: prompt }
      ], {
        temperature: 0.2,
        maxTokens: 1200
      });

      return JSON.parse(response.content);

    } catch (error) {
      console.error('AI type refinement error:', error);
      return this.getDefaultTypeRefinements();
    }
  }

  /**
   * Create final type proposals combining all analyses
   */
  createFinalTypeProposals(entityAnalysis, relationshipAnalysis, aiRefinements) {
    // Combine existing and new entity types
    const entityTypes = new Set();
    const relationshipTypes = new Set();
    
    // Add existing types
    Object.keys(entityAnalysis).forEach(type => entityTypes.add(type));
    Object.keys(relationshipAnalysis).forEach(type => relationshipTypes.add(type));

    // Add AI-suggested new types
    const newEntityTypes = aiRefinements.newEntityTypes || [];
    const newRelationshipTypes = aiRefinements.newRelationshipTypes || [];
    
    newEntityTypes.forEach(entityType => entityTypes.add(entityType.type));
    newRelationshipTypes.forEach(relType => relationshipTypes.add(relType.type));

    // Create type hierarchies
    const typeHierarchies = this.createTypeHierarchies(
      Array.from(entityTypes), 
      aiRefinements.refinedEntityTypes || {}
    );

    // Create type properties
    const typeProperties = this.createTypeProperties(
      entityAnalysis,
      relationshipAnalysis,
      aiRefinements
    );

    return {
      entityTypes: Array.from(entityTypes),
      relationshipTypes: Array.from(relationshipTypes),
      newEntityTypes,
      newRelationshipTypes,
      typeHierarchies,
      typeProperties
    };
  }

  /**
   * Propose subtypes for an entity type
   */
  proposeSubtypes(entityType, examples) {
    // Check if we have predefined subtypes
    if (this.medicalHierarchies[entityType]) {
      return this.medicalHierarchies[entityType].subtypes;
    }

    // Analyze examples to propose subtypes
    const subtypes = [];
    
    if (entityType === 'Drug' && examples.length > 0) {
      // Look for prescription patterns
      const hasRx = examples.some(e => 
        e.label.toLowerCase().includes('rx') || 
        e.properties.prescription === true
      );
      if (hasRx) subtypes.push('Prescription_Drug', 'OTC_Drug');
    }
    
    if (entityType === 'Disease' && examples.length > 0) {
      // Look for chronic/acute patterns
      const hasChronic = examples.some(e => 
        e.label.toLowerCase().includes('chronic') ||
        e.properties.type === 'chronic'
      );
      if (hasChronic) subtypes.push('Chronic_Disease', 'Acute_Disease');
    }

    return subtypes;
  }

  /**
   * Suggest properties for entity types
   */
  suggestProperties(entityType, examples) {
    // Check if we have predefined properties
    if (this.medicalHierarchies[entityType]) {
      return this.medicalHierarchies[entityType].properties;
    }

    // Analyze examples to suggest properties
    const propertySet = new Set();
    
    for (const example of examples) {
      if (example.properties) {
        Object.keys(example.properties).forEach(prop => propertySet.add(prop));
      }
    }

    // Add common medical properties based on type
    const commonProperties = this.getCommonMedicalProperties(entityType);
    commonProperties.forEach(prop => propertySet.add(prop));

    return Array.from(propertySet);
  }

  /**
   * Suggest properties for relationship types
   */
  suggestRelationshipProperties(relType, examples) {
    // Check predefined relationship patterns
    if (this.relationshipPatterns[relType]) {
      return this.relationshipPatterns[relType].properties;
    }

    const propertySet = new Set(['confidence', 'source', 'evidence']);
    
    for (const example of examples) {
      if (example.properties) {
        Object.keys(example.properties).forEach(prop => propertySet.add(prop));
      }
    }

    return Array.from(propertySet);
  }

  /**
   * Get common medical properties for entity types
   */
  getCommonMedicalProperties(entityType) {
    const commonProps = {
      'Drug': ['name', 'dosage', 'indication', 'contraindication'],
      'Disease': ['name', 'icd_code', 'symptoms', 'prevalence'],
      'Patient': ['age', 'gender', 'medical_history'],
      'Study': ['title', 'phase', 'participants', 'outcome'],
      'Treatment': ['name', 'type', 'duration', 'efficacy']
    };

    return commonProps[entityType] || ['name', 'description'];
  }

  /**
   * Create type hierarchies
   */
  createTypeHierarchies(entityTypes, refinedTypes) {
    const hierarchies = {};

    for (const entityType of entityTypes) {
      if (refinedTypes[entityType] && refinedTypes[entityType].subtypes) {
        hierarchies[entityType] = refinedTypes[entityType].subtypes;
      } else if (this.medicalHierarchies[entityType]) {
        hierarchies[entityType] = this.medicalHierarchies[entityType].subtypes;
      }
    }

    return hierarchies;
  }

  /**
   * Create comprehensive type properties
   */
  createTypeProperties(entityAnalysis, relationshipAnalysis, aiRefinements) {
    const typeProperties = {
      entities: {},
      relationships: {}
    };

    // Entity properties
    for (const [entityType, analysis] of Object.entries(entityAnalysis)) {
      typeProperties.entities[entityType] = {
        coreProperties: analysis.suggestedProperties || [],
        optionalProperties: this.getCommonMedicalProperties(entityType),
        constraints: this.getTypeConstraints(entityType),
        frequency: analysis.frequency,
        avgConfidence: analysis.avgConfidence
      };
    }

    // Relationship properties  
    for (const [relType, analysis] of Object.entries(relationshipAnalysis)) {
      typeProperties.relationships[relType] = {
        properties: analysis.suggestedProperties || [],
        domainTypes: analysis.domainTypes || [],
        rangeTypes: analysis.rangeTypes || [],
        frequency: analysis.frequency,
        avgConfidence: analysis.avgConfidence
      };
    }

    // Add AI refinements
    if (aiRefinements.refinedEntityTypes) {
      for (const [entityType, refinement] of Object.entries(aiRefinements.refinedEntityTypes)) {
        if (typeProperties.entities[entityType]) {
          typeProperties.entities[entityType].aiRefinements = refinement;
        }
      }
    }

    return typeProperties;
  }

  /**
   * Get type constraints for validation
   */
  getTypeConstraints(entityType) {
    const constraints = {
      'Drug': ['unique_name', 'valid_dosage_format'],
      'Disease': ['valid_icd_code', 'unique_name'],
      'Patient': ['valid_age_range', 'valid_gender'],
      'Clinical_Trial': ['valid_trial_id', 'valid_phase']
    };

    return constraints[entityType] || ['unique_name'];
  }

  /**
   * Calculate type confidence
   */
  calculateTypeConfidence(typeProposals, entities, relationships) {
    const totalItems = entities.length + relationships.length;
    if (totalItems === 0) return 0.5;

    const typedItems = entities.filter(e => e.type && e.type !== 'Unknown').length +
                     relationships.filter(r => r.type && r.type !== 'Unknown').length;

    const typingRate = typedItems / totalItems;
    
    // Base confidence from typing rate
    let confidence = typingRate * 0.8;

    // Bonus for comprehensive type system
    if (typeProposals.entityTypes.length >= 8) confidence += 0.1;
    if (typeProposals.relationshipTypes.length >= 6) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate average confidence for items of a type
   */
  calculateAverageConfidence(items) {
    if (items.length === 0) return 0.5;
    
    const totalConfidence = items.reduce((sum, item) => sum + (item.confidence || 0.5), 0);
    return totalConfidence / items.length;
  }

  /**
   * Get default type refinements when AI fails
   */
  getDefaultTypeRefinements() {
    return {
      refinedEntityTypes: {
        'Drug': {
          subtypes: ['Prescription_Drug', 'OTC_Drug'],
          properties: ['name', 'dosage', 'indication'],
          reasoning: 'Standard medical drug classification'
        },
        'Disease': {
          subtypes: ['Chronic_Disease', 'Acute_Disease'],
          properties: ['name', 'icd_code', 'symptoms'],
          reasoning: 'Standard disease classification'
        }
      },
      refinedRelationshipTypes: {
        'treats': {
          constraints: { domain: ['Drug'], range: ['Disease'] },
          properties: ['efficacy', 'evidence_level'],
          reasoning: 'Standard treatment relationship'
        }
      },
      newEntityTypes: [],
      newRelationshipTypes: []
    };
  }

  /**
   * Get fallback type proposals
   */
  getFallbackTypeProposals(proposedSchema) {
    return {
      entityTypes: proposedSchema.entityTypes || ['Drug', 'Disease', 'Treatment', 'Patient'],
      relationshipTypes: proposedSchema.relationshipTypes || ['treats', 'causes', 'associated_with'],
      newEntityTypes: [],
      newRelationshipTypes: [],
      typeHierarchies: {
        'Drug': ['Prescription_Drug', 'OTC_Drug'],
        'Disease': ['Chronic_Disease', 'Acute_Disease']
      },
      typeProperties: {
        entities: {
          'Drug': { coreProperties: ['name', 'dosage'], frequency: 0, avgConfidence: 0.7 },
          'Disease': { coreProperties: ['name', 'symptoms'], frequency: 0, avgConfidence: 0.7 }
        },
        relationships: {
          'treats': { properties: ['efficacy'], frequency: 0, avgConfidence: 0.7 }
        }
      },
      analysisMetadata: {
        entitiesAnalyzed: 0,
        relationshipsAnalyzed: 0,
        newEntityTypesProposed: 0,
        newRelationshipTypesProposed: 0,
        confidence: 0.6
      }
    };
  }

  /**
   * Export type proposals in different formats
   */
  exportTypeProposals(typeProposals, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(typeProposals, null, 2);
      case 'cypher':
        return this.generateCypherTypes(typeProposals);
      case 'owl':
        return this.generateOWLTypes(typeProposals);
      default:
        return typeProposals;
    }
  }

  generateCypherTypes(typeProposals) {
    let cypher = "// Entity and Relationship Type Definitions\n\n";
    
    cypher += "// Entity Types\n";
    for (const entityType of typeProposals.entityTypes) {
      cypher += `CREATE CONSTRAINT ON (n:${entityType}) ASSERT n.id IS UNIQUE;\n`;
    }
    
    cypher += "\n// Relationship Types Defined by Usage\n";
    for (const relType of typeProposals.relationshipTypes) {
      cypher += `// :${relType.toUpperCase()}\n`;
    }
    
    return cypher;
  }

  generateOWLTypes(typeProposals) {
    let owl = "@prefix : <http://medresearch.ai/ontology#> .\n";
    owl += "@prefix owl: <http://www.w3.org/2002/07/owl#> .\n";
    owl += "@prefix rdfs: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n\n";
    
    owl += "# Entity Classes\n";
    for (const entityType of typeProposals.entityTypes) {
      owl += `:${entityType} rdf:type owl:Class .\n`;
      
      // Add hierarchy if available
      if (typeProposals.typeHierarchies[entityType]) {
        for (const subtype of typeProposals.typeHierarchies[entityType]) {
          owl += `:${subtype} rdf:type owl:Class ;\n`;
          owl += `  rdfs:subClassOf :${entityType} .\n`;
        }
      }
    }
    
    owl += "\n# Relationship Properties\n";
    for (const relType of typeProposals.relationshipTypes) {
      owl += `:${relType} rdf:type owl:ObjectProperty .\n`;
    }
    
    return owl;
  }
}

export default EntityFactTypeProposalAgent;