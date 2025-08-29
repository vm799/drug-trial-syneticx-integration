<template>
  <div class="data-management bg-white min-h-screen">
    <!-- Sticky Action Bar -->
    <div class="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Data Management Center</h1>
          <p class="text-gray-600 mt-1">Manage data sources, upload files, and build knowledge graphs</p>
        </div>
        <div class="flex space-x-3">
          <button
            @click="showUploadModal = true"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Data
          </button>
          <button
            @click="refreshAllData"
            :disabled="refreshing"
            class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ refreshing ? 'Refreshing...' : 'Refresh All' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-red-800">{{ error }}</span>
        </div>
        <button @click="clearError" class="text-red-400 hover:text-red-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="px-6 py-6">
      <div class="max-w-7xl mx-auto space-y-8">
        
        <!-- System Status Overview -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
          <div v-if="systemStatus" class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-blue-600">{{ systemStatus.dataSources.total }}</div>
              <div class="text-sm text-gray-600">Data Sources</div>
            </div>
            <div class="bg-white rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-green-600">{{ systemStatus.dataSources.active }}</div>
              <div class="text-sm text-gray-600">Active Sources</div>
            </div>
            <div class="bg-white rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-purple-600">{{ systemStatus.knowledgeGraphs.total }}</div>
              <div class="text-sm text-gray-600">Knowledge Graphs</div>
            </div>
            <div class="bg-white rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-orange-600">{{ systemStatus.dataQuality.verified }}</div>
              <div class="text-sm text-gray-600">Verified Data</div>
            </div>
          </div>
          <div v-else class="animate-pulse">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div v-for="i in 4" :key="i" class="bg-white rounded-lg p-4 h-20 bg-gray-200"></div>
            </div>
          </div>
        </div>

        <!-- Data Sources -->
        <div class="bg-white rounded-xl border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Data Sources</h2>
            <p class="text-gray-600 mt-1">Monitor and manage your data sources</p>
          </div>
          <div class="p-6">
            <div v-if="dataSources.length === 0" class="text-center py-8">
              <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No data sources yet</h3>
              <p class="text-gray-500 mb-4">Upload your first data file or connect an API to get started</p>
              <button
                @click="showUploadModal = true"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Upload Data
              </button>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="source in dataSources"
                :key="source.id"
                class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <h3 class="text-lg font-medium text-gray-900">{{ source.name }}</h3>
                      <span class="px-2 py-1 text-xs font-medium rounded-full"
                        :class="{
                          'bg-green-100 text-green-800': source.status === 'active',
                          'bg-red-100 text-red-800': source.status === 'error',
                          'bg-yellow-100 text-yellow-800': source.status === 'inactive'
                        }"
                      >
                        {{ source.status }}
                      </span>
                      <span class="px-2 py-1 text-xs font-medium rounded-full"
                        :class="{
                          'bg-blue-100 text-blue-800': source.dataQuality === 'verified',
                          'bg-gray-100 text-gray-800': source.dataQuality === 'unknown',
                          'bg-red-100 text-red-800': source.dataQuality === 'error'
                        }"
                      >
                        {{ source.dataQuality }}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">
                      Type: {{ source.type }} | Data: {{ source.dataType }} | Records: {{ source.recordCount || 0 }}
                    </p>
                    <p class="text-sm text-gray-500 mt-1">
                      Last updated: {{ source.lastRefresh ? new Date(source.lastRefresh).toLocaleString() : 'Never' }}
                    </p>
                  </div>
                  <div class="flex space-x-2">
                    <button
                      @click="refreshSource(source.id)"
                      :disabled="source.refreshing"
                      class="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      @click="viewSourceDetails(source)"
                      class="text-gray-600 hover:text-gray-800"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Knowledge Graphs -->
        <div class="bg-white rounded-xl border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Knowledge Graphs</h2>
            <p class="text-gray-600 mt-1">Build and manage integrated knowledge graphs</p>
          </div>
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <button
                @click="showKnowledgeGraphModal = true"
                class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                Build New Graph
              </button>
            </div>
            
            <div v-if="knowledgeGraphs.length === 0" class="text-center py-8">
              <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No knowledge graphs yet</h3>
              <p class="text-gray-500">Build your first knowledge graph to start analyzing integrated data</p>
            </div>
            
            <div v-else class="space-y-4">
              <div
                v-for="graph in knowledgeGraphs"
                :key="graph.id"
                class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h3 class="text-lg font-medium text-gray-900">{{ graph.name || graph.id }}</h3>
                    <p class="text-sm text-gray-600 mt-1">
                      Status: {{ graph.status }} | Sources: {{ graph.sources.length }} | 
                      Entities: {{ graph.metadata.totalEntities }} | Relationships: {{ graph.metadata.totalRelationships }}
                    </p>
                    <p class="text-sm text-gray-500 mt-1">
                      Created: {{ new Date(graph.createdAt).toLocaleString() }}
                    </p>
                  </div>
                  <div class="flex space-x-2">
                    <button
                      @click="viewGraphDetails(graph)"
                      class="text-purple-600 hover:text-purple-800"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Source Status Dashboard -->
        <DataSourceStatus />

        <!-- Data Quality Report -->
        <div class="bg-white rounded-xl border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Data Quality Report</h2>
            <p class="text-gray-600 mt-1">Monitor data quality and get recommendations</p>
          </div>
          <div class="p-6">
            <div v-if="qualityReport" class="space-y-6">
              <!-- Quality Metrics -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-blue-50 rounded-lg p-4">
                  <div class="text-2xl font-bold text-blue-600">{{ qualityReport.totalSources }}</div>
                  <div class="text-sm text-blue-600">Total Sources</div>
                </div>
                <div class="bg-green-50 rounded-lg p-4">
                  <div class="text-2xl font-bold text-green-600">{{ qualityReport.refreshStatus.upToDate }}</div>
                  <div class="text-sm text-blue-600">Up to Date</div>
                </div>
                <div class="bg-red-50 rounded-lg p-4">
                  <div class="text-2xl font-bold text-red-600">{{ qualityReport.refreshStatus.error }}</div>
                  <div class="text-sm text-red-600">Errors</div>
                </div>
              </div>

              <!-- Recommendations -->
              <div v-if="qualityReport.recommendations.length > 0">
                <h3 class="text-lg font-medium text-gray-900 mb-3">Recommendations</h3>
                <div class="space-y-2">
                  <div
                    v-for="rec in qualityReport.recommendations"
                    :key="rec.sourceId"
                    class="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span class="text-yellow-800">{{ rec.description }}</span>
                    <span class="px-2 py-1 text-xs font-medium rounded-full"
                      :class="{
                        'bg-red-100 text-red-800': rec.priority === 'high',
                        'bg-yellow-100 text-yellow-800': rec.priority === 'medium',
                        'bg-blue-100 text-blue-800': rec.priority === 'low'
                      }"
                    >
                      {{ rec.priority }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="animate-pulse">
              <div class="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Upload Data File</h2>
          <button @click="showUploadModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleFileUpload" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
            <select v-model="uploadForm.dataType" class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Select data type</option>
              <option value="patents">Patents</option>
              <option value="clinical_trials">Clinical Trials</option>
              <option value="financial">Financial Data</option>
              <option value="competitive_intelligence">Competitive Intelligence</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Source Name</label>
            <input
              v-model="uploadForm.sourceName"
              type="text"
              placeholder="e.g., PharmaCorp Patents 2024"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Data File</label>
            <input
              ref="fileInput"
              type="file"
              accept=".csv,.json,.xlsx"
              @change="handleFileSelect"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <p class="text-sm text-gray-500 mt-1">Supported formats: CSV, JSON, Excel (max 50MB)</p>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="showUploadModal = false"
              class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!uploadForm.dataType || !uploadForm.sourceName || !selectedFile || uploading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {{ uploading ? 'Uploading...' : 'Upload' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Knowledge Graph Modal -->
    <div v-if="showKnowledgeGraphModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Build Knowledge Graph</h2>
          <button @click="showKnowledgeGraphModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleBuildKnowledgeGraph" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Graph Name</label>
            <input
              v-model="graphForm.name"
              type="text"
              placeholder="e.g., Pharma Market Analysis 2024"
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Data Sources</label>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              <label v-for="source in dataSources" :key="source.id" class="flex items-center">
                <input
                  type="checkbox"
                  :value="source.id"
                  v-model="graphForm.sourceIds"
                  class="mr-2"
                />
                <span class="text-sm">{{ source.name }} ({{ source.dataType }})</span>
              </label>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="showKnowledgeGraphModal = false"
              class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!graphForm.name || graphForm.sourceIds.length === 0 || buildingGraph"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              {{ buildingGraph ? 'Building...' : 'Build Graph' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import DataSourceStatus from './DataSourceStatus.vue'

// State
const error = ref(null)
const dataSources = ref([])
const knowledgeGraphs = ref([])
const systemStatus = ref(null)
const qualityReport = ref(null)
const refreshing = ref(false)
const uploading = ref(false)
const buildingGraph = ref(false)

// Modals
const showUploadModal = ref(false)
const showKnowledgeGraphModal = ref(false)

// Forms
const uploadForm = reactive({
  dataType: '',
  sourceName: ''
})

const graphForm = reactive({
  name: '',
  sourceIds: []
})

const selectedFile = ref(null)

// Methods
const clearError = () => {
  error.value = null
}

const loadDataSources = async () => {
  try {
    const response = await fetch('/api/data-management/sources')
    const data = await response.json()
    if (data.success) {
      dataSources.value = data.data
    } else {
      throw new Error(data.message || 'Failed to load data sources')
    }
  } catch (err) {
    error.value = err.message || 'Failed to load data sources'
  }
}

const loadKnowledgeGraphs = async () => {
  try {
    const response = await fetch('/api/data-management/knowledge-graphs')
    const data = await response.json()
    if (data.success) {
      knowledgeGraphs.value = data.data
    } else {
      throw new Error(data.message || 'Failed to load knowledge graphs')
    }
  } catch (err) {
    error.value = err.message || 'Failed to load knowledge graphs'
  }
}

const loadSystemStatus = async () => {
  try {
    const response = await fetch('/api/data-management/system-status')
    const data = await response.json()
    if (data.success) {
      systemStatus.value = data.data
    }
  } catch (err) {
    console.error('Failed to load system status:', err)
  }
}

const loadQualityReport = async () => {
  try {
    const response = await fetch('/api/data-management/quality-report')
    const data = await response.json()
    if (data.success) {
      qualityReport.value = data.data
    }
  } catch (err) {
    console.error('Failed to load quality report:', err)
  }
}

const refreshSource = async (sourceId) => {
  try {
    const source = dataSources.value.find(s => s.id === sourceId)
    if (source) source.refreshing = true

    const response = await fetch(`/api/data-management/sources/${sourceId}/refresh`, {
      method: 'POST'
    })
    const data = await response.json()
    
    if (data.success) {
      await loadDataSources()
      await loadSystemStatus()
      await loadQualityReport()
    } else {
      throw new Error(data.message || 'Failed to refresh data source')
    }
  } catch (err) {
    error.value = err.message || 'Failed to refresh data source'
  } finally {
    const source = dataSources.value.find(s => s.id === sourceId)
    if (source) source.refreshing = false
  }
}

const refreshAllData = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      loadDataSources(),
      loadKnowledgeGraphs(),
      loadSystemStatus(),
      loadQualityReport()
    ])
  } catch (err) {
    error.value = err.message || 'Failed to refresh data'
  } finally {
    refreshing.value = false
  }
}

const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0]
}

const handleFileUpload = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('dataFile', selectedFile.value)
    formData.append('sourceId', `source_${Date.now()}`)
    formData.append('sourceName', uploadForm.sourceName)
    formData.append('dataType', uploadForm.dataType)

    const response = await fetch('/api/data-management/upload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()
    if (data.success) {
      showUploadModal.value = false
      await loadDataSources()
      await loadSystemStatus()
      await loadQualityReport()
      
      // Reset form
      uploadForm.dataType = ''
      uploadForm.sourceName = ''
      selectedFile.value = null
      if (fileInput.value) fileInput.value.value = ''
    } else {
      throw new Error(data.message || 'Upload failed')
    }
  } catch (err) {
    error.value = err.message || 'Upload failed'
  } finally {
    uploading.value = false
  }
}

const handleBuildKnowledgeGraph = async () => {
  buildingGraph.value = true
  try {
    const response = await fetch('/api/data-management/knowledge-graphs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphForm)
    })

    const data = await response.json()
    if (data.success) {
      showKnowledgeGraphModal.value = false
      await loadKnowledgeGraphs()
      
      // Reset form
      graphForm.name = ''
      graphForm.sourceIds = []
    } else {
      throw new Error(data.message || 'Failed to build knowledge graph')
    }
  } catch (err) {
    error.value = err.message || 'Failed to build knowledge graph'
  } finally {
    buildingGraph.value = false
  }
}

const viewSourceDetails = (source) => {
  // TODO: Implement source details view
  console.log('View source details:', source)
}

const viewGraphDetails = (graph) => {
  // TODO: Implement graph details view
  console.log('View graph details:', graph)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadDataSources(),
    loadKnowledgeGraphs(),
    loadSystemStatus(),
    loadQualityReport()
  ])
})
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>