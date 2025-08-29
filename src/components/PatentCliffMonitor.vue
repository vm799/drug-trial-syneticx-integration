<template>
	<div class="space-y-4">
		<div class="sticky top-0 z-10 bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 border rounded p-3 flex flex-wrap items-start gap-3">
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900">Patent Cliff Monitoring</h3>
				<p class="text-sm text-gray-600">Track expiring patents, risk levels, and revenue at risk.</p>
			</div>
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Timeframe (months)</label>
				<select v-model.number="timeframe" class="border rounded px-3 py-2 text-sm">
					<option :value="12">12</option>
					<option :value="24">24</option>
					<option :value="36">36</option>
					<option :value="48">48</option>
				</select>
			</div>
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Risk level</label>
				<select v-model="riskLevel" class="border rounded px-3 py-2 text-sm">
					<option value="">All</option>
					<option value="critical">Critical</option>
					<option value="high">High</option>
					<option value="medium">Medium</option>
					<option value="low">Low</option>
				</select>
			</div>
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Sort by</label>
				<select v-model="sortBy" class="border rounded px-3 py-2 text-sm">
					<option value="risk">Risk</option>
					<option value="expiry">Expiry</option>
					<option value="revenue">Revenue</option>
				</select>
			</div>
			<button @click="exportCSV" class="px-4 py-2 bg-green-600 text-white rounded text-sm">Export CSV</button>
			<button @click="loadData" :disabled="loading" class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm">{{ loading ? 'Loading...' : 'Refresh' }}</button>
		</div>

		<div v-if="error" class="p-3 bg-red-50 text-red-700 rounded text-sm">{{ error }}</div>

		<div v-if="summary" class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div class="bg-white rounded shadow p-4">
				<div class="text-xs text-gray-500">Total patents</div>
				<div class="text-2xl font-semibold">{{ summary.totalPatents }}</div>
			</div>
			<div class="bg-white rounded shadow p-4">
				<div class="text-xs text-gray-500">Revenue at risk</div>
				<div class="text-2xl font-semibold">${{ formatNumber(summary.totalRevenueAtRisk) }}</div>
			</div>
			<div class="bg-white rounded shadow p-4">
				<div class="text-xs text-gray-500">Timeframe</div>
				<div class="text-2xl font-semibold">{{ summary.timeframeMonths }} mo</div>
			</div>
			<div class="bg-white rounded shadow p-4">
				<div class="text-xs text-gray-500">Risk breakdown</div>
				<div class="text-sm">C {{ summary.riskBreakdown.critical }} · H {{ summary.riskBreakdown.high }} · M {{ summary.riskBreakdown.medium }} · L {{ summary.riskBreakdown.low }}</div>
			</div>
		</div>

		<div class="bg-white rounded shadow overflow-hidden">
			<div v-if="loading" class="p-4 animate-pulse text-sm text-gray-600">Loading patent cliffs…</div>
			<table class="min-w-full text-sm">
				<thead class="bg-gray-50">
					<tr>
						<th class="text-left px-4 py-2">Patent</th>
						<th class="text-left px-4 py-2">Drug</th>
						<th class="text-left px-4 py-2">Company</th>
						<th class="text-left px-4 py-2">Expiry</th>
						<th class="text-left px-4 py-2">Risk</th>
						<th class="text-right px-4 py-2">Revenue</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="patent in patents" :key="patent.id" class="border-t">
						<td class="px-4 py-2">{{ patent.patentNumber }}</td>
						<td class="px-4 py-2">{{ patent.drugName }}</td>
						<td class="px-4 py-2">{{ patent.company }}</td>
						<td class="px-4 py-2">{{ formatDate(patent.expiryDate) }} ({{ patent.daysToExpiry }}d)</td>
						<td class="px-4 py-2"><span :class="riskBadgeClass(patent.riskLevel)" class="px-2 py-1 rounded text-xs">{{ patent.riskLevel }}</span></td>
						<td class="px-4 py-2 text-right">${{ formatNumber(patent.estimatedRevenue) }}</td>
					</tr>
				</tbody>
			</table>
			<div v-if="!loading && patents.length === 0" class="p-4 text-sm text-gray-500">No patents found for selected filters.</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { exportToCSV } from '../utils/export'

const loading = ref(false)
const error = ref('')
const timeframe = ref(24)
const riskLevel = ref('') as any
const sortBy = ref('risk')
const summary = ref<any | null>(null)
const patents = ref<any[]>([])

function formatNumber(n: number): string {
	return (n || 0).toLocaleString()
}

function formatDate(d: string): string {
	try { return new Date(d).toLocaleDateString() } catch { return d }
}

function riskBadgeClass(level: string): string {
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
		const data = await api.getPatentCliffMonitor({
			timeframe: timeframe.value,
			riskLevel: riskLevel.value || undefined,
			sortBy: sortBy.value as any,
		})
		summary.value = data.summary
		patents.value = data.patents || []
	} catch (e: any) {
		error.value = e?.message || 'Failed to load data'
		// Fallback demo data so UI remains usable
		summary.value = {
			totalPatents: 3,
			totalRevenueAtRisk: 1250000000,
			timeframeMonths: timeframe.value,
			riskBreakdown: { critical: 1, high: 1, medium: 1, low: 0 },
		}
		patents.value = [
			{ id: 'demo1', patentNumber: 'US1234567', drugName: 'Demozumab', company: 'DemoPharma', expiryDate: new Date().toISOString(), daysToExpiry: 180, riskLevel: 'critical', estimatedRevenue: 750000000 },
			{ id: 'demo2', patentNumber: 'US2345678', drugName: 'Placebolin', company: 'HealthCorp', expiryDate: new Date(Date.now()+3.6e9).toISOString(), daysToExpiry: 420, riskLevel: 'high', estimatedRevenue: 350000000 },
			{ id: 'demo3', patentNumber: 'US3456789', drugName: 'Trialex', company: 'BioTrial', expiryDate: new Date(Date.now()+6.0e9).toISOString(), daysToExpiry: 700, riskLevel: 'medium', estimatedRevenue: 150000000 },
		]
	} finally {
		loading.value = false
	}
}

function exportCSV() {
	const rows = patents.value.map(p => ({
		Patent: p.patentNumber,
		Drug: p.drugName,
		Company: p.company,
		Expiry: formatDate(p.expiryDate),
		DaysToExpiry: p.daysToExpiry,
		Risk: p.riskLevel,
		EstimatedRevenue: p.estimatedRevenue,
	}))
	exportToCSV('patent-cliff-monitor.csv', rows)
}

onMounted(loadData)
</script>

<style scoped>
</style>

