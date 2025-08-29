<template>
  <div class="research-insights bg-white min-h-screen">
    <!-- Sticky Action Bar -->
    <div class="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Research Insights</h1>
            <p class="text-gray-600 mt-1">Comprehensive analysis combining clinical trials, patents, and financial data</p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="runAnalysis"
              :disabled="loading || !searchQuery.trim()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ loading ? 'Analyzing...' : 'Run Analysis' }}</span>
            </button>
            <button
              v-if="insights"
              @click="exportInsights"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Interface -->
    <div class="px-6 py-6 bg-gray-50 border-b border-gray-200">
      <div class="max-w-4xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Research Query</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Enter drug name, company, or therapeutic area..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @keyup.enter="runAnalysis"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Therapeutic Area</label>
            <select
              v-model="filters.therapeuticArea"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Areas</option>
              <option value="oncology">Oncology</option>
              <option value="cardiology">Cardiology</option>
              <option value="neurology">Neurology</option>
              <option value="immunology">Immunology</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Trial Phase</label>
            <select
              v-model="filters.phase"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Phases</option>
              <option value="phase_1">Phase I</option>
              <option value="phase_2">Phase II</option>
              <option value="phase_3">Phase III</option>
              <option value="phase_4">Phase IV</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="mx-6 mt-6">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 class="text-sm font-medium text-red-800">Analysis failed</h3>
              <p class="text-sm text-red-700 mt-1">{{ error }}</p>
            </div>
          </div>
          <button
            @click="clearError"
            class="text-red-400 hover:text-red-600"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="px-6 py-12">
      <div class="max-w-4xl mx-auto">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Analyzing research data...</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!insights && !loading" class="px-6 py-12">
      <div class="max-w-4xl mx-auto text-center">
        <div class="mx-auto h-24 w-24 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
        </div>
        <h3 class="mt-4 text-lg font-medium text-gray-900">Ready for Research Analysis</h3>
        <p class="mt-2 text-gray-600">Enter a research query above to get comprehensive insights combining clinical trials, patents, and financial data.</p>
        <div class="mt-6">
          <div class="text-sm text-gray-500">
            <p>Try searching for:</p>
            <div class="mt-2 flex flex-wrap justify-center gap-2">
              <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Keytruda</span>
              <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Pfizer</span>
              <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Oncology</span>
              <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Immunotherapy</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="insights" class="px-6 py-6">
      <div class="max-w-7xl mx-auto space-y-8">
        <!-- Market Opportunity Score -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900">Market Opportunity Score</h2>
            <div class="text-right">
              <div class="text-3xl font-bold text-blue-600">{{ insights.marketOpportunity.total }}/100</div>
              <div class="text-sm text-blue-600">Overall Score</div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="(factor, key) in insights.marketOpportunity.factors" :key="key" class="bg-white rounded-lg p-4 border border-blue-200">
              <div class="text-sm font-medium text-gray-600 capitalize">{{ key.replace(/([A-Z])/g, ' $1') }}</div>
              <div class="text-2xl font-bold text-blue-600 mt-1">{{ factor.score }}/100</div>
              <div class="text-xs text-gray-500 mt-1">
                <span v-if="key === 'trials'">{{ factor.phase3Count }} Phase III, {{ factor.recruitingCount }} recruiting</span>
                <span v-else-if="key === 'patents'">{{ factor.totalCount }} total, {{ factor.recentCount }} recent</span>
                <span v-else-if="key === 'financials'">Market cap: ${{ formatBillions(factor.marketCap) }}B</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Key Insights Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Therapeutic Area</h3>
                <p class="text-sm text-gray-600">{{ insights.insights.therapeuticArea }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Development Stage</h3>
                <p class="text-sm text-gray-600 capitalize">{{ insights.insights.developmentStage }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Patent Risk</h3>
                <p class="text-sm text-gray-600 capitalize">{{ insights.insights.patentLandscape.risk }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Market Maturity</h3>
                <p class="text-sm text-gray-600 capitalize">{{ insights.insights.marketMaturity }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Regulatory Path</h3>
                <p class="text-sm text-gray-600 capitalize">{{ insights.insights.regulatoryPath.replace(/_/g, ' ') }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Investment Profile</h3>
                <p class="text-sm text-gray-600 capitalize">{{ insights.insights.investmentProfile.replace(/_/g, ' ') }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Competitive Landscape -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-6">Competitive Landscape</h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Trial Sponsors</h3>
              <div class="space-y-3">
                <div v-for="sponsor in insights.competitiveLandscape.topSponsors" :key="sponsor.name" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div class="font-medium text-gray-900">{{ sponsor.name }}</div>
                    <div class="text-sm text-gray-600">{{ sponsor.trials }} trials, {{ sponsor.totalEnrollment.toLocaleString() }} enrollment</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-blue-600">{{ sponsor.phases.join(', ') }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Patent Holders</h3>
              <div class="space-y-3">
                <div v-for="holder in insights.competitiveLandscape.topPatentHolders" :key="holder.name" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div class="font-medium text-gray-900">{{ holder.name }}</div>
                    <div class="text-sm text-gray-600">{{ holder.totalPatents }} total patents</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-green-600">{{ holder.recentPatents }} recent</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Strategic Recommendations -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-6">Strategic Recommendations</h2>
          <div class="space-y-4">
            <div v-for="rec in insights.recommendations" :key="rec.title" class="p-4 border-l-4 rounded-r-lg" :class="{
              'border-red-400 bg-red-50': rec.priority === 'high',
              'border-yellow-400 bg-yellow-50': rec.priority === 'medium',
              'border-green-400 bg-green-50': rec.priority === 'low'
            }">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" :class="{
                    'bg-red-500': rec.priority === 'high',
                    'bg-yellow-500': rec.priority === 'medium',
                    'bg-green-500': rec.priority === 'low'
                  }">
                    {{ rec.priority === 'high' ? '!' : rec.priority === 'medium' ? '•' : '✓' }}
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900">{{ rec.title }}</h3>
                  <p class="text-gray-600 mt-1">{{ rec.description }}</p>
                  <div class="mt-3">
                    <div class="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</div>
                    <ul class="space-y-1">
                      <li v-for="action in rec.actions" :key="action" class="text-sm text-gray-600 flex items-center space-x-2">
                        <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        <span>{{ action }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Sources -->
        <div class="bg-gray-50 rounded-xl p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Data Sources</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-gray-900">Clinical Trials</div>
                  <div class="text-sm text-gray-600">{{ insights.dataSources.trials.count }} trials from {{ insights.dataSources.trials.source }}</div>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-gray-900">Patents</div>
                  <div class="text-sm text-gray-600">{{ insights.dataSources.patents.count }} patents from {{ insights.dataSources.patents.source }}</div>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-gray-900">Financial Data</div>
                  <div class="text-sm text-gray-600">{{ insights.dataSources.financials.available ? 'Available' : 'Not available' }} from {{ insights.dataSources.financials.source }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { exportToCSV } from '../utils/export.js'

// Reactive state
const searchQuery = ref('')
const loading = ref(false)
const error = ref(null)
const insights = ref(null)

const filters = reactive({
  therapeuticArea: '',
  phase: '',
  status: '',
  country: ''
})

// Methods
const runAnalysis = async () => {
  if (!searchQuery.value.trim()) return
  
  loading.value = true
  error.value = null
  
  try {
    const params = new URLSearchParams({
      query: searchQuery.value,
      ...filters
    })
    
    const response = await fetch(`/api/research-insights/comprehensive?${params}`)
    const data = await response.json()
    
    if (data.success) {
      insights.value = data.data
    } else {
      throw new Error(data.message || 'Analysis failed')
    }
  } catch (err) {
    error.value = err.message || 'Failed to run analysis'
    console.error('Analysis error:', err)
  } finally {
    loading.value = false
  }
}

const clearError = () => {
  error.value = null
}

const exportInsights = () => {
  if (!insights.value) return
  
  const exportData = [
    {
      'Query': insights.value.query,
      'Market Opportunity Score': insights.value.marketOpportunity.total,
      'Therapeutic Area': insights.value.insights.therapeuticArea,
      'Development Stage': insights.value.insights.developmentStage,
      'Patent Risk': insights.value.insights.patentLandscape.risk,
      'Market Maturity': insights.value.insights.marketMaturity,
      'Regulatory Path': insights.value.insights.regulatoryPath,
      'Investment Profile': insights.value.insights.investmentProfile
    }
  ]
  
  exportToCSV(`research-insights-${insights.value.query}-${new Date().toISOString().split('T')[0]}.csv`, exportData)
}

const formatBillions = (value) => {
  if (!value) return '0'
  return (value / 1000000000).toFixed(1)
}
</script>

<style scoped>
.research-insights {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>