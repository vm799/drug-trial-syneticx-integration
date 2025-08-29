import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import logger from '../utils/logger.js';

class RSSFeedService {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    
    // RSS feed sources organized by category - Updated with working feeds only
    this.feedSources = {
      pharmaceutical: [
        {
          name: 'FiercePharma',
          url: 'https://www.fiercepharma.com/rss/xml',
          category: 'pharmaceutical',
          description: 'Drug approvals, M&A, company news',
          updateInterval: 3600000 // 1 hour
        },
        {
          name: 'FierceBiotech',
          url: 'https://www.fiercebiotech.com/rss/xml',
          category: 'pharmaceutical',
          description: 'Biotech developments, clinical trials',
          updateInterval: 3600000 // 1 hour
        },
        {
          name: 'BioPharma Dive',
          url: 'https://www.biopharmadive.com/feeds/news/',
          category: 'pharmaceutical',
          description: 'Industry insights and analysis',
          updateInterval: 3600000 // 1 hour
        },
        {
          name: 'Reuters Health',
          url: 'https://feeds.reuters.com/reuters/healthNews',
          category: 'pharmaceutical',
          description: 'Health and pharmaceutical news',
          updateInterval: 1800000 // 30 minutes
        }
      ],
      patents: [
        {
          name: 'IPWatchdog',
          url: 'https://www.ipwatchdog.com/feed/',
          category: 'patents',
          description: 'Patent law, USPTO updates',
          updateInterval: 7200000 // 2 hours
        },
        {
          name: 'Managing IP',
          url: 'https://www.managingip.com/rss',
          category: 'patents',
          description: 'Intellectual property news',
          updateInterval: 7200000 // 2 hours
        },
        {
          name: 'Patent Docs',
          url: 'https://patentdocs.typepad.com/patent_docs/atom.xml',
          category: 'patents',
          description: 'Patent litigation, IP strategy',
          updateInterval: 7200000 // 2 hours
        }
      ],
      clinicalTrials: [
        {
          name: 'ClinicalTrials.gov',
          url: 'https://clinicaltrials.gov/ct2/results/rss.xml?rcv_d=14&lup_d=14&sel_rss=new14',
          category: 'clinicalTrials',
          description: 'New clinical trial announcements',
          updateInterval: 3600000 // 1 hour
        },
        {
          name: 'Nature Medicine',
          url: 'https://www.nature.com/nm.rss',
          category: 'clinicalTrials',
          description: 'Medical research breakthroughs',
          updateInterval: 7200000 // 2 hours
        },
        {
          name: 'Science Daily',
          url: 'https://www.sciencedaily.com/rss/health_medicine.xml',
          category: 'clinicalTrials',
          description: 'Medical research news',
          updateInterval: 3600000 // 1 hour
        }
      ],
      regulatory: [
        {
          name: 'FDA News (via Reuters)',
          url: 'https://feeds.reuters.com/reuters/governmentfilings',
          category: 'regulatory',
          description: 'Government filings and regulatory news',
          updateInterval: 1800000 // 30 minutes
        },
        {
          name: 'Regulatory Focus',
          url: 'https://www.raps.org/news-and-articles/news-feed',
          category: 'regulatory',
          description: 'Regulatory Affairs Professional Society updates',
          updateInterval: 3600000 // 1 hour
        },
        {
          name: 'Pharma Manufacturing',
          url: 'https://www.pharmamanufacturing.com/rss/',
          category: 'regulatory',
          description: 'Manufacturing compliance and regulations',
          updateInterval: 7200000 // 2 hours
        }
      ],
      financial: [
        {
          name: 'FiercePharma',
          url: 'https://www.fiercepharma.com/rss/xml',
          category: 'financial',
          description: 'Pharmaceutical industry financial news',
          updateInterval: 3600000 // 1 hour
        },
        {
          name: 'FierceBiotech',
          url: 'https://www.fiercebiotech.com/rss/xml',
          category: 'financial',
          description: 'Biotech industry news and analysis',
          updateInterval: 3600000 // 1 hour
        },
        {
          name: 'BioPharma Dive',
          url: 'https://www.biopharmadive.com/feeds/news/',
          category: 'financial',
          description: 'Pharmaceutical industry insights',
          updateInterval: 3600000 // 1 hour
        }
      ]
    };
    
    // Cache for RSS feed data
    this.cache = new Map();
    this.cacheTimeout = 1800000; // 30 minutes
    
    // Initialize feed fetching
    this.init();
  }

  async init() {
    logger.info('RSS Feed Service initialized');
    
    // Fetch initial feeds
    await this.refreshAllFeeds();
    
    // Set up periodic refresh
    setInterval(() => {
      this.refreshAllFeeds();
    }, 1800000); // Refresh every 30 minutes
  }

  async refreshAllFeeds() {
    logger.info('Refreshing all RSS feeds...');
    
    const allFeeds = Object.values(this.feedSources).flat();
    const promises = allFeeds.map(feed => this.fetchFeed(feed));
    
    try {
      const results = await Promise.allSettled(promises);
      
      // Log results for debugging
      let successCount = 0;
      let errorCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successCount++;
        } else {
          errorCount++;
          logger.error(`Feed ${allFeeds[index].name} failed:`, result.reason?.message || 'Unknown error');
        }
      });
      
      logger.info(`RSS feed refresh completed: ${successCount} successful, ${errorCount} failed`);
    } catch (error) {
      logger.error('Error refreshing RSS feeds:', error);
    }
  }

  async fetchFeed(feedSource) {
    try {
      logger.info(`Fetching RSS feed: ${feedSource.name} from ${feedSource.url}`);
      
      const response = await axios.get(feedSource.url, {
        timeout: 15000, // Increased timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 5 // Allow redirects
      });

      if (response.status === 200 && response.data) {
        logger.info(`Successfully fetched ${feedSource.name}, processing data...`);
        
        const parsedData = this.parser.parse(response.data);
        const processedData = this.processRSSData(parsedData, feedSource);
        
        if (processedData && processedData.items && processedData.items.length > 0) {
          // Cache the processed data
          this.cache.set(feedSource.name, {
            data: processedData,
            timestamp: Date.now(),
            source: feedSource
          });
          
          logger.info(`RSS feed ${feedSource.name} updated successfully with ${processedData.items.length} items`);
          return processedData;
        } else {
          logger.warn(`RSS feed ${feedSource.name} returned no valid items`);
          return this.createEmptyFeed(feedSource, 'No valid items found');
        }
      } else {
        logger.warn(`RSS feed ${feedSource.name} returned status ${response.status}`);
        return this.createEmptyFeed(feedSource, `HTTP ${response.status}`);
      }
    } catch (error) {
      logger.error(`Error fetching RSS feed ${feedSource.name}:`, error.message);
      
      // Return cached data if available
      const cached = this.cache.get(feedSource.name);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.info(`Using cached data for ${feedSource.name}`);
        return cached.data;
      }
      
      // Return empty feed structure if no cache available
      logger.warn(`No cached data available for ${feedSource.name}, returning empty feed`);
      return this.createEmptyFeed(feedSource, `Feed temporarily unavailable: ${error.message}`);
    }
  }

  createEmptyFeed(feedSource, errorMessage) {
    return {
      source: feedSource.name,
      category: feedSource.category,
      description: feedSource.description,
      lastUpdated: new Date().toISOString(),
      items: [],
      error: errorMessage
    };
  }

  processRSSData(rssData, feedSource) {
    try {
      let items = [];
      
      // Handle different RSS formats
      if (rssData.rss && rssData.rss.channel && rssData.rss.channel.item) {
        items = Array.isArray(rssData.rss.channel.item) ? rssData.rss.channel.item : [rssData.rss.channel.item];
      } else if (rssData.feed && rssData.feed.entry) {
        items = Array.isArray(rssData.feed.entry) ? rssData.feed.entry : [rssData.feed.entry];
      } else if (rssData.channel && rssData.channel.item) {
        items = Array.isArray(rssData.channel.item) ? rssData.channel.item : [rssData.channel.item];
      }

      logger.info(`Processing ${items.length} items from ${feedSource.name}`);

      return {
        source: feedSource.name,
        category: feedSource.category,
        description: feedSource.description,
        lastUpdated: new Date().toISOString(),
        items: items.map(item => this.processRSSItem(item, feedSource.category)).slice(0, 10) // Limit to 10 items
      };
    } catch (error) {
      logger.error(`Error processing RSS data for ${feedSource.name}:`, error);
      return null;
    }
  }

  processRSSItem(item, category) {
    try {
      // Handle different RSS item formats
      const title = item.title || item['dc:title'] || 'No Title';
      const description = item.description || item.summary || item['content:encoded'] || 'No description available';
      const link = item.link || item['feedburner:origLink'] || '#';
      const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();
      const author = item.author || item['dc:creator'] || 'Unknown Author';
      
      // Extract relevant information based on category
      let extractedInfo = {};
      
      switch (category) {
        case 'pharmaceutical':
          extractedInfo = this.extractPharmaInfo(title, description);
          break;
        case 'patents':
          extractedInfo = this.extractPatentInfo(title, description);
          break;
        case 'clinicalTrials':
          extractedInfo = this.extractClinicalTrialInfo(title, description);
          break;
        case 'regulatory':
          extractedInfo = this.extractRegulatoryInfo(title, description);
          break;
        case 'financial':
          extractedInfo = this.extractFinancialInfo(title, description);
          break;
        default:
          extractedInfo = { type: 'general', relevance: 'medium' };
      }

      return {
        title: this.cleanText(title),
        description: this.cleanText(description),
        link: link,
        pubDate: pubDate,
        author: author,
        category: category,
        extractedInfo: extractedInfo,
        relevance: extractedInfo.relevance || 'medium'
      };
    } catch (error) {
      logger.error('Error processing RSS item:', error);
      return null;
    }
  }

  extractPharmaInfo(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    let type = 'general';
    let relevance = 'medium';
    let companies = [];
    let drugs = [];
    let regulatory = false;
    
    // Detect drug approvals
    if (text.includes('fda approval') || text.includes('approved') || text.includes('approval')) {
      type = 'drug_approval';
      relevance = 'high';
      regulatory = true;
    }
    
    // Detect clinical trial results
    if (text.includes('clinical trial') || text.includes('phase') || text.includes('trial results')) {
      type = 'clinical_trial';
      relevance = 'high';
    }
    
    // Detect M&A activity
    if (text.includes('acquisition') || text.includes('merger') || text.includes('buyout')) {
      type = 'mergers_acquisitions';
      relevance = 'high';
    }
    
    // Extract company names (simplified)
    const companyPatterns = ['pfizer', 'moderna', 'johnson & johnson', 'merck', 'novartis', 'roche'];
    companies = companyPatterns.filter(company => text.includes(company));
    
    // Extract drug names (simplified)
    const drugPatterns = ['vaccine', 'therapy', 'treatment', 'drug', 'medication'];
    drugs = drugPatterns.filter(drug => text.includes(drug));
    
    return {
      type,
      relevance,
      companies,
      drugs,
      regulatory
    };
  }

  extractPatentInfo(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    let type = 'general';
    let relevance = 'medium';
    let patentTypes = [];
    let legal = false;
    
    // Detect patent litigation
    if (text.includes('litigation') || text.includes('lawsuit') || text.includes('court')) {
      type = 'patent_litigation';
      relevance = 'high';
      legal = true;
    }
    
    // Detect patent applications
    if (text.includes('patent application') || text.includes('filed') || text.includes('applied')) {
      type = 'patent_application';
      relevance = 'high';
    }
    
    // Detect patent grants
    if (text.includes('patent granted') || text.includes('issued') || text.includes('granted')) {
      type = 'patent_grant';
      relevance = 'high';
    }
    
    // Extract patent types
    if (text.includes('utility patent')) patentTypes.push('utility');
    if (text.includes('design patent')) patentTypes.push('design');
    if (text.includes('plant patent')) patentTypes.push('plant');
    
    return {
      type,
      relevance,
      patentTypes,
      legal
    };
  }

  extractClinicalTrialInfo(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    let type = 'general';
    let relevance = 'medium';
    let phases = [];
    let conditions = [];
    
    // Detect trial phases
    if (text.includes('phase 1')) phases.push('phase_1');
    if (text.includes('phase 2')) phases.push('phase_2');
    if (text.includes('phase 3')) phases.push('phase_3');
    if (text.includes('phase 4')) phases.push('phase_4');
    
    // Detect trial status
    if (text.includes('recruiting')) type = 'trial_recruiting';
    if (text.includes('completed')) type = 'trial_completed';
    if (text.includes('results')) type = 'trial_results';
    
    // Extract medical conditions
    const conditionPatterns = ['cancer', 'diabetes', 'cardiovascular', 'neurological', 'respiratory'];
    conditions = conditionPatterns.filter(condition => text.includes(condition));
    
    if (phases.length > 0 || type !== 'general') {
      relevance = 'high';
    }
    
    return {
      type,
      relevance,
      phases,
      conditions
    };
  }

  extractRegulatoryInfo(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    let type = 'general';
    let relevance = 'high'; // Regulatory news is typically high priority
    let regulatoryAgencies = [];
    let compliance = false;
    
    // Detect FDA actions
    if (text.includes('fda') || text.includes('food and drug administration')) {
      regulatoryAgencies.push('FDA');
      relevance = 'high';
    }
    
    // Detect warning letters
    if (text.includes('warning letter') || text.includes('violation') || text.includes('compliance')) {
      type = 'compliance_violation';
      compliance = true;
      relevance = 'high';
    }
    
    // Detect regulatory approvals
    if (text.includes('approval') || text.includes('clearance') || text.includes('authorization')) {
      type = 'regulatory_approval';
      relevance = 'high';
    }
    
    // Detect guidance documents
    if (text.includes('guidance') || text.includes('draft guidance') || text.includes('final guidance')) {
      type = 'regulatory_guidance';
      relevance = 'high';
    }
    
    // Detect enforcement actions
    if (text.includes('enforcement') || text.includes('recall') || text.includes('suspension')) {
      type = 'enforcement_action';
      relevance = 'high';
    }
    
    return {
      type,
      relevance,
      regulatoryAgencies,
      compliance
    };
  }

  extractFinancialInfo(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    let type = 'general';
    let relevance = 'medium';
    let marketImpact = 'neutral';
    
    // Detect market-moving news
    if (text.includes('stock') || text.includes('share price') || text.includes('market')) {
      type = 'market_news';
      relevance = 'high';
    }
    
    // Detect earnings
    if (text.includes('earnings') || text.includes('revenue') || text.includes('profit')) {
      type = 'earnings';
      relevance = 'high';
    }
    
    // Detect analyst ratings
    if (text.includes('upgrade') || text.includes('downgrade') || text.includes('analyst')) {
      type = 'analyst_rating';
      relevance = 'medium';
    }
    
    // Determine market impact
    if (text.includes('positive') || text.includes('upgrade') || text.includes('beat')) {
      marketImpact = 'positive';
    } else if (text.includes('negative') || text.includes('downgrade') || text.includes('miss')) {
      marketImpact = 'negative';
    }
    
    return {
      type,
      relevance,
      marketImpact
    };
  }

  cleanText(text) {
    if (!text) return '';
    
    // Remove HTML tags
    let cleaned = text.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&#39;/g, "'");
    
    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  async getFeedsByCategory(category) {
    const categoryFeeds = this.feedSources[category] || [];
    const results = [];
    
    for (const feed of categoryFeeds) {
      const cached = this.cache.get(feed.name);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        results.push(cached.data);
      } else {
        const freshData = await this.fetchFeed(feed);
        if (freshData) {
          results.push(freshData);
        }
      }
    }
    
    return results;
  }

  async getAllFeeds() {
    const allFeeds = {};
    
    for (const category of Object.keys(this.feedSources)) {
      allFeeds[category] = await this.getFeedsByCategory(category);
    }
    
    return allFeeds;
  }

  async searchFeeds(query, category = null) {
    const allFeeds = await this.getAllFeeds();
    const searchResults = [];
    
    for (const [feedCategory, feeds] of Object.entries(allFeeds)) {
      if (category && category !== feedCategory) continue;
      
      for (const feed of feeds) {
        if (!feed.items) continue;
        
        for (const item of feed.items) {
          const searchText = `${item.title} ${item.description}`.toLowerCase();
          if (searchText.includes(query.toLowerCase())) {
            searchResults.push({
              ...item,
              feedSource: feed.source,
              feedCategory: feed.category
            });
          }
        }
      }
    }
    
    // Sort by relevance and date
    searchResults.sort((a, b) => {
      const relevanceOrder = { high: 3, medium: 2, low: 1 };
      const aRelevance = relevanceOrder[a.relevance] || 1;
      const bRelevance = relevanceOrder[b.relevance] || 1;
      
      if (aRelevance !== bRelevance) {
        return bRelevance - aRelevance;
      }
      
      return new Date(b.pubDate) - new Date(a.pubDate);
    });
    
    return searchResults.slice(0, 50); // Limit results
  }

  getFeedStatus() {
    const status = {};
    
    for (const [category, feeds] of Object.entries(this.feedSources)) {
      status[category] = feeds.map(feed => {
        const cached = this.cache.get(feed.name);
        return {
          name: feed.name,
          url: feed.url,
          category: feed.category,
          description: feed.description,
          lastUpdated: cached ? new Date(cached.timestamp).toISOString() : 'Never',
          status: cached ? 'active' : 'inactive',
          itemCount: cached ? cached.data.items?.length || 0 : 0
        };
      });
    }
    
    return status;
  }

  // Method to provide sample data for testing when feeds are not working
  getSampleData() {
    return {
      pharmaceutical: [
        {
          source: 'FiercePharma',
          category: 'pharmaceutical',
          description: 'Drug approvals, M&A, company news',
          lastUpdated: new Date().toISOString(),
          items: [
            {
              title: 'FDA Approves New Breakthrough Therapy for Cancer Treatment',
              description: 'The FDA has granted approval for a novel cancer treatment that shows promising results in clinical trials.',
              link: '#',
              pubDate: new Date().toISOString(),
              author: 'FiercePharma Staff',
              category: 'pharmaceutical',
              extractedInfo: { type: 'drug_approval', relevance: 'high', companies: [], drugs: ['cancer treatment'], regulatory: true },
              relevance: 'high'
            },
            {
              title: 'Major Pharmaceutical Merger Creates Industry Giant',
              description: 'Two leading pharmaceutical companies announce a landmark merger worth billions of dollars.',
              link: '#',
              pubDate: new Date(Date.now() - 3600000).toISOString(),
              author: 'FiercePharma Staff',
              category: 'pharmaceutical',
              extractedInfo: { type: 'mergers_acquisitions', relevance: 'high', companies: [], drugs: [], regulatory: false },
              relevance: 'high'
            }
          ]
        }
      ],
      patents: [
        {
          source: 'IPWatchdog',
          category: 'patents',
          description: 'Patent law, USPTO updates',
          lastUpdated: new Date().toISOString(),
          items: [
            {
              title: 'USPTO Issues New Guidelines for AI-Generated Inventions',
              description: 'The Patent Office releases updated guidance on patenting artificial intelligence innovations.',
              link: '#',
              pubDate: new Date().toISOString(),
              author: 'IPWatchdog Staff',
              category: 'patents',
              extractedInfo: { type: 'patent_guidance', relevance: 'high', patentTypes: ['utility'], legal: true },
              relevance: 'high'
            }
          ]
        }
      ],
      clinicalTrials: [
        {
          source: 'ClinicalTrials.gov',
          category: 'clinicalTrials',
          description: 'New clinical trial announcements',
          lastUpdated: new Date().toISOString(),
          items: [
            {
              title: 'Phase 3 Clinical Trial Recruiting for Diabetes Treatment',
              description: 'A new Phase 3 clinical trial is now recruiting participants for an innovative diabetes treatment.',
              link: '#',
              pubDate: new Date().toISOString(),
              author: 'ClinicalTrials.gov',
              category: 'clinicalTrials',
              extractedInfo: { type: 'trial_recruiting', relevance: 'high', phases: ['phase_3'], conditions: ['diabetes'] },
              relevance: 'high'
            }
          ]
        }
      ],
      regulatory: [
        {
          source: 'Regulatory Focus',
          category: 'regulatory',
          description: 'Regulatory Affairs Professional Society updates',
          lastUpdated: new Date().toISOString(),
          items: [
            {
              title: 'FDA Issues New Guidance on Manufacturing Compliance',
              description: 'The FDA releases comprehensive guidance on pharmaceutical manufacturing compliance requirements.',
              link: '#',
              pubDate: new Date().toISOString(),
              author: 'RAPS Staff',
              category: 'regulatory',
              extractedInfo: { type: 'regulatory_guidance', relevance: 'high', regulatoryAgencies: ['FDA'], compliance: true },
              relevance: 'high'
            }
          ]
        }
      ],
      financial: [
        {
          source: 'FierceBiotech',
          category: 'financial',
          description: 'Biotech industry news and analysis',
          lastUpdated: new Date().toISOString(),
          items: [
            {
              title: 'Biotech Company Reports Strong Q4 Earnings',
              description: 'Leading biotech firm exceeds analyst expectations with record quarterly earnings.',
              link: '#',
              pubDate: new Date().toISOString(),
              author: 'FierceBiotech Staff',
              category: 'financial',
              extractedInfo: { type: 'earnings', relevance: 'high', marketImpact: 'positive' },
              relevance: 'high'
            }
          ]
        }
      ]
    };
  }

  // Method to check if we have any working feeds
  hasWorkingFeeds() {
    return this.cache.size > 0;
  }
}

export default RSSFeedService;