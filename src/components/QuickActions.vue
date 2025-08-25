<script setup lang="ts">
interface Action {
  id: string
  label: string
  icon: string
}

interface Props {
  actions: Action[]
}

defineProps<Props>()

const emit = defineEmits<{
  action: [actionId: string]
}>()

const handleAction = (actionId: string) => {
  emit('action', actionId)
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    <button
      v-for="action in actions"
      :key="action.id"
      @click="handleAction(action.id)"
      class="action-button action-button-primary text-left justify-center sm:justify-start"
    >
      <span class="mr-2">{{ action.icon }}</span>
      <span class="truncate">{{ action.label }}</span>
    </button>
  </div>
</template>
