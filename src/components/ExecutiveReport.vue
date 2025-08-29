<template>
  <div class="executive-report bg-white">
    <!-- Slide 1: Executive Summary -->
    <div class="slide" v-show="currentSlide === 1">
      <div class="slide-header bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2">Executive Intelligence Report</h1>
            <p class="text-blue-100 text-lg">Pharmaceutical Portfolio Risk Assessment</p>
          </div>
          <div class="text-right">
            <div class="text-sm opacity-80">Generated: {{ reportDate }}</div>
            <div class="text-lg font-bold">CONFIDENTIAL</div>
          </div>
        </div>
      </div>
      
      <div class="slide-content p-8 space-y-8">
        <!-- Key Metrics Dashboard -->
        <div class="grid grid-cols-3 gap-6">
          <div class="metric-card bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 text-center">
            <div class="text-4xl font-bold text-red-600 mb-2">{{ summary.criticalPatents }}</div>
            <div class="text-sm font-semibold text-red-800">CRITICAL RISK PATENTS</div>
            <div class="text-xs text-red-600 mt-2">Expiring within 12 months</div>
          </div>
          <div class="metric-card bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6 text-center">
            <div class="text-4xl font-bold text-yellow-600 mb-2">${{ formatBillions(summary.revenueAtRisk) }}B</div>
            <div class="text-sm font-semibold text-yellow-800">REVENUE AT RISK</div>
            <div class="text-xs text-yellow-600 mt-2">24-month projection</div>
          </div>
          <div class="metric-card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 text-center">
            <div class="text-4xl font-bold text-green-600 mb-2">{{ summary.opportunities }}</div>
            <div class="text-sm font-semibold text-green-800">MARKET OPPORTUNITIES</div>
            <div class="text-xs text-green-600 mt-2">Strategic acquisitions identified</div>
          </div>
        </div>

        <!-- Strategic Recommendations -->
        <div class="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span class="text-2xl mr-3">🎯</span>
            Immediate Strategic Actions Required
          </h3>
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-3">
              <div class="flex items-start space-x-3">
                <span class="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <div class="font-semibold text-gray-900">Patent Cliff Mitigation</div>
                  <div class="text-sm text-gray-600">Accelerate lifecycle management for 2 critical assets</div>
                </div>
              </div>
              <div class="flex items-start space-x-3">
                <span class="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <div class="font-semibold text-gray-900">Competitive Response</div>
                  <div class="text-sm text-gray-600">Counter 3 high-threat competitor moves</div>
                </div>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex items-start space-x-3">
                <span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <div class="font-semibold text-gray-900">Market Expansion</div>
                  <div class="text-sm text-gray-600">Pursue 12 identified acquisition targets</div>
                </div>
              </div>
              <div class="flex items-start space-x-3">
                <span class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <div class="font-semibold text-gray-900">Portfolio Optimization</div>
                  <div class="text-sm text-gray-600">Divest 3 non-core therapeutic areas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide 2: Patent Risk Analysis -->
    <div class="slide" v-show="currentSlide === 2">
      <div class="slide-header bg-gradient-to-r from-green-600 to-green-800 text-white p-8 rounded-t-lg">
        <h1 class="text-3xl font-bold mb-2">Patent Cliff Analysis</h1>
        <p class="text-green-100 text-lg">Critical Asset Protection Strategy</p>
      </div>
      
      <div class="slide-content p-8 space-y-6">
        <!-- Patent Risk Timeline -->
        <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
          <h3 class="text-xl font-bold text-gray-900 mb-4">High-Risk Patent Expirations</h3>
          <div class="space-y-4">
            <div v-for="patent in topPatents" :key="patent.id" class="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div class="flex-1">
                <div class="font-bold text-gray-900">{{ patent.drugName }}</div>
                <div class="text-sm text-gray-600">Patent: {{ patent.patentNumber }}</div>
                <div class="text-sm text-gray-600">Company: {{ patent.company }}</div>
              </div>
              <div class="text-center mx-6">
                <div class="text-lg font-bold text-gray-900">{{ patent.daysToExpiry }} days</div>
                <div class="text-xs text-gray-500">Until expiry</div>
              </div>
              <div class="text-right">
                <div class="text-xl font-bold text-gray-900">${{ formatBillions(patent.revenue) }}B</div>
                <div class="text-xs text-gray-500">Annual revenue</div>
              </div>
              <div class="ml-4">
                <span :class="getRiskBadgeClass(patent.riskLevel)" class="px-3 py-1 rounded-full text-xs font-bold">
                  {{ patent.riskLevel.toUpperCase() }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Mitigation Strategies -->
        <div class="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span class="text-2xl mr-3">🛡️</span>
            Recommended Mitigation Strategies
          </h3>
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="bg-white rounded-lg p-4 border border-blue-200">
                <div class="font-semibold text-blue-900 mb-2">Lifecycle Extension</div>
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>• New formulations development</li>
                  <li>• Additional indication studies</li>
                  <li>• Pediatric exclusivity applications</li>
                </ul>
              </div>
              <div class="bg-white rounded-lg p-4 border border-blue-200">
                <div class="font-semibold text-blue-900 mb-2">Market Defense</div>
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>• Authorized generic launch</li>
                  <li>• Strategic pricing adjustments</li>
                  <li>• Enhanced market access programs</li>
                </ul>
              </div>
            </div>
            <div class="space-y-4">
              <div class="bg-white rounded-lg p-4 border border-blue-200">
                <div class="font-semibold text-blue-900 mb-2">Portfolio Diversification</div>
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>• Strategic acquisitions in-class</li>
                  <li>• Partnership opportunities</li>
                  <li>• Adjacent therapy area expansion</li>
                </ul>
              </div>
              <div class="bg-white rounded-lg p-4 border border-blue-200">
                <div class="font-semibold text-blue-900 mb-2">Financial Hedging</div>
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>• Revenue diversification initiatives</li>
                  <li>• Cost optimization programs</li>
                  <li>• Strategic reserve allocation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide 3: Competitive Intelligence & Investment Outlook -->
    <div class="slide" v-show="currentSlide === 3">
      <div class="slide-header bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8 rounded-t-lg">
        <h1 class="text-3xl font-bold mb-2">Market Intelligence & Strategic Outlook</h1>
        <p class="text-purple-100 text-lg">Competitive Landscape & Investment Recommendations</p>
      </div>
      
      <div class="slide-content p-8 space-y-6">
        <!-- Competitive Threats -->
        <div class="grid grid-cols-2 gap-6">
          <div class="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-200">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span class="text-xl mr-2">⚠️</span>
              Critical Competitive Threats
            </h3>
            <div class="space-y-3">
              <div v-for="threat in competitiveThreats" :key="threat.id" class="bg-white rounded-lg p-3 border border-red-200">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-semibold text-gray-900">{{ threat.company }}</div>
                    <div class="text-sm text-gray-600">{{ threat.activity }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-red-600">{{ threat.threatScore }}/100</div>
                    <div class="text-xs text-red-500">Threat Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span class="text-xl mr-2">💎</span>
              Strategic Opportunities
            </h3>
            <div class="space-y-3">
              <div v-for="opportunity in opportunities" :key="opportunity.id" class="bg-white rounded-lg p-3 border border-green-200">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-semibold text-gray-900">{{ opportunity.target }}</div>
                    <div class="text-sm text-gray-600">{{ opportunity.rationale }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-green-600">${{ formatBillions(opportunity.value) }}B</div>
                    <div class="text-xs text-green-500">Est. Value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Strategic Recommendations -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span class="text-2xl mr-3">📈</span>
            Board Recommendations: Next 90 Days
          </h3>
          <div class="grid grid-cols-3 gap-6">
            <div class="bg-white rounded-lg p-4 border-2 border-blue-200">
              <div class="text-center mb-3">
                <div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">1</div>
                <div class="font-bold text-blue-900">DEFEND</div>
              </div>
              <ul class="text-sm text-blue-700 space-y-2">
                <li>• Execute patent cliff mitigation for Demozumab</li>
                <li>• Launch authorized generic strategy</li>
                <li>• Accelerate lifecycle extension programs</li>
              </ul>
            </div>
            <div class="bg-white rounded-lg p-4 border-2 border-green-200">
              <div class="text-center mb-3">
                <div class="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">2</div>
                <div class="font-bold text-green-900">ACQUIRE</div>
              </div>
              <ul class="text-sm text-green-700 space-y-2">
                <li>• Initiate acquisition talks with 3 targets</li>
                <li>• Allocate $2.5B for strategic acquisitions</li>
                <li>• Focus on oncology and rare diseases</li>
              </ul>
            </div>
            <div class="bg-white rounded-lg p-4 border-2 border-purple-200">
              <div class="text-center mb-3">
                <div class="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">3</div>
                <div class="font-bold text-purple-900">INNOVATE</div>
              </div>
              <ul class="text-sm text-purple-700 space-y-2">
                <li>• Increase R&D investment by 15%</li>
                <li>• Establish AI-driven drug discovery unit</li>
                <li>• Partner with 2 biotech companies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Controls -->
    <div class="slide-controls bg-gray-100 p-4 rounded-b-lg flex items-center justify-between border-t-2 border-gray-200">
      <button @click="previousSlide" :disabled="currentSlide === 1" class="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">
        ← Previous
      </button>
      
      <div class="flex items-center space-x-4">
        <span class="text-sm text-gray-600">Slide {{ currentSlide }} of 3</span>
        <div class="flex space-x-2">
          <div v-for="slide in 3" :key="slide" @click="currentSlide = slide" 
               :class="currentSlide === slide ? 'bg-blue-600' : 'bg-gray-300'"
               class="w-3 h-3 rounded-full cursor-pointer hover:bg-blue-500 transition-colors">
          </div>
        </div>
        <button @click="exportToPDF" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
          📄 Export PDF
        </button>
      </div>
      
      <button @click="nextSlide" :disabled="currentSlide === 3" class="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">
        Next →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Reactive state
const currentSlide = ref(1)
const reportDate = ref(new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
}))

// Sample data - would be populated from API calls
const summary = ref({
  criticalPatents: 2,
  revenueAtRisk: 45.7, // in billions
  opportunities: 12
})

const topPatents = ref([
  {
    id: 1,
    drugName: 'Demozumab',
    patentNumber: 'US9,876,543',
    company: 'PharmaCorp Inc.',
    daysToExpiry: 180,
    revenue: 7.5,
    riskLevel: 'critical'
  },
  {
    id: 2,
    drugName: 'Placebolin',
    patentNumber: 'US8,765,432',
    company: 'HealthTech Ltd.',
    daysToExpiry: 420,
    revenue: 3.5,
    riskLevel: 'high'
  }
])

const competitiveThreats = ref([
  {
    id: 1,
    company: 'MegaPharma Inc.',
    activity: 'Acquiring direct competitor',
    threatScore: 87
  },
  {
    id: 2,
    company: 'GlobalBio Corp.',
    activity: 'Launching competing therapy',
    threatScore: 72
  }
])

const opportunities = ref([
  {
    id: 1,
    target: 'BioInnovate LLC',
    rationale: 'Strong oncology pipeline',
    value: 2.1
  },
  {
    id: 2,
    target: 'GeneTech Corp.',
    rationale: 'Rare disease portfolio',
    value: 1.8
  }
])

// Methods
const nextSlide = () => {
  if (currentSlide.value < 3) currentSlide.value++
}

const previousSlide = () => {
  if (currentSlide.value > 1) currentSlide.value--
}

const formatBillions = (value: number): string => {
  return (value).toFixed(1)
}

const getRiskBadgeClass = (level: string): string => {
  const classes = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-green-500 text-white'
  }
  return classes[level] || classes.medium
}

const exportToPDF = () => {
  // This would integrate with a PDF generation library
  console.log('📄 Exporting executive report to PDF...')
  alert('PDF export functionality would be implemented here using libraries like jsPDF or Puppeteer')
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowRight') nextSlide()
  if (event.key === 'ArrowLeft') previousSlide()
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  console.log('📊 Executive Report initialized')
})
</script>

<style scoped>
.executive-report {
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.slide {
  min-height: 800px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  overflow: hidden;
}

.slide-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
}

.slide-content {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.metric-card {
  transform: scale(1);
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: scale(1.02);
}

/* Print styles for PDF export */
@media print {
  .slide-controls {
    display: none;
  }
  
  .slide {
    page-break-after: always;
    min-height: 100vh;
  }
}
</style>