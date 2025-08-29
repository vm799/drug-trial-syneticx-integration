// server/routes/research-insights.js - Research Insights API Routes

import express from 'express'
import { query, validationResult } from 'express-validator'
import ClinicalTrialsService from '../services/clinicalTrialsService.js'
import FinancialDataService from '../services/financialDataService.js'
import USPTOApiService from '../services/usptoApiService.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Initialize services
const clinicalTrialsService = new ClinicalTrialsService()
const financialService = new FinancialDataService()
const usptoService = new USPTOApiService()

// @route   GET /api/research-insights/comprehensive
// @desc    Get comprehensive research insights combining trials, patents, and financials
// @access  Public (Development) / Private (Production)
router.get('/comprehensive', [
  query('query').notEmpty().withMessage('Research query is required'),
  query('therapeuticArea').optional().isString(),
  query('phase').optional().isIn(['preclinical', 'phase_1', 'phase_2', 'phase_3', 'phase_4']),
  query('status').optional().isIn(['recruiting', 'active', 'completed', 'terminated']),
  query('country').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      })
    }

    const { query: researchQuery, therapeuticArea, phase, status, country } = req.query

    logger.info(`Comprehensive research insights requested for: ${researchQuery}`)

    // Parallel data fetching for performance
    const [trials, patents, financials] = await Promise.allSettled([
      clinicalTrialsService.searchTrials(researchQuery, { phase, status, country }),
      usptoService.searchPatentsByDrug(researchQuery),
      financialService.getCompanyFinancials(researchQuery)
    ])

    // Process results
    const trialsData = trials.status === 'fulfilled' ? trials.value : []
    const patentsData = patents.status === 'fulfilled' ? patents.value : []
    const financialData = financials.status === 'fulfilled' ? financials.value : null

    // Generate insights
    const insights = generateResearchInsights(researchQuery, trialsData, patentsData, financialData)

    // Calculate market opportunity score
    const marketOpportunity = calculateMarketOpportunity(trialsData, patentsData, financialData)

    // Identify competitive landscape
    const competitiveLandscape = analyzeCompetitiveLandscape(trialsData, patentsData)

    const response = {
      success: true,
      data: {
        query: researchQuery,
        insights,
        marketOpportunity,
        competitiveLandscape,
        dataSources: {
          trials: {
            count: trialsData.length,
            source: 'ClinicalTrials.gov',
            lastUpdated: new Date().toISOString()
          },
          patents: {
            count: patentsData.length,
            source: 'USPTO',
            lastUpdated: new Date().toISOString()
          },
          financials: {
            available: !!financialData,
            source: financialData?.source || 'Not available',
            lastUpdated: financialData?.lastUpdated || null
          }
        },
        recommendations: generateRecommendations(insights, marketOpportunity),
        metadata: {
          generatedAt: new Date().toISOString(),
          therapeuticArea,
          phase,
          status,
          country
        }
      }
    }

    logger.info(`Research insights generated for ${researchQuery}: ${trialsData.length} trials, ${patentsData.length} patents`)

    res.json(response)

  } catch (error) {
    logger.error('Research insights error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate research insights'
    })
  }
})

// @route   GET /api/research-insights/trials
// @desc    Get clinical trials insights for a specific query
// @access  Public
router.get('/trials', [
  query('query').notEmpty().withMessage('Query is required'),
  query('phase').optional().isIn(['preclinical', 'phase_1', 'phase_2', 'phase_3', 'phase_4']),
  query('status').optional().isIn(['recruiting', 'active', 'completed', 'terminated'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      })
    }

    const { query: researchQuery, phase, status } = req.query

    const trials = await clinicalTrialsService.searchTrials(researchQuery, { phase, status })
    
    const insights = {
      totalTrials: trials.length,
      phaseDistribution: calculatePhaseDistribution(trials),
      statusDistribution: calculateStatusDistribution(trials),
      geographicDistribution: calculateGeographicDistribution(trials),
      sponsorAnalysis: analyzeSponsors(trials),
      enrollmentAnalysis: analyzeEnrollment(trials)
    }

    res.json({
      success: true,
      data: {
        query: researchQuery,
        trials,
        insights,
        metadata: {
          generatedAt: new Date().toISOString(),
          filters: { phase, status }
        }
      }
    })

  } catch (error) {
    logger.error('Trials insights error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trials insights'
    })
  }
})

// Helper functions
function generateResearchInsights(query, trials, patents, financials) {
  const insights = {
    therapeuticArea: identifyTherapeuticArea(query, trials),
    developmentStage: assessDevelopmentStage(trials),
    patentLandscape: analyzePatentLandscape(patents),
    marketMaturity: assessMarketMaturity(trials, patents),
    regulatoryPath: assessRegulatoryPath(trials),
    investmentProfile: assessInvestmentProfile(financials)
  }

  return insights
}

function calculateMarketOpportunity(trials, patents, financials) {
  const score = {
    total: 0,
    factors: {}
  }

  // Trial-based scoring
  if (trials.length > 0) {
    const phase3Trials = trials.filter(t => t.phase === 'III').length
    const recruitingTrials = trials.filter(t => t.status === 'Recruiting').length
    
    score.factors.trials = {
      phase3Count: phase3Trials,
      recruitingCount: recruitingTrials,
      score: Math.min(phase3Trials * 20 + recruitingTrials * 10, 100)
    }
    score.total += score.factors.trials.score * 0.4
  }

  // Patent-based scoring
  if (patents.length > 0) {
    const recentPatents = patents.filter(p => {
      const patentDate = new Date(p.date || p.filingDate || p.issueDate)
      return patentDate > new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000)
    }).length
    
    score.factors.patents = {
      totalCount: patents.length,
      recentCount: recentPatents,
      score: Math.min(patents.length * 5 + recentPatents * 10, 100)
    }
    score.total += score.factors.patents.score * 0.3
  }

  // Financial-based scoring
  if (financials) {
    const marketCapScore = Math.min(financials.marketCap / 1000000000 * 10, 100)
    const revenueScore = Math.min(financials.revenue / 1000000000 * 20, 100)
    
    score.factors.financials = {
      marketCap: financials.marketCap,
      revenue: financials.revenue,
      score: (marketCapScore + revenueScore) / 2
    }
    score.total += score.factors.financials.score * 0.3
  }

  score.total = Math.round(score.total)
  return score
}

function analyzeCompetitiveLandscape(trials, patents) {
  const sponsors = new Map()
  const companies = new Map()

  // Analyze trial sponsors
  trials.forEach(trial => {
    const sponsor = trial.sponsor
    if (!sponsors.has(sponsor)) {
      sponsors.set(sponsor, { trials: 0, phases: new Set(), totalEnrollment: 0 })
    }
    const sponsorData = sponsors.get(sponsor)
    sponsorData.trials++
    sponsorData.phases.add(trial.phase)
    sponsorData.totalEnrollment += trial.enrollment || 0
  })

  // Analyze patent assignees
  patents.forEach(patent => {
    const assignee = patent.assignee?.name || patent.applicant?.name
    if (assignee && !companies.has(assignee)) {
      companies.set(assignee, { patents: 0, recentPatents: 0 })
    }
    if (assignee) {
      const companyData = companies.get(assignee)
      companyData.patents++
      
      const patentDate = new Date(patent.date || patent.filingDate || patent.issueDate)
      if (patentDate > new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)) {
        companyData.recentPatents++
      }
    }
  })

  return {
    topSponsors: Array.from(sponsors.entries())
      .map(([name, data]) => ({
        name,
        trials: data.trials,
        phases: Array.from(data.phases),
        totalEnrollment: data.totalEnrollment
      }))
      .sort((a, b) => b.trials - a.trials)
      .slice(0, 5),
    topPatentHolders: Array.from(companies.entries())
      .map(([name, data]) => ({
        name,
        totalPatents: data.patents,
        recentPatents: data.recentPatents
      }))
      .sort((a, b) => b.totalPatents - a.totalPatents)
      .slice(0, 5)
  }
}

function generateRecommendations(insights, marketOpportunity) {
  const recommendations = []

  if (marketOpportunity.total > 70) {
    recommendations.push({
      priority: 'high',
      category: 'investment',
      title: 'High Market Opportunity Identified',
      description: 'Strong indicators suggest significant market potential. Consider strategic investment or partnership opportunities.',
      actions: ['Conduct detailed market analysis', 'Evaluate partnership opportunities', 'Assess competitive positioning']
    })
  }

  if (insights.developmentStage === 'early') {
    recommendations.push({
      priority: 'medium',
      category: 'development',
      title: 'Early Development Stage',
      description: 'Technology is in early development. Monitor progress and consider early-stage investment opportunities.',
      actions: ['Track clinical trial progress', 'Monitor patent developments', 'Assess regulatory pathway']
    })
  }

  if (insights.patentLandscape.risk === 'high') {
    recommendations.push({
      priority: 'high',
      category: 'risk',
      title: 'High Patent Risk',
      description: 'Significant patent landscape challenges identified. Develop IP strategy and risk mitigation plans.',
      actions: ['Conduct freedom-to-operate analysis', 'Develop IP strategy', 'Consider licensing opportunities']
    })
  }

  return recommendations
}

// Utility functions for data analysis
function calculatePhaseDistribution(trials) {
  const distribution = {}
  trials.forEach(trial => {
    const phase = trial.phase || 'Unknown'
    distribution[phase] = (distribution[phase] || 0) + 1
  })
  return distribution
}

function calculateStatusDistribution(trials) {
  const distribution = {}
  trials.forEach(trial => {
    const status = trial.status || 'Unknown'
    distribution[status] = (distribution[status] || 0) + 1
  })
  return distribution
}

function calculateGeographicDistribution(trials) {
  const distribution = {}
  trials.forEach(trial => {
    const country = trial.location?.country || 'Unknown'
    distribution[country] = (distribution[country] || 0) + 1
  })
  return distribution
}

function analyzeSponsors(trials) {
  const sponsors = new Map()
  trials.forEach(trial => {
    const sponsor = trial.sponsor
    const type = trial.sponsorType || 'Unknown'
    
    if (!sponsors.has(sponsor)) {
      sponsors.set(sponsor, { count: 0, type, phases: new Set() })
    }
    
    const sponsorData = sponsors.get(sponsor)
    sponsorData.count++
    sponsorData.phases.add(trial.phase)
  })

  return Array.from(sponsors.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    type: data.type,
    phases: Array.from(data.phases)
  }))
}

function analyzeEnrollment(trials) {
  const enrollmentData = trials
    .filter(t => t.enrollment > 0)
    .map(t => t.enrollment)

  if (enrollmentData.length === 0) return null

  return {
    total: enrollmentData.reduce((sum, e) => sum + e, 0),
    average: Math.round(enrollmentData.reduce((sum, e) => sum + e, 0) / enrollmentData.length),
    min: Math.min(...enrollmentData),
    max: Math.max(...enrollmentData)
  }
}

function identifyTherapeuticArea(query, trials) {
  // Simple keyword-based identification
  const keywords = query.toLowerCase()
  if (keywords.includes('cancer') || keywords.includes('oncology')) return 'Oncology'
  if (keywords.includes('heart') || keywords.includes('cardio')) return 'Cardiology'
  if (keywords.includes('brain') || keywords.includes('neuro')) return 'Neurology'
  if (keywords.includes('immune') || keywords.includes('auto')) return 'Immunology'
  return 'General'
}

function assessDevelopmentStage(trials) {
  if (trials.length === 0) return 'unknown'
  
  const phases = trials.map(t => t.phase).filter(Boolean)
  if (phases.includes('IV')) return 'mature'
  if (phases.includes('III')) return 'advanced'
  if (phases.includes('II')) return 'mid'
  if (phases.includes('I')) return 'early'
  return 'preclinical'
}

function analyzePatentLandscape(patents) {
  if (patents.length === 0) return { risk: 'low', complexity: 'low' }
  
  const recentPatents = patents.filter(p => {
    const patentDate = new Date(p.date || p.filingDate || p.issueDate)
    return patentDate > new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000)
  }).length
  
  const risk = recentPatents > 10 ? 'high' : recentPatents > 5 ? 'medium' : 'low'
  const complexity = patents.length > 20 ? 'high' : patents.length > 10 ? 'medium' : 'low'
  
  return { risk, complexity, totalPatents: patents.length, recentPatents }
}

function assessMarketMaturity(trials, patents) {
  const trialCount = trials.length
  const patentCount = patents.length
  
  if (trialCount > 50 && patentCount > 30) return 'mature'
  if (trialCount > 20 && patentCount > 15) return 'developing'
  if (trialCount > 5 && patentCount > 5) return 'emerging'
  return 'nascent'
}

function assessRegulatoryPath(trials) {
  const phase3Trials = trials.filter(t => t.phase === 'III').length
  const completedTrials = trials.filter(t => t.status === 'Completed').length
  
  if (phase3Trials > 5) return 'well-defined'
  if (phase3Trials > 2) return 'defined'
  if (completedTrials > 10) return 'exploratory'
  return 'unknown'
}

function assessInvestmentProfile(financials) {
  if (!financials) return 'insufficient_data'
  
  const marketCap = financials.marketCap
  const revenue = financials.revenue
  
  if (marketCap > 10000000000 && revenue > 1000000000) return 'large_cap'
  if (marketCap > 1000000000 && revenue > 100000000) return 'mid_cap'
  if (marketCap > 100000000) return 'small_cap'
  return 'micro_cap'
}

export default router