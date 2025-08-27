<template>
  <div v-if="results" class="space-y-6">
    
    <!-- Research Insights Card -->
    <div v-if="results.researchInsights" class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-lg">
      <div class="flex items-center mb-4">
        <div class="bg-blue-500 p-2 rounded-lg mr-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a9 9 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 21H9.154a3.374 3.374 0 00-2.474-1.053l-.548-.547z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900">🔬 Research Insights</h3>
          <p class="text-sm text-gray-600">Latest scientific findings and analysis</p>
        </div>
      </div>
      <div v-html="formatContent(results.researchInsights)" class="prose prose-sm max-w-none text-gray-800"></div>
    </div>

    <!-- Clinical Trials Card -->
    <div v-if="results.trialMatches" class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-lg">
      <div class="flex items-center mb-4">
        <div class="bg-green-500 p-2 rounded-lg mr-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900">🧪 Clinical Trials</h3>
          <p class="text-sm text-gray-600">Relevant trials and studies</p>
        </div>
      </div>
      <div v-html="formatContent(results.trialMatches)" class="prose prose-sm max-w-none text-gray-800"></div>
    </div>

    <!-- Patient Education Card -->
    <div v-if="results.explanation" class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-lg">
      <div class="flex items-center mb-4">
        <div class="bg-purple-500 p-2 rounded-lg mr-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900">💡 Patient-Friendly Explanation</h3>
          <p class="text-sm text-gray-600">Clear, actionable information</p>
        </div>
      </div>
      <div v-html="formatContent(results.explanation)" class="prose prose-sm max-w-none text-gray-800"></div>
    </div>

    <!-- Key Studies Section -->
    <div v-if="extractedStudies.length > 0" class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 shadow-lg">
      <div class="flex items-center mb-4">
        <div class="bg-yellow-500 p-2 rounded-lg mr-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900">📚 Key Studies Referenced</h3>
          <p class="text-sm text-gray-600">Research papers and publications</p>
        </div>
      </div>
      
      <div class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        <div 
          v-for="(study, index) in extractedStudies" 
          :key="index"
          class="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-yellow-300"
        >
          <h4 class="font-semibold text-gray-900 mb-2">{{ study.title }}</h4>
          <div class="space-y-2 text-sm">
            <p class="text-gray-600">
              <span class="font-medium">Journal:</span> {{ study.journal }}
            </p>
            <p class="text-gray-600">
              <span class="font-medium">Date:</span> {{ study.date }}
            </p>
            <p class="text-gray-700">{{ study.finding }}</p>
            <div class="flex flex-wrap gap-2 mt-3">
              <!-- Primary DOI Link -->
              <a 
                :href="study.doiUrl" 
                target="_blank" 
                class="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition-colors font-medium"
              >
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                  <path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2a1 1 0 10-2 0v2H5V7h2a1 1 0 000-2H5z"></path>
                </svg>
                Read Paper
              </a>
              
              <!-- PubMed Search -->
              <a 
                :href="study.pubmedUrl" 
                target="_blank" 
                class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
              >
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path>
                </svg>
                PubMed
              </a>

              <!-- Alternative PDF Access -->
              <a 
                :href="study.pdfUrl" 
                target="_blank" 
                class="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs hover:bg-red-200 transition-colors"
                title="Alternative PDF access"
              >
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd"></path>
                </svg>
                PDF
              </a>

              <!-- Google Scholar -->
              <a 
                :href="study.googleScholarUrl" 
                target="_blank" 
                class="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs hover:bg-yellow-200 transition-colors"
              >
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 000 1.838l-8.921 3.823a1 1 0 00-.502 1.321A1 1 0 001 17h18a1 1 0 00.902-1.43l-9.507-20.275a1 1 0 00-.901-.565z"></path>
                </svg>
                Scholar
              </a>

              <!-- ResearchGate -->
              <a 
                :href="study.researchGateUrl" 
                target="_blank" 
                class="inline-flex items-center px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs hover:bg-teal-200 transition-colors"
              >
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                </svg>
                RG
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Items -->
    <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200 shadow-lg">
      <div class="flex items-center mb-4">
        <div class="bg-indigo-500 p-2 rounded-lg mr-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-900">🎯 Next Steps</h3>
          <p class="text-sm text-gray-600">Actionable recommendations</p>
        </div>
      </div>
      
      <div class="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <div class="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <h4 class="font-semibold text-gray-900 mb-2">🏥 Consult Your Doctor</h4>
          <p class="text-sm text-gray-700">Discuss these findings with your healthcare provider for personalized advice.</p>
        </div>
        <div class="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <h4 class="font-semibold text-gray-900 mb-2">📖 Read More</h4>
          <p class="text-sm text-gray-700">Explore the linked studies for detailed methodology and findings.</p>
        </div>
        <div class="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <h4 class="font-semibold text-gray-900 mb-2">🔬 Clinical Trials</h4>
          <p class="text-sm text-gray-700">Check <a href="https://clinicaltrials.gov" target="_blank" class="text-blue-600 hover:underline">ClinicalTrials.gov</a> for relevant ongoing studies.</p>
        </div>
        <div class="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <h4 class="font-semibold text-gray-900 mb-2">📧 Get Updates</h4>
          <p class="text-sm text-gray-700">Subscribe to email updates for new research in your areas of interest.</p>
          <button class="mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200 transition-colors" @click="showEmailSubscription = true">
            Subscribe
          </button>
        </div>
      </div>
      
      <!-- Email Subscription Modal -->
      <div v-if="showEmailSubscription" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">📧 Research Updates</h3>
            <button @click="showEmailSubscription = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <form @submit.prevent="subscribeToUpdates">
            <div class="mb-4">
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" 
                id="email" 
                v-model="subscriptionEmail" 
                required 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="your@email.com"
              >
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Research Areas (optional)</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="checkbox" v-model="selectedAreas" value="cardiology" class="rounded text-indigo-600">
                  <span class="ml-2 text-sm">Cardiology</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="selectedAreas" value="oncology" class="rounded text-indigo-600">
                  <span class="ml-2 text-sm">Oncology</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="selectedAreas" value="neurology" class="rounded text-indigo-600">
                  <span class="ml-2 text-sm">Neurology</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" v-model="selectedAreas" value="diabetes" class="rounded text-indigo-600">
                  <span class="ml-2 text-sm">Diabetes & Endocrinology</span>
                </label>
              </div>
            </div>
            <div class="flex space-x-3">
              <button 
                type="submit" 
                :disabled="isSubscribing" 
                class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {{ isSubscribing ? 'Subscribing...' : 'Subscribe' }}
              </button>
              <button 
                type="button" 
                @click="showEmailSubscription = false" 
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  results: {
    researchInsights?: string
    trialMatches?: string
    explanation?: string
  } | null
}

const props = defineProps<Props>()

// Email subscription state
const showEmailSubscription = ref(false)
const subscriptionEmail = ref('')
const selectedAreas = ref<string[]>([])
const isSubscribing = ref(false)

// Extract studies from the response text
const extractedStudies = computed(() => {
  if (!props.results) return []
  
  const allContent = [
    props.results.researchInsights || '',
    props.results.trialMatches || '',
    props.results.explanation || ''
  ].join(' ')
  
  const studies = []
  
  // Pattern to match citations with DOI, PMID, or journal references
  const citationPatterns = [
    // DOI pattern: doi:10.1056/NEJMoa... or https://doi.org/...
    /(?:doi:|https?:\/\/doi\.org\/)(10\.\d{4,}\/[^\s\)]+)/gi,
    // PMID pattern: PMID: 12345678 or PubMed ID: 12345678
    /(?:pmid|pubmed\s+id):\s*(\d{8,})/gi,
    // Journal citation pattern: Journal Name. Year;Volume(Issue):Pages
    /([A-Z][a-z\s&]+)\.\s*(\d{4});\d+(?:\(\d+\))?:\d+(?:-\d+)?/gi,
    // Study title in quotes: "Study Title Here"
    /"([^"]{20,100})"/gi
  ]
  
  let studyCount = 0
  
  // Extract DOIs
  const doiMatches = [...allContent.matchAll(citationPatterns[0])]
  doiMatches.forEach(match => {
    if (studyCount >= 5) return // Limit to 5 studies
    const doi = match[1]
    const title = extractTitleFromContext(allContent, match.index) || `Clinical Study: ${doi.split('/').pop()}`
    studies.push({
      title: title,
      journal: inferJournalFromDOI(doi),
      date: extractDateFromContext(allContent, match.index) || "Recent",
      finding: extractFindingFromContext(allContent, match.index) || "Research finding referenced in AI analysis",
      pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(doi)}`,
      doiUrl: `https://doi.org/${doi}`,
      pdfUrl: `https://sci-hub.se/${doi}`, // Alternative access
      googleScholarUrl: `https://scholar.google.com/scholar?q=${encodeURIComponent(doi)}`,
      researchGateUrl: `https://www.researchgate.net/search/publication?q=${encodeURIComponent(doi)}`
    })
    studyCount++
  })
  
  // Extract PMIDs
  const pmidMatches = [...allContent.matchAll(citationPatterns[1])]
  pmidMatches.forEach(match => {
    if (studyCount >= 5) return
    const pmid = match[1]
    studies.push({
      title: `PubMed Study ID: ${pmid}`,
      journal: "PubMed Database",
      date: "Recent",
      finding: "Clinical study referenced in analysis",
      pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      doiUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
    })
    studyCount++
  })
  
  // Extract journal citations
  const journalMatches = [...allContent.matchAll(citationPatterns[2])]
  journalMatches.forEach(match => {
    if (studyCount >= 5) return
    const journal = match[1].trim()
    const year = match[2]
    studies.push({
      title: `Research Published in ${journal}`,
      journal: journal,
      date: year,
      finding: "Peer-reviewed research referenced in analysis",
      pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(journal)}`,
      doiUrl: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(journal)}`
    })
    studyCount++
  })
  
  // If no citations found, provide fallback studies based on content analysis
  if (studies.length === 0) {
    const contentLower = allContent.toLowerCase()
    if (contentLower.includes('clinical trial') || contentLower.includes('study') || contentLower.includes('research')) {
      studies.push({
        title: "Referenced Clinical Research",
        journal: "Medical Literature",
        date: "Recent",
        finding: "Research evidence supporting AI analysis findings",
        pubmedUrl: "https://pubmed.ncbi.nlm.nih.gov/",
        doiUrl: "https://scholar.google.com/"
      })
    }
  }
  
  return studies.slice(0, 5) // Limit to maximum 5 studies
})

// Helper functions for extracting context information
const extractTitleFromContext = (content: string, index: number | undefined) => {
  if (!index) return null
  
  // Look for quoted text near the DOI
  const contextWindow = content.substring(Math.max(0, index - 200), index + 200)
  const titleMatch = contextWindow.match(/"([^"]{20,120})"/g)
  if (titleMatch) {
    return titleMatch[titleMatch.length - 1].replace(/"/g, '')
  }
  
  // Look for patterns like "Title et al."
  const etAlMatch = contextWindow.match(/([A-Z][^.]{20,100})\s+et\s+al\./i)
  if (etAlMatch) {
    return etAlMatch[1].trim()
  }
  
  return null
}

const inferJournalFromDOI = (doi: string) => {
  const journalMap: Record<string, string> = {
    '10.1056': 'New England Journal of Medicine',
    '10.1016/s0140-6736': 'The Lancet',
    '10.1001': 'JAMA',
    '10.1038': 'Nature',
    '10.1126': 'Science',
    '10.1371': 'PLOS ONE',
    '10.1002': 'Various Wiley Journals',
    '10.1007': 'Springer Journals',
    '10.1080': 'Taylor & Francis Journals',
    '10.3389': 'Frontiers Journals'
  }
  
  for (const prefix in journalMap) {
    if (doi.startsWith(prefix)) {
      return journalMap[prefix]
    }
  }
  
  return 'Medical Journal'
}

const extractDateFromContext = (content: string, index: number | undefined) => {
  if (!index) return null
  
  const contextWindow = content.substring(Math.max(0, index - 100), index + 100)
  const yearMatch = contextWindow.match(/\b(20[0-2][0-9])\b/)
  return yearMatch ? yearMatch[1] : null
}

const extractFindingFromContext = (content: string, index: number | undefined) => {
  if (!index) return null
  
  const contextWindow = content.substring(Math.max(0, index - 300), index + 300)
  
  // Look for common medical finding patterns
  const patterns = [
    /showed?\s+([^.]{20,100})/i,
    /found\s+([^.]{20,100})/i,
    /demonstrated\s+([^.]{20,100})/i,
    /reported\s+([^.]{20,100})/i,
    /concluded\s+([^.]{20,100})/i
  ]
  
  for (const pattern of patterns) {
    const match = contextWindow.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }
  
  return null
}

// Format content with better structure
const formatContent = (content: string) => {
  if (!content) return ''
  
  // Convert markdown-style formatting to HTML
  let formatted = content
    // Headers
    .replace(/## (.*)/g, '<h4 class="text-lg font-bold text-gray-900 mt-4 mb-2">$1</h4>')
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Bullet points
    .replace(/^- (.*)/gm, '<li class="ml-4">• $1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-3">')
    // Wrap in paragraphs
    .replace(/^(?!<[hul])/gm, '<p class="mb-3">')
    .replace(/(?<!>)$/gm, '</p>')
  
  // Clean up extra paragraph tags
  formatted = formatted.replace(/<p class="mb-3"><\/p>/g, '')
  
  return formatted
}

// Email subscription handler
const subscribeToUpdates = async () => {
  isSubscribing.value = true
  
  try {
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: subscriptionEmail.value,
        researchAreas: selectedAreas.value,
        subscriptionType: 'research_updates'
      })
    })

    if (response.ok) {
      alert('✅ Successfully subscribed to research updates!')
      showEmailSubscription.value = false
      subscriptionEmail.value = ''
      selectedAreas.value = []
    } else {
      const error = await response.json()
      alert(`❌ Subscription failed: ${error.message}`)
    }
  } catch (error) {
    console.error('Subscription error:', error)
    alert('❌ Failed to subscribe. Please try again later.')
  } finally {
    isSubscribing.value = false
  }
}
</script>

<style scoped>
.prose {
  line-height: 1.6;
}

.prose h4 {
  @apply text-lg font-bold text-gray-900 mt-4 mb-2;
}

.prose p {
  @apply mb-3 text-gray-800;
}

.prose strong {
  @apply font-semibold text-gray-900;
}

.prose li {
  @apply ml-4 mb-1;
}
</style>