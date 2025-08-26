<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

interface Action {
  id: string
  label: string
  icon: string
}

interface Props {
  actions: Action[]
}

const props = defineProps<Props>();

const emit = defineEmits<{
  action: [actionId: string]
}>();

const handleAction = (actionId: string) => {
  emit('action', actionId);
};

// Form data for interests update
const interests = ref('');
const subscribed = ref(true);

const updateInterests = async () => {
  try {
    const interestsArray = interests.value.split(',').map(i => i.trim());
    await axios.post('/api/user/interests', { 
      interests: interestsArray, 
      subscribedToEmails: subscribed.value 
    });
    // Optional: Emit success or show toast
    console.log('Interests updated successfully');
    interests.value = '';  // Reset form
  } catch (error) {
    console.error('Error updating interests:', error);
    // Optional: Handle error (e.g., show notification)
  }
};
</script>

<template>
  <div>
    <!-- Quick Actions Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <button
        v-for="action in props.actions"
        :key="action.id"
        @click="handleAction(action.id)"
        class="action-button action-button-primary text-left justify-center sm:justify-start"
      >
        <span class="mr-2">{{ action.icon }}</span>
        <span class="truncate">{{ action.label }}</span>
      </button>
    </div>

    <!-- Interests Update Form -->
    <form @submit.prevent="updateInterests" class="space-y-4">
      <input 
        v-model="interests" 
        placeholder="e.g., biotech, trials" 
        class="w-full p-2 border rounded" 
      />
      <label class="flex items-center">
        <input type="checkbox" v-model="subscribed" class="mr-2" />
        Subscribe to emails
      </label>
      <button type="submit" class="action-button action-button-primary">
        Save Interests
      </button>
    </form>
  </div>
</template>

<style scoped>
.action-button {
  @apply bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center;
}
.action-button-primary {
  @apply font-semibold;
}
</style>
