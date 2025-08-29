// test-with-sample-data.js - Test Knowledge Graph with Sample Data Files

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import KnowledgeGraphAgent from './server/agents/KnowledgeGraphAgent.js';
import getOpenAIService from './server/services/openaiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadSampleData() {
  console.log('📂 Loading sample data files...');
  
  try {
    // Load structured data files
    const clinicalTrialsPath = path.join(__dirname, 'data/samples/structured/sample-clinical-trials.json');
    const drugDatabasePath = path.join(__dirname, 'data/samples/structured/drug-database.json');
    const literatureReviewPath = path.join(__dirname, 'data/samples/unstructured/medical-literature-review.txt');

    const clinicalTrialsData = JSON.parse(fs.readFileSync(clinicalTrialsPath, 'utf8'));
    const drugDatabaseData = JSON.parse(fs.readFileSync(drugDatabasePath, 'utf8'));
    const literatureReviewData = fs.readFileSync(literatureReviewPath, 'utf8');

    // Format documents for knowledge graph processing
    const documents = [
      {
        type: 'json',
        content: JSON.stringify(clinicalTrialsData),
        metadata: {
          title: 'Clinical Trials Database',
          id: 'clinical_trials_sample',
          source: 'Sample Data',
          date: new Date().toISOString()
        }
      },
      {
        type: 'json', 
        content: JSON.stringify(drugDatabaseData),
        metadata: {
          title: 'Drug Information Database',
          id: 'drug_database_sample',
          source: 'Sample Data',
          date: new Date().toISOString()
        }
      },
      {
        type: 'txt',
        content: literatureReviewData,
        metadata: {
          title: 'Cardiovascular Risk Management Review',
          id: 'literature_review_sample',
          source: 'Sample Data',
          date: new Date().toISOString()
        }
      }
    ];

    console.log('✅ Successfully loaded sample data:');
    documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.metadata.title} (${doc.type.toUpperCase()}) - ${Math.round(doc.content.length / 1000)}KB`);
    });

    return documents;

  } catch (error) {
    console.error('❌ Error loading sample data:', error.message);
    throw error;
  }
}

async function testKnowledgeGraphWithSampleData() {
  console.log('🧪 Testing Knowledge Graph System with Sample Data Files');
  console.log('='.repeat(70));

  try {
    // Load sample data from files
    const documents = await loadSampleData();
    
    // Initialize Knowledge Graph Agent
    const openaiService = getOpenAIService();
    const kgAgent = new KnowledgeGraphAgent(openaiService);

    // Define user query for comprehensive medical knowledge graph
    const userQuery = {
      query: 'Build a comprehensive medical knowledge graph focusing on drug interactions, clinical trials, and cardiovascular disease management',
      primaryIntent: 'knowledge_graph_construction',
      medicalFocus: 'cardiology',
      needsQuerying: true
    };

    console.log('\n🔬 Constructing Knowledge Graph from Sample Files...');
    const startTime = Date.now();

    // Construct knowledge graph
    const result = await kgAgent.constructKnowledgeGraph(
      documents,
      userQuery,
      { 
        sampleDataTest: true, 
        source: 'file_system',
        testType: 'comprehensive_medical_kg'
      }
    );

    const processingTime = Date.now() - startTime;

    if (result.success) {
      console.log('\n✅ Knowledge Graph Construction Completed Successfully!');
      console.log(`⏱️  Total processing time: ${processingTime}ms`);
      
      // Display comprehensive statistics
      console.log('\n📊 Knowledge Graph Statistics:');
      console.log(`   📍 Total Entities: ${result.knowledgeGraph.metadata.entityCount}`);
      console.log(`   🔗 Total Relationships: ${result.knowledgeGraph.metadata.relationshipCount}`);
      console.log(`   📚 Documents Processed: ${result.metadata.documentsProcessed}`);
      console.log(`   📋 Entity Types: ${Object.keys(result.proposedSchema.entityTypes || {}).length}`);
      console.log(`   🔄 Relationship Types: ${Object.keys(result.proposedSchema.relationshipTypes || {}).length}`);

      // Show user intent analysis
      console.log('\n🎯 User Intent Analysis:');
      console.log(`   Primary Intent: ${result.userIntent?.primaryIntent || 'N/A'}`);
      console.log(`   Medical Focus: ${result.userIntent?.medicalFocus || 'N/A'}`);
      console.log(`   Processing Complexity: ${result.userIntent?.complexity?.level || 'N/A'}`);

      // Display sample extracted entities by category
      console.log('\n🔍 Sample Extracted Entities:');
      const entities = Array.from(result.knowledgeGraph.nodes.values());
      const entityTypes = [...new Set(entities.map(e => e.type))];
      
      entityTypes.slice(0, 8).forEach(type => {
        const entitiesOfType = entities.filter(e => e.type === type).slice(0, 3);
        console.log(`   ${type}:`);
        entitiesOfType.forEach(entity => {
          console.log(`      • ${entity.label} (confidence: ${entity.confidence?.toFixed(2) || 'N/A'})`);
        });
      });

      // Display sample relationships
      console.log('\n🔗 Sample Extracted Relationships:');
      const relationships = Array.from(result.knowledgeGraph.edges.values());
      const relationshipTypes = [...new Set(relationships.map(r => r.type))];
      
      relationshipTypes.slice(0, 6).forEach(type => {
        const relsOfType = relationships.filter(r => r.type === type).slice(0, 2);
        console.log(`   ${type}:`);
        relsOfType.forEach(rel => {
          console.log(`      • ${rel.source} --[${rel.type}]--> ${rel.target}`);
        });
      });

      // Test GraphRAG queries with sample data
      console.log('\n🤖 Testing GraphRAG with Medical Queries...');
      
      const medicalQueries = [
        'What clinical trials involve aspirin for cardiovascular prevention?',
        'What are the drug interactions between metformin and other medications?',
        'Which drugs are used for treating type 2 diabetes and what are their mechanisms?',
        'What are the cardiovascular benefits and risks of statin therapy?',
        'How do ACE inhibitors work for blood pressure management?',
        'What evidence exists for aspirin in primary prevention?'
      ];

      let successfulQueries = 0;
      
      for (const query of medicalQueries) {
        try {
          console.log(`\n❓ Query: "${query}"`);
          const queryStartTime = Date.now();
          
          const queryResult = await kgAgent.queryKnowledgeGraph(query, { 
            sampleDataTest: true,
            medicalDomain: 'cardiology'
          });
          
          const queryTime = Date.now() - queryStartTime;
          
          if (queryResult.success && queryResult.response) {
            successfulQueries++;
            const answer = queryResult.response.answer || 'No specific answer generated';
            const truncatedAnswer = answer.length > 200 ? answer.substring(0, 200) + '...' : answer;
            
            console.log(`   ✅ Answer (${queryTime}ms): ${truncatedAnswer}`);
            console.log(`   📊 Confidence: ${queryResult.response.confidence?.toFixed(2) || 'N/A'}`);
            console.log(`   📈 Knowledge Used: ${queryResult.response.knowledgeUsed?.entitiesReferenced || 0} entities, ${queryResult.response.knowledgeUsed?.relationshipsReferenced || 0} relationships`);
            
            if (queryResult.response.limitations && queryResult.response.limitations.length > 0) {
              console.log(`   ⚠️  Limitations: ${queryResult.response.limitations.join(', ')}`);
            }
          } else {
            console.log(`   ❌ Query failed: ${queryResult.error || 'Unknown error'}`);
          }
          
        } catch (queryError) {
          console.log(`   💥 Query error: ${queryError.message}`);
        }
      }

      console.log(`\n📈 Query Success Rate: ${successfulQueries}/${medicalQueries.length} (${Math.round(successfulQueries/medicalQueries.length*100)}%)`);

      // Show processing strategy used
      console.log('\n📋 Processing Strategy Analysis:');
      if (result.processingStrategy) {
        console.log(`   Structured Documents: ${result.processingStrategy.structured?.length || 0}`);
        console.log(`   Unstructured Documents: ${result.processingStrategy.unstructured?.length || 0}`);
        console.log(`   Estimated Processing Time: ${result.processingStrategy.estimatedProcessingTime?.estimated || 'N/A'}`);
      }

      // Export demonstration
      console.log('\n📤 Knowledge Graph Export Demonstration:');
      try {
        const jsonExport = kgAgent.exportKnowledgeGraph('json');
        const cypherExport = kgAgent.exportKnowledgeGraph('cypher');
        
        console.log(`   📄 JSON Export: ${JSON.stringify(jsonExport).length} characters`);
        console.log(`   🔧 Cypher Export: ${cypherExport.split('\\n').length} lines of queries`);
        console.log('   ✅ Export formats: JSON, Cypher, NetworkX available');
        
        // Optionally save exports
        const exportsDir = path.join(__dirname, 'data/processed');
        if (!fs.existsSync(exportsDir)) {
          fs.mkdirSync(exportsDir, { recursive: true });
        }
        
        fs.writeFileSync(
          path.join(exportsDir, 'sample-knowledge-graph.json'), 
          JSON.stringify(jsonExport, null, 2)
        );
        
        fs.writeFileSync(
          path.join(exportsDir, 'sample-knowledge-graph.cypher'),
          cypherExport
        );
        
        console.log('   💾 Exported to data/processed/ directory');
        
      } catch (exportError) {
        console.log(`   ❌ Export error: ${exportError.message}`);
      }

      // Final statistics
      console.log('\n📊 Final Processing Statistics:');
      console.log(`   Total Processing Time: ${processingTime}ms`);
      console.log(`   Average per Document: ${Math.round(processingTime / documents.length)}ms`);
      console.log(`   Entities per Document: ${Math.round(result.knowledgeGraph.metadata.entityCount / documents.length)}`);
      console.log(`   Relationships per Document: ${Math.round(result.knowledgeGraph.metadata.relationshipCount / documents.length)}`);

    } else {
      console.log('\n❌ Knowledge Graph Construction Failed');
      console.log(`Error: ${result.error}`);
      
      if (result.knowledgeGraph && result.knowledgeGraph.metadata) {
        console.log(`Partial results: ${result.knowledgeGraph.metadata.entityCount || 0} entities, ${result.knowledgeGraph.metadata.relationshipCount || 0} relationships`);
      }
    }

  } catch (error) {
    console.error('\n💥 Test Error:', error);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎉 Sample Data Knowledge Graph Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Add your own JSON files to data/samples/structured/');
  console.log('   2. Add your own text files to data/samples/unstructured/');
  console.log('   3. Use the API endpoints: POST /api/knowledge-graph/construct');
  console.log('   4. Query your graph: POST /api/knowledge-graph/query');
  console.log('   5. Check data/processed/ for exported knowledge graphs');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testKnowledgeGraphWithSampleData();
}

export default testKnowledgeGraphWithSampleData;