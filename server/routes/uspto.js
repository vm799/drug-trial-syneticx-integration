import express from 'express'
import { USPTOApiService } from '../services/usptoApiService.js'

const router = express.Router()
const usptoService = new USPTOApiService()

// Search patents
router.get('/search', async (req, res) => {
  try {
    const { query, type } = req.query
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      })
    }

    const results = await usptoService.searchPatents(query, type)
    res.json(results)
  } catch (error) {
    console.error('USPTO search error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search patents',
      details: error.message
    })
  }
})

// Get patent details
router.get('/patent/:patentId', async (req, res) => {
  try {
    const { patentId } = req.params
    
    if (!patentId) {
      return res.status(400).json({
        success: false,
        error: 'Patent ID is required'
      })
    }

    const results = await usptoService.getPatentDetails(patentId)
    res.json(results)
  } catch (error) {
    console.error('USPTO patent details error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get patent details',
      details: error.message
    })
  }
})

// Get patent cliff data
router.get('/patent-cliff', async (req, res) => {
  try {
    const { company, drug, timeframe } = req.query
    
    // Use the new search method for patent cliff analysis
    const searchQuery = `${company || ''} ${drug || ''} patent`.trim()
    const results = await usptoService.searchPatents(searchQuery, 'patent-cliff')
    
    // Add patent cliff specific processing
    const patentCliffData = {
      ...results,
      analysis: {
        totalPatents: results.data?.patents?.length || 0,
        expiringSoon: results.data?.patents?.filter(p => p.status === 'Active').length || 0,
        riskLevel: 'Medium',
        recommendations: [
          'Monitor patent expiration dates',
          'Assess competitive landscape',
          'Plan for generic competition'
        ]
      }
    }
    
    res.json(patentCliffData)
  } catch (error) {
    console.error('Patent cliff analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to analyze patent cliff',
      details: error.message
    })
  }
})

export default router