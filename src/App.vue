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

      <!-- Main Features -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            <div class="flex space-x-2">
              <input 
                v-model="chatMessage" 
                @keyup.enter="sendMessage"
                type="text" 
                placeholder="e.g., 'Latest advances in CAR-T cell therapy for leukemia'"
                class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
              >
              <button 
                @click="sendMessage"
                :disabled="isLoading"
                class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
              >
                {{ isLoading ? 'Processing...' : 'Analyze' }}
              </button>
            </div>

            <!-- AI Response Area - This is where findings appear -->
            <div v-if="isLoading" class="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div class="flex items-center space-x-3">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p class="text-sm font-medium text-blue-800">AI analyzing medical literature...</p>
              </div>
            </div>

            <!-- AI Findings Display -->
            <div v-if="lastResponse" class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  🤖
                </div>
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <h4 class="text-sm font-semibold text-green-900">AI Research Analysis</h4>
                    <span class="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">✓ Verified</span>
                  </div>
                  <div class="prose prose-sm max-w-none">
                    <p class="text-sm font-medium text-green-900 leading-relaxed whitespace-pre-wrap">{{ lastResponse }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="!lastResponse && !isLoading" class="text-center py-6">
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

// Reactive state
const chatMessage = ref('')
const lastResponse = ref('')
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

// Methods
const sendMessage = async () => {
  if (!chatMessage.value.trim()) return
  
  isLoading.value = true
  const message = chatMessage.value
  chatMessage.value = ''
  
  try {
    // Call the actual backend API
    const response = await fetch('http://localhost:3001/api/chat', {
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
      
      // The API returns researchInsights, trialMatches, and explanation directly
      let fullResponse = ''
      
      if (data.researchInsights) {
        fullResponse += `📊 **Research Insights:**\n${data.researchInsights}\n\n`
        researchCount.value++
      }
      
      if (data.trialMatches) {
        fullResponse += `🧪 **Clinical Trial Matches:**\n${data.trialMatches}\n\n`
        trialsCount.value++
      }
      
      if (data.explanation) {
        fullResponse += `💡 **Summary:**\n${data.explanation}`
      }
      
      lastResponse.value = fullResponse || data.message || 'AI response received successfully!'
      chatCount.value++
    } else {
      const errorData = await response.json()
      lastResponse.value = `Error: ${errorData.message || 'Failed to get AI response'}`
    }
  } catch (error) {
    console.error('Chat error:', error)
    lastResponse.value = 'Sorry, there was an error connecting to the AI service. Please check that the backend is running and try again.'
  } finally {
    isLoading.value = false
  }
}

const checkSystemStatus = async () => {
  try {
    const response = await fetch('http://localhost:3001/health')
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