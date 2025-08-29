<template>
  <div class="metric-card" :class="[`metric-card--${color}`]">
    <div class="metric-header">
      <div class="metric-icon">
        <i :class="icon"></i>
      </div>
      <div class="metric-trend" v-if="trend">
        <i 
          :class="trendIcon" 
          :style="{ color: trendColor }"
        ></i>
        <span :style="{ color: trendColor }">{{ trend.percentage }}%</span>
      </div>
    </div>
    
    <div class="metric-content">
      <h3 class="metric-title">{{ title }}</h3>
      <div class="metric-value">{{ formattedValue }}</div>
    </div>
    
    <div class="metric-footer" v-if="trend">
      <span class="trend-text">vs last period</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'MetricCard',
  props: {
    title: {
      type: String,
      required: true
    },
    value: {
      type: [Number, String],
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: 'primary',
      validator: value => ['primary', 'success', 'warning', 'danger', 'info'].includes(value)
    },
    trend: {
      type: Object,
      default: null
      // Expected format: { direction: 'up'|'down'|'neutral', percentage: number }
    }
  },
  setup(props) {
    const formattedValue = computed(() => {
      if (typeof props.value === 'number') {
        if (props.value >= 1000000) {
          return (props.value / 1000000).toFixed(1) + 'M'
        } else if (props.value >= 1000) {
          return (props.value / 1000).toFixed(1) + 'K'
        }
        return props.value.toLocaleString()
      }
      return props.value
    })

    const trendIcon = computed(() => {
      if (!props.trend) return ''
      
      switch (props.trend.direction) {
        case 'up':
          return 'fas fa-arrow-up'
        case 'down':
          return 'fas fa-arrow-down'
        case 'neutral':
          return 'fas fa-minus'
        default:
          return 'fas fa-minus'
      }
    })

    const trendColor = computed(() => {
      if (!props.trend) return '#6b7280'
      
      switch (props.trend.direction) {
        case 'up':
          return props.color === 'danger' ? '#ef4444' : '#10b981'
        case 'down':
          return props.color === 'danger' ? '#10b981' : '#ef4444'
        case 'neutral':
          return '#6b7280'
        default:
          return '#6b7280'
      }
    })

    return {
      formattedValue,
      trendIcon,
      trendColor
    }
  }
}
</script>

<style scoped>
.metric-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transition: all 0.3s ease;
}

.metric-card--primary::before {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.metric-card--success::before {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.metric-card--warning::before {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.metric-card--danger::before {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.metric-card--info::before {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #d1d5db;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.3s ease;
}

.metric-card--primary .metric-icon {
  background: linear-gradient(135deg, #667eea20, #764ba220);
  color: #667eea;
}

.metric-card--success .metric-icon {
  background: linear-gradient(135deg, #10b98120, #05966920);
  color: #10b981;
}

.metric-card--warning .metric-icon {
  background: linear-gradient(135deg, #f59e0b20, #d9770620);
  color: #f59e0b;
}

.metric-card--danger .metric-icon {
  background: linear-gradient(135deg, #ef444420, #dc262620);
  color: #ef4444;
}

.metric-card--info .metric-icon {
  background: linear-gradient(135deg, #3b82f620, #2563eb20);
  color: #3b82f6;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.metric-content {
  margin-bottom: 1rem;
}

.metric-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin: 0;
}

.metric-footer {
  border-top: 1px solid #f3f4f6;
  padding-top: 0.75rem;
  margin-top: 1rem;
}

.trend-text {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Desktop optimization */
@media (min-width: 1200px) {
  .metric-card {
    padding: 2rem;
  }
  
  .metric-value {
    font-size: 2.5rem;
  }
  
  .metric-icon {
    width: 56px;
    height: 56px;
    font-size: 1.5rem;
  }
}

/* Large desktop displays */
@media (min-width: 1600px) {
  .metric-card {
    padding: 2.5rem;
  }
  
  .metric-value {
    font-size: 3rem;
  }
}
</style>