<template>
  <div class="patent-cliff-monitor">
    <div class="monitor-header">
      <div class="header-left">
        <h2 class="monitor-title">
          <i class="fas fa-exclamation-triangle"></i>
          Patent Cliff Monitor
        </h2>
        <p class="monitor-subtitle">Real-time patent expiry risk assessment</p>
      </div>
      <div class="header-controls">
        <div class="risk-filter">
          <label>Risk Level:</label>
          <select v-model="selectedRiskLevel" @change="filterData">
            <option value="">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <button @click="refreshData" class="refresh-btn" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        </button>
      </div>
    </div>

    <div class="monitor-content" v-if="!loading">
      <!-- Risk Summary Cards -->
      <div class="risk-summary">
        <div class="risk-card critical" @click="filterByRisk('critical')">
          <div class="risk-icon">
            <i class="fas fa-fire"></i>
          </div>
          <div class="risk-data">
            <span class="risk-count">{{ riskSummary.critical }}</span>
            <span class="risk-label">Critical Risk</span>
            <span class="risk-subtitle">&lt; 1 year</span>
          </div>
        </div>
        
        <div class="risk-card high" @click="filterByRisk('high')">
          <div class="risk-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="risk-data">
            <span class="risk-count">{{ riskSummary.high }}</span>
            <span class="risk-label">High Risk</span>
            <span class="risk-subtitle">1-2 years</span>
          </div>
        </div>
        
        <div class="risk-card medium" @click="filterByRisk('medium')">
          <div class="risk-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="risk-data">
            <span class="risk-count">{{ riskSummary.medium }}</span>
            <span class="risk-label">Medium Risk</span>
            <span class="risk-subtitle">2-5 years</span>
          </div>
        </div>
      </div>

      <!-- Timeline Visualization -->
      <div class="timeline-section">
        <h3 class="section-title">Patent Expiry Timeline</h3>
        <div class="timeline-container">
          <div class="timeline-axis">
            <div class="timeline-marker" v-for="year in timelineYears" :key="year">
              <span class="year-label">{{ year }}</span>
            </div>
          </div>
          <div class="timeline-events">
            <div 
              v-for="patent in filteredPatents" 
              :key="patent.id"
              class="timeline-event"
              :class="[`risk-${patent.riskLevel}`]"
              :style="{ left: calculateTimelinePosition(patent.expiryDate) + '%' }"
              @click="selectPatent(patent)"
            >
              <div class="event-marker"></div>
              <div class="event-tooltip">
                <strong>{{ patent.drugName }}</strong><br>
                {{ patent.company }}<br>
                Expires: {{ formatDate(patent.expiryDate) }}<br>
                Est. Revenue: ${{ formatRevenue(patent.estimatedRevenue) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Patent List -->
      <div class="patent-list-section">
        <h3 class="section-title">
          Patent Details 
          <span class="patent-count">({{ filteredPatents.length }})</span>
        </h3>
        <div class="patent-list">
          <div 
            v-for="patent in paginatedPatents" 
            :key="patent.id"
            class="patent-item"
            :class="[`risk-${patent.riskLevel}`]"
            @click="selectPatent(patent)"
          >
            <div class="patent-basic-info">
              <div class="patent-drug">
                <h4>{{ patent.drugName }}</h4>
                <span class="patent-number">{{ patent.patentNumber }}</span>
              </div>
              <div class="patent-company">{{ patent.company }}</div>
            </div>
            
            <div class="patent-metrics">
              <div class="metric">
                <label>Days to Expiry</label>
                <span class="metric-value" :class="getRiskClass(patent.daysToExpiry)">
                  {{ patent.daysToExpiry }}
                </span>
              </div>
              <div class="metric">
                <label>Est. Revenue Impact</label>
                <span class="metric-value">${{ formatRevenue(patent.estimatedRevenue) }}</span>
              </div>
              <div class="metric">
                <label>Generic Threat</label>
                <span class="metric-value threat-level" :class="patent.genericThreat.level">
                  {{ patent.genericThreat.level.toUpperCase() }}
                </span>
              </div>
            </div>
            
            <div class="patent-actions">
              <div class="risk-badge" :class="patent.riskLevel">
                {{ patent.riskLevel.toUpperCase() }}
              </div>
              <button class="action-btn analyze-btn" @click.stop="analyzePatent(patent)">
                <i class="fas fa-chart-line"></i> Analyze
              </button>
              <button class="action-btn monitor-btn" @click.stop="setAlert(patent)">
                <i class="fas fa-bell"></i> Monitor
              </button>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="page-btn"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">{{ currentPage }} of {{ totalPages }}</span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="page-btn"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-state" v-else>
      <div class="loading-spinner"></div>
      <p>Analyzing patent cliff risks...</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'

export default {
  name: 'PatentCliffMonitor',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['patent-selected', 'refresh-requested'],
  setup(props, { emit }) {
    const selectedRiskLevel = ref('')
    const currentPage = ref(1)
    const pageSize = 10

    // Calculate risk summary
    const riskSummary = computed(() => {
      return props.data.reduce((acc, patent) => {
        acc[patent.riskLevel] = (acc[patent.riskLevel] || 0) + 1
        return acc
      }, { critical: 0, high: 0, medium: 0, low: 0 })
    })

    // Filter patents by risk level
    const filteredPatents = computed(() => {
      if (!selectedRiskLevel.value) return props.data
      return props.data.filter(patent => patent.riskLevel === selectedRiskLevel.value)
    })

    // Paginate filtered patents
    const paginatedPatents = computed(() => {
      const start = (currentPage.value - 1) * pageSize
      const end = start + pageSize
      return filteredPatents.value.slice(start, end)
    })

    const totalPages = computed(() => {
      return Math.ceil(filteredPatents.value.length / pageSize)
    })

    // Timeline years (next 10 years)
    const timelineYears = computed(() => {
      const currentYear = new Date().getFullYear()
      return Array.from({ length: 10 }, (_, i) => currentYear + i)
    })

    const calculateTimelinePosition = (expiryDate) => {
      const now = new Date()
      const expiry = new Date(expiryDate)
      const tenYearsFromNow = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate())
      
      const totalRange = tenYearsFromNow.getTime() - now.getTime()
      const timeToExpiry = expiry.getTime() - now.getTime()
      
      return Math.max(0, Math.min(100, (timeToExpiry / totalRange) * 100))
    }

    const filterByRisk = (riskLevel) => {
      selectedRiskLevel.value = selectedRiskLevel.value === riskLevel ? '' : riskLevel
      currentPage.value = 1
    }

    const filterData = () => {
      currentPage.value = 1
    }

    const selectPatent = (patent) => {
      emit('patent-selected', patent)
    }

    const analyzePatent = (patent) => {
      // Emit event for detailed patent analysis
      emit('patent-analysis-requested', patent)
    }

    const setAlert = (patent) => {
      // Emit event for setting up patent monitoring alert
      emit('alert-requested', patent)
    }

    const refreshData = () => {
      emit('refresh-requested')
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString()
    }

    const formatRevenue = (revenue) => {
      if (revenue >= 1000000000) {
        return (revenue / 1000000000).toFixed(1) + 'B'
      } else if (revenue >= 1000000) {
        return (revenue / 1000000).toFixed(1) + 'M'
      }
      return (revenue / 1000).toFixed(0) + 'K'
    }

    const getRiskClass = (days) => {
      if (days < 365) return 'critical'
      if (days < 730) return 'high'
      if (days < 1825) return 'medium'
      return 'low'
    }

    // Reset page when filter changes
    watch(selectedRiskLevel, () => {
      currentPage.value = 1
    })

    return {
      selectedRiskLevel,
      currentPage,
      pageSize,
      riskSummary,
      filteredPatents,
      paginatedPatents,
      totalPages,
      timelineYears,
      calculateTimelinePosition,
      filterByRisk,
      filterData,
      selectPatent,
      analyzePatent,
      setAlert,
      refreshData,
      formatDate,
      formatRevenue,
      getRiskClass
    }
  }
}
</script>

<style scoped>
.patent-cliff-monitor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.monitor-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.monitor-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.monitor-title i {
  color: #ef4444;
}

.monitor-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.risk-filter {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.risk-filter label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.risk-filter select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.refresh-btn {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #f9fafb;
}

.monitor-content {
  flex: 1;
  padding: 1.5rem;
  overflow: auto;
}

.risk-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.risk-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.risk-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.risk-card.critical {
  border-color: #fecaca;
  background: linear-gradient(135deg, #fef2f2, #ffffff);
}

.risk-card.high {
  border-color: #fed7aa;
  background: linear-gradient(135deg, #fffbeb, #ffffff);
}

.risk-card.medium {
  border-color: #bfdbfe;
  background: linear-gradient(135deg, #eff6ff, #ffffff);
}

.risk-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.risk-card.critical .risk-icon {
  background: #fef2f2;
  color: #ef4444;
}

.risk-card.high .risk-icon {
  background: #fffbeb;
  color: #f59e0b;
}

.risk-card.medium .risk-icon {
  background: #eff6ff;
  color: #3b82f6;
}

.risk-data {
  display: flex;
  flex-direction: column;
}

.risk-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.risk-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.125rem;
}

.risk-subtitle {
  font-size: 0.75rem;
  color: #9ca3af;
}

.timeline-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.timeline-container {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  position: relative;
  height: 120px;
}

.timeline-axis {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.timeline-marker {
  text-align: center;
}

.year-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.timeline-events {
  position: relative;
  height: 60px;
}

.timeline-event {
  position: absolute;
  top: 0;
  cursor: pointer;
}

.event-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.timeline-event.risk-critical .event-marker {
  background: #ef4444;
}

.timeline-event.risk-high .event-marker {
  background: #f59e0b;
}

.timeline-event.risk-medium .event-marker {
  background: #3b82f6;
}

.timeline-event.risk-low .event-marker {
  background: #10b981;
}

.event-tooltip {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  z-index: 10;
}

.timeline-event:hover .event-tooltip {
  opacity: 1;
  visibility: visible;
}

.patent-list-section {
  flex: 1;
}

.patent-count {
  color: #6b7280;
  font-weight: 400;
}

.patent-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.patent-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: grid;
  grid-template-columns: 2fr 3fr 2fr;
  gap: 1rem;
  align-items: center;
}

.patent-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.patent-item.risk-critical {
  border-left: 4px solid #ef4444;
}

.patent-item.risk-high {
  border-left: 4px solid #f59e0b;
}

.patent-item.risk-medium {
  border-left: 4px solid #3b82f6;
}

.patent-item.risk-low {
  border-left: 4px solid #10b981;
}

.patent-drug h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.patent-number {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: 'Monaco', 'Consolas', monospace;
}

.patent-company {
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 500;
}

.patent-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.metric {
  text-align: center;
}

.metric label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.metric-value.critical {
  color: #ef4444;
}

.metric-value.high {
  color: #f59e0b;
}

.metric-value.medium {
  color: #3b82f6;
}

.metric-value.low {
  color: #10b981;
}

.threat-level.critical {
  color: #ef4444;
}

.threat-level.high {
  color: #f59e0b;
}

.threat-level.medium {
  color: #3b82f6;
}

.threat-level.low {
  color: #10b981;
}

.patent-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.risk-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.risk-badge.critical {
  background: #fef2f2;
  color: #ef4444;
}

.risk-badge.high {
  background: #fffbeb;
  color: #f59e0b;
}

.risk-badge.medium {
  background: #eff6ff;
  color: #3b82f6;
}

.risk-badge.low {
  background: #f0fdf4;
  color: #10b981;
}

.action-btn {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.analyze-btn {
  background: #667eea;
  color: white;
}

.analyze-btn:hover {
  background: #5a6fd8;
}

.monitor-btn {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.monitor-btn:hover {
  background: #e5e7eb;
}

.pagination {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.page-btn {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f9fafb;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Desktop optimization */
@media (min-width: 1600px) {
  .patent-item {
    padding: 1.5rem;
    grid-template-columns: 2fr 4fr 2fr;
  }
  
  .patent-metrics {
    gap: 1.5rem;
  }
  
  .timeline-container {
    height: 140px;
    padding: 2rem;
  }
}
</style>