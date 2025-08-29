import mongoose from 'mongoose'

const researchPaperSchema = new mongoose.Schema(
  {
    // Paper identification
    pubmedId: {
      type: String,
      unique: true,
      sparse: true,
    },
    doi: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      index: 'text',
    },
    abstract: {
      type: String,
      required: [true, 'Abstract is required'],
      index: 'text',
    },

    // Authors and affiliations
    authors: [
      {
        name: { type: String, required: true },
        affiliation: String,
        orcid: String,
      },
    ],

    // Publication details
    journal: {
      name: { type: String, required: true },
      issn: String,
      impactFactor: Number,
      quartile: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'] },
    },
    publicationDate: {
      type: Date,
      required: true,
      index: 1,
    },
    volume: String,
    issue: String,
    pages: String,

    // Research classification
    researchType: {
      type: String,
      enum: [
        'clinical_trial',
        'systematic_review',
        'meta_analysis',
        'case_study',
        'cohort_study',
        'randomized_controlled_trial',
        'observational_study',
        'laboratory_study',
        'review_article',
        'other',
      ],
      required: true,
    },
    medicalFields: [
      {
        type: String,
        enum: [
          'oncology',
          'cardiology',
          'neurology',
          'infectious_diseases',
          'immunology',
          'pharmacology',
          'surgery',
          'pediatrics',
          'geriatrics',
          'psychiatry',
          'dermatology',
          'endocrinology',
          'other',
        ],
      },
    ],

    // Clinical trial specific data
    clinicalTrial: {
      phase: { type: String, enum: ['preclinical', 'phase_1', 'phase_2', 'phase_3', 'phase_4'] },
      studyType: { type: String, enum: ['interventional', 'observational'] },
      participantCount: Number,
      primaryEndpoint: String,
      secondaryEndpoints: [String],
      inclusion_criteria: [String],
      exclusion_criteria: [String],
      clinicalTrialsGovId: String,
    },

    // Content analysis
    keywords: [String],
    meshTerms: [String],

    // Quality metrics
    qualityScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 5,
    },
    evidenceLevel: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      default: 'C',
    },

    // Citations and references
    citationCount: {
      type: Number,
      default: 0,
    },
    references: [
      {
        title: String,
        authors: [String],
        journal: String,
        year: Number,
        doi: String,
      },
    ],

    // AI processing data
    aiProcessing: {
      lastProcessed: Date,
      embedding: [Number], // Vector embedding for similarity search
      summaryGenerated: {
        type: Boolean,
        default: false,
      },
      factChecked: {
        type: Boolean,
        default: false,
      },
      confidenceScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5,
      },
    },

    // User interactions
    interactions: {
      views: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      chatSessions: { type: Number, default: 0 },
    },

    // Validation flags
    validation: {
      peerReviewed: { type: Boolean, default: false },
      retracted: { type: Boolean, default: false },
      flagged: { type: Boolean, default: false },
      flagReason: String,
      lastValidated: Date,
    },

    // Full text content (if available)
    fullText: {
      available: { type: Boolean, default: false },
      content: String,
      sections: [
        {
          title: String,
          content: String,
          type: {
            type: String,
            enum: ['introduction', 'methods', 'results', 'discussion', 'conclusion'],
          },
        },
      ],
    },

    // Metadata
    source: {
      type: String,
      enum: ['pubmed', 'manual', 'import', 'clinicaltrials_gov'],
      default: 'manual',
    },
    language: {
      type: String,
      default: 'en',
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'flagged', 'processing'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for performance
researchPaperSchema.index({ title: 'text', abstract: 'text', keywords: 'text' })
researchPaperSchema.index({ publicationDate: -1 })
researchPaperSchema.index({ researchType: 1 })
researchPaperSchema.index({ medicalFields: 1 })
researchPaperSchema.index({ qualityScore: -1 })
researchPaperSchema.index({ 'interactions.views': -1 })
// pubmedId and doi already have unique indexes via field definitions
researchPaperSchema.index({ 'aiProcessing.embedding': 1 })

// Virtual for primary author
researchPaperSchema.virtual('primaryAuthor').get(function () {
  return this.authors && this.authors.length > 0 ? this.authors[0].name : 'Unknown'
})

// Virtual for age of paper
researchPaperSchema.virtual('ageInDays').get(function () {
  return Math.floor((Date.now() - this.publicationDate.getTime()) / (1000 * 60 * 60 * 24))
})

// Virtual for recent status
researchPaperSchema.virtual('isRecent').get(function () {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  return this.publicationDate >= oneYearAgo
})

// Method to increment view count
researchPaperSchema.methods.incrementViews = function () {
  this.interactions.views += 1
  return this.save()
}

// Method to update AI processing status
researchPaperSchema.methods.updateAIProcessing = function (data) {
  this.aiProcessing = {
    ...this.aiProcessing,
    ...data,
    lastProcessed: new Date(),
  }
  return this.save()
}

// Static method to find similar papers
researchPaperSchema.statics.findSimilar = function (embedding, limit = 10) {
  // This would be implemented with vector similarity search
  // For now, return papers in same medical fields
  return this.find({
    'aiProcessing.embedding': { $exists: true },
  }).limit(limit)
}

export default mongoose.model('ResearchPaper', researchPaperSchema)
