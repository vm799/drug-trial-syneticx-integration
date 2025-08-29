<template>
  <div class="competitive-intelligence">
    <div class="intelligence-header">
      <div class="header-left">
        <h2 class="intelligence-title">
          <i class="fas fa-users"></i>
          Competitive Intelligence
        </h2>
        <p class="intelligence-subtitle">Track competitor portfolios and market positioning</p>
      </div>
      <div class="header-controls">
        <div class="threat-filter">
          <label>Threat Level:</label>
          <select v-model="selectedThreatLevel" @change="filterData">
            <option value="">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div class="view-toggle">
          <button 
            @click="viewMode = 'grid'" 
            :class="{ active: viewMode === 'grid' }"
            class="view-btn"
          >
            <i class="fas fa-th"></i>
          </button>
          <button 
            @click="viewMode = 'list'" 
            :class="{ active: viewMode === 'list' }"
            class="view-btn"
          >
            <i class="fas fa-list"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="intelligence-content" v-if="!loading">
      <!-- Threat Overview -->
      <div class="threat-overview">
        <div class="threat-metric critical">
          <div class="threat-icon">
            <i class="fas fa-fire"></i>
          </div>
          <div class="threat-data">
            <span class="threat-count">{{ threatSummary.critical }}</span>
            <span class="threat-label">Critical Threats</span>
          </div>
        </div>
        
        <div class="threat-metric high">
          <div class="threat-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="threat-data">
            <span class="threat-count">{{ threatSummary.high }}</span>
            <span class="threat-label">High Priority</span>
          </div>
        </div>
        
        <div class="threat-metric market-cap">
          <div class="threat-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="threat-data">
            <span class="threat-count">${{ formatValue(totalMarketCap) }}</span>
            <span class="threat-label">Total Market Cap</span>
          </div>
        </div>

        <div class="threat-metric pipeline">
          <div class="threat-icon">
            <i class="fas fa-flask"></i>
          </div>
          <div class="threat-data">
            <span class="threat-count">{{ totalPipelineAssets }}</span>
            <span class="threat-label">Pipeline Assets</span>
          </div>
        </div>
      </div>

      <!-- Competitor Matrix -->
      <div class="competitor-matrix" v-if="viewMode === 'grid'">
        <div class="matrix-header">
          <h3>Competitive Positioning Matrix</h3>
          <p>Market cap vs. pipeline strength analysis</p>
        </div>
        <div class="matrix-chart">
          <div class="matrix-grid">
            <!-- Y-axis labels -->
            <div class="y-axis">
              <span class="axis-label">High Pipeline</span>
              <span class="axis-label">Medium Pipeline</span>
              <span class="axis-label">Low Pipeline</span>
            </div>
            
            <!-- Competitor bubbles -->
            <div class="matrix-content">
              <div 
                v-for="competitor in filteredCompetitors" 
                :key="competitor.id"
                class="competitor-bubble"
                :class="[`threat-${competitor.overallThreat}`]"
                :style="getBubbleStyle(competitor)"
                @click="selectCompetitor(competitor)"
              >
                <div class="bubble-content">
                  <span class="company-name">{{ competitor.companyName }}</span>
                  <span class="bubble-metrics">
                    ${{ formatValue(competitor.marketCap) }}
                  </span>
                </div>
                <div class="bubble-tooltip">
                  <strong>{{ competitor.companyName }}</strong><br>
                  Market Cap: ${{ formatValue(competitor.marketCap) }}<br>
                  Pipeline: {{ competitor.pipelineAssets }} assets<br>
                  Threat Level: {{ competitor.overallThreat.toUpperCase() }}
                </div>
              </div>
            </div>
            
            <!-- X-axis labels -->
            <div class="x-axis">
              <span class="axis-label">Low Market Cap</span>
              <span class="axis-label">Medium Market Cap</span>
              <span class="axis-label">High Market Cap</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Competitor List View -->
      <div class="competitor-list" v-if="viewMode === 'list'">
        <div class="list-header">
          <h3>Competitor Analysis</h3>
          <div class="sort-controls">
            <select v-model="sortBy" @change="sortCompetitors">
              <option value="threatScore">Threat Score</option>
              <option value="marketCap">Market Cap</option>
              <option value="pipelineAssets">Pipeline Assets</option>
              <option value="recentActivity">Recent Activity</option>
            </select>
          </div>
        </div>

        <div class="competitor-cards">
          <div 
            v-for="competitor in sortedCompetitors" 
            :key="competitor.id"
            class="competitor-card"
            :class="[`threat-${competitor.overallThreat}`]"
            @click="selectCompetitor(competitor)"
          >
            <div class="card-header">
              <div class="company-info">
                <h4>{{ competitor.companyName }}</h4>
                <span class="company-ticker">{{ competitor.ticker }}</span>
              </div>
              <div class="threat-indicator">
                <div class="threat-badge" :class="competitor.overallThreat">
                  {{ competitor.overallThreat.toUpperCase() }}
                </div>
                <div class="threat-score">{{ competitor.threatScore }}/100</div>
              </div>
            </div>

            <div class="card-metrics">
              <div class="metric-group">
                <div class="metric">
                  <label>Market Cap</label>
                  <span class="value">${{ formatValue(competitor.marketCap) }}</span>
                </div>
                <div class="metric">
                  <label>Pipeline Assets</label>
                  <span class="value">{{ competitor.pipelineAssets }}</span>
                </div>
                <div class="metric">
                  <label>Patent Portfolio</label>
                  <span class="value">{{ competitor.patentCount }} patents</span>
                </div>
              </div>

              <div class="recent-activity">
                <label>Recent Activity</label>
                <div class="activity-list">
                  <div 
                    v-for="activity in competitor.recentActivities.slice(0, 2)" 
                    :key="activity.id"
                    class="activity-item"
                  >
                    <span class="activity-type" :class="activity.type">
                      {{ formatActivityType(activity.type) }}
                    </span>
                    <span class="activity-date">{{ formatDate(activity.date) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-actions">
              <button class="action-btn primary" @click.stop="analyzeCompetitor(competitor)">
                <i class="fas fa-chart-bar"></i> Deep Analysis
              </button>
              <button class="action-btn secondary" @click.stop="compareCompetitors(competitor)">
                <i class="fas fa-balance-scale"></i> Compare
              </button>
              <button class="action-btn monitor" @click.stop="monitorCompetitor(competitor)">
                <i class="fas fa-eye"></i> Monitor
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Market Trend Analysis -->
      <div class="market-trends">
        <h3>Market Movement Trends</h3>
        <div class="trends-grid">
          <div class="trend-card acquisitions">
            <div class="trend-header">
              <i class="fas fa-handshake"></i>
              <span>Recent Acquisitions</span>
            </div>
            <div class="trend-content">
              <div class="trend-metric">{{ recentAcquisitions.length }}</div>
              <div class="trend-change positive">+{{ acquisitionGrowth }}%</div>
            </div>
            <div class="trend-list">
              <div 
                v-for="acquisition in recentAcquisitions.slice(0, 3)" 
                :key="acquisition.id"
                class="trend-item"
              >
                <span class="acquirer">{{ acquisition.acquirer }}</span>
                <span class="target">acquired {{ acquisition.target }}</span>
                <span class="value">${{ formatValue(acquisition.value) }}</span>
              </div>
            </div>
          </div>

          <div class="trend-card partnerships">
            <div class="trend-header">
              <i class="fas fa-users-cog"></i>
              <span>Strategic Partnerships</span>
            </div>
            <div class="trend-content">
              <div class="trend-metric">{{ strategicPartnerships.length }}</div>
              <div class="trend-change positive">+{{ partnershipGrowth }}%</div>
            </div>
            <div class="trend-list">
              <div 
                v-for="partnership in strategicPartnerships.slice(0, 3)" 
                :key="partnership.id"
                class="trend-item"
              >
                <span class="partner1">{{ partnership.company1 }}</span>
                <span class="connector">partnered with</span>
                <span class="partner2">{{ partnership.company2 }}</span>
              </div>
            </div>
          </div>

          <div class="trend-card pipeline-progress">
            <div class="trend-header">
              <i class="fas fa-flask"></i>
              <span>Pipeline Advancements</span>
            </div>
            <div class="trend-content">
              <div class="trend-metric">{{ pipelineAdvancements.length }}</div>
              <div class="trend-change positive">+{{ pipelineGrowth }}%</div>
            </div>
            <div class="trend-list">
              <div 
                v-for="advancement in pipelineAdvancements.slice(0, 3)" 
                :key="advancement.id"
                class="trend-item"
              >
                <span class="drug">{{ advancement.drug }}</span>
                <span class="phase">advanced to {{ advancement.newPhase }}</span>
                <span class="company">{{ advancement.company }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-state" v-else>
      <div class="loading-spinner"></div>
      <p>Gathering competitive intelligence...</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'

export default {
  name: 'CompetitiveIntelligence',
  props: {
    data: {
      type: Object,
      default: () => ({
        competitors: [],
        recentAcquisitions: [],
        strategicPartnerships: [],
        pipelineAdvancements: []
      })
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['competitor-selected', 'analysis-requested'],
  setup(props, { emit }) {
    const selectedThreatLevel = ref('')
    const viewMode = ref('grid')
    const sortBy = ref('threatScore')

    // Computed properties for data analysis
    const threatSummary = computed(() => {
      return props.data.competitors?.reduce((acc, competitor) => {
        acc[competitor.overallThreat] = (acc[competitor.overallThreat] || 0) + 1
        return acc
      }, { critical: 0, high: 0, medium: 0, low: 0 }) || { critical: 0, high: 0, medium: 0, low: 0 }
    })

    const totalMarketCap = computed(() => {
      return props.data.competitors?.reduce((sum, competitor) => sum + competitor.marketCap, 0) || 0
    })

    const totalPipelineAssets = computed(() => {
      return props.data.competitors?.reduce((sum, competitor) => sum + competitor.pipelineAssets, 0) || 0
    })

    const filteredCompetitors = computed(() => {
      if (!selectedThreatLevel.value) return props.data.competitors || []
      return props.data.competitors?.filter(competitor => 
        competitor.overallThreat === selectedThreatLevel.value
      ) || []
    })

    const sortedCompetitors = computed(() => {
      const competitors = [...(filteredCompetitors.value || [])]
      return competitors.sort((a, b) => {
        switch (sortBy.value) {
          case 'threatScore':
            return b.threatScore - a.threatScore
          case 'marketCap':
            return b.marketCap - a.marketCap
          case 'pipelineAssets':
            return b.pipelineAssets - a.pipelineAssets
          case 'recentActivity':
            return b.recentActivities?.length - a.recentActivities?.length
          default:
            return 0
        }
      })
    })

    const recentAcquisitions = computed(() => props.data.recentAcquisitions || [])
    const strategicPartnerships = computed(() => props.data.strategicPartnerships || [])
    const pipelineAdvancements = computed(() => props.data.pipelineAdvancements || [])

    // Growth calculations (mock data for demonstration)
    const acquisitionGrowth = ref(15)
    const partnershipGrowth = ref(8)
    const pipelineGrowth = ref(22)

    const filterData = () => {
      // Filter logic is handled by computed properties
    }

    const sortCompetitors = () => {
      // Sorting logic is handled by computed properties
    }

    const selectCompetitor = (competitor) => {
      emit('competitor-selected', competitor)
    }

    const analyzeCompetitor = (competitor) => {
      emit('analysis-requested', { type: 'competitor_analysis', competitor })
    }

    const compareCompetitors = (competitor) => {
      emit('analysis-requested', { type: 'competitor_comparison', competitor })
    }

    const monitorCompetitor = (competitor) => {
      emit('analysis-requested', { type: 'competitor_monitoring', competitor })
    }

    const getBubbleStyle = (competitor) => {
      // Calculate position based on market cap (x) and pipeline strength (y)
      const maxMarketCap = Math.max(...(props.data.competitors?.map(c => c.marketCap) || [1]))
      const maxPipeline = Math.max(...(props.data.competitors?.map(c => c.pipelineAssets) || [1]))
      
      const x = (competitor.marketCap / maxMarketCap) * 80 + 10 // 10-90% range
      const y = 90 - ((competitor.pipelineAssets / maxPipeline) * 80 + 10) // Invert Y axis
      
      // Bubble size based on threat score
      const size = Math.max(40, (competitor.threatScore / 100) * 80)
      
      return {
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        transform: 'translate(-50%, -50%)'
      }
    }

    const formatValue = (value) => {
      if (value >= 1000000000) {
        return (value / 1000000000).toFixed(1) + 'B'
      } else if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M'
      }
      return (value / 1000).toFixed(0) + 'K'
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString()
    }

    const formatActivityType = (type) => {
      const types = {
        'acquisition': 'Acquisition',
        'partnership': 'Partnership',
        'pipeline_advance': 'Pipeline',
        'patent_filing': 'Patent',
        'fda_approval': 'FDA Approval',
        'clinical_trial': 'Clinical Trial'
      }
      return types[type] || type
    }

    return {
      selectedThreatLevel,
      viewMode,
      sortBy,
      threatSummary,
      totalMarketCap,
      totalPipelineAssets,
      filteredCompetitors,
      sortedCompetitors,
      recentAcquisitions,
      strategicPartnerships,
      pipelineAdvancements,
      acquisitionGrowth,
      partnershipGrowth,
      pipelineGrowth,
      filterData,
      sortCompetitors,
      selectCompetitor,
      analyzeCompetitor,
      compareCompetitors,
      monitorCompetitor,
      getBubbleStyle,
      formatValue,
      formatDate,
      formatActivityType
    }
  }
}
</script>

<style scoped>
.competitive-intelligence {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.intelligence-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.intelligence-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.intelligence-title i {
  color: #3b82f6;
}

.intelligence-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.threat-filter {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.threat-filter label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.threat-filter select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.view-toggle {
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}

.view-btn {
  padding: 0.5rem;
  border: none;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn.active {
  background: #3b82f6;
  color: white;
}

.intelligence-content {
  flex: 1;
  padding: 1.5rem;
  overflow: auto;
}

.threat-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.threat-metric {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
}

.threat-metric:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.threat-metric.critical {
  border-color: #fecaca;
  background: linear-gradient(135deg, #fef2f2, #ffffff);
}

.threat-metric.high {
  border-color: #fed7aa;
  background: linear-gradient(135deg, #fffbeb, #ffffff);
}

.threat-metric.market-cap {
  border-color: #bbf7d0;
  background: linear-gradient(135deg, #f0fdf4, #ffffff);
}

.threat-metric.pipeline {
  border-color: #bfdbfe;
  background: linear-gradient(135deg, #eff6ff, #ffffff);
}

.threat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.threat-metric.critical .threat-icon {
  background: #fef2f2;
  color: #ef4444;
}

.threat-metric.high .threat-icon {
  background: #fffbeb;
  color: #f59e0b;
}

.threat-metric.market-cap .threat-icon {
  background: #f0fdf4;
  color: #10b981;
}

.threat-metric.pipeline .threat-icon {
  background: #eff6ff;
  color: #3b82f6;
}

.threat-data {
  display: flex;
  flex-direction: column;
}

.threat-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.threat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
}

.competitor-matrix {
  margin-bottom: 2rem;
}

.matrix-header {
  margin-bottom: 1rem;
}

.matrix-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.matrix-header p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.matrix-chart {
  background: #f9fafb;
  border-radius: 8px;
  padding: 2rem;
  height: 400px;
}

.matrix-grid {
  position: relative;
  height: 100%;
  display: grid;
  grid-template-columns: 100px 1fr;
  grid-template-rows: 1fr 40px;
  gap: 1rem;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  padding-right: 1rem;
}

.x-axis {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-top: 1rem;
  grid-column: 2;
}

.axis-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.matrix-content {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
}

.competitor-bubble {
  position: absolute;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.competitor-bubble.threat-critical {
  background: #ef4444;
  color: white;
}

.competitor-bubble.threat-high {
  background: #f59e0b;
  color: white;
}

.competitor-bubble.threat-medium {
  background: #3b82f6;
  color: white;
}

.competitor-bubble.threat-low {
  background: #10b981;
  color: white;
}

.competitor-bubble:hover {
  transform: translate(-50%, -50%) scale(1.1);
  z-index: 10;
}

.bubble-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0.25rem;
}

.company-name {
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 0.125rem;
}

.bubble-metrics {
  font-size: 0.625rem;
  opacity: 0.9;
}

.bubble-tooltip {
  position: absolute;
  top: 100%;
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
  z-index: 20;
  margin-top: 0.5rem;
}

.competitor-bubble:hover .bubble-tooltip {
  opacity: 1;
  visibility: visible;
}

.competitor-list {
  margin-bottom: 2rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.list-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.sort-controls select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.competitor-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.competitor-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.competitor-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.competitor-card.threat-critical {
  border-left: 4px solid #ef4444;
}

.competitor-card.threat-high {
  border-left: 4px solid #f59e0b;
}

.competitor-card.threat-medium {
  border-left: 4px solid #3b82f6;
}

.competitor-card.threat-low {
  border-left: 4px solid #10b981;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.company-info h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.company-ticker {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  font-family: 'Monaco', 'Consolas', monospace;
}

.threat-indicator {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.threat-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.threat-badge.critical {
  background: #fef2f2;
  color: #ef4444;
}

.threat-badge.high {
  background: #fffbeb;
  color: #f59e0b;
}

.threat-badge.medium {
  background: #eff6ff;
  color: #3b82f6;
}

.threat-badge.low {
  background: #f0fdf4;
  color: #10b981;
}

.threat-score {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
}

.card-metrics {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 1rem;
}

.metric-group {
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

.metric .value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.recent-activity label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.activity-type {
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-weight: 500;
}

.activity-type.acquisition {
  background: #fef2f2;
  color: #ef4444;
}

.activity-type.partnership {
  background: #eff6ff;
  color: #3b82f6;
}

.activity-type.pipeline_advance {
  background: #f0fdf4;
  color: #10b981;
}

.activity-date {
  color: #9ca3af;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.action-btn {
  padding: 0.5rem 1rem;
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

.action-btn.primary {
  background: #3b82f6;
  color: white;
}

.action-btn.primary:hover {
  background: #2563eb;
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.action-btn.secondary:hover {
  background: #e5e7eb;
}

.action-btn.monitor {
  background: #10b981;
  color: white;
}

.action-btn.monitor:hover {
  background: #059669;
}

.market-trends {
  margin-bottom: 2rem;
}

.market-trends h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.trends-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.trend-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.trend-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.trend-header i {
  color: #3b82f6;
}

.trend-header span {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.trend-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.trend-metric {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.trend-change {
  font-size: 0.875rem;
  font-weight: 600;
}

.trend-change.positive {
  color: #10b981;
}

.trend-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.trend-item {
  font-size: 0.75rem;
  color: #6b7280;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 4px;
}

.trend-item .acquirer,
.trend-item .partner1,
.trend-item .drug {
  font-weight: 600;
  color: #1f2937;
}

.trend-item .value,
.trend-item .phase,
.trend-item .company {
  float: right;
  color: #3b82f6;
  font-weight: 500;
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
  border-top: 3px solid #3b82f6;
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
  .competitor-card {
    padding: 2rem;
  }
  
  .card-metrics {
    gap: 3rem;
  }
  
  .matrix-chart {
    height: 500px;
    padding: 3rem;
  }
}
</style>