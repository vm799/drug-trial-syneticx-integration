<template>
  <div class="rss-news-feed">
    <!-- Enterprise News Dashboard -->
    <EnterpriseNewsDashboard 
      :news="news" 
      @refresh-news="refreshFeeds"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import EnterpriseNewsDashboard from './EnterpriseNewsDashboard.vue'

// Props
const props = defineProps({
  news: {
    type: Array,
    default: () => []
  }
})

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
  { value: 'regulatory', label: 'Regulatory & FDA' },
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
    const currentHost = window.location.hostname
    const currentProtocol = window.location.protocol
    const backendUrl = currentHost === 'localhost' || currentHost === '127.0.0.1' ? 
      'http://localhost:3001' : 
      `${currentProtocol}//${currentHost}`
    
    const url = selectedCategory.value === 'all' 
      ? `${backendUrl}/api/rss-feeds/all`
      : `${backendUrl}/api/rss-feeds/category/${selectedCategory.value}`
    
    console.log('Loading RSS feeds from:', url)
    
    const response = await fetch(url)
    const data = await response.json()
    
    console.log('RSS data loaded:', data)
    
    if (data.success) {
      if (selectedCategory.value === 'all') {
        // Flatten all categories into single array
        const allItems = []
        Object.values(data.data).forEach(categoryFeeds => {
          if (Array.isArray(categoryFeeds)) {
            categoryFeeds.forEach(feed => {
              if (feed.items && Array.isArray(feed.items)) {
                feed.items.forEach(item => {
                  if (item && item.title) {
                    allItems.push({
                      ...item,
                      feedSource: feed.source,
                      feedCategory: feed.category
                    })
                  }
                })
              }
            })
          }
        })
        news.value = allItems
      } else {
        // Single category
        const categoryItems = []
        if (Array.isArray(data.data)) {
          data.data.forEach(feed => {
            if (feed.items && Array.isArray(feed.items)) {
              feed.items.forEach(item => {
                if (item && item.title) {
                  categoryItems.push({
                    ...item,
                    feedSource: feed.source,
                    feedCategory: feed.category
                  })
                }
              })
            }
          })
        }
        news.value = categoryItems
      }
    } else {
      throw new Error(data.error || 'Failed to load news')
    }
  } catch (err) {
    error.value = err.message
    console.error('Error loading RSS feeds:', err)
    // Set demo data if RSS fails
    news.value = [
      {
        title: 'FDA Approves New Cancer Treatment',
        description: 'Breakthrough therapy shows significant improvement in patient outcomes',
        link: '#',
        pubDate: new Date().toISOString(),
        feedSource: 'Demo News',
        feedCategory: 'pharmaceutical',
        relevance: 'high'
      },
      {
        title: 'Major Patent Expires Next Month',
        description: 'Billion-dollar drug loses exclusivity, opening market to generics',
        link: '#',
        pubDate: new Date().toISOString(),
        feedSource: 'Demo News',
        feedCategory: 'patents',
        relevance: 'high'
      }
    ]
  } finally {
    loading.value = false
  }
}

const refreshFeeds = async () => {
  try {
    const currentHost = window.location.hostname
    const currentProtocol = window.location.protocol
    const backendUrl = currentHost === 'localhost' || currentHost === '127.0.0.1' ? 
      'http://localhost:3001' : 
      `${currentProtocol}//${currentHost}`
    
    const response = await fetch(`${backendUrl}/api/rss-feeds/refresh`, { method: 'POST' })
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
    const currentHost = window.location.hostname
    const currentProtocol = window.location.protocol
    const backendUrl = currentHost === 'localhost' || currentHost === '127.0.0.1' ? 
      'http://localhost:3001' : 
      `${currentProtocol}//${currentHost}`
    
    const response = await fetch(`${backendUrl}/api/rss-feeds/trending?timeframe=24h&limit=20`)
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