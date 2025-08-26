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
              <span class="text-sm text-gray-600">{{ systemStatus }}</span>
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
              <p class="text-2xl font-semibold text-gray-900">5</p>
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
        <!-- Chat Interface -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">AI Research Assistant</h3>
          <div class="space-y-4">
            <div class="bg-gray-50 rounded p-3">
              <p class="text-sm text-gray-600">Ask me about medical research, clinical trials, or get insights from the latest papers.</p>
            </div>
            <div class="flex space-x-2">
              <input 
                v-model="chatMessage" 
                @keyup.enter="sendMessage"
                type="text" 
                placeholder="Ask about recent cancer immunotherapy research..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
              <button 
                @click="sendMessage"
                :disabled="isLoading"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {{ isLoading ? '...' : 'Send' }}
              </button>
            </div>
            <div v-if="lastResponse" class="bg-blue-50 rounded p-3">
              <p class="text-sm text-gray-800">{{ lastResponse }}</p>
            </div>
          </div>
        </div>

        <!-- Research Papers -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Latest Research</h3>
          <div class="space-y-4">
            <div v-for="paper in samplePapers" :key="paper.id" class="border-l-4 border-blue-500 pl-4">
              <h4 class="font-medium text-gray-900 text-sm">{{ paper.title }}</h4>
              <p class="text-xs text-gray-500 mt-1">{{ paper.journal }} • {{ paper.year }}</p>
            </div>
            <button class="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              View All Papers
            </button>
          </div>
        </div>
      </div>

      <!-- System Info -->
      <div class="mt-8 bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm">Frontend</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm">Backend API</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm">Database</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span class="text-sm">OpenAI (Mock Mode)</span>
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
const systemStatus = ref('Online')
const researchCount = ref(1247)
const chatCount = ref(89)
const trialsCount = ref(456)

// Sample data
const samplePapers = ref([
  {
    id: 1,
    title: 'Novel mRNA Vaccine Platforms for Cancer Immunotherapy',
    journal: 'Nature Medicine',
    year: '2024'
  },
  {
    id: 2,
    title: 'AI-Driven Drug Discovery in Oncology: A Systematic Review',
    journal: 'Cell',
    year: '2024'
  },
  {
    id: 3,
    title: 'Precision Medicine Approaches in Alzheimer\'s Disease',
    journal: 'Science Translational Medicine',
    year: '2024'
  }
])

// Methods
const sendMessage = async () => {
  if (!chatMessage.value.trim()) return
  
  isLoading.value = true
  const message = chatMessage.value
  chatMessage.value = ''
  
  try {
    // Mock response for now
    await new Promise(resolve => setTimeout(resolve, 1000))
    lastResponse.value = `Thank you for your question about "${message}". The AI research system is processing your query and will provide insights from the latest medical literature. This is a demo response while the full AI system is being initialized.`
  } catch (error) {
    lastResponse.value = 'Sorry, there was an error processing your request. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const checkSystemStatus = async () => {
  try {
    const response = await fetch('/api/health')
    if (response.ok) {
      systemStatus.value = 'All Systems Operational'
    }
  } catch (error) {
    systemStatus.value = 'Backend Offline'
  }
}

// Lifecycle
onMounted(() => {
  checkSystemStatus()
  console.log('🚀 MedResearch AI Application Loaded')
})
</script>

<style>
/* Global styles are handled by Tailwind CSS */
</style>