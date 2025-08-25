<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div class="suggestion-card">
    <p class="text-sm text-primary-800 mb-2">I'd like to learn about this paper:</p>
    <p class="text-sm font-medium text-primary-900 mb-4">
      {{ title }}
    </p>
    <p class="text-sm text-primary-700">
      What would you like to know about the paper:
      <span class="font-medium">{{ title }}?</span>
    </p>
  </div>
</template>
