import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import logger from '../utils/logger.js';

class RSSFeedService {
  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    
    // RSS feed sources organized by category
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
          name: 'PharmaTimes',
          url: 'https://www.pharmatimes.com/rss/news.xml',
          category: 'pharmaceutical',
          description: 'Industry updates, regulatory news',
          updateInterval: 7200000 // 2 hours
        },
        {
          name: 'BioSpace',
          url: 'https://www.biospace.com/news/rss/',
          category: 'pharmaceutical',
          description: 'Biotech developments, clinical trials',
          updateInterval: 3600000 // 1 hour
        },
        {
          name: 'Endpoints News',
          url: 'https://endpts.com/feed/',
          category: 'pharmaceutical',
          description: 'Drug development, FDA updates',
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
      financial: [
        {
          name: 'Seeking Alpha Pharma',
          url: 'https://seekingalpha.com/feed/healthcare',
          category: 'financial',
          description: 'Pharma stock analysis',
          updateInterval: 1800000 // 30 minutes
        },
        {
          name: 'MarketWatch Healthcare',
          url: 'https://feeds.marketwatch.com/marketwatch/healthcare/',
          category: 'financial',
          description: 'Healthcare market updates',
          updateInterval: 3600000 // 1 hour
        },
        {
          name: 'Reuters Health',
          url: 'https://feeds.reuters.com/reuters/healthNews',
          category: 'financial',
          description: 'Industry financial news',
          updateInterval: 1800000 // 30 minutes
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
      await Promise.allSettled(promises);
      logger.info('RSS feed refresh completed');
    } catch (error) {
      logger.error('Error refreshing RSS feeds:', error);
    }
  }

  async fetchFeed(feedSource) {
    try {
      const response = await axios.get(feedSource.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.status === 200 && response.data) {
        const parsedData = this.parser.parse(response.data);
        const processedData = this.processRSSData(parsedData, feedSource);
        
        // Cache the processed data
        this.cache.set(feedSource.name, {
          data: processedData,
          timestamp: Date.now(),
          source: feedSource
        });
        
        logger.info(`RSS feed ${feedSource.name} updated successfully`);
        return processedData;
      }
    } catch (error) {
      logger.error(`Error fetching RSS feed ${feedSource.name}:`, error.message);
      
      // Return cached data if available
      const cached = this.cache.get(feedSource.name);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }
    
    return null;
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
}

export default RSSFeedService;