<template>
	<div class="space-y-4">
		<div class="flex flex-wrap items-end gap-3">
			<div class="flex-1 min-w-[240px]">
				<label class="block text-xs font-medium text-gray-600 mb-1">Search USPTO</label>
				<input v-model="query" placeholder="e.g., CRISPR gene editing" class="w-full border rounded px-3 py-2 text-sm" />
			</div>
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Type</label>
				<select v-model="type" class="border rounded px-3 py-2 text-sm">
					<option value="patents">Patents</option>
					<option value="applications">Applications</option>
				</select>
			</div>
			<button @click="search" :disabled="loading || !query" class="ml-auto px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm">{{ loading ? 'Searching...' : 'Search' }}</button>
		</div>

		<div v-if="error" class="p-3 bg-red-50 text-red-700 rounded text-sm">{{ error }}</div>

		<div class="bg-white rounded shadow overflow-hidden">
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
			<div v-if="!loading && results.length === 0" class="p-4 text-sm text-gray-500">Enter a query to search USPTO.</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '../services/api'

const query = ref('')
const type = ref<'patents' | 'applications'>('patents')
const loading = ref(false)
const error = ref('')
const results = ref<any[]>([])

function formatDate(d?: string): string {
	if (!d) return ''
	try { return new Date(d).toLocaleDateString() } catch { return d }
}

async function search() {
	loading.value = true
	error.value = ''
	try {
		const data = await api.searchUSPTO({ query: query.value, type: type.value, page: 1 })
		results.value = data.results || data.items || []
	} catch (e: any) {
		error.value = e?.message || 'Search failed'
		results.value = []
	} finally {
		loading.value = false
	}
}
</script>

<style scoped>
</style>

