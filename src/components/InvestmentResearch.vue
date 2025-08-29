<template>
	<div class="space-y-4">
		<div class="flex flex-wrap items-start gap-3">
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900">Investment Research Analytics</h3>
				<p class="text-sm text-gray-600">Run patent-cliff impact analysis to estimate revenue exposure.</p>
			</div>
			<button @click="runAnalysis" :disabled="loading || !companyName" class="ml-auto px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm">{{ loading ? 'Analyzing...' : 'Run analysis' }}</button>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Company</label>
				<input 
					v-model="companyName" 
					placeholder="e.g., Pfizer" 
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
				/>
			</div>
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Timeframe (years)</label>
				<input 
					v-model.number="analysisTimeframe" 
					type="number" 
					min="1" 
					max="20" 
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
				/>
			</div>
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Discount rate</label>
				<input 
					v-model.number="discountRate" 
					type="number" 
					step="0.01" 
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
				/>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<label class="inline-flex items-center text-sm"><input type="checkbox" v-model="includeScenarios" class="mr-2"/>Include scenarios</label>
		</div>

		<div v-if="error" class="p-3 bg-red-50 text-red-700 rounded text-sm flex items-center justify-between">
			<span>{{ error }}</span>
			<button class="px-3 py-1 bg-red-600 text-white rounded text-xs" @click="runAnalysis">Retry</button>
		</div>

		<!-- Data Source Indicator -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<div class="flex items-center space-x-2">
				<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<h4 class="font-medium text-blue-900">Data Source Information</h4>
					<p class="text-sm text-blue-700">
						<span v-if="dataSource === 'demo'" class="font-semibold">📊 DEMO DATA:</span> 
						<span v-else-if="dataSource === 'real'" class="font-semibold">✅ REAL DATA:</span>
						<span v-else class="font-semibold">❓ UNKNOWN:</span>
						{{ dataSourceDescription }}
					</p>
				</div>
			</div>
		</div>

		<div v-if="result" class="space-y-4">
			<div class="bg-white p-4 rounded shadow">
				<div class="text-sm text-gray-600">Company</div>
				<div class="text-xl font-semibold">{{ meta.companyName }}</div>
				<div class="text-xs text-gray-500">Generated {{ meta.generatedAt }}</div>
			</div>
			<div class="bg-white p-4 rounded shadow">
				<h4 class="font-semibold mb-2">Key metrics</h4>
				<pre class="text-xs whitespace-pre-wrap">{{ JSON.stringify(result.keyMetrics || result, null, 2) }}</pre>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '../services/api'

const companyName = ref('')
const analysisTimeframe = ref(10)
const discountRate = ref(0.12)
const includeScenarios = ref(true)

const loading = ref(false)
const error = ref('')
const result = ref<any | null>(null)
const meta = ref<any | null>(null)
const dataSource = ref<'demo' | 'real' | 'unknown'>('unknown')
const dataSourceDescription = ref('No analysis run yet')

async function runAnalysis() {
	loading.value = true
	error.value = ''
	result.value = null
	dataSource.value = 'unknown'
	dataSourceDescription.value = 'Running analysis...'
	
	try {
		const data = await api.analyzePatentCliffImpact({
			companyName: companyName.value,
			analysisTimeframe: analysisTimeframe.value,
			discountRate: discountRate.value,
			includeScenarios: includeScenarios.value,
		})
		
		result.value = data.analysis
		meta.value = data.metadata
		
		// Determine data source from response
		if (data.metadata?.dataSource === 'REAL_FINANCIAL_API' || data.metadata?.dataSource === 'REAL_YAHOO_FINANCE_API') {
			dataSource.value = 'real'
			dataSourceDescription.value = `Live data from ${data.metadata.dataSource} - Last updated: ${data.metadata.lastUpdated || 'Unknown'}`
		} else if (data.metadata?.dataSource === 'MOCK_DATA') {
			dataSource.value = 'demo'
			dataSourceDescription.value = `Demo data for demonstration purposes - ${data.metadata.reason || 'No real financial data available'}`
		} else {
			dataSource.value = 'unknown'
			dataSourceDescription.value = 'Data source could not be determined'
		}
		
	} catch (e: any) {
		console.error('Analysis error:', e)
		
		// Check if it's an authorization error
		if (e?.message?.includes('authorization') || e?.message?.includes('401') || e?.message?.includes('403')) {
			error.value = 'Authorization error: Please check your API credentials or contact support'
			dataSource.value = 'unknown'
			dataSourceDescription.value = 'Authorization failed - cannot access data source'
		} else if (e?.message?.includes('endpoint') || e?.message?.includes('404') || e?.message?.includes('500')) {
			error.value = 'API endpoint error: Service temporarily unavailable. Using demo data instead.'
			dataSource.value = 'demo'
			dataSourceDescription.value = 'API endpoint failed - showing demo data for demonstration'
			
			// Provide demo data as fallback
			result.value = {
				keyMetrics: {
					revenueExposure: '$2.5B',
					patentCliffRisk: 'High',
					mitigationOptions: ['Generic competition', 'New drug development', 'Patent extension'],
					estimatedLoss: '$1.8B over 5 years'
				}
			}
			meta.value = {
				companyName: companyName.value,
				generatedAt: new Date().toLocaleString(),
				dataSource: 'MOCK_DATA',
				reason: 'API endpoint failed - using demo data'
			}
		} else {
			error.value = e?.message || 'Failed to run analysis. Please try again.'
			dataSource.value = 'unknown'
			dataSourceDescription.value = 'Analysis failed - error occurred'
		}
	} finally {
		loading.value = false
	}
}
</script>

<style scoped>
</style>

