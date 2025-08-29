<template>
	<div class="space-y-4">
		<div class="sticky top-0 z-10 bg-gradient-to-r from-purple-50 to-purple-100 backdrop-blur border-2 border-purple-200 rounded-xl shadow-lg p-4 flex flex-wrap items-start gap-4">
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-black">Competitive Intelligence AI</h3>
				<p class="text-sm text-black">Monitor competitors, threat levels, market cap, and pipelines.</p>
			</div>
			<div>
				<label class="block text-xs font-medium text-black mb-1">Threat level</label>
				<select v-model="threatLevel" class="border rounded px-3 py-2 text-sm text-black bg-white border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200">
					<option value="">All</option>
					<option value="critical">Critical</option>
					<option value="high">High</option>
					<option value="medium">Medium</option>
					<option value="low">Low</option>
				</select>
			</div>
			<div>
				<label class="block text-xs font-medium text-black mb-1">Sort by</label>
				<select v-model="sortBy" class="border rounded px-3 py-2 text-sm text-black bg-white border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200">
					<option value="threat">Threat</option>
					<option value="marketCap">Market Cap</option>
					<option value="pipeline">Pipeline</option>
					<option value="lastUpdated">Last Updated</option>
				</select>
			</div>
			<button @click="exportCSV" class="px-4 py-2 bg-green-600 text-white rounded text-sm">Export CSV</button>
			<button @click="loadData" :disabled="loading" class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm">{{ loading ? 'Loading...' : 'Refresh' }}</button>
		</div>

		<div v-if="error" class="p-3 bg-red-50 text-red-700 rounded text-sm flex items-center justify-between">
			<span>{{ error }}</span>
			<button class="px-3 py-1 bg-red-600 text-white rounded text-xs" @click="loadData">Retry</button>
		</div>

		<div v-if="summary" class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div class="bg-white rounded-lg shadow-lg p-4 border-2 border-gray-200">
				<div class="text-xs text-black font-medium">Total competitors</div>
				<div class="text-2xl font-bold text-black">{{ summary.totalCompetitors }}</div>
			</div>
			<div class="bg-white rounded-lg shadow-lg p-4 border-2 border-gray-200">
				<div class="text-xs text-black font-medium">Total market cap</div>
				<div class="text-2xl font-bold text-black">{{ formatCurrency(summary.totalMarketCap || 0) }}</div>
			</div>
			<div class="bg-white rounded-lg shadow-lg p-4 border-2 border-gray-200">
				<div class="text-xs text-black font-medium">Pipeline assets</div>
				<div class="text-2xl font-bold text-black">{{ formatLargeNumber(summary.totalPipelineAssets || 0) }}</div>
			</div>
			<div class="bg-white rounded-lg shadow-lg p-4 border-2 border-gray-200">
				<div class="text-xs text-black font-medium">Threat breakdown</div>
				<div class="text-sm text-black font-semibold">C {{ summary.threatSummary.critical }} · H {{ summary.threatSummary.high }} · M {{ summary.threatSummary.medium }} · L {{ summary.threatSummary.low }}</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
			<div v-if="loading" class="p-4 animate-pulse text-sm text-black font-medium">Loading competitors…</div>
			<table class="min-w-full text-sm">
				<thead class="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
					<tr>
						<th class="text-left px-6 py-4 font-bold tracking-wider">Company</th>
						<th class="text-left px-6 py-4 font-bold tracking-wider">Threat</th>
						<th class="text-left px-6 py-4 font-bold tracking-wider">Market Cap</th>
						<th class="text-left px-6 py-4 font-bold tracking-wider">Pipeline</th>
						<th class="text-left px-6 py-4 font-bold tracking-wider">Patents</th>
						<th class="text-left px-6 py-4 font-bold tracking-wider">Last Analyzed</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="comp in competitors" :key="comp.companyInfo?.name" class="border-t border-gray-200 hover:bg-purple-50 transition-colors duration-200">
						<td class="px-6 py-4 font-semibold text-black">{{ comp.companyInfo?.name }}</td>
						<td class="px-6 py-4"><span :class="threatClass(comp.overallThreat)" class="px-3 py-1 rounded-full text-xs font-bold shadow-sm">{{ comp.overallThreat.toUpperCase() }}</span> <span class="text-xs text-black ml-2">({{ comp.threatScore }})</span></td>
						<td class="px-6 py-4 font-bold text-black">{{ formatCurrency(comp.financialMetrics?.marketCap || 0) }}</td>
						<td class="px-6 py-4 font-semibold text-black">{{ formatLargeNumber(comp.pipelineAnalysis?.totalAssets || 0) }}</td>
						<td class="px-6 py-4 font-semibold text-black">{{ formatLargeNumber(comp.patentPortfolio?.totalPatents || 0) }}</td>
						<td class="px-6 py-4 text-black">{{ formatDate(comp.lastAnalyzed) }}</td>
					</tr>
				</tbody>
			</table>
			<div v-if="!loading && competitors.length === 0" class="p-4 text-sm text-black">No competitors found. Adjust threat level or sort options.</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { exportToCSV } from '../utils/export'
import { formatCurrency, formatLargeNumber } from '../utils/formatters'

const loading = ref(false)
const error = ref('')
const threatLevel = ref('') as any
const sortBy = ref('threat')
const summary = ref<any | null>(null)
const competitors = ref<any[]>([])

function formatDate(d: string): string {
	try { return new Date(d).toLocaleDateString() } catch { return d }
}

function threatClass(level: string): string {
	switch (level) {
		case 'critical': return 'bg-red-100 text-red-700'
		case 'high': return 'bg-orange-100 text-orange-700'
		case 'medium': return 'bg-yellow-100 text-yellow-700'
		default: return 'bg-green-100 text-green-700'
	}
}

async function loadData() {
	loading.value = true
	error.value = ''
	try {
		const data = await api.getCompetitiveDashboard({
			threatLevel: threatLevel.value || undefined,
			sortBy: sortBy.value as any,
			limit: 50,
		})
		summary.value = data.summary
		competitors.value = data.competitors || []
	} catch (e: any) {
		error.value = e?.message || 'Failed to load data'
		// Fallback demo data
		summary.value = {
			totalCompetitors: 3,
			threatSummary: { critical: 1, high: 1, medium: 1, low: 0 },
			totalMarketCap: 220000000000,
			totalPipelineAssets: 45,
		}
		competitors.value = [
			{ companyInfo: { name: 'DemoBio' }, overallThreat: 'critical', threatScore: 92, financialMetrics: { marketCap: 120000000000 }, pipelineAnalysis: { totalAssets: 20 }, patentPortfolio: { totalPatents: 540 }, lastAnalyzed: new Date().toISOString() },
			{ companyInfo: { name: 'HealthCorp' }, overallThreat: 'high', threatScore: 81, financialMetrics: { marketCap: 70000000000 }, pipelineAnalysis: { totalAssets: 15 }, patentPortfolio: { totalPatents: 320 }, lastAnalyzed: new Date().toISOString() },
			{ companyInfo: { name: 'TrialLabs' }, overallThreat: 'medium', threatScore: 65, financialMetrics: { marketCap: 30000000000 }, pipelineAnalysis: { totalAssets: 10 }, patentPortfolio: { totalPatents: 150 }, lastAnalyzed: new Date().toISOString() },
		]
	} finally {
		loading.value = false
	}
}

function exportCSV() {
	const rows = competitors.value.map(c => ({
		Company: c.companyInfo?.name,
		Threat: c.overallThreat,
		ThreatScore: c.threatScore,
		MarketCap: c.financialMetrics?.marketCap || 0,
		PipelineAssets: c.pipelineAnalysis?.totalAssets || 0,
		Patents: c.patentPortfolio?.totalPatents || 0,
		LastAnalyzed: formatDate(c.lastAnalyzed),
	}))
	exportToCSV('competitive-intelligence.csv', rows)
}

onMounted(loadData)
</script>

<style scoped>
</style>

