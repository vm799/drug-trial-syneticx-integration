import express from 'express'
import RSSFeedService from '../services/rssFeedService.js'

const router = express.Router()
const rssService = new RSSFeedService()

// Get all RSS feeds by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params
    const { limit = 20 } = req.query
    
    let feeds = await rssService.getFeedsByCategory(category)
    
    // Check if we have any working feeds
    const hasWorkingFeeds = rssService.hasWorkingFeeds()
    
    // If no working feeds, provide sample data for testing
    if (!hasWorkingFeeds) {
      console.log(`No working RSS feeds found for category ${category}, providing sample data`)
      const sampleData = rssService.getSampleData()
      feeds = sampleData[category] || []
    }
    
    // Limit items per feed if specified
    if (limit) {
      feeds.forEach(feed => {
        if (feed.items) {
          feed.items = feed.items.slice(0, parseInt(limit))
        }
      })
    }
    
    res.json({
      success: true,
      data: feeds,
      metadata: {
        category: category,
        totalFeeds: feeds.length,
        timestamp: new Date().toISOString(),
        source: 'RSS Feed Service',
        usingSampleData: !hasWorkingFeeds
      }
    })
  } catch (error) {
    console.error('RSS feeds error:', error)
    
    // Provide sample data even on error
    const sampleData = rssService.getSampleData()
    const categoryFeeds = sampleData[req.params.category] || []
    
    res.json({
      success: true,
      data: categoryFeeds,
      metadata: {
        category: req.params.category,
        totalFeeds: categoryFeeds.length,
        timestamp: new Date().toISOString(),
        source: 'RSS Feed Service',
        usingSampleData: true,
        error: 'Using sample data due to feed errors'
      }
    })
  }
})

// Get all RSS feeds
router.get('/all', async (req, res) => {
  try {
    const { limit = 20 } = req.query
    
    let allFeeds = await rssService.getAllFeeds()
    
    // Check if we have any working feeds
    const hasWorkingFeeds = rssService.hasWorkingFeeds()
    
    // If no working feeds, provide sample data for testing
    if (!hasWorkingFeeds) {
      console.log('No working RSS feeds found, providing sample data')
      allFeeds = rssService.getSampleData()
    }
    
    // Limit items per feed if specified
    if (limit) {
      Object.keys(allFeeds).forEach(category => {
        allFeeds[category].forEach(feed => {
          if (feed.items) {
            feed.items = feed.items.slice(0, parseInt(limit))
          }
        })
      })
    }
    
    res.json({
      success: true,
      data: allFeeds,
      metadata: {
        totalCategories: Object.keys(allFeeds).length,
        timestamp: new Date().toISOString(),
        source: 'RSS Feed Service',
        usingSampleData: !hasWorkingFeeds
      }
    })
  } catch (error) {
    console.error('All RSS feeds error:', error)
    
    // Provide sample data even on error
    const sampleData = rssService.getSampleData()
    
    res.json({
      success: true,
      data: sampleData,
      metadata: {
        totalCategories: Object.keys(sampleData).length,
        timestamp: new Date().toISOString(),
        source: 'RSS Feed Service',
        usingSampleData: true,
        error: 'Using sample data due to feed errors'
      }
    })
  }
})

// Search RSS feeds
router.get('/search', async (req, res) => {
  try {
    const { query, category, limit = 50 } = req.query
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      })
    }
    
    const searchResults = await rssService.searchFeeds(query, category)
    
    // Limit results if specified
    const limitedResults = limit ? searchResults.slice(0, parseInt(limit)) : searchResults
    
    res.json({
      success: true,
      data: limitedResults,
      metadata: {
        query: query,
        category: category || 'all',
        totalResults: searchResults.length,
        returnedResults: limitedResults.length,
        timestamp: new Date().toISOString(),
        source: 'RSS Feed Service'
      }
    })
  } catch (error) {
    console.error('RSS search error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search RSS feeds',
      details: error.message
    })
  }
})

// Get RSS feed status
router.get('/status', async (req, res) => {
  try {
    const status = rssService.getFeedStatus()
    
    res.json({
      success: true,
      data: status,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'RSS Feed Service'
      }
    })
  } catch (error) {
    console.error('RSS status error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get RSS feed status',
      details: error.message
    })
  }
})

// Refresh RSS feeds manually
router.post('/refresh', async (req, res) => {
  try {
    await rssService.refreshAllFeeds()
    
    res.json({
      success: true,
      message: 'RSS feeds refreshed successfully',
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'RSS Feed Service'
      }
    })
  } catch (error) {
    console.error('RSS refresh error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to refresh RSS feeds',
      details: error.message
    })
  }
})

// Get trending topics from RSS feeds
router.get('/trending', async (req, res) => {
  try {
    const { timeframe = '24h', limit = 10 } = req.query
    
    const allFeeds = await rssService.getAllFeeds()
    const trendingTopics = []
    
    // Analyze all feed items to find trending topics
    const allItems = []
    Object.values(allFeeds).forEach(categoryFeeds => {
      categoryFeeds.forEach(feed => {
        if (feed.items) {
          feed.items.forEach(item => {
            allItems.push({
              ...item,
              feedSource: feed.source,
              feedCategory: feed.category
            })
          })
        }
      })
    })
    
    // Filter by timeframe
    const now = new Date()
    const timeframeMs = timeframe === '24h' ? 24 * 60 * 60 * 1000 : 
                        timeframe === '7d' ? 7 * 24 * 60 * 60 * 1000 : 
                        timeframe === '30d' ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    
    const recentItems = allItems.filter(item => {
      const itemDate = new Date(item.pubDate)
      return (now - itemDate) <= timeframeMs
    })
    
    // Extract keywords and count occurrences
    const keywordCounts = {}
    recentItems.forEach(item => {
      const text = `${item.title} ${item.description}`.toLowerCase()
      const keywords = text.match(/\b\w{4,}\b/g) || []
      
      keywords.forEach(keyword => {
        if (keyword.length > 3 && !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'were', 'their'].includes(keyword)) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1
        }
      })
    })
    
    // Sort by frequency and get top trending
    const sortedKeywords = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, parseInt(limit))
      .map(([keyword, count]) => ({
        keyword,
        count,
        relevance: count > 5 ? 'high' : count > 2 ? 'medium' : 'low'
      }))
    
    res.json({
      success: true,
      data: {
        trendingTopics: sortedKeywords,
        timeframe: timeframe,
        totalItems: recentItems.length,
        analysisDate: now.toISOString()
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'RSS Feed Service'
      }
    })
  } catch (error) {
    console.error('Trending topics error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get trending topics',
      details: error.message
    })
  }
})

// Get company-specific news
router.get('/company/:companyName', async (req, res) => {
  try {
    const { companyName } = req.params
    const { limit = 20 } = req.query
    
    const allFeeds = await rssService.getAllFeeds()
    const companyNews = []
    
    // Search for company-specific news across all feeds
    Object.values(allFeeds).forEach(categoryFeeds => {
      categoryFeeds.forEach(feed => {
        if (feed.items) {
          feed.items.forEach(item => {
            const searchText = `${item.title} ${item.description}`.toLowerCase()
            if (searchText.includes(companyName.toLowerCase())) {
              companyNews.push({
                ...item,
                feedSource: feed.source,
                feedCategory: feed.category
              })
            }
          })
        }
      })
    })
    
    // Sort by date and relevance
    companyNews.sort((a, b) => {
      const relevanceOrder = { high: 3, medium: 2, low: 1 }
      const aRelevance = relevanceOrder[a.relevance] || 1
      const bRelevance = relevanceOrder[b.relevance] || 1
      
      if (aRelevance !== bRelevance) {
        return bRelevance - aRelevance
      }
      
      return new Date(b.pubDate) - new Date(a.pubDate)
    })
    
    // Limit results
    const limitedNews = limit ? companyNews.slice(0, parseInt(limit)) : companyNews
    
    res.json({
      success: true,
      data: {
        company: companyName,
        news: limitedNews,
        totalResults: companyNews.length
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'RSS Feed Service'
      }
    })
  } catch (error) {
    console.error('Company news error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company news',
      details: error.message
    })
  }
})

export default router