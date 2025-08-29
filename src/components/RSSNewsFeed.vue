<template>
  <div class="rss-news-feed">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white mb-8">
      <h2 class="text-3xl font-bold mb-3">📰 Industry News & Updates</h2>
      <p class="text-blue-100 text-lg mb-4">
        Real-time pharmaceutical, patent, and clinical trial news from leading industry sources.
        Stay informed with the latest developments in drug development, regulatory updates, and market intelligence.
      </p>
      <div class="bg-blue-800/30 rounded-lg p-4 mt-6">
        <h4 class="font-semibold mb-2">News Sources:</h4>
        <ul class="text-blue-100 text-sm space-y-1">
          <li>• FiercePharma, PharmaTimes, BioSpace - Industry updates</li>
          <li>• IPWatchdog, Managing IP - Patent & IP news</li>
          <li>• ClinicalTrials.gov, Nature Medicine - Research breakthroughs</li>
          <li>• Seeking Alpha, MarketWatch - Financial & market analysis</li>
        </ul>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 mb-6 shadow-sm">
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <h3 class="text-xl font-semibold text-gray-900">News Dashboard</h3>
          <div class="flex gap-2">
            <button
              @click="refreshFeeds"
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
              {{ loading ? 'Refreshing...' : 'Refresh Feeds' }}
            </button>
            <button
              @click="showTrendingModal = true"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              Trending Topics
            </button>
          </div>
        </div>
        
        <div class="flex gap-2 w-full sm:w-auto">
          <select
            v-model="selectedCategory"
            @change="loadFeeds"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="pharmaceutical">Pharmaceutical</option>
            <option value="patents">Patents & IP</option>
            <option value="clinicalTrials">Clinical Trials</option>
            <option value="financial">Financial & Market</option>
          </select>
          <input
            v-model="searchQuery"
            @input="debounceSearch"
            placeholder="Search news..."
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="animate-pulse">
        <div class="bg-gray-200 h-24 rounded-lg"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div class="text-red-600 mb-4">
        <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-red-800 mb-2">Failed to Load News</h3>
      <p class="text-red-600 mb-4">{{ error }}</p>
      <button
        @click="loadFeeds"
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Try Again
      </button>
    </div>

    <!-- News Content -->
    <div v-else class="space-y-6">
      <!-- Category Tabs -->
      <div class="flex flex-wrap gap-2 border-b border-gray-200">
        <button
          v-for="category in categories"
          :key="category.value"
          @click="selectedCategory = category.value; loadFeeds()"
          :class="[
            'px-4 py-2 rounded-t-lg font-medium transition-colors',
            selectedCategory === category.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ category.label }}
        </button>
      </div>

      <!-- News Items -->
      <div v-if="filteredNews.length > 0" class="grid gap-6">
        <div
          v-for="item in filteredNews"
          :key="`${item.feedSource}-${item.title}`"
          class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <h4 class="text-lg font-semibold text-gray-900 mb-2">
                <a
                  :href="item.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-blue-600 transition-colors"
                >
                  {{ item.title }}
                </a>
              </h4>
              <p class="text-gray-600 mb-3 line-clamp-3">{{ item.description }}</p>
              
              <div class="flex flex-wrap gap-2 mb-3">
                <span
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getRelevanceClass(item.relevance)
                  ]"
                >
                  {{ item.relevance }} relevance
                </span>
                <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {{ item.feedCategory }}
                </span>
                <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {{ item.feedSource }}
                </span>
              </div>
            </div>
            
            <div class="text-right text-sm text-gray-500 ml-4">
              <div>{{ formatDate(item.pubDate) }}</div>
              <div class="text-xs">{{ item.author }}</div>
            </div>
          </div>
          
          <!-- Extracted Info -->
          <div v-if="item.extractedInfo" class="bg-gray-50 rounded-lg p-3">
            <h5 class="font-medium text-gray-900 mb-2">Key Information:</h5>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
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
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No News Found</h3>
        <p class="text-gray-500">
          {{ searchQuery ? `No news matching "${searchQuery}" found.` : 'No news available for this category.' }}
        </p>
      </div>
    </div>

    <!-- Trending Topics Modal -->
    <div v-if="showTrendingModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold">🔥 Trending Topics</h3>
          <button
            @click="showTrendingModal = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div v-if="trendingTopics.length > 0" class="space-y-4">
          <div
            v-for="topic in trendingTopics"
            :key="topic.keyword"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <span class="font-medium text-gray-900">{{ topic.keyword }}</span>
              <span class="text-sm text-gray-500 ml-2">({{ topic.count }} mentions)</span>
            </div>
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
        
        <div v-else class="text-center py-8 text-gray-500">
          No trending topics available at the moment.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'

// Reactive state
const loading = ref(false)
const error = ref(null)
const news = ref([])
const selectedCategory = ref('all')
const searchQuery = ref('')
const showTrendingModal = ref(false)
const trendingTopics = ref([])

// Categories
const categories = [
  { value: 'all', label: 'All News' },
  { value: 'pharmaceutical', label: 'Pharmaceutical' },
  { value: 'patents', label: 'Patents & IP' },
  { value: 'clinicalTrials', label: 'Clinical Trials' },
  { value: 'financial', label: 'Financial & Market' }
]

// Computed properties
const filteredNews = computed(() => {
  let filtered = news.value
  
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(item => item.feedCategory === selectedCategory.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

// Methods
const loadFeeds = async () => {
  loading.value = true
  error.value = null
  
  try {
    const url = selectedCategory.value === 'all' 
      ? '/api/rss-feeds/all'
      : `/api/rss-feeds/category/${selectedCategory.value}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.success) {
      if (selectedCategory.value === 'all') {
        // Flatten all categories into single array
        news.value = Object.values(data.data).flat().flatMap(feed => 
          feed.items?.map(item => ({
            ...item,
            feedSource: feed.source,
            feedCategory: feed.category
          })) || []
        )
      } else {
        // Single category
        news.value = data.data.flatMap(feed => 
          feed.items?.map(item => ({
            ...item,
            feedSource: feed.source,
            feedCategory: feed.category
          })) || []
        )
      }
    } else {
      throw new Error(data.error || 'Failed to load news')
    }
  } catch (err) {
    error.value = err.message
    console.error('Error loading RSS feeds:', err)
  } finally {
    loading.value = false
  }
}

const refreshFeeds = async () => {
  try {
    const response = await fetch('/api/rss-feeds/refresh', { method: 'POST' })
    const data = await response.json()
    
    if (data.success) {
      await loadFeeds()
    }
  } catch (err) {
    console.error('Error refreshing feeds:', err)
  }
}

const loadTrendingTopics = async () => {
  try {
    const response = await fetch('/api/rss-feeds/trending?timeframe=24h&limit=20')
    const data = await response.json()
    
    if (data.success) {
      trendingTopics.value = data.data.trendingTopics
    }
  } catch (err) {
    console.error('Error loading trending topics:', err)
  }
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

const formatDate = (dateString) => {
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

// Lifecycle
onMounted(async () => {
  await loadFeeds()
  await loadTrendingTopics()
})

// Watch for category changes
watch(selectedCategory, () => {
  loadFeeds()
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>