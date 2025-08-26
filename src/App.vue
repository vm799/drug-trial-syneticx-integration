<script setup lang="ts">
import { ref, computed } from 'vue'
import ResearchPaper from './components/ResearchPaper.vue'
import ChatInterface from './components/ChatInterface.vue'
import QuickActions from './components/QuickActions.vue'
import SuggestionCard from './components/SuggestionCard.vue'
import apiService from './services/api'

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

const chatMessages = ref([] as Array<{type: 'user' | 'assistant', content: string, id?: string}>)
const currentChatSession = ref<string | null>(null)
const isLoading = ref(false)
const lastAssistantMessage = ref('')

const messageInput = ref('')
const showChat = ref(false)
const activeSection = ref('research') // research, trials, bookmarks, analytics
const apiStatus = ref<'online' | 'offline' | 'checking'>('checking')

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

const handleQuickAction = async (action: string) => {
  console.log(`Quick action: ${action}`)
  showChat.value = true
  isLoading.value = true

  try {
    // Ensure we have a chat session
    if (!currentChatSession.value) {
      await createChatSession()
    }

    let message = ''
    switch (action) {
      case 'summarize':
        message = 'Please provide a comprehensive summary of this research paper.'
        break
      case 'methodology':
        message = 'Can you explain the research methodologies used in this study?'
        break
      case 'critique':
        message = 'What are the strengths and limitations of this research?'
        break
      case 'related':
        message = 'Can you find and show me related studies on this topic?'
        break
      default:
        message = 'How can you help me analyze this research paper?'
    }

    await sendChatMessage(message)
  } catch (error) {
    console.error('Quick action error:', error)
    apiStatus.value = 'offline'
    // Fallback to mock response if API fails
    handleQuickActionFallback(action)
  } finally {
    isLoading.value = false
  }
}

// Fallback for when API is not available
const handleQuickActionFallback = (action: string) => {
  let response = ''
  switch (action) {
    case 'summarize':
      response = 'This study demonstrates that mRNA vaccines show promising results in cancer immunotherapy with improved survival rates compared to traditional treatments. The research involved 2,847 patients and showed significant improvements over traditional chemotherapy protocols.'
      break
    case 'methodology':
      response = 'The study employed a randomized, double-blind, placebo-controlled design across 45 medical centers with rigorous statistical analysis using Kaplan-Meier survival curves. The methodology follows gold standard clinical trial protocols.'
      break
    case 'critique':
      response = 'While the results are promising, the study could benefit from longer follow-up periods and more diverse patient populations to strengthen the evidence base. The sample size is adequate but geographic diversity could be improved.'
      break
    case 'related':
      response = 'I found 23 related studies on mRNA cancer vaccines. Here are the most relevant ones:\n\n1. "mRNA-based immunotherapy for cancer treatment" (Nature, 2023)\n2. "Efficacy of personalized mRNA vaccines" (Cell, 2023)\n3. "Safety profile of mRNA therapeutics" (NEJM, 2024)\n\nWould you like me to provide more details about any of these studies?'
      lastAssistantMessage.value = response
      break
    default:
      response = 'I can help you analyze this research paper in several ways: summarize key findings, explain methodologies, critique the study design, or find related research. What interests you most?'
  }

  chatMessages.value.push({
    type: 'assistant',
    content: response,
    id: Date.now().toString()
  })
}

const toggleBookmark = () => {
  currentPaper.value.isBookmarked = !currentPaper.value.isBookmarked
}

const toggleChat = () => {
  showChat.value = !showChat.value
}

const handleChatMessage = async (message: string) => {
  chatMessages.value.push({
    type: 'user',
    content: message,
    id: Date.now().toString()
  })

  isLoading.value = true

  try {
    // Ensure we have a chat session
    if (!currentChatSession.value) {
      await createChatSession()
    }

    await sendChatMessage(message)
  } catch (error) {
    console.error('Chat message error:', error)
    apiStatus.value = 'offline'
    // Fallback to intelligent mock response
    handleChatMessageFallback(message)
  } finally {
    isLoading.value = false
  }
}

// Intelligent fallback responses
const handleChatMessageFallback = (message: string) => {
  const lowerMessage = message.toLowerCase()
  let response = ''

  // Handle follow-up questions contextually
  if (lowerMessage.includes('yes') || lowerMessage.includes('show me')) {
    if (lastAssistantMessage.value.includes('related studies')) {
      response = 'Here are the detailed abstracts of the most relevant studies:\n\n**Study 1: mRNA-based immunotherapy for cancer treatment**\n*Authors: Chen et al., Nature 2023*\nThis comprehensive review analyzes 45 clinical trials using mRNA vaccines for various cancer types...\n\n**Study 2: Efficacy of personalized mRNA vaccines**\n*Authors: Rodriguez et al., Cell 2023*\nA breakthrough study showing 78% response rates in personalized mRNA vaccine trials...\n\nWould you like me to analyze any specific aspect of these studies?'
    } else {
      response = 'Certainly! I\'d be happy to provide more detailed information. Could you specify what aspect you\'d like me to elaborate on?'
    }
  } else if (lowerMessage.includes('no') || lowerMessage.includes('not interested')) {
    response = 'No problem! Is there anything else about this research paper you\'d like to explore? I can help with methodology analysis, statistical interpretation, or finding alternative studies.'
  } else if (lowerMessage.includes('methodology') || lowerMessage.includes('method')) {
    response = 'The study methodology includes:\n\n• **Design**: Randomized, double-blind, placebo-controlled trial\n• **Population**: 2,847 patients across multiple cancer types\n• **Duration**: 24-month follow-up period\n• **Primary endpoint**: Overall survival rates\n• **Statistical analysis**: Kaplan-Meier survival curves, Cox regression\n\nWould you like me to explain any specific methodological aspect in more detail?'
  } else if (lowerMessage.includes('result') || lowerMessage.includes('finding')) {
    response = 'Key findings from this study:\n\n• **Primary outcome**: Significant improvement in overall survival (HR: 0.73, p<0.001)\n• **Safety profile**: Reduced adverse effects vs. traditional chemotherapy\n• **Response rate**: 68% overall response rate\n• **Duration**: Median response duration of 18.2 months\n\nThe results suggest mRNA vaccines could become a new standard of care. Would you like me to elaborate on any specific finding?'
  } else if (lowerMessage.includes('statistic') || lowerMessage.includes('data')) {
    response = 'Statistical highlights:\n\n• **Sample size**: n=2,847 (adequately powered for primary endpoint)\n• **Confidence intervals**: 95% CI provided for all primary outcomes\n• **P-values**: All primary endpoints achieved statistical significance (p<0.05)\n• **Effect size**: Clinically meaningful improvement (>20% relative risk reduction)\n\nWould you like me to explain the statistical methods used or interpret specific results?'
  } else {
    response = 'I understand you\'re asking about "' + message + '". Based on this research paper, I can help you explore:\n\n• Study design and methodology\n• Key findings and results\n• Statistical analysis and interpretation\n• Limitations and future research directions\n• Related studies in this field\n\nWhat specific aspect interests you most?'
  }

  setTimeout(() => {
    chatMessages.value.push({
      type: 'assistant',
      content: response,
      id: Date.now().toString()
    })
    lastAssistantMessage.value = response
  }, 1000)
}

// API functions
const createChatSession = async () => {
  try {
    const session = await apiService.createChatSession({
      type: 'paper_analysis',
      specialization: 'medical research'
    })
    currentChatSession.value = session.sessionId
    return session
  } catch (error) {
    console.error('Failed to create chat session:', error)
    // Continue with mock responses
    currentChatSession.value = 'mock_session_' + Date.now()
    throw error
  }
}

const sendChatMessage = async (message: string) => {
  if (!currentChatSession.value) {
    throw new Error('No active chat session')
  }

  try {
    const response = await apiService.sendMessage(
      currentChatSession.value,
      message,
      {
        paperId: currentPaper.value.doi || 'current_paper',
        paperTitle: currentPaper.value.title,
        paperContext: currentPaper.value.abstract
      }
    )

    chatMessages.value.push({
      type: 'assistant',
      content: response.response.content,
      id: Date.now().toString()
    })

    lastAssistantMessage.value = response.response.content
    apiStatus.value = 'online'
    return response
  } catch (error) {
    console.error('Failed to send message:', error)
    apiStatus.value = 'offline'
    throw error
  }
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
              <div class="flex items-center space-x-2">
                <h3 class="text-lg font-semibold text-gray-900">Research Assistant</h3>
                <div
                  v-if="apiStatus === 'online'"
                  class="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                  title="Connected to AI service"
                >
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Live AI</span>
                </div>
                <div
                  v-else-if="apiStatus === 'offline'"
                  class="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs"
                  title="Using offline responses"
                >
                  <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Offline Mode</span>
                </div>
                <div
                  v-else
                  class="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                >
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <span>Connecting...</span>
                </div>
              </div>
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
                  :key="message.id || index"
                  class="flex mb-4"
                  :class="message.type === 'user' ? 'justify-end' : 'justify-start'"
                >
                  <div
                    class="max-w-[80%] px-4 py-3 rounded-2xl text-sm break-words leading-relaxed"
                    :class="
                      message.type === 'user'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                    "
                  >
                    <div v-if="message.content.includes('\n')" class="whitespace-pre-line">
                      {{ message.content }}
                    </div>
                    <div v-else>
                      {{ message.content }}
                    </div>
                  </div>
                </div>

                <!-- Loading indicator -->
                <div v-if="isLoading" class="flex justify-start mb-4">
                  <div class="bg-white text-gray-800 border border-gray-200 shadow-sm px-4 py-3 rounded-2xl">
                    <div class="flex items-center space-x-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      <span class="text-sm text-gray-600">AI is thinking...</span>
                    </div>
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
