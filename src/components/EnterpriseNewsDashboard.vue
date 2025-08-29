<template>
  <div class="enterprise-news-dashboard">
    <!-- Executive Summary -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total News Items</p>
            <p class="text-2xl font-bold text-gray-900">{{ newsSummary.total }}</p>
          </div>
          <div class="p-3 bg-blue-100 rounded-full">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-sm text-gray-500">Last 24 hours</span>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">High Priority</p>
            <p class="text-2xl font-bold text-red-600">{{ newsSummary.highPriority }}</p>
          </div>
          <div class="p-3 bg-red-100 rounded-full">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-sm text-gray-500">Requires attention</span>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Companies Mentioned</p>
            <p class="text-2xl font-bold text-green-600">{{ newsSummary.companies.length }}</p>
          </div>
          <div class="p-3 bg-green-100 rounded-full">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-sm text-gray-500">Top mentions</span>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Regulatory Updates</p>
            <p class="text-2xl font-bold text-purple-600">{{ newsSummary.regulatory }}</p>
          </div>
          <div class="p-3 bg-purple-100 rounded-full">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-sm text-gray-500">FDA, EMA, etc.</span>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
      <div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <h3 class="text-xl font-semibold text-gray-900">News Intelligence Dashboard</h3>
          <div class="flex gap-2">
            <button
              @click="refreshNews"
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              {{ loading ? 'Refreshing...' : 'Refresh News' }}
            </button>
            <button
              @click="exportNews"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Export Report
            </button>
            <button
              @click="showTrendingModal = true"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              Trending Analysis
            </button>
          </div>
        </div>
        
        <div class="flex gap-2 w-full lg:w-auto">
          <select
            v-model="selectedCategory"
            @change="filterNews"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="pharmaceutical">Pharmaceutical</option>
            <option value="patents">Patents & IP</option>
            <option value="clinicalTrials">Clinical Trials</option>
            <option value="regulatory">Regulatory & FDA</option>
            <option value="financial">Financial & Market</option>
          </select>
          <select
            v-model="selectedRelevance"
            @change="filterNews"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Relevance</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input
            v-model="searchQuery"
            @input="debounceSearch"
            placeholder="Search news, companies, drugs..."
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[250px]"
          />
        </div>
      </div>
    </div>

    <!-- Company Mentions Summary -->
    <div class="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
      <h4 class="text-lg font-semibold text-gray-900 mb-4">Top Company Mentions</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div
          v-for="company in topCompanies"
          :key="company.name"
          class="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          @click="filterByCompany(company.name)"
        >
          <div class="text-lg font-semibold text-gray-900">{{ company.name }}</div>
          <div class="text-sm text-gray-600">{{ company.count }} mentions</div>
          <div class="text-xs text-gray-500 mt-1">{{ company.lastMention }}</div>
        </div>
      </div>
    </div>

    <!-- News Grid -->
    <div class="grid gap-6">
      <div
        v-for="item in filteredNews"
        :key="item.id"
        class="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-2xl">{{ getCategoryIcon(item.feedCategory) }}</span>
              <h4 class="text-lg font-semibold text-gray-900">
                <a
                  :href="item.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-blue-600 transition-colors"
                >
                  {{ item.title }}
                </a>
              </h4>
            </div>
            <p class="text-gray-600 mb-3 line-clamp-3">{{ item.description }}</p>
            
            <div class="flex flex-wrap gap-2 mb-3">
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  getRelevanceClass(item.relevance)
                ]"
              >
                {{ item.relevance }} priority
              </span>
              <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {{ item.feedCategory }}
              </span>
              <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {{ item.feedSource }}
              </span>
              <span v-if="item.extractedInfo?.regulatory" class="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                Regulatory
              </span>
            </div>
          </div>
          
          <div class="text-right text-sm text-gray-500 ml-4 min-w-[100px]">
            <div>{{ formatTimeAgo(item.pubDate) }}</div>
            <div class="text-xs">{{ item.author }}</div>
          </div>
        </div>
        
        <!-- Extracted Intelligence -->
        <div v-if="item.extractedInfo" class="bg-gray-50 rounded-lg p-4">
          <h5 class="font-medium text-gray-900 mb-3">Intelligence Summary</h5>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div v-if="item.extractedInfo.type" class="text-gray-600">
              <span class="font-medium">Type:</span> {{ formatType(item.extractedInfo.type) }}
            </div>
            <div v-if="item.extractedInfo.companies?.length" class="text-gray-600">
              <span class="font-medium">Companies:</span> {{ item.extractedInfo.companies.join(', ') }}
            </div>
            <div v-if="item.extractedInfo.drugs?.length" class="text-gray-600">
              <span class="font-medium">Drugs:</span> {{ item.extractedInfo.drugs.join(', ') }}
            </div>
            <div v-if="item.extractedInfo.phases?.length" class="text-gray-600">
              <span class="font-medium">Phases:</span> {{ item.extractedInfo.phases.join(', ') }}
            </div>
            <div v-if="item.extractedInfo.conditions?.length" class="text-gray-600">
              <span class="font-medium">Conditions:</span> {{ item.extractedInfo.conditions.join(', ') }}
            </div>
            <div v-if="item.extractedInfo.marketImpact" class="text-gray-600">
              <span class="font-medium">Market Impact:</span> {{ item.extractedInfo.marketImpact }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredNews.length === 0 && !loading" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <svg class="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No News Found</h3>
      <p class="text-gray-500">
        {{ searchQuery ? `No news matching "${searchQuery}" found.` : 'No news available for the selected filters.' }}
      </p>
    </div>

    <!-- Trending Analysis Modal -->
    <div v-if="showTrendingModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">🔥 Trending Analysis Report</h3>
          <button
            @click="showTrendingModal = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Trending Topics -->
          <div>
            <h4 class="text-lg font-medium text-gray-900 mb-3">Top Trending Topics</h4>
            <div class="space-y-2">
              <div
                v-for="topic in trendingTopics"
                :key="topic.keyword"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span class="font-medium text-gray-900">{{ topic.keyword }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500">({{ topic.count }} mentions)</span>
                  <span
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium',
                      getRelevanceClass(topic.relevance)
                    ]"
                  >
                    {{ topic.relevance }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Market Insights -->
          <div>
            <h4 class="text-lg font-medium text-gray-900 mb-3">Market Insights</h4>
            <div class="space-y-3">
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="font-medium text-blue-900">Regulatory Activity</div>
                <div class="text-sm text-blue-700">{{ marketInsights.regulatory }} regulatory updates</div>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="font-medium text-green-900">Clinical Trials</div>
                <div class="text-sm text-green-700">{{ marketInsights.clinicalTrials }} trial announcements</div>
              </div>
              <div class="p-3 bg-purple-50 rounded-lg">
                <div class="font-medium text-purple-900">Patent Activity</div>
                <div class="text-sm text-purple-700">{{ marketInsights.patents }} patent updates</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// Props
const props = defineProps({
  news: {
    type: Array,
    default: () => []
  }
})

// Reactive state
const loading = ref(false)
const selectedCategory = ref('all')
const selectedRelevance = ref('all')
const searchQuery = ref('')
const showTrendingModal = ref(false)
const trendingTopics = ref([])

// Computed properties
const filteredNews = computed(() => {
  let filtered = props.news
  
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(item => item.feedCategory === selectedCategory.value)
  }
  
  if (selectedRelevance.value !== 'all') {
    filtered = filtered.filter(item => item.relevance === selectedRelevance.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.extractedInfo?.companies && item.extractedInfo.companies.some(company => 
        company.toLowerCase().includes(query)
      )) ||
      (item.extractedInfo?.drugs && item.extractedInfo.drugs.some(drug => 
        drug.toLowerCase().includes(query)
      ))
    )
  }
  
  return filtered
})

const newsSummary = computed(() => {
  const total = props.news.length
  const highPriority = props.news.filter(item => item.relevance === 'high').length
  const regulatory = props.news.filter(item => 
    item.extractedInfo?.regulatory || 
    item.title.toLowerCase().includes('fda') ||
    item.title.toLowerCase().includes('ema') ||
    item.title.toLowerCase().includes('regulatory')
  ).length
  
  // Extract company mentions
  const companyMentions = {}
  props.news.forEach(item => {
    if (item.extractedInfo?.companies) {
      item.extractedInfo.companies.forEach(company => {
        if (!companyMentions[company]) {
          companyMentions[company] = { count: 0, lastMention: '' }
        }
        companyMentions[company].count++
        if (!companyMentions[company].lastMention || 
            new Date(item.pubDate) > new Date(companyMentions[company].lastMention)) {
          companyMentions[company].lastMention = formatTimeAgo(item.pubDate)
        }
      })
    }
  })
  
  const companies = Object.entries(companyMentions)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
  
  return { total, highPriority, regulatory, companies }
})

const topCompanies = computed(() => newsSummary.value.companies)

const marketInsights = computed(() => {
  const regulatory = props.news.filter(item => 
    item.extractedInfo?.regulatory || 
    item.title.toLowerCase().includes('fda') ||
    item.title.toLowerCase().includes('ema')
  ).length
  
  const clinicalTrials = props.news.filter(item => 
    item.feedCategory === 'clinicalTrials' ||
    item.title.toLowerCase().includes('clinical trial')
  ).length
  
  const patents = props.news.filter(item => 
    item.feedCategory === 'patents' ||
    item.title.toLowerCase().includes('patent')
  ).length
  
  return { regulatory, clinicalTrials, patents }
})

// Methods
const refreshNews = async () => {
  loading.value = true
  // Emit event to parent to refresh news
  emit('refresh-news')
  setTimeout(() => {
    loading.value = false
  }, 1000)
}

const exportNews = () => {
  const csvContent = generateCSV()
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `news-report-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

const generateCSV = () => {
  const headers = ['Title', 'Description', 'Category', 'Source', 'Relevance', 'Published Date', 'Author', 'Companies', 'Drugs', 'Type']
  const rows = filteredNews.value.map(item => [
    item.title,
    item.description,
    item.feedCategory,
    item.feedSource,
    item.relevance,
    item.pubDate,
    item.author || '',
    item.extractedInfo?.companies?.join('; ') || '',
    item.extractedInfo?.drugs?.join('; ') || '',
    item.extractedInfo?.type || ''
  ])
  
  return [headers, ...rows].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n')
}

const filterNews = () => {
  // Filtering is handled by computed property
}

const filterByCompany = (companyName) => {
  searchQuery.value = companyName
}

const debounceSearch = (() => {
  let timeout
  return () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      // Search is handled by computed property
    }, 300)
  }
})()

const loadTrendingTopics = async () => {
  try {
    const response = await fetch('/api/rss-feeds/trending?timeframe=24h&limit=15')
    const data = await response.json()
    
    if (data.success) {
      trendingTopics.value = data.data.trendingTopics
    }
  } catch (err) {
    console.error('Error loading trending topics:', err)
  }
}

const getCategoryIcon = (category) => {
  const icons = {
    pharmaceutical: '💊',
    patents: '🔒',
    clinicalTrials: '🧬',
    regulatory: '⚖️',
    financial: '💰'
  }
  return icons[category] || '📰'
}

const getRelevanceClass = (relevance) => {
  switch (relevance) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const formatType = (type) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// Lifecycle
onMounted(async () => {
  await loadTrendingTopics()
})

// Watch for news changes to reload trending topics
watch(() => props.news, () => {
  loadTrendingTopics()
}, { deep: true })
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>