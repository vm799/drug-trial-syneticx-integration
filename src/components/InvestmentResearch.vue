<template>
	<div class="space-y-4">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Company</label>
				<input v-model="companyName" placeholder="e.g., Pfizer" class="w-full border rounded px-3 py-2 text-sm" />
			</div>
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Timeframe (years)</label>
				<input v-model.number="analysisTimeframe" type="number" min="1" max="20" class="w-full border rounded px-3 py-2 text-sm" />
			</div>
			<div>
				<label class="block text-xs font-medium text-gray-600 mb-1">Discount rate</label>
				<input v-model.number="discountRate" type="number" step="0.01" class="w-full border rounded px-3 py-2 text-sm" />
			</div>
		</div>
		<div class="flex items-center gap-3">
			<label class="inline-flex items-center text-sm"><input type="checkbox" v-model="includeScenarios" class="mr-2"/>Include scenarios</label>
			<button @click="runAnalysis" :disabled="loading || !companyName" class="ml-auto px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm">{{ loading ? 'Analyzing...' : 'Run analysis' }}</button>
		</div>

		<div v-if="error" class="p-3 bg-red-50 text-red-700 rounded text-sm">{{ error }}</div>

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

async function runAnalysis() {
	loading.value = true
	error.value = ''
	result.value = null
	try {
		const data = await api.analyzePatentCliffImpact({
			companyName: companyName.value,
			analysisTimeframe: analysisTimeframe.value,
			discountRate: discountRate.value,
			includeScenarios: includeScenarios.value,
		})
		result.value = data.analysis
		meta.value = data.metadata
	} catch (e: any) {
		error.value = e?.message || 'Failed to run analysis (requires premium)'
	} finally {
		loading.value = false
	}
}
</script>

<style scoped>
</style>

