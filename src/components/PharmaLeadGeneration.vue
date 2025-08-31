<template>
  <div class="pharma-lead-generation">
    <!-- Header Section -->
    <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Pharma Lead Generation Dashboard</h1>
          <p class="text-gray-600">Real-time triggers for medical research platform outreach</p>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-500 mb-1">Last Updated:</div>
          <div class="text-sm font-medium text-gray-900">{{ formatDate(lastUpdated) }}</div>
        </div>
      </div>

      <!-- Summary Metrics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-red-50 rounded-lg p-4 border border-red-200 hover:shadow-md transition-shadow cursor-pointer" @click="filterByTrigger('critical')">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-red-800">Critical Triggers</span>
            <span class="text-2xl font-bold text-red-900">{{ triggerCounts.critical }}</span>
          </div>
          <p class="text-xs text-red-700">👆 Click to filter</p>
        </div>

        <div class="bg-orange-50 rounded-lg p-4 border border-orange-200 hover:shadow-md transition-shadow cursor-pointer" @click="filterByTrigger('warning_letter')">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-orange-800">Warning Letters</span>
            <span class="text-2xl font-bold text-orange-900">{{ triggerCounts.warningLetters }}</span>
          </div>
          <p class="text-xs text-orange-700">👆 Click to filter</p>
        </div>

        <div class="bg-purple-50 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-shadow cursor-pointer" @click="filterByTrigger('patent')">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-purple-800">Patent Issues</span>
            <span class="text-2xl font-bold text-purple-900">{{ triggerCounts.patents }}</span>
          </div>
          <p class="text-xs text-purple-700">👆 Click to filter</p>
        </div>

        <div class="bg-green-50 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow cursor-pointer" @click="filterByTrigger('investment')">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-green-800">Investment Opportunities</span>
            <span class="text-2xl font-bold text-green-900">{{ triggerCounts.investments }}</span>
          </div>
          <p class="text-xs text-green-700">👆 Click to filter</p>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="flex flex-wrap items-center gap-4">
        <div>
          <label class="text-sm font-medium text-gray-700 mr-2">Filter by Trigger:</label>
          <select
            v-model="selectedTrigger"
            @change="applyFilters"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Triggers</option>
            <option value="warning_letter">Warning Letters (483s)</option>
            <option value="drug_recall">Drug Recalls</option>
            <option value="trial_failed">Failed Trials</option>
            <option value="clinical_hold">Clinical Holds</option>
            <option value="patent_expiry">Patent Expiry</option>
            <option value="enforcement_action">Enforcement Actions</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mr-2">Priority:</label>
          <select
            v-model="selectedPriority"
            @change="applyFilters"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>

        <div class="ml-auto flex gap-2">
          <button
            @click="refreshData"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Refresh Data
          </button>
          
          <button
            @click="clearFilters"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Clear Filters
          </button>
          
          <button
            @click="exportLeads"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export Leads
          </button>
        </div>
      </div>
    </div>

    <!-- Lead Cards -->
    <div class="space-y-6">
      <div
        v-for="lead in filteredLeads"
        :key="lead.id"
        class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
      >
        <!-- Lead Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              :class="[
                'px-3 py-1 rounded-full text-xs font-bold uppercase',
                getPriorityClass(lead.priority)
              ]"
            >
              {{ lead.priority }}
            </div>
            <div class="text-sm text-gray-600">{{ getTypeLabel(lead.type) }}</div>
          </div>
          <div class="text-sm text-gray-500">{{ formatRelativeDate(lead.date) }}</div>
        </div>

        <!-- Lead Title and Description -->
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ lead.title }}</h3>
        <p class="text-gray-600 mb-4 line-clamp-3">{{ lead.description }}</p>

        <!-- Company Information -->
        <div class="flex items-center gap-3 mb-4">
          <div class="flex items-center gap-2">
            <span class="text-2xl">📊</span>
            <span class="font-medium text-gray-900">{{ lead.company }}</span>
          </div>
        </div>

        <!-- Source and Links -->
        <div class="flex items-center gap-4 mb-4">
          <div class="text-sm">
            <span class="text-gray-500">Source:</span>
            <span class="font-medium text-gray-900 ml-1">{{ lead.source }}</span>
            <span class="text-green-600 ml-1">✅</span>
          </div>
          <a
            :href="lead.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <span>📰 Click here to see source article</span>
          </a>
          <a
            :href="lead.companyUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <span>🏢 {{ lead.company }} Website</span>
          </a>
        </div>

        <!-- Outreach Opportunity -->
        <div class="bg-blue-50 rounded-lg p-4 mb-4">
          <div class="flex items-start gap-2 mb-2">
            <span class="text-lg">💡</span>
            <div>
              <div class="font-medium text-blue-900 mb-1">Outreach Opportunity:</div>
              <p class="text-blue-800 text-sm">{{ lead.outreachOpportunity }}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <button
            @click="generateEmail(lead)"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
          >
            <span>📧</span>
            Generate Email
          </button>
          <button
            @click="generateLinkedIn(lead)"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
          >
            <span>💼</span>
            LinkedIn Post
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredLeads.length === 0 && !loading" class="text-center py-12">
      <div class="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <span class="text-4xl">🎯</span>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Leads Found</h3>
      <p class="text-gray-500">No leads matching the selected filters were found.</p>
      <button
        @click="clearFilters"
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Clear Filters
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin w-12 h-12 mx-auto border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
      <p class="text-gray-600">Loading pharmaceutical leads...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Reactive state
const loading = ref(false)
const selectedTrigger = ref('')
const selectedPriority = ref('')
const lastUpdated = ref(new Date())

// Sample lead data based on your example
const leads = ref([
  {
    id: 1,
    priority: 'critical',
    type: 'warning_letter',
    date: new Date('2025-08-30'),
    title: 'Pfizer Receives FDA Warning Letter for Manufacturing Violations at North Carolina Facility',
    description: 'The FDA issued a warning letter to Pfizer citing significant cGMP violations including inadequate cleaning validation and failure to investigate discrepancies in manufacturing processes.',
    company: 'Pfizer',
    source: 'FDA Law Blog',
    sourceUrl: 'https://www.fdalawblog.net/',
    companyUrl: 'https://www.pfizer.com/',
    outreachOpportunity: 'Pfizer received FDA warning letter - compliance issues present. Opportunity to offer regulatory data management and compliance monitoring solutions.'
  },
  {
    id: 2,
    priority: 'critical',
    type: 'drug_recall',
    date: new Date('2025-08-25'),
    title: 'Gilead Sciences Recalls Hepatitis B Treatment Due to Manufacturing Defect',
    description: 'Gilead voluntarily recalls batches of hepatitis B treatment due to contamination concerns identified during routine quality testing at manufacturing facility.',
    company: 'Gilead Sciences',
    source: 'FDA Law Blog',
    sourceUrl: 'https://www.fdalawblog.net/',
    companyUrl: 'https://www.gilead.com/',
    outreachOpportunity: 'Gilead Sciences experiencing compliance challenges. Opportunity to offer quality management and regulatory data solutions.'
  },
  {
    id: 3,
    priority: 'critical',
    type: 'clinical_hold',
    date: new Date('2021-12-22'),
    title: 'Particulate problem prompts hold on 10 Gilead studies of HIV hopeful lenacapavir',
    description: 'Particulate problem prompts hold on 10 Gilead studies of HIV hopeful lenacapavir',
    company: 'Gilead',
    source: 'FiercePharma',
    sourceUrl: 'https://www.fiercepharma.com/',
    companyUrl: 'https://www.gilead.com/',
    outreachOpportunity: 'Gilead received FDA warning letter - compliance issues present. Opportunity to offer regulatory data management and compliance monitoring solutions.'
  },
  {
    id: 4,
    priority: 'high',
    type: 'patent_expiry',
    date: new Date('2025-08-29'),
    title: 'Novartis Patent for Blockbuster Drug Gleevec Set to Expire in 2025',
    description: 'Novartis faces patent cliff as exclusivity for Gleevec expires, opening market to generic competition worth $4.5 billion annually.',
    company: 'Novartis',
    source: 'Pharmaceutical Executive',
    sourceUrl: 'https://www.pharmexec.com/',
    companyUrl: 'https://www.novartis.com/',
    outreachOpportunity: 'Novartis facing patent cliff challenges. Opportunity to provide competitive intelligence and market access data.'
  }
])

// Computed properties
const triggerCounts = computed(() => {
  const counts = {
    critical: 0,
    warningLetters: 0,
    patents: 0,
    investments: 0
  }
  
  leads.value.forEach(lead => {
    if (lead.priority === 'critical') counts.critical++
    if (lead.type === 'warning_letter') counts.warningLetters++
    if (lead.type === 'patent_expiry') counts.patents++
    if (lead.type === 'investment_opportunity') counts.investments++
  })
  
  return counts
})

const filteredLeads = computed(() => {
  let filtered = leads.value
  
  if (selectedTrigger.value) {
    filtered = filtered.filter(lead => lead.type === selectedTrigger.value)
  }
  
  if (selectedPriority.value) {
    filtered = filtered.filter(lead => lead.priority === selectedPriority.value)
  }
  
  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Methods
const getPriorityClass = (priority) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getTypeLabel = (type) => {
  const labels = {
    warning_letter: 'Warning Letter/483',
    drug_recall: 'Drug Recall',
    trial_failed: 'Failed Trial',
    clinical_hold: 'Clinical Hold',
    patent_expiry: 'Patent Expiry',
    enforcement_action: 'Enforcement Action',
    compliance_violation: 'Compliance Issue'
  }
  return labels[type] || type.replace('_', ' ')
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

const formatRelativeDate = (date) => {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

const filterByTrigger = (trigger) => {
  if (trigger === 'critical') {
    selectedPriority.value = 'critical'
    selectedTrigger.value = ''
  } else if (trigger === 'warning_letter') {
    selectedTrigger.value = 'warning_letter'
  } else if (trigger === 'patent') {
    selectedTrigger.value = 'patent_expiry'
  } else if (trigger === 'investment') {
    selectedTrigger.value = 'investment_opportunity'
  }
}

const applyFilters = () => {
  // Filtering is handled by computed property
}

const clearFilters = () => {
  selectedTrigger.value = ''
  selectedPriority.value = ''
}

const refreshData = async () => {
  loading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    lastUpdated.value = new Date()
  } finally {
    loading.value = false
  }
}

const exportLeads = () => {
  const csvContent = generateCSV()
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pharma-leads-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

const generateCSV = () => {
  const headers = ['Priority', 'Type', 'Date', 'Company', 'Title', 'Description', 'Source', 'Opportunity']
  const rows = filteredLeads.value.map(lead => [
    lead.priority,
    getTypeLabel(lead.type),
    formatRelativeDate(lead.date),
    lead.company,
    lead.title,
    lead.description,
    lead.source,
    lead.outreachOpportunity
  ])
  
  return [headers, ...rows].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n')
}

const generateEmail = (lead) => {
  alert(`Generate email template for ${lead.company} regarding ${lead.type}`)
}

const generateLinkedIn = (lead) => {
  alert(`Generate LinkedIn post for ${lead.company} opportunity`)
}

// Lifecycle
onMounted(() => {
  refreshData()
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