// test-knowledge-graph.js - Test the multi-agent knowledge graph system

import KnowledgeGraphAgent from './server/agents/KnowledgeGraphAgent.js';
import getOpenAIService from './server/services/openaiService.js';

async function testKnowledgeGraphSystem() {
  console.log('🧪 Testing Multi-Agent Knowledge Graph Construction System');
  console.log('='.repeat(60));

  try {
    // Initialize the Knowledge Graph Agent
    const openaiService = getOpenAIService();
    const kgAgent = new KnowledgeGraphAgent(openaiService.client);

    // Sample medical documents (structured and unstructured)
    const sampleDocuments = [
      // Structured document (JSON format)
      {
        type: 'json',
        content: JSON.stringify({
          study_id: 'NCT123456789',
          title: 'Aspirin for Primary Prevention of Cardiovascular Events',
          drug: {
            name: 'Aspirin',
            dosage: '81mg',
            frequency: 'daily',
            class: 'NSAID'
          },
          condition: 'Cardiovascular Disease Prevention',
          participants: 15000,
          phase: 'Phase III',
          duration_months: 60,
          primary_endpoint: 'Major cardiovascular events',
          results: {
            efficacy: '15% reduction in cardiovascular events',
            side_effects: [
              { effect: 'Gastrointestinal bleeding', frequency: '2.1%' },
              { effect: 'Peptic ulcer', frequency: '1.3%' }
            ]
          },
          conclusion: 'Low-dose aspirin significantly reduces cardiovascular events in high-risk patients'
        }),
        metadata: {
          title: 'Aspirin CVD Prevention Clinical Trial',
          id: 'structured_clinical_trial_1',
          source: 'ClinicalTrials.gov',
          date: '2024-01-15'
        }
      },
      
      // Unstructured document (text format)
      {
        type: 'txt',
        content: `
Metformin: A Comprehensive Drug Profile

Metformin hydrochloride is the most widely prescribed medication for type 2 diabetes mellitus. 
As a member of the biguanide class of antidiabetic agents, metformin works primarily by decreasing 
hepatic glucose production and improving insulin sensitivity in peripheral tissues.

Clinical Pharmacology:
Metformin does not stimulate insulin secretion, making it unique among diabetes medications. 
Instead, it activates AMP-activated protein kinase (AMPK), which leads to decreased gluconeogenesis 
and increased glucose uptake by skeletal muscle. This mechanism explains why metformin rarely 
causes hypoglycemia when used as monotherapy.

Therapeutic Indications:
- Type 2 diabetes mellitus (first-line treatment)
- Prediabetes prevention
- Polycystic ovary syndrome (off-label use)
- Gestational diabetes (in some cases)

Dosing and Administration:
The typical starting dose is 500mg twice daily with meals, gradually titrated to a maximum 
of 2000-2550mg daily based on glucose control and tolerability. Extended-release formulations 
allow for once-daily dosing, improving patient adherence.

Contraindications and Precautions:
Metformin is contraindicated in patients with severe kidney disease (eGFR < 30 mL/min/1.73m²), 
acute or chronic metabolic acidosis, and severe heart failure. The risk of lactic acidosis, 
though rare (3 cases per 100,000 patient-years), necessitates careful patient selection.

Drug Interactions:
Alcohol consumption increases the risk of lactic acidosis. Iodinated contrast media may 
precipitate acute kidney injury, requiring temporary discontinuation of metformin. 
Carbonic anhydrase inhibitors and cationic drugs that compete for renal tubular secretion 
may increase metformin plasma concentrations.

Clinical Evidence:
The UK Prospective Diabetes Study (UKPDS) demonstrated that metformin reduces cardiovascular 
mortality by 36% and all-cause mortality by 36% compared to conventional therapy in overweight 
patients with type 2 diabetes. Additionally, metformin treatment is associated with modest 
weight loss (2-3 kg on average) and improvement in lipid profiles.

Adverse Effects:
Gastrointestinal side effects (nausea, diarrhea, abdominal discomfort) occur in 20-30% of 
patients but usually resolve with continued therapy or dose adjustment. Vitamin B12 deficiency 
may develop with long-term use, particularly in patients with risk factors such as age > 65 years.
        `,
        metadata: {
          title: 'Metformin Comprehensive Drug Review',
          id: 'unstructured_drug_review_1',
          source: 'Medical Literature',
          author: 'Clinical Pharmacology Team',
          date: '2024-02-10'
        }
      },

      // Semi-structured document (CSV-like data)
      {
        type: 'csv',
        content: `drug_name,indication,dosage,mechanism_of_action,side_effects,contraindications
Lisinopril,Hypertension,10-40mg daily,ACE inhibitor,Dry cough|Hyperkalemia|Angioedema,Pregnancy|Bilateral renal stenosis
Atorvastatin,Hyperlipidemia,20-80mg daily,HMG-CoA reductase inhibitor,Myalgia|Hepatotoxicity|Rhabdomyolysis,Active liver disease|Pregnancy
Warfarin,Anticoagulation,2-10mg daily,Vitamin K antagonist,Bleeding|Skin necrosis|Purple toe syndrome,Pregnancy|Active bleeding|Recent surgery
Levothyroxine,Hypothyroidism,25-200mcg daily,Thyroid hormone replacement,Hyperthyroid symptoms|Cardiac arrhythmias,Thyrotoxicosis|Acute MI`,
        metadata: {
          title: 'Common Medications Database Extract',
          id: 'structured_medications_db_1',
          source: 'Hospital Pharmacy Database',
          date: '2024-03-05'
        }
      }
    ];

    // User query for knowledge graph construction
    const userQuery = {
      query: 'Build a comprehensive medical knowledge graph from these documents focusing on drug interactions, therapeutic relationships, and clinical evidence',
      primaryIntent: 'knowledge_graph_construction',
      medicalFocus: 'pharmacology',
      needsQuerying: true
    };

    console.log('📄 Processing documents:');
    sampleDocuments.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.metadata.title} (${doc.type.toUpperCase()})`);
    });
    
    console.log('\n🔬 Constructing knowledge graph...');
    const startTime = Date.now();

    // Construct the knowledge graph
    const result = await kgAgent.constructKnowledgeGraph(
      sampleDocuments,
      userQuery,
      { demo: true, testRun: true }
    );

    const processingTime = Date.now() - startTime;

    if (result.success) {
      console.log('\n✅ Knowledge Graph Construction Completed!');
      console.log(`⏱️  Processing time: ${processingTime}ms`);
      console.log('\n📊 Knowledge Graph Statistics:');
      console.log(`   📍 Entities: ${result.knowledgeGraph.metadata.entityCount}`);
      console.log(`   🔗 Relationships: ${result.knowledgeGraph.metadata.relationshipCount}`);
      console.log(`   📚 Documents processed: ${result.metadata.documentsProcessed}`);
      console.log(`   🎯 Schema complexity: ${Object.keys(result.proposedSchema.entityTypes).length} entity types`);

      // Display sample entities
      console.log('\n🔍 Sample Entities:');
      const entities = Array.from(result.knowledgeGraph.nodes.values()).slice(0, 10);
      entities.forEach(entity => {
        console.log(`   • ${entity.label} (${entity.type}) - confidence: ${entity.confidence?.toFixed(2) || 'N/A'}`);
      });

      // Display sample relationships
      console.log('\n🔗 Sample Relationships:');
      const relationships = Array.from(result.knowledgeGraph.edges.values()).slice(0, 8);
      relationships.forEach(rel => {
        console.log(`   • ${rel.source} --[${rel.type}]--> ${rel.target}`);
      });

      // Test GraphRAG querying
      console.log('\n🤖 Testing GraphRAG Query System...');
      const testQueries = [
        'What medications treat cardiovascular disease?',
        'What are the side effects of metformin?',
        'Which drugs interact with warfarin?',
        'What is the mechanism of action of ACE inhibitors?'
      ];

      for (const query of testQueries) {
        try {
          console.log(`\n❓ Query: "${query}"`);
          const queryResult = await kgAgent.queryKnowledgeGraph(query, { demo: true });
          
          if (queryResult.success && queryResult.response) {
            console.log(`   📝 Answer: ${queryResult.response.answer?.substring(0, 200)}...`);
            console.log(`   📊 Confidence: ${queryResult.response.confidence?.toFixed(2) || 'N/A'}`);
            console.log(`   📈 Knowledge used: ${queryResult.response.knowledgeUsed?.entitiesReferenced || 0} entities`);
          } else {
            console.log(`   ❌ Query failed: ${queryResult.error || 'Unknown error'}`);
          }
        } catch (queryError) {
          console.log(`   ❌ Query error: ${queryError.message}`);
        }
      }

      // Display schema information
      console.log('\n📋 Generated Schema:');
      console.log(`   Entity Types: ${result.proposedSchema.entityTypes?.join(', ') || 'None'}`);
      console.log(`   Relationship Types: ${result.proposedSchema.relationshipTypes?.join(', ') || 'None'}`);

      // Export options demo
      console.log('\n📤 Export Options Available:');
      console.log('   • JSON format (default)');
      console.log('   • Cypher queries for Neo4j');
      console.log('   • NetworkX format for Python analysis');

      const jsonExport = kgAgent.exportKnowledgeGraph('json');
      console.log(`\n💾 JSON Export size: ${JSON.stringify(jsonExport).length} characters`);

    } else {
      console.log('\n❌ Knowledge Graph Construction Failed');
      console.log(`Error: ${result.error}`);
    }

  } catch (error) {
    console.error('\n💥 Test Error:', error);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Multi-Agent Knowledge Graph Test Complete!');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testKnowledgeGraphSystem();
}

export default testKnowledgeGraphSystem;