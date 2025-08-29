#!/usr/bin/env node

/**
 * Test script for RapidAPI Patent Integration
 * Run this to verify your RapidAPI setup is working
 */

import dotenv from 'dotenv'
import axios from 'axios'

// Load environment variables
dotenv.config()

const RAPIDAPI_KEY = process.env.RAPIDAPI_PATENT_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_PATENT_HOST || 'global-patent1.p.rapidapi.com'

console.log('🧪 Testing RapidAPI Patent Integration...\n')

if (!RAPIDAPI_KEY) {
  console.error('❌ RAPIDAPI_PATENT_KEY not found in .env file')
  console.log('Please add: RAPIDAPI_PATENT_KEY=your_api_key_here')
  process.exit(1)
}

console.log('✅ API Key found:', RAPIDAPI_KEY.substring(0, 10) + '...')
console.log('✅ API Host:', RAPIDAPI_HOST)
console.log('')

// Test 1: Patent Search
async function testPatentSearch() {
  console.log('🔍 Test 1: Patent Search')
  console.log('Searching for "cancer treatment"...')
  
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/patent/search`, {
      params: { query: 'cancer treatment' },
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    })
    
    console.log('✅ Search successful!')
    console.log('📊 Response status:', response.status)
    console.log('📊 Response data keys:', Object.keys(response.data || {}))
    
    if (response.data && response.data.patents) {
      console.log('📊 Found patents:', response.data.patents.length)
      if (response.data.patents.length > 0) {
        const firstPatent = response.data.patents[0]
        console.log('📋 First patent:', {
          number: firstPatent.patentNumber || firstPatent.id || 'Unknown',
          title: firstPatent.title || firstPatent.name || 'No title',
          assignee: firstPatent.assignee || firstPatent.owner || 'Unknown'
        })
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Search failed:', error.message)
    if (error.response) {
      console.error('📊 Error status:', error.response.status)
      console.error('📊 Error data:', error.response.data)
    }
    return false
  }
}

// Test 2: Patent Details
async function testPatentDetails() {
  console.log('\n🔍 Test 2: Patent Details')
  console.log('Getting details for US12155252B2...')
  
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/patent/detail`, {
      params: { id: 'US12155252B2' },
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    })
    
    console.log('✅ Details successful!')
    console.log('📊 Response status:', response.status)
    console.log('📊 Response data keys:', Object.keys(response.data || {}))
    
    if (response.data) {
      const patent = response.data
      console.log('📋 Patent details:', {
        number: patent.patentNumber || patent.id || 'Unknown',
        title: patent.title || patent.name || 'No title',
        assignee: patent.assignee || patent.owner || 'Unknown',
        status: patent.status || patent.legalStatus || 'Unknown'
      })
    }
    
    return true
  } catch (error) {
    console.error('❌ Details failed:', error.message)
    if (error.response) {
      console.error('📊 Error status:', error.response.status)
      console.error('📊 Error data:', error.response.data)
    }
    return false
  }
}

// Test 3: Company Patents
async function testCompanyPatents() {
  console.log('\n🔍 Test 3: Company Patents')
  console.log('Searching for Pfizer patents...')
  
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/patent/search`, {
      params: { query: 'Pfizer' },
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    })
    
    console.log('✅ Company search successful!')
    console.log('📊 Response status:', response.status)
    
    if (response.data && response.data.patents) {
      console.log('📊 Found Pfizer patents:', response.data.patents.length)
      if (response.data.patents.length > 0) {
        const firstPatent = response.data.patents[0]
        console.log('📋 First Pfizer patent:', {
          number: firstPatent.patentNumber || firstPatent.id || 'Unknown',
          title: firstPatent.title || firstPatent.name || 'No title'
        })
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Company search failed:', error.message)
    return false
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting RapidAPI Patent Integration Tests...\n')
  
  const results = {
    search: await testPatentSearch(),
    details: await testPatentDetails(),
    company: await testCompanyPatents()
  }
  
  console.log('\n📊 Test Results Summary:')
  console.log('🔍 Patent Search:', results.search ? '✅ PASS' : '❌ FAIL')
  console.log('📋 Patent Details:', results.details ? '✅ PASS' : '❌ FAIL')
  console.log('🏢 Company Patents:', results.company ? '✅ PASS' : '❌ FAIL')
  
  const passedTests = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your RapidAPI integration is working perfectly!')
    console.log('\n🚀 Next steps:')
    console.log('1. Restart your application: npm run dev')
    console.log('2. Go to USPTO Integration tab')
    console.log('3. Search for patents - you should see REAL DATA!')
  } else {
    console.log('⚠️  Some tests failed. Check your API key and try again.')
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Verify your API key is correct')
    console.log('2. Check your internet connection')
    console.log('3. Ensure RapidAPI service is available')
  }
}

// Run the tests
runAllTests().catch(console.error)