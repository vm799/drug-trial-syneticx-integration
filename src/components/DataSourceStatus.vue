<template>
  <div class="data-source-status bg-white rounded-xl border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="text-xl font-semibold text-gray-900">Data Source Status Dashboard</h2>
      <p class="text-gray-600 mt-1">Monitor which data sources are working and get real-time data</p>
    </div>
    
    <div class="p-6 space-y-6">
      
      <!-- Real-Time Status Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-green-600">{{ workingSources }}</div>
          <div class="text-sm text-green-600">Working APIs</div>
        </div>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-yellow-600">{{ needsConfig }}</div>
          <div class="text-sm text-yellow-600">Need Setup</div>
        </div>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-red-600">{{ failedSources }}</div>
          <div class="text-sm text-red-600">Failed</div>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-blue-600">{{ totalSources }}</div>
          <div class="text-sm text-blue-600">Total Sources</div>
        </div>
      </div>

      <!-- Data Source Details -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900">Data Source Details</h3>
        
        <!-- Working APIs -->
        <div v-if="workingSources > 0" class="space-y-3">
          <h4 class="text-md font-medium text-green-700">✅ Working APIs (Real Data)</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div 
              v-for="source in workingAPIs" 
              :key="source.id"
              class="bg-green-50 border border-green-200 rounded-lg p-3"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h5 class="font-medium text-green-900">{{ source.name }}</h5>
                  <p class="text-sm text-green-700">{{ source.description }}</p>
                  <p class="text-xs text-green-600">Last updated: {{ source.lastUpdated }}</p>
                </div>
                <div class="text-right">
                  <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- APIs Needing Configuration -->
        <div v-if="needsConfig > 0" class="space-y-3">
          <h4 class="text-md font-medium text-yellow-700">⚠️ APIs Needing Configuration</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div 
              v-for="source in configNeededAPIs" 
              :key="source.id"
              class="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h5 class="font-medium text-yellow-900">{{ source.name }}</h5>
                  <p class="text-sm text-yellow-700">{{ source.description }}</p>
                  <p class="text-xs text-yellow-600">{{ source.setupRequired }}</p>
                </div>
                <div class="text-right">
                  <button 
                    @click="showSetupGuide(source)"
                    class="px-3 py-1 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Setup Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Failed APIs -->
        <div v-if="failedSources > 0" class="space-y-3">
          <h4 class="text-md font-medium text-red-700">❌ Failed APIs (Using Demo Data)</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div 
              v-for="source in failedAPIs" 
              :key="source.id"
              class="bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h5 class="font-medium text-red-900">{{ source.name }}</h5>
                  <p class="text-sm text-red-700">{{ source.description }}</p>
                  <p class="text-xs text-red-600">Error: {{ source.error }}</p>
                </div>
                <div class="text-right">
                  <button 
                    @click="retryAPI(source)"
                    class="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div class="flex flex-wrap gap-3">
          <button 
            @click="testAllAPIs"
            :disabled="testing"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {{ testing ? 'Testing...' : 'Test All APIs' }}
          </button>
          <button 
            @click="showSetupModal = true"
            class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Setup Guide
          </button>
          <button 
            @click="refreshStatus"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            Refresh Status
          </button>
        </div>
      </div>

      <!-- Why Demo Data? -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="font-medium text-blue-900 mb-2">🤔 Why Am I Seeing Demo Data?</h4>
        <div class="text-sm text-blue-800 space-y-2">
          <p><strong>1. API Keys Missing:</strong> Some services require API keys for access</p>
          <p><strong>2. Rate Limits:</strong> Free APIs may have usage limits</p>
          <p><strong>3. Network Issues:</strong> Temporary connectivity problems</p>
          <p><strong>4. Service Unavailable:</strong> External APIs may be down</p>
        </div>
        <div class="mt-3">
          <button 
            @click="showSetupModal = true"
            class="text-blue-700 hover:text-blue-900 text-sm font-medium underline"
          >
            Learn how to get real data →
          </button>
        </div>
      </div>
    </div>

    <!-- Setup Guide Modal -->
    <div v-if="showSetupModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Data Source Setup Guide</h2>
          <button @click="showSetupModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-6">
          <!-- Free APIs (No Setup Required) -->
          <div>
            <h3 class="text-lg font-medium text-green-700 mb-3">✅ Free APIs - No Setup Required</h3>
            <div class="space-y-3">
              <div class="border border-green-200 rounded-lg p-3">
                <h4 class="font-medium text-green-900">ClinicalTrials.gov</h4>
                <p class="text-sm text-green-700">Public clinical trial data - automatically working</p>
                <p class="text-xs text-green-600">Status: Always available, no rate limits</p>
              </div>
              <div class="border border-green-200 rounded-lg p-3">
                <h4 class="font-medium text-green-900">Yahoo Finance</h4>
                <p class="text-sm text-green-700">Public financial market data - automatically working</p>
                <p class="text-xs text-green-600">Status: Always available, no rate limits</p>
              </div>
            </div>
          </div>

          <!-- APIs Needing Setup -->
          <div>
            <h3 class="text-lg font-medium text-yellow-700 mb-3">⚠️ APIs Needing Setup</h3>
            <div class="space-y-3">
              <div class="border border-yellow-200 rounded-lg p-3">
                <h4 class="font-medium text-yellow-900">USPTO API</h4>
                <p class="text-sm text-yellow-700">Patent data from US Patent Office</p>
                <div class="text-xs text-yellow-600 space-y-1 mt-2">
                  <p><strong>Setup:</strong> Register at developer.uspto.gov</p>
                  <p><strong>Cost:</strong> Free (1000 requests/hour)</p>
                  <p><strong>Time:</strong> 5 minutes</p>
                </div>
                <a href="https://developer.uspto.gov/" target="_blank" class="text-blue-600 hover:text-blue-800 text-xs underline">
                  Get API Key →
                </a>
              </div>
              
              <div class="border border-yellow-200 rounded-lg p-3">
                <h4 class="font-medium text-yellow-900">Alpha Vantage</h4>
                <p class="text-sm text-yellow-700">Advanced financial data and market metrics</p>
                <div class="text-xs text-yellow-600 space-y-1 mt-2">
                  <p><strong>Setup:</strong> Register at alphavantage.co</p>
                  <p><strong>Cost:</strong> Free tier (500 requests/day)</p>
                  <p><strong>Time:</strong> 2 minutes</p>
                </div>
                <a href="https://www.alphavantage.co/support/#api-key" target="_blank" class="text-blue-600 hover:text-blue-800 text-xs underline">
                  Get API Key →
                </a>
              </div>

              <div class="border border-yellow-200 rounded-lg p-3">
                <h4 class="font-medium text-yellow-900">OpenAI API</h4>
                <p class="text-sm text-yellow-700">AI-powered insights and analysis</p>
                <div class="text-xs text-yellow-600 space-y-1 mt-2">
                  <p><strong>Setup:</strong> Register at platform.openai.com</p>
                  <p><strong>Cost:</strong> Pay-per-use (very affordable)</p>
                  <p><strong>Time:</strong> 3 minutes</p>
                </div>
                <a href="https://platform.openai.com/api-keys" target="_blank" class="text-blue-600 hover:text-blue-800 text-xs underline">
                  Get API Key →
                </a>
              </div>
            </div>
          </div>

          <!-- Environment Variables Setup -->
          <div>
            <h3 class="text-lg font-medium text-blue-700 mb-3">🔧 Environment Variables Setup</h3>
            <div class="bg-gray-100 rounded-lg p-3">
              <p class="text-sm text-gray-700 mb-2">Add these to your <code class="bg-gray-200 px-1 rounded">.env</code> file:</p>
              <pre class="text-xs text-gray-800 bg-white p-2 rounded border overflow-x-auto">
# USPTO API (Free)
USPTO_API_KEY=your_uspto_api_key_here

# Alpha Vantage (Free tier)
ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here

# OpenAI (Pay-per-use)
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB (Required)
MONGODB_URI=your_mongodb_connection_string
              </pre>
            </div>
          </div>

          <!-- File Upload Alternative -->
          <div>
            <h3 class="text-lg font-medium text-purple-700 mb-3">📁 Alternative: Upload Your Own Data</h3>
            <div class="border border-purple-200 rounded-lg p-3">
              <p class="text-sm text-purple-700 mb-2">
                Don't want to wait for API setup? Upload your own CSV/JSON files with real data!
              </p>
              <ul class="text-xs text-purple-600 space-y-1">
                <li>• Patent data from your internal databases</li>
                <li>• Clinical trial information from your research</li>
                <li>• Financial data from your company reports</li>
                <li>• Competitive intelligence from your analysis</li>
              </ul>
              <p class="text-xs text-purple-600 mt-2">
                <strong>Go to:</strong> Data Management tab → Upload Data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// State
const showSetupModal = ref(false)
const testing = ref(false)
const dataSources = ref([
  {
    id: 'clinicaltrials',
    name: 'ClinicalTrials.gov',
    description: 'Clinical trial data and outcomes',
    status: 'working',
    lastUpdated: 'Just now',
    error: null,
    setupRequired: null
  },
  {
    id: 'yahoo_finance',
    name: 'Yahoo Finance',
    description: 'Financial market data and company metrics',
    status: 'working',
    lastUpdated: 'Just now',
    error: null,
    setupRequired: null
  },
  {
    id: 'uspto',
    name: 'USPTO API',
    description: 'Patent information and filing data',
    status: 'needs_config',
    lastUpdated: 'Never',
    error: null,
    setupRequired: 'API key registration required'
  },
  {
    id: 'alpha_vantage',
    name: 'Alpha Vantage',
    description: 'Advanced financial metrics and analysis',
    status: 'needs_config',
    lastUpdated: 'Never',
    error: null,
    setupRequired: 'API key registration required'
  },
  {
    id: 'openai',
    name: 'OpenAI API',
    description: 'AI-powered insights and analysis',
    status: 'needs_config',
    lastUpdated: 'Never',
    error: null,
    setupRequired: 'API key registration required'
  },
  {
    id: 'rapidapi-patent',
    name: 'RapidAPI Patent Data',
    description: 'Global patent database with search and details',
    status: 'needs_config',
    lastUpdated: 'Never',
    error: 'API key not configured',
    setupRequired: 'API key registration required',
    setupUrl: 'https://rapidapi.com/hub/patent-apis',
    setupSteps: [
      'Go to RapidAPI Patent APIs',
      'Sign up for free account',
      'Get API key',
      'Add to .env file: RAPIDAPI_PATENT_KEY=your_key'
    ]
  }
])

// Computed
const workingAPIs = computed(() => dataSources.value.filter(s => s.status === 'working'))
const configNeededAPIs = computed(() => dataSources.value.filter(s => s.status === 'needs_config'))
const failedAPIs = computed(() => dataSources.value.filter(s => s.status === 'failed'))

const workingSources = computed(() => workingAPIs.value.length)
const needsConfig = computed(() => configNeededAPIs.value.length)
const failedSources = computed(() => failedAPIs.value.length)
const totalSources = computed(() => dataSources.value.length)

// Methods
const testAllAPIs = async () => {
  testing.value = true
  try {
    // Test each API endpoint
    await Promise.all([
      testClinicalTrialsAPI(),
      testYahooFinanceAPI(),
      testUSPTOAPI(),
      testAlphaVantageAPI(),
      testOpenAIAPI(),
      testRapidAPIPatent()
    ])
    
    await refreshStatus()
  } catch (error) {
    console.error('API testing failed:', error)
  } finally {
    testing.value = false
  }
}

const testClinicalTrialsAPI = async () => {
  try {
    const response = await fetch('/api/research-insights/trials?query=cancer&limit=1')
    if (response.ok) {
      updateSourceStatus('clinicaltrials', 'working', 'Just now')
    } else {
      updateSourceStatus('clinicaltrials', 'failed', 'API error', response.statusText)
    }
  } catch (error) {
    updateSourceStatus('clinicaltrials', 'failed', 'Never', 'Network error')
  }
}

const testYahooFinanceAPI = async () => {
  try {
    const response = await fetch('/api/competitive-intelligence')
    if (response.ok) {
      updateSourceStatus('yahoo_finance', 'working', 'Just now')
    } else {
      updateSourceStatus('yahoo_finance', 'failed', 'API error', response.statusText)
    }
  } catch (error) {
    updateSourceStatus('yahoo_finance', 'failed', 'Never', 'Network error')
  }
}

const testUSPTOAPI = async () => {
  try {
    const response = await fetch('/api/patents/search?query=cancer&limit=1')
    if (response.ok) {
      const data = await response.json()
      if (data.metadata?.dataSource === 'REAL_USPTO_API') {
        updateSourceStatus('uspto', 'working', 'Just now')
      } else {
        updateSourceStatus('uspto', 'needs_config', 'Never', 'API key required')
      }
    } else {
      updateSourceStatus('uspto', 'needs_config', 'Never', 'API key required')
    }
  } catch (error) {
    updateSourceStatus('uspto', 'needs_config', 'Never', 'API key required')
  }
}

const testAlphaVantageAPI = async () => {
  // This would test if Alpha Vantage key is configured
  updateSourceStatus('alpha_vantage', 'needs_config', 'Never', 'API key required')
}

const testOpenAIAPI = async () => {
  // This would test if OpenAI key is configured
  updateSourceStatus('openai', 'needs_config', 'Never', 'API key required')
}

const testRapidAPIPatent = async () => {
  try {
    updateSourceStatus('rapidapi-patent', 'testing', 'Testing API connection...');
    
    const response = await fetch('/api/uspto/search?query=cancer+treatment');
    const data = await response.json();
    
    if (data.success && data.metadata?.dataSource === 'REAL_RAPIDAPI_PATENT') {
      updateSourceStatus('rapidapi-patent', 'working', null, '2024-01-15');
      // Assuming $toast is available globally or imported
      // this.$toast.success('RapidAPI Patent API is working! You now have real patent data.');
    } else {
      updateSourceStatus('rapidapi-patent', 'failed', 'API returned demo data - check configuration');
    }
  } catch (error: any) {
    updateSourceStatus('rapidapi-patent', 'failed', `Test failed: ${error.message}`);
  }
}

const updateSourceStatus = (id: string, status: string, lastUpdated: string, error?: string) => {
  const source = dataSources.value.find(s => s.id === id)
  if (source) {
    source.status = status
    source.lastUpdated = lastUpdated
    source.error = error || null
  }
}

const showSetupGuide = (source: any) => {
  showSetupModal.value = true
}

const retryAPI = async (source: any) => {
  // Implement retry logic for failed APIs
  console.log('Retrying API:', source.id)
}

const refreshStatus = async () => {
  await testAllAPIs()
}

// Lifecycle
onMounted(() => {
  testAllAPIs()
})
</script>

<style scoped>
code {
  font-family: 'Courier New', monospace;
}
</style>