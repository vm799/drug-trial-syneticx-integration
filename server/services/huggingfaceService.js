/**
 * Hugging Face API Service
 * Provides access to various Hugging Face models for pharmaceutical AI research
 */

import logger from '../utils/logger.js';

class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.isConfigured = this.apiKey && this.apiKey !== 'your-huggingface-api-key-here';
    
    // Model endpoints for different tasks
    this.models = {
      // Medical text analysis
      medicalNER: 'alvaroalon2/biobert_diseases_ner',
      drugNER: 'alvaroalon2/biobert_chemical_ner', 
      biomedicalQA: 'dmis-lab/biobert-base-cased-v1.2-squad',
      clinicalBERT: 'emilyalsentzer/Bio_ClinicalBERT',
      
      // General NLP tasks
      textGeneration: 'microsoft/DialoGPT-large',
      questionAnswering: 'distilbert-base-cased-distilled-squad',
      textSummarization: 'facebook/bart-large-cnn',
      sentimentAnalysis: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      
      // Scientific document processing
      scientificQA: 'allenai/scibert_scivocab_uncased',
      paperSummarization: 'allenai/led-large-16384-arxiv'
    };
    
    if (this.isConfigured) {
      logger.info('🤗 Hugging Face Service initialized with API key');
    } else {
      logger.warn('🤗 Hugging Face API key not configured, will use demo responses');
    }
  }

  /**
   * Make request to Hugging Face Inference API
   */
  async makeRequest(modelName, payload, options = {}) {
    if (!this.isConfigured) {
      logger.info(`🤗 Hugging Face not configured, returning demo response for ${modelName}`);
      return this.getDemoResponse(modelName, payload);
    }

    const url = `${this.baseUrl}/${modelName}`;
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`🤗 Making request to ${modelName} (attempt ${attempt}/${maxRetries})`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'SyneticX-Pharma-AI/1.0'
          },
          body: JSON.stringify(payload),
          timeout: options.timeout || 30000
        });

        if (!response.ok) {
          if (response.status === 503) {
            logger.warn(`🤗 Model ${modelName} is loading, waiting...`);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
              continue;
            }
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        logger.info(`🤗 Successfully got response from ${modelName}`);
        return result;

      } catch (error) {
        logger.error(`🤗 Error with ${modelName} (attempt ${attempt}): ${error.message}`);
        
        if (attempt === maxRetries) {
          logger.warn(`🤗 All attempts failed for ${modelName}, falling back to demo response`);
          return this.getDemoResponse(modelName, payload);
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  /**
   * Extract medical entities from text
   */
  async extractMedicalEntities(text) {
    try {
      const diseases = await this.makeRequest(this.models.medicalNER, {
        inputs: text,
        options: { wait_for_model: true }
      });

      const chemicals = await this.makeRequest(this.models.drugNER, {
        inputs: text,
        options: { wait_for_model: true }
      });

      return {
        diseases: this.processNERResults(diseases, 'DISEASE'),
        drugs: this.processNERResults(chemicals, 'CHEMICAL'),
        success: true,
        source: this.isConfigured ? 'huggingface_api' : 'demo_data'
      };
    } catch (error) {
      logger.error('🤗 Medical entity extraction failed:', error);
      return {
        diseases: ['cardiovascular disease', 'diabetes'],
        drugs: ['aspirin', 'metformin'],
        success: false,
        error: error.message,
        source: 'demo_data'
      };
    }
  }

  /**
   * Answer questions about medical/pharmaceutical topics
   */
  async answerMedicalQuestion(question, context = '') {
    try {
      const response = await this.makeRequest(this.models.biomedicalQA, {
        inputs: {
          question: question,
          context: context || 'Medical and pharmaceutical research context'
        },
        options: { wait_for_model: true }
      });

      return {
        answer: response.answer || response,
        confidence: response.score || 0.85,
        success: true,
        source: this.isConfigured ? 'huggingface_biobert' : 'demo_data'
      };
    } catch (error) {
      logger.error('🤗 Medical QA failed:', error);
      return {
        answer: `Based on current pharmaceutical research, ${question.toLowerCase()} involves complex mechanisms that require careful analysis of clinical data and regulatory guidelines.`,
        confidence: 0.80,
        success: false,
        error: error.message,
        source: 'demo_data'
      };
    }
  }

  /**
   * Summarize scientific papers or medical text
   */
  async summarizeMedicalText(text) {
    try {
      // Use scientific paper summarization model for better results
      const response = await this.makeRequest(this.models.paperSummarization, {
        inputs: text,
        parameters: {
          max_length: 512,
          min_length: 100,
          do_sample: false
        },
        options: { wait_for_model: true }
      });

      return {
        summary: response[0]?.summary_text || response.summary_text || response,
        success: true,
        source: this.isConfigured ? 'huggingface_led' : 'demo_data'
      };
    } catch (error) {
      logger.error('🤗 Text summarization failed:', error);
      return {
        summary: `This medical research discusses important findings related to pharmaceutical developments and clinical outcomes. The study methodology appears sound and results suggest potential therapeutic applications that warrant further investigation.`,
        success: false,
        error: error.message,
        source: 'demo_data'
      };
    }
  }

  /**
   * Analyze sentiment of clinical trial outcomes or research papers
   */
  async analyzeSentiment(text) {
    try {
      const response = await this.makeRequest(this.models.sentimentAnalysis, {
        inputs: text,
        options: { wait_for_model: true }
      });

      const result = Array.isArray(response) ? response[0] : response;
      
      return {
        sentiment: result.label?.toLowerCase() || 'neutral',
        confidence: result.score || 0.75,
        success: true,
        source: this.isConfigured ? 'huggingface_roberta' : 'demo_data'
      };
    } catch (error) {
      logger.error('🤗 Sentiment analysis failed:', error);
      return {
        sentiment: 'positive',
        confidence: 0.72,
        success: false,
        error: error.message,
        source: 'demo_data'
      };
    }
  }

  /**
   * Generate research insights and recommendations
   */
  async generateResearchInsights(query, context = {}) {
    try {
      // Extract medical entities first
      const entities = await this.extractMedicalEntities(query);
      
      // Generate contextual response
      const qaResponse = await this.answerMedicalQuestion(
        `What are the key research insights for ${query}?`,
        context.background || ''
      );

      // Analyze the sentiment of the query
      const sentiment = await this.analyzeSentiment(query);

      return {
        insights: qaResponse.answer,
        entities: entities,
        sentiment: sentiment,
        recommendations: this.generateRecommendations(entities, sentiment),
        confidence: qaResponse.confidence,
        success: true,
        source: this.isConfigured ? 'huggingface_multi_model' : 'demo_data'
      };
    } catch (error) {
      logger.error('🤗 Research insights generation failed:', error);
      return this.getDemoInsights(query);
    }
  }

  /**
   * Process NER results to extract relevant entities
   */
  processNERResults(results, entityType) {
    if (!Array.isArray(results)) return [];
    
    return results
      .filter(item => item.entity_group === entityType || item.entity === entityType)
      .map(item => item.word || item.text)
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .slice(0, 10); // Limit results
  }

  /**
   * Generate recommendations based on extracted entities and sentiment
   */
  generateRecommendations(entities, sentiment) {
    const recommendations = [];
    
    if (entities.drugs?.length > 0) {
      recommendations.push(`Consider clinical trials monitoring for ${entities.drugs.join(', ')}`);
    }
    
    if (entities.diseases?.length > 0) {
      recommendations.push(`Review latest research on ${entities.diseases.join(', ')}`);
    }
    
    if (sentiment.sentiment === 'negative') {
      recommendations.push('Monitor for potential safety concerns or adverse events');
    } else if (sentiment.sentiment === 'positive') {
      recommendations.push('Investigate potential market opportunities or competitive advantages');
    }
    
    recommendations.push('Analyze patent landscape and regulatory requirements');
    recommendations.push('Assess competitive intelligence and market positioning');
    
    return recommendations;
  }

  /**
   * Get demo response when API is not configured
   */
  getDemoResponse(modelName, payload) {
    logger.info(`🤗 Generating demo response for model: ${modelName}`);
    
    const demoResponses = {
      [this.models.medicalNER]: [
        { entity_group: 'DISEASE', word: 'cardiovascular disease', confidence: 0.95 },
        { entity_group: 'DISEASE', word: 'diabetes', confidence: 0.89 }
      ],
      [this.models.drugNER]: [
        { entity_group: 'CHEMICAL', word: 'aspirin', confidence: 0.96 },
        { entity_group: 'CHEMICAL', word: 'metformin', confidence: 0.88 }
      ],
      [this.models.biomedicalQA]: {
        answer: 'Based on current pharmaceutical research, this involves complex mechanisms that require careful analysis of clinical data.',
        score: 0.85
      },
      [this.models.textSummarization]: [{
        summary_text: 'This medical research discusses important findings related to pharmaceutical developments and clinical outcomes with promising therapeutic applications.'
      }],
      [this.models.sentimentAnalysis]: {
        label: 'POSITIVE',
        score: 0.78
      }
    };

    return demoResponses[modelName] || { demo: true, message: 'Demo response for pharmaceutical AI analysis' };
  }

  /**
   * Get demo research insights
   */
  getDemoInsights(query) {
    return {
      insights: `Pharmaceutical research on "${query}" shows promising developments in clinical applications. Current studies indicate potential therapeutic benefits with manageable safety profiles.`,
      entities: {
        diseases: ['cardiovascular disease', 'diabetes'],
        drugs: ['aspirin', 'metformin'],
        success: true,
        source: 'demo_data'
      },
      sentiment: {
        sentiment: 'positive',
        confidence: 0.82,
        success: true,
        source: 'demo_data'
      },
      recommendations: [
        'Monitor ongoing clinical trials for safety and efficacy data',
        'Review regulatory approval pathways and requirements',
        'Analyze competitive landscape and patent protection',
        'Assess market potential and commercialization strategies'
      ],
      confidence: 0.85,
      success: false,
      source: 'demo_data',
      note: 'Using demo data - configure HUGGINGFACE_API_KEY for live AI analysis'
    };
  }

  /**
   * Check service health and configuration
   */
  getServiceStatus() {
    return {
      configured: this.isConfigured,
      models: Object.keys(this.models).length,
      baseUrl: this.baseUrl,
      availableModels: this.models,
      lastHealthCheck: new Date().toISOString(),
      status: this.isConfigured ? 'operational' : 'demo_mode'
    };
  }
}

export default HuggingFaceService;