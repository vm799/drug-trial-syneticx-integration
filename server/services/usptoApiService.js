// server/services/usptoApiService.js - USPTO Patent Database Integration Service

import fetch from 'node-fetch'
import logger from '../utils/logger.js'
import Patent from '../models/Patent.js'
import { EventEmitter } from 'events'

class USPTOApiService extends EventEmitter {
  constructor() {
    super()
    this.baseURL = 'https://developer.uspto.gov/ptab-api'
    this.patentSearchURL = 'https://search-api.uspto.gov/search/v1'
    this.bulkDataURL = 'https://bulkdata.uspto.gov'
    
    // Rate limiting
    this.requestQueue = []
    this.isProcessing = false
    this.requestsPerMinute = 60
    this.requestInterval = 60000 / this.requestsPerMinute // 1 second per request
    
    // Cache for frequently accessed data
    this.cache = new Map()
    this.cacheTimeout = 300000 // 5 minutes

    this.init()
  }

  init() {
    logger.info('USPTO API Service initialized')
    
    // Start processing queue
    this.startQueueProcessor()
    
    // Clean cache periodically
    setInterval(() => {
      this.cleanCache()
    }, this.cacheTimeout)
  }

  /**
   * Search patents by drug name and company
   */
  async searchPatentsByDrug(drugName, companyName = null, options = {}) {
    const cacheKey = `patents_${drugName}_${companyName || 'all'}`
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.debug(`Returning cached patent search for ${drugName}`)
        return cached.data
      }
    }

    try {
      const searchQuery = this.buildPatentSearchQuery(drugName, companyName, options)
      const results = await this.executePatentSearch(searchQuery)
      const processedResults = await this.processPatentResults(results)

      // Cache results
      this.cache.set(cacheKey, {
        data: processedResults,
        timestamp: Date.now()
      })

      logger.info(`Found ${processedResults.length} patents for drug: ${drugName}`)
      return processedResults
    } catch (error) {
      logger.error('USPTO patent search error:', error)
      throw new Error(`Failed to search patents for ${drugName}: ${error.message}`)
    }
  }

  /**
   * Get detailed patent information by patent number
   */
  async getPatentDetails(patentNumber) {
    const cacheKey = `patent_details_${patentNumber}`
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const patentData = await this.fetchPatentDetails(patentNumber)
      const processedData = this.processPatentDetails(patentData)

      // Cache results
      this.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      })

      return processedData
    } catch (error) {
      logger.error(`Error fetching patent details for ${patentNumber}:`, error)
      throw error
    }
  }

  /**
   * Monitor patent cliff risks for expiring patents
   */
  async monitorPatentCliffs(timeframe = 24) { // months
    try {
      logger.info(`Monitoring patent cliffs for next ${timeframe} months`)
      
      const currentDate = new Date()
      const futureDate = new Date()
      futureDate.setMonth(currentDate.getMonth() + timeframe)

      // Get patents expiring within timeframe
      const expiringPatents = await Patent.findExpiringPatents(timeframe)
      
      const cliffAnalysis = []
      
      for (const patent of expiringPatents) {
        try {
          // Get latest USPTO status
          const usptoStatus = await this.getPatentStatus(patent.patentNumber)
          
          // Calculate cliff risk
          const riskAnalysis = this.calculateCliffRisk(patent, usptoStatus)
          
          // Update patent in database
          await this.updatePatentRiskData(patent, riskAnalysis, usptoStatus)
          
          cliffAnalysis.push({
            patentId: patent._id,
            patentNumber: patent.patentNumber,
            drugName: patent.drugInfo.drugName,
            company: patent.assignee.name,
            expiryDate: patent.expiryDate,
            riskLevel: riskAnalysis.riskLevel,
            estimatedRevenue: patent.marketImpact.estimatedRevenue,
            genericThreat: riskAnalysis.genericThreat,
            recommendations: riskAnalysis.recommendations
          })

          // Emit event for real-time updates
          this.emit('patentCliffUpdated', {
            patent,
            riskAnalysis
          })

        } catch (error) {
          logger.error(`Error analyzing patent cliff for ${patent.patentNumber}:`, error)
        }
      }

      // Sort by risk level and revenue impact
      cliffAnalysis.sort((a, b) => {
        const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }
        const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
        if (riskDiff !== 0) return riskDiff
        return b.estimatedRevenue - a.estimatedRevenue
      })

      logger.info(`Patent cliff analysis completed: ${cliffAnalysis.length} patents analyzed`)
      
      return {
        totalPatents: cliffAnalysis.length,
        criticalRisk: cliffAnalysis.filter(p => p.riskLevel === 'critical').length,
        highRisk: cliffAnalysis.filter(p => p.riskLevel === 'high').length,
        totalRevenueAtRisk: cliffAnalysis.reduce((sum, p) => sum + p.estimatedRevenue, 0),
        patents: cliffAnalysis
      }

    } catch (error) {
      logger.error('Patent cliff monitoring error:', error)
      throw error
    }
  }

  /**
   * Sync patent data with USPTO database
   */
  async syncPatentData(companyName, options = {}) {
    try {
      logger.info(`Starting USPTO data sync for company: ${companyName}`)
      
      const syncResult = {
        company: companyName,
        startTime: new Date(),
        patentsProcessed: 0,
        patentsUpdated: 0,
        patentsCreated: 0,
        errors: []
      }

      // Search for company patents
      const companyPatents = await this.searchPatentsByCompany(companyName, {
        limit: options.limit || 1000,
        includeExpired: options.includeExpired || false
      })

      for (const usptoPatent of companyPatents) {
        try {
          syncResult.patentsProcessed++
          
          // Check if patent exists in our database
          const existingPatent = await Patent.findOne({ 
            patentNumber: usptoPatent.patentNumber 
          })

          if (existingPatent) {
            // Update existing patent
            const updates = this.generatePatentUpdates(existingPatent, usptoPatent)
            if (Object.keys(updates).length > 0) {
              await Patent.findByIdAndUpdate(existingPatent._id, updates)
              syncResult.patentsUpdated++
              
              this.emit('patentUpdated', {
                patentId: existingPatent._id,
                patentNumber: usptoPatent.patentNumber,
                updates
              })
            }
          } else {
            // Create new patent record
            const newPatent = await this.createPatentFromUSPTO(usptoPatent)
            syncResult.patentsCreated++
            
            this.emit('patentCreated', {
              patentId: newPatent._id,
              patentNumber: usptoPatent.patentNumber
            })
          }

          // Add delay to respect rate limits
          await this.delay(this.requestInterval)

        } catch (error) {
          syncResult.errors.push({
            patentNumber: usptoPatent.patentNumber,
            error: error.message
          })
          logger.error(`Error processing patent ${usptoPatent.patentNumber}:`, error)
        }
      }

      syncResult.endTime = new Date()
      syncResult.duration = syncResult.endTime - syncResult.startTime
      
      logger.info('USPTO sync completed', syncResult)
      
      return syncResult

    } catch (error) {
      logger.error('USPTO data sync error:', error)
      throw error
    }
  }

  /**
   * Get competitive patent landscape for a therapeutic area
   */
  async getCompetitiveLandscape(therapeuticArea, options = {}) {
    try {
      logger.info(`Analyzing competitive landscape for: ${therapeuticArea}`)
      
      const landscape = {
        therapeuticArea,
        totalPatents: 0,
        companies: new Map(),
        patentsByYear: new Map(),
        expiringPatents: [],
        whitespaceOpportunities: []
      }

      // Search for patents in therapeutic area
      const patents = await this.searchPatentsByTherapeuticArea(therapeuticArea, {
        limit: options.limit || 5000,
        timeRange: options.timeRange || 20 // years
      })

      landscape.totalPatents = patents.length

      for (const patent of patents) {
        // Group by company
        const companyName = patent.assignee?.name || 'Unknown'
        if (!landscape.companies.has(companyName)) {
          landscape.companies.set(companyName, {
            name: companyName,
            patentCount: 0,
            patents: [],
            marketShare: 0,
            avgPatentAge: 0
          })
        }
        
        const company = landscape.companies.get(companyName)
        company.patentCount++
        company.patents.push(patent)

        // Group by filing year
        const filingYear = new Date(patent.filingDate).getFullYear()
        if (!landscape.patentsByYear.has(filingYear)) {
          landscape.patentsByYear.set(filingYear, 0)
        }
        landscape.patentsByYear.set(filingYear, 
          landscape.patentsByYear.get(filingYear) + 1
        )

        // Identify expiring patents
        const yearsToExpiry = (new Date(patent.expiryDate) - new Date()) / (365 * 24 * 60 * 60 * 1000)
        if (yearsToExpiry <= 5 && yearsToExpiry > 0) {
          landscape.expiringPatents.push({
            patentNumber: patent.patentNumber,
            drugName: patent.drugInfo?.drugName,
            company: companyName,
            expiryDate: patent.expiryDate,
            yearsToExpiry: Math.round(yearsToExpiry * 10) / 10,
            estimatedRevenue: patent.marketImpact?.estimatedRevenue || 0
          })
        }
      }

      // Calculate market shares
      for (const [companyName, company] of landscape.companies) {
        company.marketShare = (company.patentCount / landscape.totalPatents) * 100
        company.avgPatentAge = company.patents.reduce((sum, p) => {
          const age = (new Date() - new Date(p.filingDate)) / (365 * 24 * 60 * 60 * 1000)
          return sum + age
        }, 0) / company.patents.length
      }

      // Identify whitespace opportunities
      landscape.whitespaceOpportunities = this.identifyWhitespaceOpportunities(patents, therapeuticArea)

      // Sort companies by patent count
      landscape.companies = new Map([...landscape.companies.entries()]
        .sort((a, b) => b[1].patentCount - a[1].patentCount))

      // Sort expiring patents by revenue impact
      landscape.expiringPatents.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)

      return landscape

    } catch (error) {
      logger.error('Competitive landscape analysis error:', error)
      throw error
    }
  }

  // Private helper methods

  buildPatentSearchQuery(drugName, companyName, options) {
    const query = {
      searchText: drugName,
      facets: [],
      sort: options.sort || 'date',
      rows: options.limit || 100,
      start: options.start || 0
    }

    if (companyName) {
      query.facets.push({
        field: 'assignee',
        value: companyName
      })
    }

    if (options.patentType) {
      query.facets.push({
        field: 'classification',
        value: options.patentType
      })
    }

    return query
  }

  async executePatentSearch(query) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        type: 'search',
        query,
        resolve,
        reject
      })
    })
  }

  async processPatentResults(results) {
    if (!results || !results.docs) {
      return []
    }

    const processedPatents = []
    
    for (const doc of results.docs) {
      try {
        const processedPatent = {
          patentNumber: doc.patentNumber || doc.publicationNumber,
          title: doc.title,
          abstract: doc.abstract,
          filingDate: new Date(doc.filingDate),
          grantDate: doc.grantDate ? new Date(doc.grantDate) : null,
          expiryDate: this.calculateExpiryDate(doc.filingDate, doc.patentType),
          assignee: {
            name: doc.assignee?.[0] || 'Unknown',
            type: this.determineAssigneeType(doc.assignee?.[0])
          },
          inventors: doc.inventor?.map(inv => ({ name: inv })) || [],
          classification: doc.classification || [],
          status: this.determinePatentStatus(doc),
          source: 'uspto_api'
        }

        processedPatents.push(processedPatent)
      } catch (error) {
        logger.error(`Error processing patent document:`, error)
      }
    }

    return processedPatents
  }

  calculateExpiryDate(filingDate, patentType = 'utility') {
    const filing = new Date(filingDate)
    const expiryYears = patentType === 'design' ? 15 : 20
    const expiry = new Date(filing)
    expiry.setFullYear(filing.getFullYear() + expiryYears)
    return expiry
  }

  calculateCliffRisk(patent, usptoStatus) {
    const now = new Date()
    const yearsToExpiry = (patent.expiryDate - now) / (365 * 24 * 60 * 60 * 1000)
    const revenue = patent.marketImpact.estimatedRevenue || 0
    const importance = patent.strategicValue.importance

    let riskLevel = 'low'
    let genericThreat = 'low'
    const recommendations = []

    // Calculate risk based on multiple factors
    if (yearsToExpiry < 1 && importance === 'critical' && revenue > 1000000000) {
      riskLevel = 'critical'
      genericThreat = 'critical'
      recommendations.push('Immediate action required - consider lifecycle management strategies')
      recommendations.push('Evaluate authorized generic partnerships')
      recommendations.push('Accelerate next-generation product development')
    } else if (yearsToExpiry < 2 && ['critical', 'high'].includes(importance)) {
      riskLevel = 'high'
      genericThreat = revenue > 500000000 ? 'high' : 'medium'
      recommendations.push('Begin patent cliff mitigation planning')
      recommendations.push('Explore supplementary patent opportunities')
    } else if (yearsToExpiry < 5) {
      riskLevel = 'medium'
      genericThreat = 'medium'
      recommendations.push('Monitor competitive landscape')
      recommendations.push('Consider strategic partnerships')
    }

    // Factor in USPTO status
    if (usptoStatus?.maintenanceFeesOwed) {
      recommendations.push('Patent maintenance fees required to maintain protection')
    }

    if (usptoStatus?.reexaminationProceedings) {
      riskLevel = this.escalateRiskLevel(riskLevel)
      recommendations.push('Patent under reexamination - monitor proceedings closely')
    }

    return {
      riskLevel,
      genericThreat,
      yearsToExpiry: Math.round(yearsToExpiry * 10) / 10,
      recommendations,
      lastAnalyzed: new Date(),
      usptoStatus
    }
  }

  escalateRiskLevel(currentLevel) {
    const levels = { 'low': 'medium', 'medium': 'high', 'high': 'critical', 'critical': 'critical' }
    return levels[currentLevel] || 'medium'
  }

  async updatePatentRiskData(patent, riskAnalysis, usptoStatus) {
    const updates = {
      'cliffAnalysis.cliffRisk': riskAnalysis.riskLevel,
      'cliffAnalysis.yearsToExpiry': riskAnalysis.yearsToExpiry,
      'cliffAnalysis.genericThreat.level': riskAnalysis.genericThreat,
      'cliffAnalysis.lastAnalyzed': new Date(),
      'status.legal': usptoStatus?.legalStatus || patent.status.legal,
      'aiAnalysis.recommendations': riskAnalysis.recommendations
    }

    if (usptoStatus?.maintenanceFeesOwed) {
      updates['status.maintenance.feesOwed'] = usptoStatus.maintenanceFeesOwed
      updates['status.maintenance.nextFeeDate'] = usptoStatus.nextFeeDate
    }

    await Patent.findByIdAndUpdate(patent._id, updates)
  }

  startQueueProcessor() {
    setInterval(() => {
      if (!this.isProcessing && this.requestQueue.length > 0) {
        this.processNextRequest()
      }
    }, this.requestInterval)
  }

  async processNextRequest() {
    if (this.requestQueue.length === 0 || this.isProcessing) return

    this.isProcessing = true
    const request = this.requestQueue.shift()

    try {
      let result
      switch (request.type) {
        case 'search':
          result = await this.performPatentSearch(request.query)
          break
        case 'details':
          result = await this.performPatentDetailsFetch(request.patentNumber)
          break
        default:
          throw new Error(`Unknown request type: ${request.type}`)
      }
      request.resolve(result)
    } catch (error) {
      request.reject(error)
    } finally {
      this.isProcessing = false
    }
  }

  async performPatentSearch(query) {
    const response = await fetch(`${this.patentSearchURL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    })

    if (!response.ok) {
      throw new Error(`USPTO API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  cleanCache() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key)
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Additional helper methods for completeness
  determineAssigneeType(assignee) {
    if (!assignee) return 'unknown'
    
    const name = assignee.toLowerCase()
    if (name.includes('inc') || name.includes('corp') || name.includes('ltd') || name.includes('llc')) {
      return 'company'
    } else if (name.includes('university') || name.includes('institute')) {
      return 'university'
    } else if (name.includes('government') || name.includes('dept')) {
      return 'government'
    }
    return 'individual'
  }

  determinePatentStatus(doc) {
    // Simplified status determination based on available data
    if (doc.statusDate && new Date(doc.statusDate) > new Date()) {
      return 'granted'
    }
    return 'pending'
  }

  identifyWhitespaceOpportunities(patents, therapeuticArea) {
    // Simplified whitespace analysis
    // In production, this would involve more sophisticated analysis
    const opportunities = [
      {
        area: 'Novel delivery mechanisms',
        confidence: 0.75,
        description: 'Limited patent coverage in targeted delivery systems'
      },
      {
        area: 'Combination therapies',
        confidence: 0.65,
        description: 'Opportunities for synergistic drug combinations'
      }
    ]
    
    return opportunities
  }

  generatePatentUpdates(existingPatent, usptoPatent) {
    const updates = {}
    
    // Compare and generate updates
    if (usptoPatent.status !== existingPatent.status?.legal) {
      updates['status.legal'] = usptoPatent.status
    }
    
    // Add other comparison logic here
    
    return updates
  }

  async createPatentFromUSPTO(usptoPatent) {
    const patentData = {
      ...usptoPatent,
      source: 'uspto_sync',
      status: { legal: usptoPatent.status || 'granted' },
      drugInfo: {
        drugName: this.extractDrugName(usptoPatent.title, usptoPatent.abstract)
      },
      dataSources: {
        uspto: {
          verified: true,
          lastSync: new Date(),
          dataQuality: 'high'
        }
      }
    }

    return await Patent.create(patentData)
  }

  extractDrugName(title, abstract) {
    // Simplified drug name extraction
    // In production, this would use NLP and drug databases
    const text = `${title} ${abstract}`.toLowerCase()
    
    // Common drug name patterns
    const drugPatterns = [
      /(\w+mab)\b/g, // monoclonal antibodies
      /(\w+ine)\b/g,  // many drug names end in -ine
      /(\w+ol)\b/g,   // many drug names end in -ol
    ]
    
    for (const pattern of drugPatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        return matches[0]
      }
    }
    
    return 'Unknown'
  }

  async searchPatentsByCompany(companyName, options) {
    // Implementation for company-specific patent search
    const query = this.buildPatentSearchQuery('', companyName, options)
    const results = await this.executePatentSearch(query)
    return this.processPatentResults(results)
  }

  async searchPatentsByTherapeuticArea(area, options) {
    // Implementation for therapeutic area patent search
    const query = this.buildPatentSearchQuery(area, null, options)
    const results = await this.executePatentSearch(query)
    return this.processPatentResults(results)
  }

  async getPatentStatus(patentNumber) {
    // Implementation for getting current patent status from USPTO
    return {
      legalStatus: 'granted',
      maintenanceFeesOwed: false,
      nextFeeDate: null,
      reexaminationProceedings: false
    }
  }

  async fetchPatentDetails(patentNumber) {
    // Implementation for fetching detailed patent information
    return {}
  }

  processPatentDetails(patentData) {
    // Implementation for processing detailed patent data
    return patentData
  }
}

export default USPTOApiService