import axios from 'axios'
import logger from '../utils/logger.js'

class FinancialDataService {
  constructor() {
    // Free financial data sources
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_KEY || null
    this.yahooFinanceBase = 'https://query1.finance.yahoo.com/v8/finance'
    this.finnhubKey = process.env.FINNHUB_KEY || null
  }

  async getCompanyFinancials(companyName) {
    try {
      // Try Yahoo Finance first (free, no API key)
      const yahooData = await this.getYahooFinanceData(companyName)
      if (yahooData) {
        yahooData.dataSource = 'REAL_YAHOO_FINANCE_API'
        yahooData.dataQuality = 'verified'
        yahooData.reason = 'Live financial data from Yahoo Finance'
        return yahooData
      }

      // Fallback to Alpha Vantage if key available
      if (this.alphaVantageKey) {
        const alphaData = await this.getAlphaVantageData(companyName)
        if (alphaData) {
          alphaData.dataSource = 'REAL_ALPHA_VANTAGE_API'
          alphaData.dataQuality = 'verified'
          alphaData.reason = 'Live financial data from Alpha Vantage'
          return alphaData
        }
      }

      // Return mock data if no external sources available
      logger.warn(`No real financial data available for ${companyName}, using mock data`)
      return this.getMockFinancialData(companyName)
    } catch (error) {
      logger.error('Financial data fetch error:', error)
      return this.getMockFinancialData(companyName)
    }
  }

  async getYahooFinanceData(companyName) {
    try {
      // Search for company symbol
      const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(companyName)}&quotesCount=1`
      const searchResponse = await axios.get(searchUrl)
      
      if (searchResponse.data?.quotes?.[0]) {
        const symbol = searchResponse.data.quotes[0].symbol
        
        // Get company info and financials
        const [infoResponse, financialsResponse] = await Promise.all([
          axios.get(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryDetail,financialData`),
          axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`)
        ])

        const info = infoResponse.data?.quoteSummary?.result?.[0]
        const financials = financialsResponse.data?.chart?.result?.[0]

        if (info && financials) {
          return {
            symbol,
            companyName: info.summaryDetail?.longName || companyName,
            marketCap: info.summaryDetail?.marketCap || 0,
            enterpriseValue: info.summaryDetail?.enterpriseValue || 0,
            revenue: info.financialData?.totalRevenue || 0,
            profitMargin: info.financialData?.profitMargins || 0,
            currentPrice: financials.meta?.regularMarketPrice || 0,
            priceChange: financials.meta?.regularMarketPrice - (financials.meta?.previousClose || 0),
            volume: financials.meta?.regularMarketVolume || 0,
            source: 'Yahoo Finance',
            lastUpdated: new Date().toISOString()
          }
        }
      }
      return null
    } catch (error) {
      logger.warn('Yahoo Finance fetch failed:', error.message)
      return null
    }
  }

  async getAlphaVantageData(companyName) {
    if (!this.alphaVantageKey) return null
    
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${companyName}&apikey=${this.alphaVantageKey}`
      )
      
      if (response.data?.Symbol) {
        return {
          symbol: response.data.Symbol,
          companyName: response.data.Name || companyName,
          marketCap: parseFloat(response.data.MarketCapitalization) || 0,
          enterpriseValue: parseFloat(response.data.MarketCapitalization) || 0,
          revenue: parseFloat(response.data.RevenueTTM) || 0,
          profitMargin: parseFloat(response.data.ProfitMargin) || 0,
          currentPrice: parseFloat(response.data.Price) || 0,
          source: 'Alpha Vantage',
          lastUpdated: new Date().toISOString()
        }
      }
      return null
    } catch (error) {
      logger.warn('Alpha Vantage fetch failed:', error.message)
      return null
    }
  }

  getMockFinancialData(companyName) {
    // Generate realistic mock data based on company name
    const mockData = {
      symbol: companyName.substring(0, 4).toUpperCase(),
      companyName,
      marketCap: Math.floor(Math.random() * 100000000000) + 1000000000,
      enterpriseValue: Math.floor(Math.random() * 120000000000) + 1200000000,
      revenue: Math.floor(Math.random() * 50000000000) + 5000000000,
      profitMargin: (Math.random() * 0.3) + 0.1,
      currentPrice: (Math.random() * 200) + 50,
      source: 'Mock Data',
      lastUpdated: new Date().toISOString(),
      dataSource: 'MOCK_DATA',
      dataQuality: 'demo_only',
      reason: 'No real financial data available - using generated demo data'
    }
    
    mockData.priceChange = mockData.currentPrice * (Math.random() * 0.1 - 0.05)
    mockData.volume = Math.floor(mockData.marketCap / mockData.currentPrice * 0.01)
    
    return mockData
  }
}

export default FinancialDataService