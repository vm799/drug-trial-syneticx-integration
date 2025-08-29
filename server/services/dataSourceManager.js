// server/services/dataSourceManager.js - Comprehensive Data Source Management

import fs from 'fs/promises'
import path from 'path'
import csv from 'csv-parser'
import { createReadStream } from 'fs'
import logger from '../utils/logger.js'
import { EventEmitter } from 'events'

class DataSourceManager extends EventEmitter {
  constructor() {
    super()
    this.dataSources = new Map()
    this.uploadDirectory = path.join(process.cwd(), 'uploads')
    this.dataDirectory = path.join(process.cwd(), 'data')
    this.refreshSchedules = new Map()
    
    this.init()
  }

  async init() {
    try {
      // Ensure directories exist
      await fs.mkdir(this.uploadDirectory, { recursive: true })
      await fs.mkdir(this.dataDirectory, { recursive: true })
      
      // Load existing data sources
      await this.loadDataSources()
      
      // Start refresh schedules
      this.startRefreshSchedules()
      
      logger.info('Data Source Manager initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Data Source Manager:', error)
    }
  }

  // ===== DATA SOURCE REGISTRATION =====
  
  async registerDataSource(sourceId, config) {
    const dataSource = {
      id: sourceId,
      name: config.name,
      type: config.type, // 'api', 'file', 'scraper', 'database'
      url: config.url,
      apiKey: config.apiKey,
      refreshInterval: config.refreshInterval || 3600000, // 1 hour default
      lastRefresh: null,
      nextRefresh: null,
      status: 'active',
      dataQuality: 'unknown',
      recordCount: 0,
      lastError: null,
      config: config
    }

    this.dataSources.set(sourceId, dataSource)
    await this.saveDataSources()
    
    // Schedule refresh
    this.scheduleRefresh(sourceId, dataSource.refreshInterval)
    
    logger.info(`Data source registered: ${sourceId} (${config.name})`)
    return dataSource
  }

  // ===== LIVE DATA FEEDS =====
  
  async refreshLiveDataSource(sourceId) {
    const source = this.dataSources.get(sourceId)
    if (!source || source.type !== 'api') {
      throw new Error(`Invalid API data source: ${sourceId}`)
    }

    try {
      logger.info(`Refreshing live data source: ${sourceId}`)
      
      const response = await fetch(source.url, {
        headers: source.apiKey ? { 'Authorization': `Bearer ${source.apiKey}` } : {}
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      
      // Process and store data
      const processedData = await this.processLiveData(sourceId, data)
      
      // Update source status
      source.lastRefresh = new Date()
      source.nextRefresh = new Date(Date.now() + source.refreshInterval)
      source.dataQuality = 'verified'
      source.recordCount = processedData.length
      source.lastError = null
      
      await this.saveDataSources()
      
      // Emit refresh event
      this.emit('dataRefreshed', { sourceId, recordCount: processedData.length })
      
      logger.info(`Live data source refreshed: ${sourceId} - ${processedData.length} records`)
      return processedData
      
    } catch (error) {
      logger.error(`Failed to refresh live data source ${sourceId}:`, error)
      
      // Update error status
      source.lastError = error.message
      source.dataQuality = 'error'
      await this.saveDataSources()
      
      throw error
    }
  }

  // ===== FILE UPLOAD PROCESSING =====
  
  async processFileUpload(filePath, sourceConfig) {
    try {
      logger.info(`Processing file upload: ${filePath}`)
      
      const fileExtension = path.extname(filePath).toLowerCase()
      let data = []

      switch (fileExtension) {
        case '.csv':
          data = await this.parseCSVFile(filePath)
          break
        case '.json':
          data = await this.parseJSONFile(filePath)
          break
        case '.xlsx':
          data = await this.parseExcelFile(filePath)
          break
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`)
      }

      // Process and validate data
      const processedData = await this.processUploadedData(data, sourceConfig)
      
      // Store processed data
      const dataId = await this.storeProcessedData(processedData, sourceConfig)
      
      // Register as data source if not already
      if (!this.dataSources.has(sourceConfig.id)) {
        await this.registerDataSource(sourceConfig.id, {
          ...sourceConfig,
          type: 'file',
          lastRefresh: new Date(),
          recordCount: processedData.length
        })
      }

      logger.info(`File processed successfully: ${filePath} - ${processedData.length} records`)
      return { dataId, recordCount: processedData.length }
      
    } catch (error) {
      logger.error(`Failed to process file upload ${filePath}:`, error)
      throw error
    }
  }

  async parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = []
      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject)
    })
  }

  async parseJSONFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content)
  }

  async parseExcelFile(filePath) {
    // TODO: Implement Excel parsing with xlsx library
    throw new Error('Excel parsing not yet implemented')
  }

  // ===== DATA PROCESSING & VALIDATION =====
  
  async processLiveData(sourceId, rawData) {
    const source = this.dataSources.get(sourceId)
    
    // Apply source-specific processing
    switch (source.config.dataType) {
      case 'patents':
        return this.processPatentData(rawData)
      case 'clinical_trials':
        return this.processClinicalTrialData(rawData)
      case 'financial':
        return this.processFinancialData(rawData)
      case 'competitive_intelligence':
        return this.processCompetitiveIntelligenceData(rawData)
      default:
        return rawData
    }
  }

  async processUploadedData(data, sourceConfig) {
    // Validate data structure
    const validatedData = this.validateDataStructure(data, sourceConfig.schema)
    
    // Apply transformations
    const transformedData = this.applyDataTransformations(validatedData, sourceConfig.transformations)
    
    // Enrich with metadata
    const enrichedData = this.enrichDataWithMetadata(transformedData, sourceConfig)
    
    return enrichedData
  }

  validateDataStructure(data, schema) {
    if (!schema) return data
    
    const validated = []
    for (const record of data) {
      const validRecord = {}
      let isValid = true
      
      for (const [field, config] of Object.entries(schema)) {
        if (config.required && !record[field]) {
          isValid = false
          break
        }
        
        if (record[field] !== undefined) {
          // Type validation
          if (config.type === 'date' && !this.isValidDate(record[field])) {
            isValid = false
            break
          }
          
          if (config.type === 'number' && isNaN(Number(record[field]))) {
            isValid = false
            break
          }
          
          validRecord[field] = record[field]
        }
      }
      
      if (isValid) {
        validated.push(validRecord)
      }
    }
    
    return validated
  }

  applyDataTransformations(data, transformations) {
    if (!transformations) return data
    
    return data.map(record => {
      const transformed = { ...record }
      
      for (const [field, transform] of Object.entries(transformations)) {
        if (transform.type === 'rename' && record[transform.from]) {
          transformed[field] = record[transform.from]
          delete transformed[transform.from]
        }
        
        if (transform.type === 'format' && record[field]) {
          transformed[field] = this.formatField(record[field], transform.format)
        }
        
        if (transform.type === 'calculate' && transform.formula) {
          transformed[field] = this.calculateField(record, transform.formula)
        }
      }
      
      return transformed
    })
  }

  enrichDataWithMetadata(data, sourceConfig) {
    return data.map(record => ({
      ...record,
      _metadata: {
        source: sourceConfig.id,
        uploadedAt: new Date().toISOString(),
        dataQuality: 'verified',
        lastUpdated: new Date().toISOString(),
        recordId: this.generateRecordId(record, sourceConfig)
      }
    }))
  }

  // ===== DATA STORAGE =====
  
  async storeProcessedData(data, sourceConfig) {
    const dataId = `${sourceConfig.id}_${Date.now()}`
    const dataPath = path.join(this.dataDirectory, `${dataId}.json`)
    
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2))
    
    // Store metadata
    const metadata = {
      id: dataId,
      sourceId: sourceConfig.id,
      recordCount: data.length,
      storedAt: new Date().toISOString(),
      filePath: dataPath,
      schema: sourceConfig.schema
    }
    
    const metadataPath = path.join(this.dataDirectory, `${dataId}_metadata.json`)
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    
    return dataId
  }

  async loadProcessedData(dataId) {
    const dataPath = path.join(this.dataDirectory, `${dataId}.json`)
    const content = await fs.readFile(dataPath, 'utf8')
    return JSON.parse(content)
  }

  // ===== REFRESH SCHEDULING =====
  
  scheduleRefresh(sourceId, interval) {
    if (this.refreshSchedules.has(sourceId)) {
      clearTimeout(this.refreshSchedules.get(sourceId))
    }
    
    const timeoutId = setTimeout(async () => {
      try {
        await this.refreshLiveDataSource(sourceId)
        // Schedule next refresh
        this.scheduleRefresh(sourceId, interval)
      } catch (error) {
        logger.error(`Scheduled refresh failed for ${sourceId}:`, error)
        // Retry with exponential backoff
        setTimeout(() => this.scheduleRefresh(sourceId, interval), interval * 2)
      }
    }, interval)
    
    this.refreshSchedules.set(sourceId, timeoutId)
  }

  startRefreshSchedules() {
    for (const [sourceId, source] of this.dataSources) {
      if (source.type === 'api' && source.status === 'active') {
        this.scheduleRefresh(sourceId, source.refreshInterval)
      }
    }
  }

  // ===== DATA QUALITY MONITORING =====
  
  async checkDataQuality(sourceId) {
    const source = this.dataSources.get(sourceId)
    if (!source) return null
    
    const qualityMetrics = {
      sourceId,
      lastRefresh: source.lastRefresh,
      recordCount: source.recordCount,
      dataQuality: source.dataQuality,
      lastError: source.lastError,
      refreshOverdue: source.nextRefresh && new Date() > source.nextRefresh,
      needsRefresh: this.needsRefresh(source)
    }
    
    return qualityMetrics
  }

  needsRefresh(source) {
    if (!source.lastRefresh) return true
    if (source.nextRefresh && new Date() > source.nextRefresh) return true
    return false
  }

  // ===== UTILITY METHODS =====
  
  isValidDate(value) {
    const date = new Date(value)
    return date instanceof Date && !isNaN(date)
  }

  formatField(value, format) {
    switch (format) {
      case 'uppercase':
        return String(value).toUpperCase()
      case 'lowercase':
        return String(value).toLowerCase()
      case 'date':
        return new Date(value).toISOString()
      default:
        return value
    }
  }

  calculateField(record, formula) {
    // Simple formula evaluation (in production, use a proper expression parser)
    try {
      return eval(formula.replace(/\{(\w+)\}/g, 'record.$1'))
    } catch (error) {
      logger.warn(`Failed to calculate field with formula ${formula}:`, error)
      return null
    }
  }

  generateRecordId(record, sourceConfig) {
    if (sourceConfig.primaryKey) {
      return `${sourceConfig.id}_${record[sourceConfig.primaryKey]}`
    }
    return `${sourceConfig.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ===== PERSISTENCE =====
  
  async saveDataSources() {
    const dataPath = path.join(this.dataDirectory, 'data_sources.json')
    const data = Array.from(this.dataSources.values())
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2))
  }

  async loadDataSources() {
    try {
      const dataPath = path.join(this.dataDirectory, 'data_sources.json')
      const content = await fs.readFile(dataPath, 'utf8')
      const sources = JSON.parse(content)
      
      for (const source of sources) {
        this.dataSources.set(source.id, source)
      }
      
      logger.info(`Loaded ${sources.length} data sources`)
    } catch (error) {
      logger.info('No existing data sources found, starting fresh')
    }
  }

  // ===== PUBLIC API =====
  
  async getDataSourceStatus(sourceId) {
    const source = this.dataSources.get(sourceId)
    if (!source) return null
    
    return {
      ...source,
      qualityMetrics: await this.checkDataQuality(sourceId)
    }
  }

  async getAllDataSources() {
    const sources = []
    for (const [id, source] of this.dataSources) {
      sources.push({
        ...source,
        qualityMetrics: await this.checkDataQuality(id)
      })
    }
    return sources
  }

  async refreshDataSource(sourceId) {
    const source = this.dataSources.get(sourceId)
    if (!source) {
      throw new Error(`Data source not found: ${sourceId}`)
    }
    
    if (source.type === 'api') {
      return await this.refreshLiveDataSource(sourceId)
    } else if (source.type === 'file') {
      // Re-process the last uploaded file
      return await this.reprocessFileSource(sourceId)
    }
    
    throw new Error(`Unsupported data source type: ${source.type}`)
  }

  async reprocessFileSource(sourceId) {
    // Implementation for reprocessing file-based data sources
    logger.info(`Reprocessing file source: ${sourceId}`)
    // TODO: Implement file reprocessing logic
  }
}

export default DataSourceManager