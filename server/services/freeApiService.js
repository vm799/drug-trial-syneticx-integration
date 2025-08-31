/**
 * Free API Service
 * Integrates with free and public APIs to get real pharmaceutical data
 */

import logger from '../utils/logger.js';

class FreeApiService {
  constructor() {
    this.apis = {
      // Clinical Trials
      clinicalTrials: 'https://clinicaltrials.gov/api/query/full_studies',
      
      // Drug Information
      rxnorm: 'https://rxnav.nlm.nih.gov/REST/rxcui.json',
      dailymed: 'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json',
      
      // FDA Data
      fdaEnforcement: 'https://api.fda.gov/drug/enforcement.json',
      fdaEvents: 'https://api.fda.gov/drug/event.json',
      fdaDrugs: 'https://api.fda.gov/drug/drugsfda.json',
      
      // Patent Data (limited free access)
      uspto: 'https://developer.uspto.gov/ds-api',
      
      // Financial Data
      alphavantage: 'https://www.alphavantage.co/query',
      
      // News and Research
      pubmed: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
      arxiv: 'http://export.arxiv.org/api/query',
      
      // General APIs
      wikipedia: 'https://en.wikipedia.org/api/rest_v1/page/summary/'
    };

    logger.info('🌐 Free API Service initialized with multiple data sources');
  }

  /**
   * Search clinical trials from ClinicalTrials.gov
   */
  async searchClinicalTrials(query, maxResults = 10) {
    try {
      logger.info(`🧪 Searching clinical trials for: "${query}"`);
      
      const params = new URLSearchParams({
        'expr': query,
        'max_rnk': maxResults,
        'fmt': 'json'
      });

      const response = await fetch(`${this.apis.clinicalTrials}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const studies = data.FullStudiesResponse?.FullStudies || [];

      const processedTrials = studies.map(study => {
        const studyData = study.Study;
        return {
          nctId: studyData.ProtocolSection?.IdentificationModule?.NCTId,
          title: studyData.ProtocolSection?.IdentificationModule?.BriefTitle,
          status: studyData.ProtocolSection?.StatusModule?.OverallStatus,
          phase: studyData.ProtocolSection?.DesignModule?.PhaseList?.Phase?.[0] || 'Not specified',
          condition: studyData.ProtocolSection?.ConditionsModule?.ConditionList?.Condition?.[0],
          sponsor: studyData.ProtocolSection?.SponsorCollaboratorsModule?.LeadSponsor?.LeadSponsorName,
          enrollment: studyData.ProtocolSection?.DesignModule?.EnrollmentInfo?.EnrollmentCount,
          startDate: studyData.ProtocolSection?.StatusModule?.StartDateStruct?.StartDate,
          completionDate: studyData.ProtocolSection?.StatusModule?.CompletionDateStruct?.CompletionDate,
          summary: studyData.ProtocolSection?.DescriptionModule?.BriefSummary?.substring(0, 200) + '...'
        };
      });

      logger.info(`🧪 Found ${processedTrials.length} clinical trials`);
      
      return {
        success: true,
        trials: processedTrials,
        totalCount: processedTrials.length,
        source: 'clinicaltrials_gov',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('🧪 Clinical trials search failed:', error);
      return this.getFallbackTrials(query);
    }
  }

  /**
   * Search FDA enforcement actions and warning letters
   */
  async searchFDAEnforcement(query, limit = 10) {
    try {
      logger.info(`⚖️ Searching FDA enforcement for: "${query}"`);
      
      const params = new URLSearchParams({
        'search': `product_description:${query}`,
        'limit': limit
      });

      const response = await fetch(`${this.apis.fdaEnforcement}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const results = data.results || [];

      const processedActions = results.map(action => ({
        recallNumber: action.recall_number,
        product: action.product_description,
        reason: action.reason_for_recall,
        classification: action.classification,
        company: action.recalling_firm,
        date: action.report_date,
        status: action.status,
        distribution: action.distribution_pattern
      }));

      logger.info(`⚖️ Found ${processedActions.length} FDA enforcement actions`);

      return {
        success: true,
        enforcements: processedActions,
        totalCount: processedActions.length,
        source: 'fda_enforcement_api',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('⚖️ FDA enforcement search failed:', error);
      return this.getFallbackEnforcement(query);
    }
  }

  /**
   * Search PubMed for medical research papers
   */
  async searchPubMed(query, maxResults = 10) {
    try {
      logger.info(`📚 Searching PubMed for: "${query}"`);
      
      const searchParams = new URLSearchParams({
        'db': 'pubmed',
        'term': query,
        'retmax': maxResults,
        'retmode': 'json',
        'sort': 'relevance'
      });

      const searchResponse = await fetch(`${this.apis.pubmed}?${searchParams}`);
      const searchData = await searchResponse.json();
      
      const ids = searchData.esearchresult?.idlist || [];
      
      if (ids.length === 0) {
        return this.getFallbackPapers(query);
      }

      // Get detailed info for papers
      const detailParams = new URLSearchParams({
        'db': 'pubmed',
        'id': ids.join(','),
        'retmode': 'xml'
      });

      const detailResponse = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?${detailParams}`);
      const detailText = await detailResponse.text();

      // Basic XML parsing for titles (simplified)
      const titleMatches = detailText.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/g) || [];
      const abstractMatches = detailText.match(/<AbstractText>(.*?)<\/AbstractText>/g) || [];

      const papers = ids.slice(0, titleMatches.length).map((id, index) => ({
        pmid: id,
        title: titleMatches[index]?.replace(/<[^>]*>/g, '') || 'Research Paper',
        abstract: abstractMatches[index]?.replace(/<[^>]*>/g, '')?.substring(0, 200) + '...' || 'Abstract not available',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        relevance: 'high'
      }));

      logger.info(`📚 Found ${papers.length} PubMed papers`);

      return {
        success: true,
        papers: papers,
        totalCount: papers.length,
        source: 'pubmed_api',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('📚 PubMed search failed:', error);
      return this.getFallbackPapers(query);
    }
  }

  /**
   * Get drug information from RxNorm
   */
  async getDrugInfo(drugName) {
    try {
      logger.info(`💊 Getting drug info for: "${drugName}"`);
      
      const response = await fetch(`${this.apis.rxnorm}?name=${encodeURIComponent(drugName)}`);
      const data = await response.json();
      
      const rxcui = data.idGroup?.rxnormId?.[0];
      
      if (!rxcui) {
        return this.getFallbackDrugInfo(drugName);
      }

      // Get additional drug properties
      const propsResponse = await fetch(`https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`);
      const propsData = await propsResponse.json();
      
      const properties = propsData.properties || {};

      return {
        success: true,
        drug: {
          name: drugName,
          rxcui: rxcui,
          synonym: properties.synonym,
          tty: properties.tty,
          language: properties.language,
          suppress: properties.suppress
        },
        source: 'rxnorm_api',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('💊 Drug info search failed:', error);
      return this.getFallbackDrugInfo(drugName);
    }
  }

  /**
   * Search ArXiv for pharmaceutical research papers
   */
  async searchArxiv(query, maxResults = 5) {
    try {
      logger.info(`📖 Searching ArXiv for: "${query}"`);
      
      const params = new URLSearchParams({
        'search_query': `all:${query} AND cat:q-bio*`,
        'start': 0,
        'max_results': maxResults,
        'sortBy': 'relevance',
        'sortOrder': 'descending'
      });

      const response = await fetch(`${this.apis.arxiv}?${params}`);
      const xmlText = await response.text();
      
      // Simple XML parsing for ArXiv entries
      const entryMatches = xmlText.match(/<entry>(.*?)<\/entry>/gs) || [];
      
      const papers = entryMatches.map(entry => {
        const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
        const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s);
        const authorMatches = entry.match(/<name>(.*?)<\/name>/g);
        const linkMatch = entry.match(/<id>(.*?)<\/id>/);
        
        return {
          title: titleMatch?.[1]?.trim().replace(/\s+/g, ' ') || 'Research Paper',
          summary: summaryMatch?.[1]?.trim().substring(0, 200) + '...' || 'Summary not available',
          authors: authorMatches?.map(author => author.replace(/<[^>]*>/g, '')) || [],
          url: linkMatch?.[1] || '#',
          source: 'arxiv'
        };
      });

      logger.info(`📖 Found ${papers.length} ArXiv papers`);

      return {
        success: true,
        papers: papers,
        totalCount: papers.length,
        source: 'arxiv_api',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('📖 ArXiv search failed:', error);
      return this.getFallbackPapers(query);
    }
  }

  /**
   * Get company information from Wikipedia
   */
  async getCompanyInfo(companyName) {
    try {
      logger.info(`🏢 Getting company info for: "${companyName}"`);
      
      const response = await fetch(`${this.apis.wikipedia}${encodeURIComponent(companyName)}`);
      
      if (!response.ok) {
        throw new Error('Company not found');
      }

      const data = await response.json();
      
      return {
        success: true,
        company: {
          name: data.title,
          description: data.extract,
          url: data.content_urls?.desktop?.page,
          thumbnail: data.thumbnail?.source,
          coordinates: data.coordinates
        },
        source: 'wikipedia_api',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('🏢 Company info search failed:', error);
      return this.getFallbackCompanyInfo(companyName);
    }
  }

  /**
   * Fallback methods for when APIs fail
   */
  getFallbackTrials(query) {
    return {
      success: false,
      trials: [
        {
          nctId: 'NCT00000001',
          title: `Clinical Trial for ${query}`,
          status: 'Recruiting',
          phase: 'Phase 2',
          condition: query,
          sponsor: 'Medical Research Institute',
          enrollment: '500',
          summary: `A randomized controlled trial investigating ${query} in patients with relevant conditions.`
        }
      ],
      source: 'demo_fallback',
      note: 'Demo data - API temporarily unavailable'
    };
  }

  getFallbackEnforcement(query) {
    return {
      success: false,
      enforcements: [
        {
          recallNumber: 'F-2024-001',
          product: `${query} related product`,
          reason: 'Quality control issues',
          classification: 'Class II',
          company: 'Pharmaceutical Company',
          date: '2024-08-01',
          status: 'Ongoing'
        }
      ],
      source: 'demo_fallback',
      note: 'Demo data - FDA API temporarily unavailable'
    };
  }

  getFallbackPapers(query) {
    return {
      success: false,
      papers: [
        {
          pmid: '12345678',
          title: `Recent Advances in ${query} Research`,
          abstract: `This study investigates the therapeutic applications of ${query} in clinical settings...`,
          url: 'https://pubmed.ncbi.nlm.nih.gov/12345678/',
          relevance: 'high'
        }
      ],
      source: 'demo_fallback',
      note: 'Demo data - PubMed API temporarily unavailable'
    };
  }

  getFallbackDrugInfo(drugName) {
    return {
      success: false,
      drug: {
        name: drugName,
        rxcui: 'unknown',
        synonym: drugName,
        tty: 'unknown',
        language: 'ENG'
      },
      source: 'demo_fallback',
      note: 'Demo data - RxNorm API temporarily unavailable'
    };
  }

  getFallbackCompanyInfo(companyName) {
    return {
      success: false,
      company: {
        name: companyName,
        description: `${companyName} is a pharmaceutical company focused on developing innovative treatments.`,
        url: '#',
        thumbnail: null
      },
      source: 'demo_fallback',
      note: 'Demo data - Wikipedia API temporarily unavailable'
    };
  }

  /**
   * Get service status for all APIs
   */
  getServiceStatus() {
    return {
      configured: true,
      availableApis: Object.keys(this.apis),
      description: 'Free API service providing access to clinical trials, FDA data, PubMed, and more',
      lastCheck: new Date().toISOString(),
      status: 'operational'
    };
  }
}

export default FreeApiService;