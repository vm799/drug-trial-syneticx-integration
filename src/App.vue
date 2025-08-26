<script setup lang="ts">
import { ref, computed } from 'vue'
import ResearchPaper from './components/ResearchPaper.vue'
import ChatInterface from './components/ChatInterface.vue'
import QuickActions from './components/QuickActions.vue'
import SuggestionCard from './components/SuggestionCard.vue'

// Sample research papers data
const currentPaper = ref({
  title:
    'Efficacy of Novel mRNA Vaccine Platforms in Phase III Clinical Trials for Oncology Applications',
  authors: 'Dr. Sarah Chen, Dr. Michael Rodriguez, Dr. Lisa Wang',
  year: '2024',
  abstract:
    'This comprehensive study evaluates the safety and efficacy of next-generation mRNA vaccine platforms specifically designed for cancer immunotherapy. Our phase III trial involved 2,847 patients across multiple cancer types, demonstrating significant improvements in overall survival rates and reduced adverse effects compared to traditional chemotherapy protocols.',
  type: 'Clinical Trial',
  status: 'Published',
  doi: '10.1038/s41591-024-0847-2',
  journal: 'Nature Medicine',
  isBookmarked: false,
})

const suggestedPaper = ref({
  title: 'Personalized Drug Dosing using AI-Driven Pharmacokinetic Modeling for Pediatric Oncology',
  authors: 'Dr. James Thompson, Dr. Emily Foster',
  type: 'Research Article',
})

const chatMessages = ref([] as Array<{type: 'user' | 'assistant', content: string}>)

const messageInput = ref('')
const showChat = ref(false)
const activeSection = ref('research') // research, trials, bookmarks, analytics

const quickActions = [
  { id: 'summarize', label: 'Summarize paper', icon: '📄' },
  { id: 'methodology', label: 'Explore methodologies', icon: '🔬' },
  { id: 'critique', label: 'Critique paper', icon: '🔍' },
  { id: 'related', label: 'Find related studies', icon: '🔗' },
]

const handlePaperAction = (action: string) => {
  console.log(`Paper action: ${action}`)
  // Handle different paper actions here
  if (action === 'like') {
    // Add to liked papers
  } else if (action === 'dislike') {
    // Add to disliked papers
  }
}

const handleQuickAction = (action: string) => {
  console.log(`Quick action: ${action}`)
  // Handle quick actions
  showChat.value = true

  // Simulate AI response based on action
  setTimeout(() => {
    let response = ''
    switch (action) {
      case 'summarize':
        response =
          'This study demonstrates that mRNA vaccines show promising results in cancer immunotherapy with improved survival rates compared to traditional treatments.'
        break
      case 'methodology':
        response =
          'The study employed a randomized, double-blind, placebo-controlled design across 45 medical centers with rigorous statistical analysis using Kaplan-Meier survival curves.'
        break
      case 'critique':
        response =
          'While the results are promising, the study could benefit from longer follow-up periods and more diverse patient populations to strengthen the evidence base.'
        break
      case 'related':
        response =
          'I found 23 related studies on mRNA cancer vaccines. Would you like me to show you the most relevant ones?'
        break
      default:
        response = 'How can I help you analyze this research paper?'
    }

    chatMessages.value.push({
      type: 'assistant',
      content: response,
    })
  }, 1000)
}

const toggleBookmark = () => {
  currentPaper.value.isBookmarked = !currentPaper.value.isBookmarked
}

const toggleChat = () => {
  showChat.value = !showChat.value
}

const handleChatMessage = (message: string) => {
  chatMessages.value.push({
    type: 'user',
    content: message,
  })

  // Simulate AI response
  setTimeout(() => {
    chatMessages.value.push({
      type: 'assistant',
      content:
        'I can help you analyze this research paper. Let me break down the key findings and methodologies for you.',
    })
  }, 1000)
}

const sendMessage = () => {
  if (messageInput.value.trim()) {
    handleChatMessage(messageInput.value)
    messageInput.value = ''
  }
}

const sendQuickMessage = () => {
  if (messageInput.value.trim()) {
    handleChatMessage(messageInput.value)
    messageInput.value = ''
  }
}

const formatDate = computed(() => {
  const date = new Date()
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div
              class="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center"
            >
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900">MedResearch AI</h1>
              <p class="text-sm sm:text-base text-gray-500 hidden sm:block">
                Clinical Trial & Drug Research Assistant
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2 sm:space-x-3">
            <button class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg
                class="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-5 5v-5zM15 17H9a2 2 0 01-2-2V9a2 2 0 012-2h6a2 2 0 012 2v6.17z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="mt-4 border-t border-gray-200 pt-4">
          <nav class="flex space-x-6">
            <button
              @click="activeSection = 'research'"
              :class="
                activeSection === 'research'
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent'
              "
              class="pb-2 border-b-2 font-medium text-sm transition-colors hover:text-primary-600"
            >
              Research Papers
            </button>
            <button
              @click="activeSection = 'trials'"
              :class="
                activeSection === 'trials'
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent'
              "
              class="pb-2 border-b-2 font-medium text-sm transition-colors hover:text-primary-600"
            >
              Clinical Trials
            </button>
            <button
              @click="activeSection = 'bookmarks'"
              :class="
                activeSection === 'bookmarks'
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent'
              "
              class="pb-2 border-b-2 font-medium text-sm transition-colors hover:text-primary-600"
            >
              Bookmarks
            </button>
            <button
              @click="activeSection = 'analytics'"
              :class="
                activeSection === 'analytics'
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent'
              "
              class="pb-2 border-b-2 font-medium text-sm transition-colors hover:text-primary-600"
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <!-- Research Papers Section -->
      <div v-if="activeSection === 'research'" class="flex flex-col lg:grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-200px)]">
        <!-- Left Column: Paper Content -->
        <div class="space-y-6 overflow-y-auto lg:pr-2 order-1">
          <!-- Research Paper Card -->
          <ResearchPaper
            :paper="currentPaper"
            @toggle-bookmark="toggleBookmark"
            @action="handlePaperAction"
            @chat-toggle="() => showChat = true"
          />

          <!-- Date Indicator -->
          <div class="text-center">
            <p class="text-sm text-gray-500">{{ formatDate }}</p>
          </div>

          <!-- Learning Suggestion -->
          <SuggestionCard :title="suggestedPaper.title" />

          <!-- Quick Actions -->
          <div class="card">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <QuickActions :actions="quickActions" @action="handleQuickAction" />
          </div>
        </div>

        <!-- Right Column: Chat Interface -->
        <div class="order-2 lg:sticky lg:top-6">
          <!-- Mobile Chat Toggle Button -->
          <div class="lg:hidden mb-4">
            <button
              @click="showChat = !showChat"
              class="w-full btn btn-primary"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {{ showChat ? 'Hide Chat' : 'Open Chat Assistant' }}
            </button>
          </div>

          <!-- Chat Container -->
          <div
            class="card flex flex-col"
            :class="{
              'h-96 lg:h-[calc(100vh-240px)]': true,
              'hidden lg:flex': !showChat
            }"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Research Assistant</h3>
              <button
                @click="showChat = false"
                class="p-1 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              >
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Chat Messages -->
            <div class="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-hide">
              <div v-if="chatMessages.length === 0" class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p class="text-sm">Start a conversation with the AI assistant</p>
                <p class="text-xs text-gray-400 mt-1">Use quick actions or type your questions below</p>
              </div>

              <div v-else>
                <div
                  v-for="(message, index) in chatMessages"
                  :key="index"
                  class="flex"
                  :class="message.type === 'user' ? 'justify-end' : 'justify-start'"
                >
                  <div
                    class="max-w-[80%] px-4 py-2 rounded-2xl text-sm break-words"
                    :class="
                      message.type === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
                    "
                  >
                    {{ message.content }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Chat Input -->
            <div class="border-t pt-4">
              <div class="flex space-x-2">
                <input
                  v-model="messageInput"
                  @keyup.enter="sendMessage"
                  type="text"
                  placeholder="Ask about methodologies, results, or implications..."
                  class="flex-1 input text-sm"
                />
                <button @click="sendMessage" class="btn btn-primary shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Clinical Trials Section -->
      <div v-else-if="activeSection === 'trials'" class="space-y-6">
        <div class="card text-center py-12">
          <div
            class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Clinical Trials Database</h3>
          <p class="text-gray-600 mb-4">
            Search and analyze ongoing and completed clinical trials worldwide.
          </p>
          <p class="text-sm text-gray-500">
            This section will include trial search, filtering, and comparative analysis tools.
          </p>
        </div>
      </div>

      <!-- Bookmarks Section -->
      <div v-else-if="activeSection === 'bookmarks'" class="space-y-6">
        <div class="card text-center py-12">
          <div
            class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Saved Research</h3>
          <p class="text-gray-600 mb-4">
            Access your bookmarked papers, trials, and research notes.
          </p>
          <p class="text-sm text-gray-500">
            Your saved items will appear here for easy reference and organization.
          </p>
        </div>
      </div>

      <!-- Analytics Section -->
      <div v-else-if="activeSection === 'analytics'" class="space-y-6">
        <div class="card text-center py-12">
          <div
            class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Research Analytics</h3>
          <p class="text-gray-600 mb-4">
            Track research trends, citation networks, and impact metrics.
          </p>
          <p class="text-sm text-gray-500">
            Comprehensive analytics dashboard for medical research insights and trends.
          </p>
        </div>
      </div>
    </main>

    <!-- Bottom Spacing -->
    <div class="h-6"></div>
  </div>
</template>

<style scoped>
/* Component-specific styles if needed */
</style>
