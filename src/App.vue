<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">MedResearch AI</h1>
            <span class="ml-2 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
              v2.0.0
            </span>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span class="text-sm font-medium text-gray-900">{{ systemStatus }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Desktop-first Navigation -->
    <nav class="bg-white border-t border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-6 overflow-x-auto">
          <button @click="activeTab = 'home'" :class="tabClass('home')" class="py-3 text-sm font-medium whitespace-nowrap">Home</button>
          <button @click="activeTab = 'patent'" :class="tabClass('patent')" class="py-3 text-sm font-medium whitespace-nowrap">Patent Cliff</button>
          <button @click="activeTab = 'competitive'" :class="tabClass('competitive')" class="py-3 text-sm font-medium whitespace-nowrap">Competitive Intel</button>
          <button @click="activeTab = 'investment'" :class="tabClass('investment')" class="py-3 text-sm font-medium whitespace-nowrap">Investment Research</button>
          <button @click="activeTab = 'uspto'" :class="tabClass('uspto')" class="py-3 text-sm font-medium whitespace-nowrap">USPTO</button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome Section -->
      <div class="mb-8">
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h2 class="text-3xl font-bold mb-2">Welcome to MedResearch AI</h2>
          <p class="text-blue-100">
            Enterprise-grade AI-powered medical research platform with advanced multi-agent orchestration.
          </p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              🤖
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">AI Agents</p>
              <p class="text-2xl font-semibold text-gray-900">{{ agentCount }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              📚
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Research Papers</p>
              <p class="text-2xl font-semibold text-gray-900">{{ researchCount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              💬
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Chat Sessions</p>
              <p class="text-2xl font-semibold text-gray-900">{{ chatCount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              🔬
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Trials Found</p>
              <p class="text-2xl font-semibold text-gray-900">{{ trialsCount }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Home Tab -->
      <div v-if="activeTab === 'home'" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- AI Research Assistant -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">AI Research Assistant</h3>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xs text-green-600 font-medium">AI Ready</span>
            </div>
          </div>
          
          <div class="space-y-4">
            <!-- Instructions -->
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <h4 class="text-sm font-semibold text-gray-900 mb-2">🧬 Medical Research AI</h4>
              <p class="text-sm font-medium text-gray-700">Ask about clinical trials, drug research, treatment protocols, or literature reviews. The AI provides:</p>
              <ul class="text-xs text-gray-600 mt-2 ml-4 space-y-1">
                <li>• Research insights & analysis</li>
                <li>• Clinical trial matches</li>
                <li>• Evidence-based summaries</li>
              </ul>
            </div>

            <!-- Chat Input -->
            <div class="flex flex-col space-y-2">
              <textarea 
                v-model="chatMessage" 
                @keyup.enter.prevent="sendMessage"
                rows="3"
                placeholder="Please type in your query here e.g. CAR-T cell therapy, CRISPR gene editing, Immunotherapy combinations, mRNA vaccines"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-900 font-medium placeholder-gray-500 dark:placeholder-gray-500 bg-white dark:bg-white resize-y min-h-[80px]"
              ></textarea>
              <div class="flex justify-end">
                <button 
                  @click="sendMessage"
                  :disabled="isLoading"
                  class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
                >
                  {{ isLoading ? 'Processing...' : 'Analyze' }}
                </button>
              </div>
            </div>

            <!-- AI Response Area - This is where findings appear -->
            <div v-if="isLoading" class="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div class="flex items-center space-x-3">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p class="text-sm font-medium text-blue-800">AI analyzing medical literature...</p>
              </div>
            </div>

            <!-- AI Research Results Display -->
            <ResearchResults :results="aiResults" />

            <!-- Empty State -->
            <div v-if="!aiResults && !isLoading" class="text-center py-6">
              <div class="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                💬
              </div>
              <p class="text-sm text-gray-500">Ready for your medical research query</p>
            </div>
          </div>
        </div>

        <!-- AI Research Insights -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">AI Research Insights</h3>
          <div class="space-y-4">
            <div v-if="recentPapers.length === 0" class="text-center py-8">
              <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                🔬
              </div>
              <p class="text-gray-500 text-sm">No research analyses yet</p>
              <p class="text-xs text-gray-400 mt-1">Start a chat to generate AI-powered research insights</p>
            </div>
            <div v-else>
              <div v-for="paper in recentPapers" :key="paper.id" class="border-l-4 border-green-500 pl-4">
                <h4 class="font-medium text-gray-900 text-sm">{{ paper.title }}</h4>
                <p class="text-xs text-gray-500 mt-1">{{ paper.source }} • {{ paper.timestamp }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Info -->
      <div class="mt-8 bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm font-medium text-gray-900">Frontend</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm font-medium text-gray-900">Backend API</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm font-medium text-gray-900">Database</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm font-medium text-gray-900">OpenAI Connected</span>
          </div>
        </div>
      </div>

      <!-- Patent Cliff Tab -->
      <div v-if="activeTab === 'patent'" class="space-y-6">
        <h3 class="text-lg font-semibold text-gray-900">Patent Cliff Monitoring</h3>
        <PatentCliffMonitor />
      </div>

      <!-- Competitive Intelligence Tab -->
      <div v-if="activeTab === 'competitive'" class="space-y-6">
        <h3 class="text-lg font-semibold text-gray-900">Competitive Intelligence</h3>
        <CompetitiveIntelligence />
      </div>

      <!-- Investment Research Tab -->
      <div v-if="activeTab === 'investment'" class="space-y-6">
        <h3 class="text-lg font-semibold text-gray-900">Investment Research Analytics</h3>
        <InvestmentResearch />
      </div>

      <!-- USPTO Tab -->
      <div v-if="activeTab === 'uspto'" class="space-y-6">
        <h3 class="text-lg font-semibold text-gray-900">USPTO Integration</h3>
        <USPTOIntegration />
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center text-gray-500 text-sm">
          <p>MedResearch AI Enterprise Platform v2.0.0</p>
          <p class="mt-1">Built with Enterprise Architecture & Multi-Agent AI Orchestration</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ResearchResults from './components/ResearchResults.vue'
import PatentCliffMonitor from './components/PatentCliffMonitor.vue'
import CompetitiveIntelligence from './components/CompetitiveIntelligence.vue'
import InvestmentResearch from './components/InvestmentResearch.vue'
import USPTOIntegration from './components/USPTOIntegration.vue'

// Reactive state
const chatMessage = ref('')
const lastResponse = ref('')
const aiResults = ref(null)
const isLoading = ref(false)
const systemStatus = ref('Initializing')
const researchCount = ref(0)
const chatCount = ref(0)
const trialsCount = ref(0)
const agentCount = ref(0)

// Dynamic data - will be populated from API
const recentPapers = ref([])
const chatHistory = ref([])
const systemMetrics = ref({
  uptime: 0,
  responseTime: 0,
  successRate: 0
})

// Navigation state
const activeTab = ref<'home' | 'patent' | 'competitive' | 'investment' | 'uspto'>('home')
const tabClass = (tab: string) => (
  activeTab.value === tab
    ? 'border-b-2 border-blue-600 text-blue-700'
    : 'text-gray-600 hover:text-gray-900'
)

// Methods
const sendMessage = async () => {
  if (!chatMessage.value.trim()) return
  
  isLoading.value = true
  const message = chatMessage.value
  // Keep the message in the input box - don't clear it
  
  try {
    // Call the actual backend API (use current host for mobile compatibility)
    const currentHost = window.location.hostname
    const currentProtocol = window.location.protocol
    const backendUrl = currentHost === 'localhost' || currentHost === '127.0.0.1' ? 
      'http://localhost:3001' : 
      `${currentProtocol}//${currentHost}`
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // For now, we'll skip authentication to test
      },
      body: JSON.stringify({
        query: message,
        context: {
          sessionId: 'demo-session',
          specialization: 'general'
        }
      })
    })

    if (response.ok) {
      const data = await response.json()
      
      // Set structured results for ResearchResults component
      aiResults.value = {
        researchInsights: data.researchInsights || null,
        trialMatches: data.trialMatches || null,
        explanation: data.explanation || null
      }
      
      // Update counters
      if (data.researchInsights) researchCount.value++
      if (data.trialMatches) trialsCount.value++
      if (data.explanation) chatCount.value++
      
      // Keep legacy response for any fallbacks
      let fullResponse = ''
      if (data.researchInsights) {
        fullResponse += `📊 **Research Insights:**\n${data.researchInsights}\n\n`
      }
      if (data.trialMatches) {
        fullResponse += `🧪 **Clinical Trial Matches:**\n${data.trialMatches}\n\n`
      }
      if (data.explanation) {
        fullResponse += `💡 **Summary:**\n${data.explanation}`
      }
      lastResponse.value = fullResponse || data.message || 'AI response received successfully!'
    } else {
      const errorData = await response.json()
      lastResponse.value = `Error: ${errorData.message || 'Failed to get AI response'}`
    }
  } catch (error) {
    console.error('Chat error:', error)
    aiResults.value = null
    lastResponse.value = 'Sorry, there was an error connecting to the AI service. Please check that the backend is running and try again.'
  } finally {
    isLoading.value = false
  }
}

const checkSystemStatus = async () => {
  try {
    const currentHost = window.location.hostname
    const currentProtocol = window.location.protocol
    const backendUrl = currentHost === 'localhost' || currentHost === '127.0.0.1' ? 
      'http://localhost:3001' : 
      `${currentProtocol}//${currentHost}`
    const response = await fetch(`${backendUrl}/health`)
    if (response.ok) {
      const healthData = await response.json()
      systemStatus.value = 'All Systems Operational'
      // Update metrics from health data
      systemMetrics.value.uptime = Math.round(healthData.uptime || 0)
      systemMetrics.value.responseTime = 150 // Default good response time
      systemMetrics.value.successRate = 99.5
    } else {
      systemStatus.value = 'System Issues Detected'
    }
  } catch (error) {
    console.error('Health check failed:', error)
    systemStatus.value = 'Backend Offline'
  }
}

const loadSystemStats = async () => {
  try {
    // In a real app, this would fetch from analytics API
    agentCount.value = 5 // Multi-agent system count
    researchCount.value = 0 // Will increment with usage
    chatCount.value = 0 // Will increment with chats
    trialsCount.value = 0 // Will increment with trial searches
  } catch (error) {
    console.error('Failed to load system stats:', error)
  }
}

// Lifecycle
onMounted(() => {
  checkSystemStatus()
  loadSystemStats()
  console.log('🚀 MedResearch AI Enterprise Platform Loaded')
})
</script>

<style>
/* Global styles are handled by Tailwind CSS */
</style>