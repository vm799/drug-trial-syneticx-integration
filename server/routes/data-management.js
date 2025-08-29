// server/routes/data-management.js - Data Management API Routes

import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { query, validationResult } from 'express-validator'
import DataSourceManager from '../services/dataSourceManager.js'
import KnowledgeGraphBuilder from '../services/knowledgeGraphBuilder.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Initialize services
const dataSourceManager = new DataSourceManager()
const knowledgeGraphBuilder = new KnowledgeGraphBuilder(dataSourceManager)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.json', '.xlsx']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${ext} not allowed. Supported types: ${allowedTypes.join(', ')}`))
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
})

// ===== DATA SOURCE MANAGEMENT =====

// @route   POST /api/data-management/sources
// @desc    Register a new data source
// @access  Public (Development) / Private (Production)
router.post('/sources', [
  query('id').notEmpty().withMessage('Data source ID is required'),
  query('name').notEmpty().withMessage('Data source name is required'),
  query('type').isIn(['api', 'file', 'scraper', 'database']).withMessage('Invalid data source type'),
  query('dataType').notEmpty().withMessage('Data type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { id, name, type, dataType, url, apiKey, refreshInterval, schema, transformations } = req.body

    const sourceConfig = {
      id,
      name,
      type,
      dataType,
      url,
      apiKey,
      refreshInterval: refreshInterval ? parseInt(refreshInterval) : 3600000,
      schema,
      transformations
    }

    const dataSource = await dataSourceManager.registerDataSource(id, sourceConfig)

    res.json({
      success: true,
      message: 'Data source registered successfully',
      data: dataSource
    })

  } catch (error) {
    logger.error('Failed to register data source:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to register data source',
      error: error.message
    })
  }
})

// @route   GET /api/data-management/sources
// @desc    Get all data sources with status
// @access  Public
router.get('/sources', async (req, res) => {
  try {
    const sources = await dataSourceManager.getAllDataSources()
    
    res.json({
      success: true,
      data: sources
    })

  } catch (error) {
    logger.error('Failed to get data sources:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get data sources',
      error: error.message
    })
  }
})

// @route   GET /api/data-management/sources/:id
// @desc    Get specific data source status
// @access  Public
router.get('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params
    const source = await dataSourceManager.getDataSourceStatus(id)
    
    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Data source not found'
      })
    }

    res.json({
      success: true,
      data: source
    })

  } catch (error) {
    logger.error('Failed to get data source status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get data source status',
      error: error.message
    })
  }
})

// @route   POST /api/data-management/sources/:id/refresh
// @desc    Manually refresh a data source
// @access  Public
router.post('/sources/:id/refresh', async (req, res) => {
  try {
    const { id } = req.params
    const data = await dataSourceManager.refreshDataSource(id)
    
    res.json({
      success: true,
      message: 'Data source refreshed successfully',
      data: {
        recordCount: data.length,
        refreshedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('Failed to refresh data source:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to refresh data source',
      error: error.message
    })
  }
})

// ===== FILE UPLOAD PROCESSING =====

// @route   POST /api/data-management/upload
// @desc    Upload and process data files
// @access  Public
router.post('/upload', upload.single('dataFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const { sourceId, sourceName, dataType, schema, transformations } = req.body

    if (!sourceId || !sourceName || !dataType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sourceId, sourceName, dataType'
      })
    }

    // Parse schema and transformations if provided
    let parsedSchema = null
    let parsedTransformations = null

    try {
      if (schema) parsedSchema = JSON.parse(schema)
      if (transformations) parsedTransformations = JSON.parse(transformations)
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in schema or transformations'
      })
    }

    const sourceConfig = {
      id: sourceId,
      name: sourceName,
      type: 'file',
      dataType,
      schema: parsedSchema,
      transformations: parsedTransformations
    }

    // Process the uploaded file
    const result = await dataSourceManager.processFileUpload(req.file.path, sourceConfig)

    // Clean up uploaded file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      message: 'File processed successfully',
      data: {
        sourceId: result.dataId,
        recordCount: result.recordCount,
        processedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('File upload processing failed:', error)
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path)
      } catch (cleanupError) {
        logger.error('Failed to cleanup uploaded file:', cleanupError)
      }
    }

    res.status(500).json({
      success: false,
      message: 'File processing failed',
      error: error.message
    })
  }
})

// @route   GET /api/data-management/upload-templates
// @desc    Get upload templates for different data types
// @access  Public
router.get('/upload-templates', async (req, res) => {
  try {
    const templates = {
      patents: {
        description: 'Patent data including patent numbers, titles, assignees, inventors, and drug information',
        requiredFields: ['patentNumber', 'title', 'assignee'],
        optionalFields: ['abstract', 'filingDate', 'grantDate', 'expiryDate', 'status', 'inventors', 'drugInfo'],
        sampleData: [
          {
            patentNumber: 'US12345678',
            title: 'Novel Therapeutic Compound for Cancer Treatment',
            assignee: 'PharmaCorp Inc.',
            abstract: 'A novel compound...',
            filingDate: '2020-01-15',
            inventors: ['John Doe', 'Jane Smith'],
            drugInfo: { drugName: 'CancerDrug-123', therapeuticArea: 'Oncology' }
          }
        ]
      },
      clinical_trials: {
        description: 'Clinical trial data including trial IDs, titles, phases, sponsors, and interventions',
        requiredFields: ['nctId', 'title', 'sponsor'],
        optionalFields: ['phase', 'status', 'startDate', 'completionDate', 'enrollment', 'interventionName', 'interventionType'],
        sampleData: [
          {
            nctId: 'NCT12345678',
            title: 'Phase II Study of Novel Drug in Advanced Cancer',
            sponsor: 'PharmaCorp Inc.',
            phase: 'II',
            status: 'Recruiting',
            interventionName: 'Novel Drug',
            interventionType: 'Drug'
          }
        ]
      },
      financial: {
        description: 'Financial data including company information, market metrics, and performance indicators',
        requiredFields: ['companyName', 'symbol'],
        optionalFields: ['marketCap', 'revenue', 'profitMargin', 'currentPrice', 'volume'],
        sampleData: [
          {
            companyName: 'PharmaCorp Inc.',
            symbol: 'PHAR',
            marketCap: 5000000000,
            revenue: 1000000000,
            profitMargin: 0.15,
            currentPrice: 50.00
          }
        ]
      },
      competitive_intelligence: {
        description: 'Competitive intelligence data including company analysis and threat assessments',
        requiredFields: ['companyInfo.name', 'threatScore'],
        optionalFields: ['overallThreat', 'marketPosition', 'strengths', 'weaknesses', 'opportunities', 'threats'],
        sampleData: [
          {
            companyInfo: { name: 'CompetitorCorp', ticker: 'COMP' },
            threatScore: 8.5,
            overallThreat: 'High',
            marketPosition: 'Market Leader',
            strengths: ['Strong R&D pipeline', 'Global presence'],
            weaknesses: ['High debt levels']
          }
        ]
      }
    }

    res.json({
      success: true,
      data: templates
    })

  } catch (error) {
    logger.error('Failed to get upload templates:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get upload templates',
      error: error.message
    })
  }
})

// ===== KNOWLEDGE GRAPH OPERATIONS =====

// @route   POST /api/data-management/knowledge-graphs
// @desc    Build a new knowledge graph from data sources
// @access  Public
router.post('/knowledge-graphs', [
  query('name').notEmpty().withMessage('Knowledge graph name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { name, sourceIds, options } = req.body

    // Start knowledge graph construction
    const knowledgeGraph = await knowledgeGraphBuilder.buildKnowledgeGraph(sourceIds, {
      name,
      ...options
    })

    res.json({
      success: true,
      message: 'Knowledge graph construction started',
      data: {
        graphId: knowledgeGraph.id,
        status: knowledgeGraph.status,
        sources: knowledgeGraph.sources.length
      }
    })

  } catch (error) {
    logger.error('Failed to start knowledge graph construction:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to start knowledge graph construction',
      error: error.message
    })
  }
})

// @route   GET /api/data-management/knowledge-graphs
// @desc    Get all knowledge graphs
// @access  Public
router.get('/knowledge-graphs', async (req, res) => {
  try {
    const graphs = await knowledgeGraphBuilder.getAllKnowledgeGraphs()
    
    res.json({
      success: true,
      data: graphs
    })

  } catch (error) {
    logger.error('Failed to get knowledge graphs:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get knowledge graphs',
      error: error.message
    })
  }
})

// @route   GET /api/data-management/knowledge-graphs/:id
// @desc    Get specific knowledge graph
// @access  Public
router.get('/knowledge-graphs/:id', async (req, res) => {
  try {
    const { id } = req.params
    const graph = await knowledgeGraphBuilder.getKnowledgeGraph(id)
    
    if (!graph) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge graph not found'
      })
    }

    res.json({
      success: true,
      data: graph
    })

  } catch (error) {
    logger.error('Failed to get knowledge graph:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get knowledge graph',
      error: error.message
    })
  }
})

// @route   POST /api/data-management/knowledge-graphs/:id/query
// @desc    Query a knowledge graph
// @access  Public
router.post('/knowledge-graphs/:id/query', [
  query('query').notEmpty().withMessage('Query is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { id } = req.params
    const { query } = req.body

    const results = await knowledgeGraphBuilder.queryKnowledgeGraph(id, query)

    res.json({
      success: true,
      data: results
    })

  } catch (error) {
    logger.error('Failed to query knowledge graph:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to query knowledge graph',
      error: error.message
    })
  }
})

// ===== DATA QUALITY MONITORING =====

// @route   GET /api/data-management/quality-report
// @desc    Get comprehensive data quality report
// @access  Public
router.get('/quality-report', async (req, res) => {
  try {
    const sources = await dataSourceManager.getAllDataSources()
    
    const qualityReport = {
      totalSources: sources.length,
      sourcesByType: {},
      sourcesByQuality: {},
      refreshStatus: {
        upToDate: 0,
        needsRefresh: 0,
        overdue: 0,
        error: 0
      },
      recommendations: []
    }

    for (const source of sources) {
      // Count by type
      qualityReport.sourcesByType[source.type] = (qualityReport.sourcesByType[source.type] || 0) + 1
      
      // Count by quality
      qualityReport.sourcesByQuality[source.dataQuality] = (qualityReport.sourcesByQuality[source.dataQuality] || 0) + 1
      
      // Count refresh status
      if (source.dataQuality === 'error') {
        qualityReport.refreshStatus.error++
      } else if (source.qualityMetrics?.refreshOverdue) {
        qualityReport.refreshStatus.overdue++
      } else if (source.qualityMetrics?.needsRefresh) {
        qualityReport.refreshStatus.needsRefresh++
      } else {
        qualityReport.refreshStatus.upToDate++
      }

      // Generate recommendations
      if (source.dataQuality === 'error') {
        qualityReport.recommendations.push({
          sourceId: source.id,
          type: 'error_resolution',
          priority: 'high',
          description: `Resolve error in ${source.name}: ${source.lastError}`
        })
      } else if (source.qualityMetrics?.refreshOverdue) {
        qualityReport.recommendations.push({
          sourceId: source.id,
          type: 'refresh_overdue',
          priority: 'medium',
          description: `Refresh overdue data source: ${source.name}`
        })
      }
    }

    res.json({
      success: true,
      data: qualityReport
    })

  } catch (error) {
    logger.error('Failed to generate quality report:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate quality report',
      error: error.message
    })
  }
})

// ===== SYSTEM STATUS =====

// @route   GET /api/data-management/system-status
// @desc    Get overall system status
// @access  Public
router.get('/system-status', async (req, res) => {
  try {
    const sources = await dataSourceManager.getAllDataSources()
    const graphs = await knowledgeGraphBuilder.getAllKnowledgeGraphs()
    
    const systemStatus = {
      timestamp: new Date().toISOString(),
      dataSources: {
        total: sources.length,
        active: sources.filter(s => s.status === 'active').length,
        error: sources.filter(s => s.status === 'error').length
      },
      knowledgeGraphs: {
        total: graphs.length,
        building: graphs.filter(g => g.status === 'building').length,
        completed: graphs.filter(g => g.status === 'completed').length
      },
      dataQuality: {
        verified: sources.filter(s => s.dataQuality === 'verified').length,
        unknown: sources.filter(s => s.dataQuality === 'unknown').length,
        error: sources.filter(s => s.dataQuality === 'error').length
      }
    }

    res.json({
      success: true,
      data: systemStatus
    })

  } catch (error) {
    logger.error('Failed to get system status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get system status',
      error: error.message
    })
  }
})

export default router