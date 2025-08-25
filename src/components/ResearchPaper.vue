<script setup lang="ts">
interface Paper {
  title: string
  authors: string
  year: string
  abstract: string
  type: string
  status: string
  doi?: string
  journal?: string
  isBookmarked: boolean
}

interface Props {
  paper: Paper
}

defineProps<Props>()

const emit = defineEmits<{
  toggleBookmark: []
  action: [action: string]
  chatToggle: []
}>()

const handleAction = (action: string) => {
  emit('action', action)
}

const toggleBookmark = () => {
  emit('toggleBookmark')
}

const toggleChat = () => {
  emit('chatToggle')
}
</script>

<template>
  <div class="paper-card">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
      <div class="flex-1">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
          >
            {{ paper.type }}
          </span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800"
          >
            {{ paper.status }}
          </span>
        </div>
        <h2 class="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 leading-tight mb-3">
          {{ paper.title }}
        </h2>
        <p class="text-sm sm:text-base text-gray-600 mb-2">
          {{ paper.authors }}
        </p>
        <p class="text-sm text-gray-500 mb-4">({{ paper.year }})</p>
      </div>
      <button
        @click="toggleBookmark"
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-4"
      >
        <svg
          class="w-5 h-5"
          :class="paper.isBookmarked ? 'text-yellow-500 fill-current' : 'text-gray-400'"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      </button>
    </div>

    <div class="mb-6">
      <p class="text-sm font-medium text-gray-900 mb-2">Abstract:</p>
      <p class="text-sm text-gray-700 leading-relaxed">
        {{ paper.abstract }}
        <button class="text-primary-600 hover:text-primary-700 font-medium ml-1">Read more</button>
      </p>
    </div>

    <!-- Action Buttons -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
      <button
        class="action-button action-button-primary justify-center sm:justify-start"
        @click="handleAction('like')"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
        More like this
      </button>
      <button
        class="action-button action-button-primary justify-center sm:justify-start"
        @click="handleAction('dislike')"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.60L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2M17 4h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
          />
        </svg>
        Less like this
      </button>
    </div>

    <button class="w-full action-button action-button-primary" @click="toggleChat">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      Chat with paper
    </button>
  </div>
</template>
