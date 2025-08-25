<script setup lang="ts">
import { ref } from 'vue'

interface Message {
  type: 'user' | 'assistant'
  content: string
}

interface Props {
  messages: Message[]
  visible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  sendMessage: [message: string]
}>()

const messageInput = ref('')

const sendMessage = () => {
  if (messageInput.value.trim()) {
    emit('sendMessage', messageInput.value)
    messageInput.value = ''
  }
}
</script>

<template>
  <div v-if="visible" class="card">
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Research Assistant</h3>
      <div class="space-y-4 max-h-60 overflow-y-auto scrollbar-hide">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="flex"
          :class="message.type === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm"
            :class="
              message.type === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
            "
          >
            {{ message.content }}
          </div>
        </div>
      </div>
    </div>
    <div class="flex space-x-2">
      <input
        v-model="messageInput"
        @keyup.enter="sendMessage"
        type="text"
        placeholder="Ask about methodologies, results, or implications..."
        class="flex-1 input"
      />
      <button @click="sendMessage" class="btn btn-primary shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
