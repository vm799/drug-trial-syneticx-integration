<template>
	<div class="space-y-4">
		<div class="sticky top-0 z-10 bg-blue-50/60 backdrop-blur supports-[backdrop-filter]:bg-blue-50/40 border rounded p-3 flex flex-wrap items-start gap-3">
			<div class="flex-1">
				<h3 class="text-xl font-semibold text-gray-900">USPTO Integration</h3>
				<p class="text-sm text-gray-600">Search patents and applications directly from the USPTO data.</p>
			</div>
			<div class="flex-1 min-w-[240px]">
				<label class="block text-xs font-medium text-gray-600 mb-1">Search USPTO</label>
				<input 
					v-model="query" 
					placeholder="e.g., CRISPR gene editing" 
					class="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
				/>
			</div>
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Type</label>
				<select v-model="type" class="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
					<option value="patents">Patents</option>
					<option value="applications">Applications</option>
				</select>
			</div>
			<button @click="exportCSV" class="px-4 py-2 bg-green-600 text-white rounded text-sm" :disabled="results.length===0">Export CSV</button>
			<button @click="search" :disabled="loading || !query" class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm">{{ loading ? 'Searching...' : 'Search' }}</button>
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

		<div v-if="error" class="p-3 bg-red-50 text-red-700 rounded text-sm flex items-center justify-between">
			<span>{{ error }}</span>
			<button class="px-3 py-1 bg-red-600 text-white rounded text-xs" @click="search">Retry</button>
		</div>

		<div class="bg-white rounded shadow overflow-hidden">
			<div v-if="loading" class="p-4 animate-pulse text-sm text-gray-600">Searching USPTO…</div>
			<table class="min-w-full text-sm">
				<thead class="bg-gray-50">
					<tr>
						<th class="text-left px-4 py-2">Number</th>
						<th class="text-left px-4 py-2">Title</th>
						<th class="text-left px-4 py-2">Assignee</th>
						<th class="text-left px-4 py-2">Date</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="r in results" :key="r.id || r.patentNumber" class="border-t">
						<td class="px-4 py-2">{{ r.patentNumber || r.applicationNumber }}</td>
						<td class="px-4 py-2">{{ r.title }}</td>
						<td class="px-4 py-2">{{ r.assignee?.name || r.applicant?.name }}</td>
						<td class="px-4 py-2">{{ formatDate(r.date || r.filingDate || r.issueDate) }}</td>
					</tr>
				</tbody>
			</table>
			<div v-if="!loading && results.length === 0" class="p-4 text-sm text-gray-600">
				Enter a query to search USPTO. Try technology keywords or patent numbers.
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '../services/api'
import { exportToCSV } from '../utils/export'

const query = ref('')
const type = ref<'patents' | 'applications'>('patents')
const loading = ref(false)
const error = ref('')
const results = ref<any[]>([])
const dataSource = ref<'demo' | 'real' | 'unknown'>('unknown')
const dataSourceDescription = ref('No search performed yet')

function formatDate(d?: string): string {
	if (!d) return ''
	try { return new Date(d).toLocaleDateString() } catch { return d }
}

async function search() {
	loading.value = true
	error.value = ''
	dataSource.value = 'unknown'
	dataSourceDescription.value = 'Searching USPTO...'
	
	try {
		const data = await api.searchUSPTO({ query: query.value, type: type.value, page: 1 })
		
		if (data.results && data.results.length > 0) {
			results.value = data.results
			
			// Determine data source from response
			if (data.metadata?.dataSource === 'REAL_USPTO_API' || data.metadata?.dataSource === 'REAL_GOOGLE_PATENTS_API') {
				dataSource.value = 'real'
				dataSourceDescription.value = `Live data from ${data.metadata.dataSource} - ${data.results.length} results found - Last updated: ${data.metadata.lastUpdated || 'Unknown'}`
			} else if (data.metadata?.dataSource === 'MOCK_DATA') {
				dataSource.value = 'demo'
				dataSourceDescription.value = `Demo data for demonstration - ${data.metadata.reason || 'No real USPTO data available'}`
			} else {
				dataSource.value = 'unknown'
				dataSourceDescription.value = 'Data source could not be determined'
			}
		} else {
			results.value = []
			dataSource.value = 'unknown'
			dataSourceDescription.value = 'No results found'
		}
		
	} catch (e: any) {
		console.error('USPTO search error:', e)
		
		// Check specific error types
		if (e?.message?.includes('authorization') || e?.message?.includes('401') || e?.message?.includes('403')) {
			error.value = 'Authorization error: USPTO API access denied. Please check API credentials.'
			dataSource.value = 'unknown'
			dataSourceDescription.value = 'Authorization failed - cannot access USPTO data'
		} else if (e?.message?.includes('endpoint') || e?.message?.includes('404') || e?.message?.includes('500')) {
			error.value = 'USPTO API endpoint error: Service temporarily unavailable. Using demo data instead.'
			dataSource.value = 'demo'
			dataSourceDescription.value = 'USPTO API failed - showing demo data for demonstration'
			
			// Provide demo results as fallback
			results.value = [
				{ 
					id: 'demoUSPTO1', 
					patentNumber: 'US9876543', 
					title: 'CRISPR delivery method for gene editing', 
					assignee: { name: 'DemoBio Inc.' }, 
					date: new Date().toISOString(),
					_dataSource: 'MOCK_DATA',
					_reason: 'USPTO API endpoint failed'
				},
				{ 
					id: 'demoUSPTO2', 
					patentNumber: 'US8765432', 
					title: 'mRNA vaccine formulation and delivery system', 
					assignee: { name: 'HealthCorp Ltd.' }, 
					date: new Date().toISOString(),
					_dataSource: 'MOCK_DATA',
					_reason: 'USPTO API endpoint failed'
				},
				{ 
					id: 'demoUSPTO3', 
					patentNumber: 'US7654321', 
					title: 'Novel cancer immunotherapy treatment', 
					assignee: { name: 'OncoTech Solutions' }, 
					date: new Date().toISOString(),
					_dataSource: 'MOCK_DATA',
					_reason: 'USPTO API endpoint failed'
				}
			]
		} else {
			error.value = e?.message || 'USPTO search failed. Please try again.'
			dataSource.value = 'unknown'
			dataSourceDescription.value = 'Search failed - error occurred'
		}
	} finally {
		loading.value = false
	}
}

function exportCSV() {
	const rows = results.value.map(r => ({
		Number: r.patentNumber || r.applicationNumber,
		Title: r.title,
		Assignee: r.assignee?.name || r.applicant?.name,
		Date: formatDate(r.date || r.filingDate || r.issueDate),
	}))
	exportToCSV('uspto-results.csv', rows)
}
</script>

<style scoped>
</style>

