import axios from 'axios'
import logger from '../utils/logger.js'

class ClinicalTrialsService {
  constructor() {
    this.baseURL = 'https://clinicaltrials.gov/api/v2'
    this.cache = new Map()
    this.cacheTimeout = 300000 // 5 minutes
  }

  async searchTrials(query, options = {}) {
    try {
      const cacheKey = `trials_${query}_${JSON.stringify(options)}`
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data
        }
      }

      // Build search parameters
      const params = {
        query: query,
        fields: 'NCTId,BriefTitle,OfficialTitle,Phase,Status,LeadSponsorName,LeadSponsorClass,StartDate,CompletionDate,EnrollmentCount,StudyType,InterventionType,InterventionName,OutcomeMeasureDescription,LocationCountry,LocationState,LocationCity',
        format: 'json',
        min_rnk: 1,
        max_rnk: 50
      }

      if (options.phase) params.phase = options.phase
      if (options.status) params.status = options.status
      if (options.country) params.country = options.country

      const response = await axios.get(`${this.baseURL}/studies`, { params })
      
      if (response.data?.studies) {
        const processedTrials = response.data.studies.map(trial => this.processTrialData(trial))
        
        // Cache results
        this.cache.set(cacheKey, {
          data: processedTrials,
          timestamp: Date.now()
        })
        
        return processedTrials
      }
      
      return []
    } catch (error) {
      logger.warn('ClinicalTrials.gov API failed, using mock data:', error.message)
      return this.getMockTrials(query, options)
    }
  }

  async getTrialDetails(nctId) {
    try {
      const response = await axios.get(`${this.baseURL}/studies/${nctId}`)
      
      if (response.data) {
        return this.processTrialData(response.data)
      }
      
      return null
    } catch (error) {
      logger.warn(`Failed to fetch trial ${nctId}:`, error.message)
      return this.getMockTrialDetails(nctId)
    }
  }

  processTrialData(trial) {
    return {
      nctId: trial.nctId || trial.NCTId,
      title: trial.briefTitle || trial.BriefTitle || trial.OfficialTitle,
      phase: trial.phase || trial.Phase || 'Unknown',
      status: trial.status || trial.Status || 'Unknown',
      sponsor: trial.leadSponsorName || trial.LeadSponsorName || 'Unknown',
      sponsorType: trial.leadSponsorClass || trial.LeadSponsorClass || 'Unknown',
      startDate: trial.startDate || trial.StartDate,
      completionDate: trial.completionDate || trial.CompletionDate,
      enrollment: trial.enrollmentCount || trial.EnrollmentCount || 0,
      studyType: trial.studyType || trial.StudyType || 'Unknown',
      interventionType: trial.interventionType || trial.InterventionType || 'Unknown',
      interventionName: trial.interventionName || trial.InterventionName || 'Unknown',
      outcomeMeasures: trial.outcomeMeasureDescription || trial.OutcomeMeasureDescription || [],
      location: {
        country: trial.locationCountry || trial.LocationCountry || 'Unknown',
        state: trial.locationState || trial.LocationState || 'Unknown',
        city: trial.locationCity || trial.LocationCity || 'Unknown'
      },
      source: 'REAL_CLINICALTRIALS_GOV_API',
      dataQuality: 'verified',
      lastUpdated: new Date().toISOString()
    }
  }

  getMockTrials(query, options = {}) {
    const mockTrials = [
      {
        nctId: 'NCT12345678',
        title: `Phase ${options.phase || 'II'} Study of ${query} in Advanced Cancer`,
        phase: options.phase || 'II',
        status: options.status || 'Recruiting',
        sponsor: 'MockPharma Inc.',
        sponsorType: 'Industry',
        startDate: '2024-01-15',
        completionDate: '2026-06-30',
        enrollment: 150,
        studyType: 'Interventional',
        interventionType: 'Drug',
        interventionName: query,
        outcomeMeasures: ['Overall Survival', 'Progression-Free Survival', 'Response Rate'],
        location: { country: 'United States', state: 'California', city: 'Los Angeles' },
        source: 'MOCK_DATA',
        dataQuality: 'demo_only',
        reason: 'ClinicalTrials.gov API failed - using demo data'
      },
      {
        nctId: 'NCT87654321',
        title: `Safety and Efficacy of ${query} in Combination Therapy`,
        phase: options.phase || 'III',
        status: options.status || 'Active, not recruiting',
        sponsor: 'BioResearch Corp.',
        sponsorType: 'Industry',
        startDate: '2023-08-01',
        completionDate: '2025-12-31',
        enrollment: 300,
        studyType: 'Interventional',
        interventionType: 'Drug',
        interventionName: query,
        outcomeMeasures: ['Safety Profile', 'Efficacy Measures', 'Quality of Life'],
        location: { country: 'United States', state: 'New York', city: 'New York' },
        source: 'MOCK_DATA',
        dataQuality: 'demo_only',
        reason: 'ClinicalTrials.gov API failed - using demo data'
      }
    ]
    
    return mockTrials
  }

  getMockTrialDetails(nctId) {
    return {
      nctId,
      title: 'Comprehensive Study of Novel Therapeutic Agent',
      phase: 'II',
      status: 'Recruiting',
      sponsor: 'MockPharma Inc.',
      sponsorType: 'Industry',
      startDate: '2024-01-15',
      completionDate: '2026-06-30',
      enrollment: 150,
      studyType: 'Interventional',
      interventionType: 'Drug',
      interventionName: 'Novel Therapeutic Agent',
      outcomeMeasures: ['Overall Survival', 'Progression-Free Survival', 'Response Rate', 'Safety Profile'],
      location: { country: 'United States', state: 'California', city: 'Los Angeles' },
      source: 'MOCK_DATA',
      dataQuality: 'demo_only',
      reason: 'ClinicalTrials.gov API failed - using demo data',
      lastUpdated: new Date().toISOString()
    }
  }
}

export default ClinicalTrialsService