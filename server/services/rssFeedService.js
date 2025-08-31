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
          name: 'ClinicalTrials.gov - Terminated Studies',
          url: 'https://clinicaltrials.gov/ct2/results/rss.xml?term=terminated&recrs=e&age_v=&gndr=&type=&rslt=&phase=&fund=&cond=&intr=&titles=&outc=&spons=&lead=&id=&cntry=&state=&city=&dist=&locn=&rsub=&strd_s=&strd_e=&prcd_s=&prcd_e=&sfpd_s=&sfpd_e=&rfpd_s=&rfpd_e=&lupd_s=&lupd_e=&sort=&lup_d=14',
          category: 'clinicalTrials',
          description: 'Recently terminated clinical trials',
          updateInterval: 1800000, // 30 minutes - high priority for failures
          priority: 'high'
        },
        {
          name: 'ClinicalTrials.gov - Withdrawn Studies',
          url: 'https://clinicaltrials.gov/ct2/results/rss.xml?term=withdrawn&recrs=e&age_v=&gndr=&type=&rslt=&phase=&fund=&cond=&intr=&titles=&outc=&spons=&lead=&id=&cntry=&state=&city=&dist=&locn=&rsub=&strd_s=&strd_e=&prcd_s=&prcd_e=&sfpd_s=&sfpd_e=&rfpd_s=&rfpd_e=&lupd_s=&lupd_e=&sort=&lup_d=14',
          category: 'clinicalTrials',
          description: 'Recently withdrawn clinical trials',
          updateInterval: 1800000, // 30 minutes - high priority for failures
          priority: 'high'
        },
        {
          name: 'BioCentury Intelligence',
          url: 'https://www.biocentury.com/rss',
          category: 'clinicalTrials',
          description: 'Clinical trial outcomes and pharmaceutical intelligence',
          updateInterval: 1800000 // 30 minutes
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
          name: 'FDA Warning Letters RSS',
          url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/warning-letters/rss.xml',
          category: 'regulatory',
          description: 'FDA Warning Letters and enforcement actions',
          updateInterval: 900000, // 15 minutes - high priority
          priority: 'high'
        },
        {
          name: 'FDA Drug Recalls RSS',
          url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls-market-withdrawals-safety-alerts/rss.xml',
          category: 'regulatory',
          description: 'FDA drug recalls and safety alerts',
          updateInterval: 900000, // 15 minutes - high priority
          priority: 'high'
        },
        {
          name: 'FDA News & Events RSS',
          url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-announcements/rss.xml',
          category: 'regulatory',
          description: 'FDA press announcements and regulatory updates',
          updateInterval: 1800000, // 30 minutes
          priority: 'high'
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
      if (!item || typeof item !== 'object') {
        logger.warn('Invalid RSS item:', item);
        return null;
      }
      
      // Handle different RSS item formats
      const title = this.extractValue(item.title || item['dc:title'] || 'No Title');
      const description = this.extractValue(item.description || item.summary || item['content:encoded'] || 'No description available');
      const link = this.extractValue(item.link || item['feedburner:origLink'] || '#');
      const pubDate = this.extractValue(item.pubDate || item.published || item.updated || new Date().toISOString());
      const author = this.extractValue(item.author || item['dc:creator'] || 'Unknown Author');
      
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

      const processedItem = {
        title: this.cleanText(title),
        description: this.cleanText(description),
        link: String(link || '#'),
        pubDate: String(pubDate),
        author: this.cleanText(author),
        category: category,
        extractedInfo: extractedInfo,
        relevance: extractedInfo.relevance || 'medium'
      };
      
      // Validate the processed item
      if (!processedItem.title || processedItem.title.trim() === '' || processedItem.title === 'No Title') {
        logger.warn('Skipping RSS item with invalid title');
        return null;
      }
      
      return processedItem;
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
    let companies = [];
    let trialStatus = 'unknown';
    let severity = 'medium';
    
    // Detect trial phases
    if (text.includes('phase 1') || text.includes('phase i')) phases.push('phase_1');
    if (text.includes('phase 2') || text.includes('phase ii')) phases.push('phase_2');
    if (text.includes('phase 3') || text.includes('phase iii')) phases.push('phase_3');
    if (text.includes('phase 4') || text.includes('phase iv')) phases.push('phase_4');
    
    // Detect failed/negative trials - HIGHEST PRIORITY
    if (text.includes('failed') || text.includes('unsuccessful') || text.includes('did not meet') || 
        text.includes('missed primary endpoint') || text.includes('negative results') || 
        text.includes('futility') || text.includes('stopped for futility')) {
      type = 'trial_failed';
      relevance = 'high';
      severity = 'high';
      trialStatus = 'failed';
    }
    
    // Detect terminated trials - HIGH PRIORITY
    if (text.includes('terminated') || text.includes('discontinued') || text.includes('halted') || 
        text.includes('suspended') || text.includes('stopped early')) {
      type = 'trial_terminated';
      relevance = 'high';
      severity = 'high';
      trialStatus = 'terminated';
    }
    
    // Detect withdrawn trials - HIGH PRIORITY
    if (text.includes('withdrawn') || text.includes('cancelled') || text.includes('canceled')) {
      type = 'trial_withdrawn';
      relevance = 'high';
      severity = 'medium';
      trialStatus = 'withdrawn';
    }
    
    // Detect delayed trials
    if (text.includes('delayed') || text.includes('postponed') || text.includes('enrollment challenges')) {
      type = 'trial_delayed';
      relevance = 'high';
      severity = 'medium';
      trialStatus = 'delayed';
    }
    
    // Detect safety concerns
    if (text.includes('safety concern') || text.includes('adverse event') || text.includes('safety review') || 
        text.includes('data safety monitoring') || text.includes('dsmb')) {
      type = 'trial_safety_concern';
      relevance = 'high';
      severity = 'high';
    }
    
    // Detect trial status
    if (text.includes('recruiting')) {
      type = type === 'general' ? 'trial_recruiting' : type;
      trialStatus = 'recruiting';
    }
    if (text.includes('completed')) {
      type = type === 'general' ? 'trial_completed' : type;
      trialStatus = 'completed';
    }
    if (text.includes('results')) {
      type = type === 'general' ? 'trial_results' : type;
    }
    
    // Extract medical conditions (enhanced)
    const conditionPatterns = [
      'cancer', 'oncology', 'tumor', 'carcinoma', 'melanoma', 'lymphoma', 'leukemia',
      'diabetes', 'cardiovascular', 'heart', 'stroke', 'hypertension',
      'neurological', 'alzheimer', 'parkinson', 'multiple sclerosis', 'epilepsy',
      'respiratory', 'asthma', 'copd', 'pneumonia',
      'infectious disease', 'covid', 'hepatitis', 'hiv',
      'autoimmune', 'rheumatoid arthritis', 'crohn', 'psoriasis'
    ];
    conditions = conditionPatterns.filter(condition => text.includes(condition));
    
    // Extract company names
    const companyPatterns = [
      'pfizer', 'moderna', 'johnson & johnson', 'j&j', 'merck', 'novartis', 'roche', 'genentech',
      'bristol myers squibb', 'bms', 'abbvie', 'gilead', 'amgen', 'biogen', 'regeneron',
      'eli lilly', 'lilly', 'glaxosmithkline', 'gsk', 'astrazeneca', 'sanofi', 'takeda'
    ];
    companies = companyPatterns.filter(company => text.includes(company));
    
    if (phases.length > 0 || type !== 'general') {
      relevance = relevance === 'medium' ? 'high' : relevance;
    }
    
    return {
      type,
      relevance,
      phases,
      conditions,
      companies,
      trialStatus,
      severity
    };
  }

  extractRegulatoryInfo(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    let type = 'general';
    let relevance = 'high'; // Regulatory news is typically high priority
    let regulatoryAgencies = [];
    let compliance = false;
    let companies = [];
    let severity = 'medium';
    
    // Detect FDA actions
    if (text.includes('fda') || text.includes('food and drug administration')) {
      regulatoryAgencies.push('FDA');
      relevance = 'high';
    }
    
    // Detect warning letters - HIGHEST PRIORITY
    if (text.includes('warning letter') || text.includes('warning letters')) {
      type = 'warning_letter';
      compliance = true;
      relevance = 'high';
      severity = 'high';
    }
    
    // Detect enforcement actions and violations
    if (text.includes('violation') || text.includes('violations') || text.includes('non-compliance') || text.includes('noncompliance')) {
      type = 'compliance_violation';
      compliance = true;
      relevance = 'high';
      severity = 'high';
    }
    
    // Detect recalls - CRITICAL
    if (text.includes('recall') || text.includes('recalls') || text.includes('withdrawn') || text.includes('withdrawal')) {
      type = 'drug_recall';
      relevance = 'high';
      severity = 'critical';
    }
    
    // Detect safety alerts
    if (text.includes('safety alert') || text.includes('safety concern') || text.includes('adverse event')) {
      type = 'safety_alert';
      relevance = 'high';
      severity = 'high';
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
    if (text.includes('enforcement') || text.includes('suspension') || text.includes('injunction') || text.includes('consent decree')) {
      type = 'enforcement_action';
      relevance = 'high';
      severity = 'high';
    }
    
    // Detect clinical hold or trial suspension
    if (text.includes('clinical hold') || text.includes('trial suspended') || text.includes('study suspended')) {
      type = 'clinical_hold';
      relevance = 'high';
      severity = 'high';
    }
    
    // Detect inspection findings
    if (text.includes('inspection') || text.includes('form 483') || text.includes('observations')) {
      type = 'inspection_findings';
      compliance = true;
      relevance = 'high';
    }
    
    // Extract company names (enhanced list)
    const companyPatterns = [
      'pfizer', 'moderna', 'johnson & johnson', 'j&j', 'merck', 'novartis', 'roche', 'genentech',
      'bristol myers squibb', 'bms', 'abbvie', 'gilead', 'amgen', 'biogen', 'regeneron',
      'eli lilly', 'lilly', 'glaxosmithkline', 'gsk', 'astrazeneca', 'sanofi', 'takeda',
      'celgene', 'vertex', 'alexion', 'incyte', 'illumina', 'danaher'
    ];
    companies = companyPatterns.filter(company => text.includes(company));
    
    return {
      type,
      relevance,
      regulatoryAgencies,
      compliance,
      companies,
      severity
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

  extractValue(value) {
    if (!value) return '';
    
    // Handle objects that might contain text values
    if (typeof value === 'object' && value !== null) {
      if (value['#text']) {
        return String(value['#text']);
      } else if (value._) {
        return String(value._);
      } else if (Array.isArray(value)) {
        return value.length > 0 ? String(value[0]) : '';
      } else {
        return String(value);
      }
    }
    
    return String(value);
  }

  cleanText(text) {
    if (!text) return '';
    
    // Ensure text is a string
    let textStr = this.extractValue(text);
    
    // Remove HTML tags
    let cleaned = textStr.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&#39;/g, "'");
    cleaned = cleaned.replace(/&#038;/g, '&');
    
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
            },
            {
              title: 'Pfizer Receives FDA Warning Letter Over Manufacturing Violations',
              description: 'FDA issues warning letter to Pfizer facility citing multiple manufacturing violations and compliance issues.',
              link: '#',
              pubDate: new Date(Date.now() - 1800000).toISOString(),
              author: 'Regulatory News',
              category: 'pharmaceutical',
              extractedInfo: { type: 'warning_letter', relevance: 'high', companies: ['pfizer'], severity: 'high', compliance: true },
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
            },
            {
              title: 'Moderna COVID-19 Trial Terminated Due to Safety Concerns',
              description: 'Moderna announces early termination of Phase 2 COVID-19 vaccine trial following adverse events in multiple participants.',
              link: '#',
              pubDate: new Date(Date.now() - 900000).toISOString(),
              author: 'BioCentury',
              category: 'clinicalTrials',
              extractedInfo: { type: 'trial_terminated', relevance: 'high', phases: ['phase_2'], companies: ['moderna'], trialStatus: 'terminated', severity: 'high' },
              relevance: 'high'
            },
            {
              title: 'Johnson & Johnson Alzheimer Drug Trial Fails to Meet Primary Endpoint',
              description: 'J&J discontinues Phase 3 Alzheimer trial after drug failed to show statistically significant improvement over placebo.',
              link: '#',
              pubDate: new Date(Date.now() - 1800000).toISOString(),
              author: 'FierceBiotech',
              category: 'clinicalTrials',
              extractedInfo: { type: 'trial_failed', relevance: 'high', phases: ['phase_3'], companies: ['johnson & johnson'], trialStatus: 'failed', severity: 'high' },
              relevance: 'high'
            }
          ]
        }
      ],
      regulatory: [
        {
          source: 'FDA Warning Letters',
          category: 'regulatory',
          description: 'FDA Warning Letters and enforcement actions',
          lastUpdated: new Date().toISOString(),
          items: [
            {
              title: 'FDA Issues Warning Letter to Novartis Over Data Integrity Violations',
              description: 'FDA cites Novartis manufacturing facility for significant data integrity violations and inadequate quality control systems.',
              link: '#',
              pubDate: new Date().toISOString(),
              author: 'FDA',
              category: 'regulatory',
              extractedInfo: { type: 'warning_letter', relevance: 'high', regulatoryAgencies: ['FDA'], compliance: true, companies: ['novartis'], severity: 'high' },
              relevance: 'high'
            },
            {
              title: 'FDA Initiates Drug Recall for Contaminated Blood Pressure Medication',
              description: 'FDA announces Class I recall of blood pressure medication due to contamination with carcinogenic substances.',
              link: '#',
              pubDate: new Date(Date.now() - 600000).toISOString(),
              author: 'FDA',
              category: 'regulatory',
              extractedInfo: { type: 'drug_recall', relevance: 'high', regulatoryAgencies: ['FDA'], severity: 'critical' },
              relevance: 'high'
            },
            {
              title: 'FDA Suspends Clinical Trial After Serious Adverse Events',
              description: 'FDA places clinical hold on Phase 2 oncology trial following reports of serious adverse events in multiple patients.',
              link: '#',
              pubDate: new Date(Date.now() - 1200000).toISOString(),
              author: 'FDA',
              category: 'regulatory',
              extractedInfo: { type: 'clinical_hold', relevance: 'high', regulatoryAgencies: ['FDA'], severity: 'high' },
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