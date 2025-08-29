<template>
  <div class="breaking-news-ticker">
    <!-- Ticker Container -->
    <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white z-50 shadow-lg border-t-2 border-red-500">
      <div class="flex items-center justify-between px-4 py-2">
        <!-- Breaking News Label -->
        <div class="flex items-center space-x-2 min-w-0">
          <div class="flex items-center space-x-2 bg-red-800 px-3 py-1 rounded-full">
            <div class="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
            <span class="text-sm font-bold whitespace-nowrap">BREAKING NEWS</span>
          </div>
          
          <!-- Live Indicator -->
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
            <span class="text-xs font-medium">LIVE</span>
          </div>
        </div>

        <!-- News Ticker -->
        <div class="flex-1 mx-4 overflow-hidden">
          <div 
            ref="tickerContainer"
            class="flex space-x-8 whitespace-nowrap"
            :style="{ transform: `translateX(${tickerPosition}px)` }"
          >
            <div
              v-for="(item, index) in displayNews"
              :key="`${item.id}-${index}`"
              class="flex items-center space-x-4 min-w-0"
            >
              <!-- News Item -->
              <div class="flex items-center space-x-3 group cursor-pointer" @click="showNewsDetail(item)">
                <!-- Category Icon -->
                <div class="flex-shrink-0">
                  <span class="text-lg">{{ getCategoryIcon(item.feedCategory) }}</span>
                </div>
                
                <!-- News Text -->
                <div class="min-w-0">
                  <div class="text-sm font-medium truncate max-w-md group-hover:text-red-200 transition-colors">
                    {{ item.title }}
                  </div>
                  <div class="text-xs text-red-200 opacity-80">
                    {{ formatTimeAgo(item.pubDate) }} • {{ item.feedSource }}
                  </div>
                </div>
                
                <!-- Relevance Badge -->
                <div 
                  v-if="item.relevance === 'high'"
                  class="flex-shrink-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium"
                >
                  HIGH
                </div>
              </div>
              
              <!-- Separator -->
              <div class="text-red-400 text-lg">•</div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center space-x-2 min-w-0">
          <!-- Pause/Play -->
          <button
            @click="toggleTicker"
            class="p-1 hover:bg-red-700 rounded transition-colors"
            :title="isPaused ? 'Resume ticker' : 'Pause ticker'"
          >
            <svg v-if="isPaused" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          
          <!-- Settings -->
          <button
            @click="showSettings = true"
            class="p-1 hover:bg-red-700 rounded transition-colors"
            title="Ticker settings"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
          
          <!-- Minimize -->
          <button
            @click="isMinimized = !isMinimized"
            class="p-1 hover:bg-red-700 rounded transition-colors"
            :title="isMinimized ? 'Expand ticker' : 'Minimize ticker'"
          >
            <svg v-if="isMinimized" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- News Detail Modal -->
    <div v-if="selectedNews" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-900">Breaking News Detail</h3>
          <button
            @click="selectedNews = null"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <h4 class="text-lg font-semibold text-gray-900 mb-2">{{ selectedNews.title }}</h4>
            <p class="text-gray-600">{{ selectedNews.description }}</p>
          </div>
          
          <div class="flex flex-wrap gap-2">
            <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {{ selectedNews.feedCategory }}
            </span>
            <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              {{ selectedNews.feedSource }}
            </span>
            <span 
              :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                getRelevanceClass(selectedNews.relevance)
              ]"
            >
              {{ selectedNews.relevance }} relevance
            </span>
          </div>
          
          <div class="text-sm text-gray-500">
            Published: {{ formatDate(selectedNews.pubDate) }}
            {{ selectedNews.author ? `• Author: ${selectedNews.author}` : '' }}
          </div>
          
          <div class="flex gap-2">
            <a
              :href="selectedNews.link"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Read Full Article
            </a>
            <button
              @click="goToNewsTab"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              View in News Tab
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettings" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-900">Ticker Settings</h3>
          <button
            @click="showSettings = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Show Categories
            </label>
            <div class="space-y-2">
              <label v-for="category in availableCategories" :key="category.value" class="flex items-center">
                <input
                  v-model="selectedCategories"
                  :value="category.value"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="ml-2 text-sm text-gray-700">{{ category.label }}</span>
              </label>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Minimum Relevance
            </label>
            <select
              v-model="minRelevance"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Ticker Speed
            </label>
            <input
              v-model="tickerSpeed"
              type="range"
              min="1"
              max="10"
              class="w-full"
            >
            <div class="text-sm text-gray-500 text-center">{{ tickerSpeed }}x</div>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="showSettings = false"
            class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="saveSettings"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

// Props
const props = defineProps({
  news: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['navigate-to-news'])

// Reactive state
const tickerPosition = ref(0)
const isPaused = ref(false)
const isMinimized = ref(false)
const showSettings = ref(false)
const selectedNews = ref(null)
const tickerContainer = ref(null)

// Settings
const selectedCategories = ref(['pharmaceutical', 'patents', 'clinicalTrials', 'financial'])
const minRelevance = ref('medium')
const tickerSpeed = ref(3)

// Available categories
const availableCategories = [
  { value: 'pharmaceutical', label: 'Pharmaceutical' },
  { value: 'patents', label: 'Patents & IP' },
  { value: 'clinicalTrials', label: 'Clinical Trials' },
  { value: 'financial', label: 'Financial & Market' }
]

// Computed properties
const displayNews = computed(() => {
  return props.news.filter(item => 
    selectedCategories.value.includes(item.feedCategory) &&
    getRelevanceScore(item.relevance) >= getRelevanceScore(minRelevance.value)
  )
})

const relevanceOrder = { high: 3, medium: 2, low: 1 }

const getRelevanceScore = (relevance) => {
  return relevanceOrder[relevance] || 1
}

// Methods
const startTicker = () => {
  if (isPaused.value) return
  
  const tickerWidth = tickerContainer.value?.scrollWidth || 0
  const containerWidth = tickerContainer.value?.parentElement?.clientWidth || 0
  
  if (tickerWidth > containerWidth) {
    tickerPosition.value -= (tickerSpeed.value * 0.5)
    
    // Reset position when ticker moves completely off screen
    if (tickerPosition.value < -tickerWidth) {
      tickerPosition.value = containerWidth
    }
  }
}

const toggleTicker = () => {
  isPaused.value = !isPaused.value
}

const showNewsDetail = (news) => {
  selectedNews.value = news
}

const goToNewsTab = () => {
  emit('navigate-to-news')
  selectedNews.value = null
}

const saveSettings = () => {
  showSettings.value = false
  // Settings are automatically applied through computed properties
}

const getCategoryIcon = (category) => {
  const icons = {
    pharmaceutical: '💊',
    patents: '🔒',
    clinicalTrials: '🧬',
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

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

// Animation loop
let animationId = null

const startAnimation = () => {
  if (animationId) return
  
  const animate = () => {
    startTicker()
    animationId = requestAnimationFrame(animate)
  }
  animate()
}

const stopAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// Lifecycle
onMounted(() => {
  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
})

// Watch for news changes to reset ticker position
watch(() => props.news, () => {
  tickerPosition.value = 0
}, { deep: true })
</script>

<style scoped>
.breaking-news-ticker {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Smooth scrolling for ticker */
.breaking-news-ticker .overflow-hidden {
  scroll-behavior: smooth;
}

/* Custom scrollbar for webkit browsers */
.breaking-news-ticker ::-webkit-scrollbar {
  display: none;
}

/* Ensure ticker stays above other content */
.breaking-news-ticker {
  z-index: 9999;
}
</style>