#!/usr/bin/env node

// test-pharma-intelligence.js - Test script for new pharmaceutical intelligence APIs
import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3001'
let authToken = null

// Test configuration
const testConfig = {
  email: 'test@example.com',
  password: 'testpassword123',
  companyName: 'Pfizer',
  therapeuticArea: 'oncology'
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    })

    const data = await response.json()
    
    return {
      status: response.status,
      statusText: response.statusText,
      data
    }
  } catch (error) {
    return {
      status: 500,
      statusText: 'Network Error',
      error: error.message
    }
  }
}

async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...')
  const result = await makeRequest('/health')
  
  if (result.status === 200) {
    console.log('✅ Server is running')
    console.log(`   Uptime: ${Math.round(result.data.uptime)}s`)
  } else {
    console.log('❌ Server health check failed')
    console.log(`   Status: ${result.status}`)
  }
  
  return result.status === 200
}

async function authenticateUser() {
  console.log('\n🔐 Testing Authentication...')
  
  // Try to register first (might fail if user exists)
  await makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: testConfig.email,
      password: testConfig.password,
      subscription: 'premium'
    })
  })

  // Login
  const loginResult = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testConfig.email,
      password: testConfig.password
    })
  })

  if (loginResult.status === 200 && loginResult.data.token) {
    authToken = loginResult.data.token
    console.log('✅ Authentication successful')
    return true
  } else {
    console.log('❌ Authentication failed')
    console.log(`   Status: ${loginResult.status}`)
    console.log(`   Message: ${loginResult.data.message}`)
    return false
  }
}

async function testPatentApis() {
  console.log('\n💊 Testing Patent Intelligence APIs...')
  
  // Test patent cliff monitoring
  console.log('  📊 Patent Cliff Monitor...')
  const cliffResult = await makeRequest('/api/patents/cliff-monitor?timeframe=24&sortBy=risk&limit=5')
  
  if (cliffResult.status === 200) {
    console.log(`  ✅ Patent cliff monitoring works`)
    console.log(`     Found ${cliffResult.data.data?.patents?.length || 0} patents`)
  } else {
    console.log(`  ❌ Patent cliff monitoring failed (${cliffResult.status})`)
  }

  // Test patent search
  console.log('  🔍 Patent Search...')
  const searchResult = await makeRequest('/api/patents/search?drugName=aspirin&limit=3')
  
  if (searchResult.status === 200) {
    console.log(`  ✅ Patent search works`)
    console.log(`     Found ${searchResult.data.data?.patents?.length || 0} patents`)
  } else {
    console.log(`  ❌ Patent search failed (${searchResult.status})`)
  }

  // Test patent statistics
  console.log('  📈 Patent Statistics...')
  const statsResult = await makeRequest('/api/patents/statistics/overview')
  
  if (statsResult.status === 200) {
    console.log(`  ✅ Patent statistics work`)
    console.log(`     Total patents: ${statsResult.data.data?.totalPatents || 0}`)
  } else {
    console.log(`  ❌ Patent statistics failed (${statsResult.status})`)
  }
}

async function testCompetitiveIntelligence() {
  console.log('\n🏢 Testing Competitive Intelligence APIs...')
  
  // Test dashboard
  console.log('  📊 CI Dashboard...')
  const dashboardResult = await makeRequest('/api/competitive-intelligence/dashboard?limit=5')
  
  if (dashboardResult.status === 200) {
    console.log(`  ✅ CI dashboard works`)
    console.log(`     Found ${dashboardResult.data.data?.competitors?.length || 0} competitors`)
  } else {
    console.log(`  ❌ CI dashboard failed (${dashboardResult.status})`)
  }

  // Test partnerships
  console.log('  🤝 Partnership Tracking...')
  const partnershipsResult = await makeRequest('/api/competitive-intelligence/partnerships?timeframe=last_12_months')
  
  if (partnershipsResult.status === 200) {
    console.log(`  ✅ Partnership tracking works`)
    console.log(`     Found ${partnershipsResult.data.data?.totalPartnerships || 0} partnerships`)
  } else {
    console.log(`  ❌ Partnership tracking failed (${partnershipsResult.status})`)
  }

  // Test market trends
  console.log('  📈 Market Trends...')
  const trendsResult = await makeRequest('/api/competitive-intelligence/market-trends?therapeuticArea=oncology')
  
  if (trendsResult.status === 200) {
    console.log(`  ✅ Market trends work`)
    console.log(`     Trend data available: ${Object.keys(trendsResult.data.data?.trends || {}).length} categories`)
  } else {
    console.log(`  ❌ Market trends failed (${trendsResult.status})`)
  }
}

async function testInvestmentResearch() {
  console.log('\n💰 Testing Investment Research APIs...')
  
  // Test market trends
  console.log('  📊 Investment Market Trends...')
  const trendsResult = await makeRequest('/api/investment-research/market-trends?therapeuticArea=oncology&timeframe=1Y')
  
  if (trendsResult.status === 200) {
    console.log(`  ✅ Investment market trends work`)
    console.log(`     Trend categories: ${Object.keys(trendsResult.data.data?.trends || {}).length}`)
  } else {
    console.log(`  ❌ Investment market trends failed (${trendsResult.status})`)
  }

  // Test investment alerts
  console.log('  🚨 Investment Alerts...')
  const alertsResult = await makeRequest('/api/investment-research/alerts?limit=5')
  
  if (alertsResult.status === 200) {
    console.log(`  ✅ Investment alerts work`)
    console.log(`     Found ${alertsResult.data.data?.alerts?.length || 0} alerts`)
    console.log(`     High priority: ${alertsResult.data.data?.summary?.high || 0}`)
  } else {
    console.log(`  ❌ Investment alerts failed (${alertsResult.status})`)
  }

  // Test peer comparison
  console.log('  ⚖️  Peer Comparison...')
  const peerResult = await makeRequest('/api/investment-research/peer-comparison?targetCompany=Pfizer&peerCompanies=Johnson%20%26%20Johnson,Merck&metrics=risk,valuation')
  
  if (peerResult.status === 200) {
    console.log(`  ✅ Peer comparison works`)
    console.log(`     Comparing: ${peerResult.data.data?.targetCompany} vs ${peerResult.data.data?.peerCompanies?.length || 0} peers`)
  } else {
    console.log(`  ❌ Peer comparison failed (${peerResult.status})`)
  }
}

async function testKnowledgeGraph() {
  console.log('\n🕸️  Testing Knowledge Graph API...')
  
  const kgResult = await makeRequest('/api/knowledge-graph/demo', {
    method: 'POST'
  })
  
  if (kgResult.status === 200) {
    console.log(`  ✅ Knowledge graph demo works`)
    console.log(`     Entities: ${kgResult.data.data?.construction?.knowledgeGraph?.entities || 0}`)
    console.log(`     Relationships: ${kgResult.data.data?.construction?.knowledgeGraph?.relationships || 0}`)
  } else {
    console.log(`  ❌ Knowledge graph demo failed (${kgResult.status})`)
    if (kgResult.data?.error) {
      console.log(`     Error: ${kgResult.data.error}`)
    }
  }
}

async function runTests() {
  console.log('🧪 Starting Pharmaceutical Intelligence Platform Tests\n')
  console.log('=' .repeat(60))
  
  // Step 1: Health check
  const serverHealthy = await testHealthCheck()
  if (!serverHealthy) {
    console.log('\n❌ Server is not healthy. Exiting tests.')
    process.exit(1)
  }

  // Step 2: Authentication
  const authenticated = await authenticateUser()
  if (!authenticated) {
    console.log('\n❌ Authentication failed. Testing public endpoints only.')
  }

  // Step 3: Test APIs
  await testPatentApis()
  await testCompetitiveIntelligence()
  await testInvestmentResearch()
  await testKnowledgeGraph()

  console.log('\n' + '=' .repeat(60))
  console.log('🎉 Pharmaceutical Intelligence Platform Test Complete!')
  console.log('\n📋 Summary:')
  console.log('   • Patent Intelligence APIs: Ready for testing')
  console.log('   • Competitive Intelligence APIs: Ready for testing') 
  console.log('   • Investment Research APIs: Ready for testing')
  console.log('   • Knowledge Graph APIs: Ready for testing')
  console.log('\n💡 Next Steps:')
  console.log('   • Test with real pharmaceutical data')
  console.log('   • Configure USPTO API credentials for live data')
  console.log('   • Set up frontend dashboard for visual testing')
  console.log('   • Add sample companies and patents to database')
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error)
  process.exit(1)
})