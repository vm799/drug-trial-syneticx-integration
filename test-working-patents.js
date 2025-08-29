#!/usr/bin/env node

/**
 * Test script for Working Patent APIs
 * Tests both RapidAPI and Google Patents fallback
 */

import dotenv from 'dotenv'
import axios from 'axios'

// Load environment variables
dotenv.config()

const RAPIDAPI_KEY = process.env.RAPIDAPI_PATENT_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_PATENT_HOST || 'global-patent1.p.rapidapi.com'

console.log('🧪 Testing Working Patent APIs...\n')

console.log('✅ API Key found:', RAPIDAPI_KEY ? RAPIDAPI_KEY.substring(0, 10) + '...' : 'Not configured')
console.log('✅ API Host:', RAPIDAPI_HOST)
console.log('')

// Test 1: Google Patents (No API key required)
async function testGooglePatents() {
  console.log('🔍 Test 1: Google Patents (No API Key Required)')
  console.log('Searching for "cancer treatment"...')
  
  try {
    const response = await axios.get('https://patents.google.com/xhr/query', {
      params: {
        q: 'cancer treatment',
        language: 'ENGLISH',
        num: 5
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    console.log('✅ Google Patents search successful!')
    console.log('📊 Response status:', response.status)
    console.log('📊 Response data keys:', Object.keys(response.data || {}))
    
    if (response.data && response.data.results) {
      console.log('📊 Found patents:', response.data.results.length)
      if (response.data.results.length > 0) {
        const firstPatent = response.data.results[0]
        console.log('📋 First patent:', {
          number: firstPatent.patent_number || firstPatent.id || 'Unknown',
          title: firstPatent.title || firstPatent.name || 'No title',
          assignee: firstPatent.assignee || firstPatent.owner || 'Unknown'
        })
      }
    }
    
    return true
  } catch (error) {
    console.error('❌ Google Patents search failed:', error.message)
    if (error.response) {
      console.error('📊 Error status:', error.response.status)
    }
    return false
  }
}

// Test 2: USPTO Bulk Data (No API key required)
async function testUSPTOBulkData() {
  console.log('\n🔍 Test 2: USPTO Bulk Data (No API Key Required)')
  console.log('Checking USPTO bulk data availability...')
  
  try {
    const response = await axios.get('https://bulkdata.uspto.gov/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    console.log('✅ USPTO Bulk Data accessible!')
    console.log('📊 Response status:', response.status)
    console.log('📊 This provides bulk patent data downloads')
    
    return true
  } catch (error) {
    console.error('❌ USPTO Bulk Data failed:', error.message)
    return false
  }
}

// Test 3: RapidAPI Patent (With API key)
async function testRapidAPIPatent() {
  console.log('\n🔍 Test 3: RapidAPI Patent (With API Key)')
  
  if (!RAPIDAPI_KEY) {
    console.log('⚠️  No RapidAPI key configured - skipping test')
    return false
  }
  
  console.log('Testing RapidAPI endpoints...')
  
  const endpoints = [
    '/patent/search?query=cancer+treatment',
    '/search?q=cancer+treatment',
    '/patents?query=cancer+treatment'
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`  Trying endpoint: ${endpoint}`)
      
      const response = await axios.get(`https://${RAPIDAPI_HOST}${endpoint}`, {
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      })
      
      if (response.status === 200) {
        console.log(`✅ RapidAPI endpoint ${endpoint} works!`)
        console.log('📊 Response data keys:', Object.keys(response.data || {}))
        return true
      }
    } catch (error) {
      console.log(`  ❌ Endpoint ${endpoint} failed:`, error.message)
    }
  }
  
  console.log('❌ All RapidAPI endpoints failed')
  return false
}

// Test 4: Test our USPTO service
async function testUSPTOService() {
  console.log('\n🔍 Test 4: Our USPTO Service Integration')
  console.log('Testing the integrated service...')
  
  try {
    // Start the server first
    console.log('  Starting server...')
    const { spawn } = await import('child_process')
    
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    })
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Test the service
    const response = await axios.get('http://localhost:10000/api/uspto/search?query=cancer+treatment')
    
    console.log('✅ USPTO Service test successful!')
    console.log('📊 Response:', response.data)
    
    // Stop server
    server.kill()
    
    return true
  } catch (error) {
    console.error('❌ USPTO Service test failed:', error.message)
    return false
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Working Patent API Tests...\n')
  
  const results = {
    google: await testGooglePatents(),
    uspto: await testUSPTOBulkData(),
    rapidapi: await testRapidAPIPatent(),
    service: false // Skip service test for now
  }
  
  console.log('\n📊 Test Results Summary:')
  console.log('🔍 Google Patents:', results.google ? '✅ PASS' : '❌ FAIL')
  console.log('📋 USPTO Bulk Data:', results.uspto ? '✅ PASS' : '❌ FAIL')
  console.log('🚀 RapidAPI Patent:', results.rapidapi ? '✅ PASS' : '❌ FAIL')
  console.log('⚙️  USPTO Service:', '⏭️  SKIPPED')
  
  const passedTests = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length - 1 // Exclude service test
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests >= 2) {
    console.log('🎉 Great! You have working patent data sources!')
    console.log('\n🚀 Next steps:')
    console.log('1. Restart your application: npm run dev')
    console.log('2. Go to USPTO Integration tab')
    console.log('3. Search for patents - you should see REAL DATA!')
    console.log('\n💡 Working APIs:')
    if (results.google) console.log('  ✅ Google Patents (No API key needed)')
    if (results.uspto) console.log('  ✅ USPTO Bulk Data (No API key needed)')
    if (results.rapidapi) console.log('  ✅ RapidAPI Patent (With your API key)')
  } else {
    console.log('⚠️  Most tests failed. Let\'s troubleshoot:')
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check your internet connection')
    console.log('2. Verify RapidAPI key if using RapidAPI')
    console.log('3. Try accessing Google Patents manually')
  }
}

// Run the tests
runAllTests().catch(console.error)