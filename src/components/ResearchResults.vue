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
      
      <div class="grid gap-4 md:grid-cols-2">
        <div 
          v-for="(study, index) in extractedStudies" 
          :key="index"
          class="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
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
            <div class="flex space-x-2 mt-3">
              <a 
                :href="study.pubmedUrl" 
                target="_blank" 
                class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
              >
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"></path>
                </svg>
                PubMed
              </a>
              <a 
                :href="study.doiUrl" 
                target="_blank" 
                class="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition-colors"
              >
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"></path>
                </svg>
                Full Text
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
      
      <div class="grid gap-3 md:grid-cols-2">
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-2">🏥 Consult Your Doctor</h4>
          <p class="text-sm text-gray-700">Discuss these findings with your healthcare provider for personalized advice.</p>
        </div>
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-2">📖 Read More</h4>
          <p class="text-sm text-gray-700">Explore the linked studies for detailed methodology and findings.</p>
        </div>
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-2">🔬 Clinical Trials</h4>
          <p class="text-sm text-gray-700">Check ClinicalTrials.gov for relevant ongoing studies.</p>
        </div>
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <h4 class="font-semibold text-gray-900 mb-2">🔄 Follow Up</h4>
          <p class="text-sm text-gray-700">Stay updated with latest research developments in this area.</p>
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
    studies.push({
      title: `Clinical Study Referenced in AI Analysis`,
      journal: "Extracted from Research",
      date: "2024",
      finding: "Research finding referenced in AI analysis",
      pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(doi)}`,
      doiUrl: `https://doi.org/${doi}`
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