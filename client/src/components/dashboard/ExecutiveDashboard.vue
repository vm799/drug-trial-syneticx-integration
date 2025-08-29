# ExecutiveDashboard.vue - Desktop-First Pharmaceutical Intelligence Dashboard

<template>
  <div class="executive-dashboard">
    <!-- Header Section -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">Pharmaceutical Intelligence Dashboard</h1>
        <div class="header-controls">
          <div class="time-range-selector">
            <select v-model="timeRange" @change="refreshDashboard" class="time-select">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <button @click="exportDashboard" class="export-btn">
            <i class="fas fa-download"></i> Export Report
          </button>
          <button @click="refreshDashboard" class="refresh-btn" :disabled="isLoading">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"></i> Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Main Dashboard Grid -->
    <div class="dashboard-grid">
      <!-- Key Metrics Row -->
      <div class="metrics-row">
        <MetricCard
          title="Critical Patent Cliffs"
          :value="dashboardData.criticalCliffs"
          icon="fas fa-exclamation-triangle"
          color="danger"
          :trend="dashboardData.cliffTrend"
        />
        <MetricCard
          title="Total Patents Monitored"
          :value="dashboardData.totalPatents"
          icon="fas fa-file-contract"
          color="primary"
          :trend="dashboardData.patentTrend"
        />
        <MetricCard
          title="Market Opportunities"
          :value="dashboardData.opportunities"
          icon="fas fa-chart-line"
          color="success"
          :trend="dashboardData.opportunityTrend"
        />
        <MetricCard
          title="Active Competitors"
          :value="dashboardData.competitors"
          icon="fas fa-users"
          color="info"
          :trend="dashboardData.competitorTrend"
        />
      </div>

      <!-- Main Content Areas -->
      <div class="content-row">
        <!-- Patent Cliff Monitor (Left Column) -->
        <div class="content-section cliff-monitor">
          <PatentCliffMonitor 
            :data="dashboardData.patentCliffs"
            :loading="isLoading"
            @patent-selected="handlePatentSelected"
          />
        </div>

        <!-- Competitive Intelligence (Right Column) -->
        <div class="content-section competitive-intel">
          <CompetitiveIntelligence 
            :data="dashboardData.competitiveData"
            :loading="isLoading"
            @competitor-selected="handleCompetitorSelected"
          />
        </div>
      </div>

      <!-- Secondary Content Areas -->
      <div class="secondary-row">
        <!-- Market Opportunities -->
        <div class="content-section market-opportunities">
          <MarketOpportunityFinder 
            :data="dashboardData.marketOpportunities"
            :loading="isLoading"
            @opportunity-selected="handleOpportunitySelected"
          />
        </div>

        <!-- Investment Analytics -->
        <div class="content-section investment-analytics">
          <InvestmentAnalytics 
            :data="dashboardData.investmentData"
            :loading="isLoading"
            @analysis-requested="handleAnalysisRequest"
          />
        </div>
      </div>

      <!-- Drug Pipeline Integration -->
      <div class="pipeline-row">
        <div class="content-section drug-pipeline">
          <DrugPipelineIntegration 
            :data="dashboardData.pipelineData"
            :loading="isLoading"
            @pipeline-selected="handlePipelineSelected"
          />
        </div>
      </div>
    </div>

    <!-- Modals and Overlays -->
    <PatentDetailModal 
      v-if="selectedPatent"
      :patent="selectedPatent"
      @close="selectedPatent = null"
    />
    
    <CompetitorDetailModal 
      v-if="selectedCompetitor"
      :competitor="selectedCompetitor"
      @close="selectedCompetitor = null"
    />
  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue'
import MetricCard from './components/MetricCard.vue'
import PatentCliffMonitor from './components/PatentCliffMonitor.vue'
import CompetitiveIntelligence from './components/CompetitiveIntelligence.vue'
import MarketOpportunityFinder from './components/MarketOpportunityFinder.vue'
import InvestmentAnalytics from './components/InvestmentAnalytics.vue'
import DrugPipelineIntegration from './components/DrugPipelineIntegration.vue'
import PatentDetailModal from './modals/PatentDetailModal.vue'
import CompetitorDetailModal from './modals/CompetitorDetailModal.vue'
import { useDashboardData } from '@/composables/useDashboardData'
import { useNotifications } from '@/composables/useNotifications'

export default {
  name: 'ExecutiveDashboard',
  components: {
    MetricCard,
    PatentCliffMonitor,
    CompetitiveIntelligence,
    MarketOpportunityFinder,
    InvestmentAnalytics,
    DrugPipelineIntegration,
    PatentDetailModal,
    CompetitorDetailModal
  },
  setup() {
    const isLoading = ref(false)
    const timeRange = ref(30)
    const selectedPatent = ref(null)
    const selectedCompetitor = ref(null)
    
    const dashboardData = reactive({
      criticalCliffs: 0,
      totalPatents: 0,
      opportunities: 0,
      competitors: 0,
      cliffTrend: { direction: 'up', percentage: 0 },
      patentTrend: { direction: 'up', percentage: 0 },
      opportunityTrend: { direction: 'up', percentage: 0 },
      competitorTrend: { direction: 'neutral', percentage: 0 },
      patentCliffs: [],
      competitiveData: [],
      marketOpportunities: [],
      investmentData: {},
      pipelineData: []
    })

    const { fetchDashboardData } = useDashboardData()
    const { showNotification } = useNotifications()

    const refreshDashboard = async () => {
      isLoading.value = true
      try {
        const data = await fetchDashboardData(timeRange.value)
        Object.assign(dashboardData, data)
        showNotification('Dashboard refreshed successfully', 'success')
      } catch (error) {
        showNotification('Failed to refresh dashboard', 'error')
        console.error('Dashboard refresh error:', error)
      } finally {
        isLoading.value = false
      }
    }

    const exportDashboard = async () => {
      try {
        // Generate comprehensive dashboard export
        const exportData = {
          generatedAt: new Date().toISOString(),
          timeRange: timeRange.value,
          summary: {
            criticalCliffs: dashboardData.criticalCliffs,
            totalPatents: dashboardData.totalPatents,
            opportunities: dashboardData.opportunities,
            competitors: dashboardData.competitors
          },
          detailedData: {
            patentCliffs: dashboardData.patentCliffs,
            competitiveIntelligence: dashboardData.competitiveData,
            marketOpportunities: dashboardData.marketOpportunities,
            investmentAnalysis: dashboardData.investmentData
          }
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pharma-intelligence-dashboard-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        showNotification('Dashboard exported successfully', 'success')
      } catch (error) {
        showNotification('Failed to export dashboard', 'error')
        console.error('Export error:', error)
      }
    }

    const handlePatentSelected = (patent) => {
      selectedPatent.value = patent
    }

    const handleCompetitorSelected = (competitor) => {
      selectedCompetitor.value = competitor
    }

    const handleOpportunitySelected = (opportunity) => {
      // Navigate to detailed opportunity analysis
      console.log('Opportunity selected:', opportunity)
    }

    const handleAnalysisRequest = (request) => {
      // Trigger investment analysis
      console.log('Analysis requested:', request)
    }

    const handlePipelineSelected = (pipeline) => {
      // Navigate to pipeline details
      console.log('Pipeline selected:', pipeline)
    }

    onMounted(() => {
      refreshDashboard()
      
      // Set up real-time updates
      const interval = setInterval(refreshDashboard, 300000) // 5 minutes
      
      return () => clearInterval(interval)
    })

    return {
      isLoading,
      timeRange,
      selectedPatent,
      selectedCompetitor,
      dashboardData,
      refreshDashboard,
      exportDashboard,
      handlePatentSelected,
      handleCompetitorSelected,
      handleOpportunitySelected,
      handleAnalysisRequest,
      handlePipelineSelected
    }
  }
}
</script>

<style scoped>
.executive-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.dashboard-header {
  background: white;
  border-bottom: 1px solid #e1e5e9;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1800px;
  margin: 0 auto;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.time-select {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.time-select:focus {
  outline: none;
  border-color: #667eea;
}

.export-btn, .refresh-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.refresh-btn {
  background: white;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.refresh-btn:hover:not(:disabled) {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dashboard-grid {
  padding: 2rem;
  max-width: 1800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.content-row, .secondary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.pipeline-row {
  display: grid;
  grid-template-columns: 1fr;
}

.content-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.content-section:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Desktop optimization - larger screens get more space */
@media (min-width: 1600px) {
  .dashboard-grid {
    max-width: 2000px;
  }
  
  .dashboard-title {
    font-size: 2.5rem;
  }
  
  .content-section {
    min-height: 400px;
  }
}

/* Wide desktop support */
@media (min-width: 2000px) {
  .dashboard-grid {
    max-width: 2400px;
  }
  
  .metrics-row {
    grid-template-columns: repeat(6, 1fr);
  }
  
  .content-row, .secondary-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Professional workstation support */
@media (min-width: 1200px) and (min-height: 800px) {
  .content-section {
    min-height: 450px;
  }
}
</style>