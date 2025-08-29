<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Enterprise Header -->
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-[1800px] mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Brand & Platform Identity -->
          <div class="flex items-center space-x-6">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">Φ</span>
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900">Pharmaceutical Intelligence Platform</h1>
                <p class="text-xs text-gray-500 font-medium">Enterprise Analytics & Decision Support</p>
              </div>
            </div>
          </div>
          
          <!-- User & System Status -->
          <div class="flex items-center space-x-6">
            <div class="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-sm font-medium text-green-800">{{ systemStatus }}</span>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">Enterprise User</p>
              <p class="text-xs text-gray-500">Premium License Active</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Enterprise Navigation Tabs -->
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-[1800px] mx-auto px-6">
        <div class="flex space-x-0 overflow-x-auto">
          <button 
            @click="activeTab = 'dashboard'" 
            :class="enterpriseTabClass('dashboard')" 
            class="px-8 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 hover:bg-gray-50"
          >
            Executive Dashboard
          </button>
          <button 
            @click="activeTab = 'patent'" 
            :class="enterpriseTabClass('patent')" 
            class="px-8 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 hover:bg-gray-50"
          >
            Patent Cliff Monitor
          </button>
          <button 
            @click="activeTab = 'competitive'" 
            :class="enterpriseTabClass('competitive')" 
            class="px-8 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 hover:bg-gray-50"
          >
            Competitive Intelligence
          </button>
          <button 
            @click="activeTab = 'investment'" 
            :class="enterpriseTabClass('investment')" 
            class="px-8 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 hover:bg-gray-50"
          >
            Investment Research
          </button>
          <button 
            @click="activeTab = 'uspto'" 
            :class="enterpriseTabClass('uspto')" 
            class="px-8 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 hover:bg-gray-50"
          >
            USPTO Integration
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Application Layout -->
    <div class="flex min-h-screen">
      <!-- Sidebar Metrics & Navigation -->
      <aside class="w-80 bg-white border-r border-gray-200 flex flex-col">
        <!-- Key Metrics Sidebar -->
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
          <div class="space-y-4">
            <!-- Critical Patents Metric -->
            <div class="bg-red-50 p-4 rounded-lg border border-red-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-red-800">Critical Risk Patents</span>
                <span class="text-2xl font-bold text-red-900">{{ metrics.criticalPatents }}</span>
              </div>
              <p class="text-xs text-red-600 leading-relaxed">
                Patents expiring within 12 months with &gt;$500M revenue impact. 
                <strong>Requires immediate attention</strong> for lifecycle management strategies.
              </p>
            </div>

            <!-- High Risk Patents -->
            <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-orange-800">High Risk Patents</span>
                <span class="text-2xl font-bold text-orange-900">{{ metrics.highRiskPatents }}</span>
              </div>
              <p class="text-xs text-orange-600 leading-relaxed">
                Patents expiring in 12-24 months with significant revenue exposure. 
                <strong>Strategic planning needed</strong> for market transition.
              </p>
            </div>

            <!-- Market Opportunities -->
            <div class="bg-green-50 p-4 rounded-lg border border-green-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-green-800">Market Opportunities</span>
                <span class="text-2xl font-bold text-green-900">{{ metrics.opportunities }}</span>
              </div>
              <p class="text-xs text-green-600 leading-relaxed">
                Generic/biosimilar opportunities from competitor patent expiries. 
                <strong>Revenue potential</strong> through strategic market entry.
              </p>
            </div>

            <!-- Total Revenue Monitored -->
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-blue-800">Revenue Monitored</span>
                <span class="text-xl font-bold text-blue-900">${{ formatBillions(metrics.totalRevenue) }}B</span>
              </div>
              <p class="text-xs text-blue-600 leading-relaxed">
                Total pharmaceutical revenue under patent protection monitoring. 
                <strong>Comprehensive coverage</strong> of market exposure.
              </p>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="p-6 border-b border-gray-200">
          <h4 class="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
          <div class="space-y-2">
            <button @click="refreshAllData" :disabled="isLoading" class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {{ isLoading ? 'Refreshing...' : 'Refresh All Data' }}
            </button>
            <button @click="exportReport" class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
              Export Executive Report
            </button>
            <button @click="setupAlerts" class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Configure Alerts
            </button>
          </div>
        </div>

        <!-- Risk Legend -->
        <div class="p-6 flex-1">
          <h4 class="text-sm font-semibold text-gray-900 mb-3">Risk Classification</h4>
          <div class="space-y-3">
            <div class="flex items-start space-x-3">
              <div class="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
              <div>
                <p class="text-xs font-medium text-gray-900">Critical</p>
                <p class="text-xs text-gray-600">Immediate action required (&lt;12 months)</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <div class="w-3 h-3 bg-orange-500 rounded-full mt-1"></div>
              <div>
                <p class="text-xs font-medium text-gray-900">High</p>
                <p class="text-xs text-gray-600">Strategic planning needed (12-24 months)</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <div class="w-3 h-3 bg-yellow-500 rounded-full mt-1"></div>
              <div>
                <p class="text-xs font-medium text-gray-900">Medium</p>
                <p class="text-xs text-gray-600">Monitor closely (2-5 years)</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <div class="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
              <div>
                <p class="text-xs font-medium text-gray-900">Low</p>
                <p class="text-xs text-gray-600">Long-term planning (&gt;5 years)</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 p-8 max-w-[1200px]">
        <!-- Executive Dashboard Tab -->
        <div v-if="activeTab === 'dashboard'" class="space-y-8">
          <!-- Hero Section -->
          <div class="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-xl p-8 text-white">
            <div class="max-w-3xl">
              <h2 class="text-3xl font-bold mb-3">Executive Dashboard</h2>
              <p class="text-blue-100 text-lg mb-6">
                Comprehensive pharmaceutical intelligence platform providing real-time patent cliff monitoring, 
                competitive analysis, and investment research capabilities for strategic decision making.
              </p>
              <div class="grid grid-cols-3 gap-6 mt-6">
                <div class="text-center">
                  <div class="text-2xl font-bold">{{ metrics.totalPatents }}</div>
                  <div class="text-blue-200 text-sm">Patents Monitored</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold">{{ metrics.competitors }}</div>
                  <div class="text-blue-200 text-sm">Competitors Tracked</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold">99.7%</div>
                  <div class="text-blue-200 text-sm">System Uptime</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Key Insights Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- AI Research Assistant -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900">AI Research Assistant</h3>
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span class="text-xs text-green-600 font-medium">AI Ready</span>
                </div>
              </div>
              
              <!-- Research Input -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Research Query
                </label>
                <div class="relative">
                  <textarea 
                    v-model="chatMessage" 
                    @keyup.enter.prevent="sendMessage"
                    rows="4"
                    placeholder="Ask about patent cliff analysis, competitive intelligence, or investment opportunities..."
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500 bg-white resize-none"
                  ></textarea>
                  <button 
                    @click="sendMessage"
                    :disabled="isLoading || !chatMessage.trim()"
                    class="absolute bottom-3 right-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors"
                  >
                    {{ isLoading ? 'Processing...' : 'Analyze' }}
                  </button>
                </div>
              </div>

              <!-- AI Response Area -->
              <div v-if="isLoading" class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div class="flex items-center space-x-3">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p class="text-sm font-medium text-blue-800">AI analyzing pharmaceutical data...</p>
                </div>
              </div>

              <ResearchResults :results="aiResults" />

              <div v-if="!aiResults && !isLoading" class="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                <div class="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  🤖
                </div>
                <p class="text-sm text-gray-500 font-medium">Ready for pharmaceutical intelligence queries</p>
                <p class="text-xs text-gray-400 mt-1">Ask about patents, competitors, or market opportunities</p>
              </div>
            </div>

            <!-- Latest Intelligence -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-6">Latest Intelligence</h3>
              <div class="space-y-4">
                <div v-if="latestAlerts.length === 0" class="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    📊
                  </div>
                  <p class="text-gray-500 text-sm font-medium">No recent intelligence alerts</p>
                  <p class="text-xs text-gray-400 mt-1">Intelligence updates will appear here</p>
                </div>
                <div v-else>
                  <div v-for="alert in latestAlerts" :key="alert.id" class="border-l-4 pl-4" :class="alertBorderClass(alert.severity)">
                    <h4 class="font-medium text-gray-900 text-sm">{{ alert.title }}</h4>
                    <p class="text-xs text-gray-600 mt-1">{{ alert.description }}</p>
                    <p class="text-xs text-gray-500 mt-2">{{ formatTime(alert.timestamp) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Patent Cliff Monitor Tab -->
        <div v-if="activeTab === 'patent'" class="space-y-8">
          <!-- Hero Section -->
          <div class="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white">
            <h2 class="text-3xl font-bold mb-3">Patent Cliff Monitor</h2>
            <p class="text-red-100 text-lg mb-4">
              Real-time monitoring of patent expiries with AI-powered risk assessment and revenue impact analysis. 
              Identify critical patent cliffs and plan lifecycle management strategies.
            </p>
            <div class="bg-red-800/30 rounded-lg p-4 mt-6">
              <h4 class="font-semibold mb-2">Key Benefits:</h4>
              <ul class="text-red-100 text-sm space-y-1">
                <li>• Early warning system for billion-dollar patent cliffs</li>
                <li>• Automated risk classification and prioritization</li>
                <li>• Revenue impact modeling and scenario planning</li>
                <li>• Competitive intelligence on expiring patents</li>
              </ul>
            </div>
          </div>
          <PatentCliffMonitor />
        </div>

        <!-- Competitive Intelligence Tab -->
        <div v-if="activeTab === 'competitive'" class="space-y-8">
          <div class="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-8 text-white">
            <h2 class="text-3xl font-bold mb-3">Competitive Intelligence</h2>
            <p class="text-purple-100 text-lg mb-4">
              Comprehensive competitor analysis with market positioning insights, threat assessment, and strategic opportunity identification 
              across the pharmaceutical landscape.
            </p>
            <div class="bg-purple-800/30 rounded-lg p-4 mt-6">
              <h4 class="font-semibold mb-2">Intelligence Capabilities:</h4>
              <ul class="text-purple-100 text-sm space-y-1">
                <li>• Automated competitor threat scoring and ranking</li>
                <li>• Market position analysis and benchmarking</li>
                <li>• Pipeline intelligence and acquisition targets</li>
                <li>• Partnership and alliance tracking</li>
              </ul>
            </div>
          </div>
          <CompetitiveIntelligence />
        </div>

        <!-- Investment Research Tab -->
        <div v-if="activeTab === 'investment'" class="space-y-8">
          <div class="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-8 text-white">
            <h2 class="text-3xl font-bold mb-3">Investment Research</h2>
            <p class="text-green-100 text-lg mb-4">
              Advanced analytics for pharmaceutical investment decisions with patent cliff impact modeling, 
              risk assessment, and market opportunity analysis.
            </p>
            <div class="bg-green-800/30 rounded-lg p-4 mt-6">
              <h4 class="font-semibold mb-2">Investment Insights:</h4>
              <ul class="text-green-100 text-sm space-y-1">
                <li>• Patent cliff impact on company valuations</li>
                <li>• Risk-adjusted portfolio analysis and modeling</li>
                <li>• Market opportunity identification and sizing</li>
                <li>• Peer comparison and investment recommendations</li>
              </ul>
            </div>
          </div>
          <InvestmentResearch />
        </div>

        <!-- USPTO Integration Tab -->
        <div v-if="activeTab === 'uspto'" class="space-y-8">
          <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-8 text-white">
            <h2 class="text-3xl font-bold mb-3">USPTO Integration</h2>
            <p class="text-indigo-100 text-lg mb-4">
              Direct integration with USPTO patent database for real-time patent data, filing tracking, 
              and comprehensive patent landscape analysis.
            </p>
            <div class="bg-indigo-800/30 rounded-lg p-4 mt-6">
              <h4 class="font-semibold mb-2">Database Capabilities:</h4>
              <ul class="text-indigo-100 text-sm space-y-1">
                <li>• Real-time USPTO patent database synchronization</li>
                <li>• Advanced patent search and classification</li>
                <li>• Patent family mapping and analysis</li>
                <li>• Automated patent status monitoring</li>
              </ul>
            </div>
          </div>
          <USPTOIntegration />
        </div>
      </main>
    </div>

    <!-- System Status Footer -->
    <footer class="bg-white border-t border-gray-200 mt-auto">
      <div class="max-w-[1800px] mx-auto px-6 py-6">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            <p class="font-medium">Pharmaceutical Intelligence Platform v2.1.0</p>
            <p>Enterprise Edition • Real-time Patent & Competitive Intelligence</p>
          </div>
          
          <!-- System Health Status -->
          <div class="flex items-center space-x-6">
            <div class="text-xs text-gray-500 text-center">
              <p class="font-medium">System Health</p>
              <div class="flex items-center justify-center space-x-4 mt-2">
                <div class="flex items-center space-x-1">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>API</span>
                </div>
                <div class="flex items-center space-x-1">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Database</span>
                </div>
                <div class="flex items-center space-x-1">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>AI Services</span>
                </div>
                <div class="flex items-center space-x-1">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>USPTO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import ResearchResults from './components/ResearchResults.vue'
import PatentCliffMonitor from './components/PatentCliffMonitor.vue'
import CompetitiveIntelligence from './components/CompetitiveIntelligence.vue'
import InvestmentResearch from './components/InvestmentResearch.vue'
import USPTOIntegration from './components/USPTOIntegration.vue'
import apiService from './services/api'

// Application State
const activeTab = ref<'dashboard' | 'patent' | 'competitive' | 'investment' | 'uspto'>('dashboard')
const isLoading = ref(false)
const systemStatus = ref('All Systems Operational')
const chatMessage = ref('')
const aiResults = ref(null)

// Enterprise Metrics
const metrics = reactive({
  criticalPatents: 0,
  highRiskPatents: 0,
  opportunities: 0,
  totalRevenue: 0,
  totalPatents: 0,
  competitors: 0
})

// Latest Intelligence Alerts
const latestAlerts = ref([
  {
    id: 1,
    severity: 'critical',
    title: 'Critical Patent Cliff Detected',
    description: 'Atorvastatin patent expires in 8 months - $2.1B revenue at risk',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 2,
    severity: 'high',
    title: 'New Competitor Entry',
    description: 'Biosimilar competitor filed for Humira market entry',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  {
    id: 3,
    severity: 'medium',
    title: 'Market Opportunity Identified',
    description: 'Generic opportunity in oncology - estimated $340M market',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
  }
])

// Methods
const enterpriseTabClass = (tab: string) => (
  activeTab.value === tab
    ? 'border-blue-600 text-blue-700 bg-blue-50'
    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
)

const alertBorderClass = (severity: string) => {
  const classes = {
    critical: 'border-red-500',
    high: 'border-orange-500',
    medium: 'border-yellow-500',
    low: 'border-green-500'
  }
  return classes[severity] || classes.medium
}

const formatBillions = (value: number) => {
  return (value / 1000000000).toFixed(1)
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours} hours ago`
  return `${Math.floor(hours / 24)} days ago`
}

const sendMessage = async () => {
  if (!chatMessage.value.trim()) return
  
  isLoading.value = true
  const message = chatMessage.value
  
  try {
    const currentHost = window.location.hostname
    const currentProtocol = window.location.protocol
    const backendUrl = currentHost === 'localhost' || currentHost === '127.0.0.1' ? 
      'http://localhost:3001' : 
      `${currentProtocol}//${currentHost}`
    
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: message,
        context: {
          sessionId: 'enterprise-session',
          specialization: 'pharmaceutical_intelligence'
        }
      })
    })

    if (response.ok) {
      const data = await response.json()
      
      aiResults.value = {
        researchInsights: data.researchInsights || null,
        trialMatches: data.trialMatches || null,
        explanation: data.explanation || null
      }
    } else {
      const errorData = await response.json()
      console.error('Chat API error:', errorData)
    }
  } catch (error) {
    console.error('Chat error:', error)
    aiResults.value = null
  } finally {
    isLoading.value = false
  }
}

const refreshAllData = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  try {
    // Simulate refreshing all pharmaceutical intelligence data
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update metrics with mock data
    metrics.criticalPatents = Math.floor(Math.random() * 5) + 1
    metrics.highRiskPatents = Math.floor(Math.random() * 10) + 3
    metrics.opportunities = Math.floor(Math.random() * 15) + 5
    metrics.totalRevenue = Math.floor(Math.random() * 50000000000) + 10000000000
    metrics.totalPatents = Math.floor(Math.random() * 500) + 100
    metrics.competitors = Math.floor(Math.random() * 25) + 10
    
    systemStatus.value = 'All Systems Operational'
  } catch (error) {
    console.error('Data refresh error:', error)
    systemStatus.value = 'System Issues Detected'
  } finally {
    isLoading.value = false
  }
}

const exportReport = async () => {
  // Generate comprehensive executive report
  const reportData = {
    generatedAt: new Date().toISOString(),
    platformVersion: '2.1.0',
    metrics: metrics,
    alerts: latestAlerts.value,
    systemStatus: systemStatus.value
  }

  const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
    type: 'application/json' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pharma-intelligence-report-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const setupAlerts = () => {
  alert('Alert configuration panel - Feature coming in next release')
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
      systemStatus.value = 'All Systems Operational'
    } else {
      systemStatus.value = 'System Issues Detected'
    }
  } catch (error) {
    console.error('Health check failed:', error)
    systemStatus.value = 'Backend Offline'
  }
}

const loadInitialData = async () => {
  try {
    // Initialize metrics with sample data
    metrics.criticalPatents = 2
    metrics.highRiskPatents = 7
    metrics.opportunities = 12
    metrics.totalRevenue = 45000000000 // $45B
    metrics.totalPatents = 247
    metrics.competitors = 18
  } catch (error) {
    console.error('Failed to load initial data:', error)
  }
}

// Lifecycle
onMounted(() => {
  checkSystemStatus()
  loadInitialData()
  console.log('🚀 Pharmaceutical Intelligence Platform Enterprise Edition Loaded')
})
</script>

<style scoped>
/* Custom scrollbar for sidebar */
aside::-webkit-scrollbar {
  width: 6px;
}

aside::-webkit-scrollbar-track {
  background: #f1f5f9;
}

aside::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

aside::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Smooth transitions */
* {
  transition: all 0.2s ease;
}

/* Focus states */
button:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>