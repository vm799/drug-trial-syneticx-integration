import { createApp } from 'vue'
import App from './App.vue'

// Import styles
import './assets/main.css'

// Initialize the Vue app
const app = createApp(App)

// Global error handler for uncaught errors
app.config.errorHandler = (error, instance, info) => {
  console.error('Vue error:', error, info)
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

// Handle global errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

// Mount the app
app.mount('#app')

// Log startup information
console.log('🚀 MedResearch AI Application Started')
console.log('📱 Enterprise Platform v2.0.0')

// Development mode debugging
if (import.meta.env.DEV) {
  console.log('🔧 Development mode active')
}