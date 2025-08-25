# MedResearch AI - Enterprise Medical Research Chatbot

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/vm799/drug-trial-synetixc-integration)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![Vue](https://img.shields.io/badge/vue-3.5.17-brightgreen.svg)](https://vuejs.org/)

A production-ready, enterprise-grade AI-powered medical research assistant with advanced validation systems to prevent hallucinations, comprehensive authentication, and real-time chat capabilities.

## 🎯 Overview

MedResearch AI transforms medical research by providing an intelligent chatbot that can analyze research papers, conduct literature reviews, and provide evidence-based insights while maintaining the highest standards of accuracy and safety through advanced anti-hallucination mechanisms.

### Key Features

- **🤖 AI-Powered Analysis**: OpenAI GPT-4 integration with medical research specialization
- **🔒 Anti-Hallucination System**: Multi-layer validation to ensure accuracy
- **📊 Research Database**: Integration with PubMed and ClinicalTrials.gov
- **🔐 Enterprise Security**: JWT authentication with role-based access control
- **📈 Analytics Dashboard**: Comprehensive usage and research insights
- **⚡ Real-time Chat**: WebSocket-powered instant communication
- **📱 Responsive Design**: Mobile-first UI with desktop optimization
- **🏥 Medical Validation**: Citation requirements and fact-checking

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Frontend Features](#frontend-features)
- [Backend Services](#backend-services)
- [Validation System](#validation-system)
- [Security](#security)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **MongoDB** 5.0+ (local or Atlas)
- **OpenAI API Key**
- **npm** or **yarn** package manager

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/vm799/drug-trial-synetixc-integration.git
cd drug-trial-synetixc-integration

# Run setup script
npm run setup

# Configure environment variables
cp server/.env.example server/.env
# Edit server/.env with your API keys

# Start the full application
npm run dev:fullstack
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/docs (if enabled)

## 🏗️ Architecture

### System Overview

```
┌────────────────────────────┐    ┌────────────────────────────┐    ┌────────────────────────────┐
│   Frontend                │    │    Backend                 │    │   External                │
│   (Vue 3 + Vite + TS)     │◄──►│  (Node.js + Express)      │◄──►│   Services                │
│                           │    │                            │    │                            │
│ • Vue 3.5.17              │    │ • Express.js 4.18          │    │ • OpenAI API              │
│ • TypeScript 5.8          │    │ • MongoDB 8.0 + Mongoose   │    │ • PubMed                  │
│ • Tailwind CSS 3.4.11     │    │ • Socket.IO                │    │ • ClinicalTrials.gov       │
│ • Responsive UI           │    │ • JWT Auth                 │    │ • Neon DB                  │
└────────────────────────────┘    └────────────────────────────┘    └────────────────────────────┘
```

### Technology Stack

#### Frontend

- **Framework**: Vue 3.5.17 with Composition API
- **Language**: TypeScript 5.8
- **Styling**: TailwindCSS 3.4.11 with custom medical theme
- **Build Tool**: Vite 7.0 with HMR
- **Testing**: Vitest with Vue Test Utils
- **State Management**: Vue 3 reactivity system
- **HTTP Client**: Custom API service with fetch

#### Backend

- **Runtime**: Node.js 18+ with ES modules
- **Framework**: Express.js 4.18 with middleware stack
- **Database**: MongoDB 8.0 with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.IO for WebSocket communication
- **AI Integration**: OpenAI API with GPT-4
- **Logging**: Winston with structured logging
- **Security**: Helmet, CORS, rate limiting, input validation

#### External Services

- **AI**: OpenAI GPT-4 Turbo for chat and analysis
- **Database**: MongoDB Atlas or local MongoDB
- **Research APIs**: PubMed, ClinicalTrials.gov
- **Monitoring**: Sentry for error tracking
- **Storage**: Optional cloud storage for files

## 📦 Installation

### Development Setup

1. **Clone and Install**

   ```bash
   git clone https://github.com/vm799/drug-trial-synetixc-integration.git
   cd drug-trial-synetixc-integration
   npm install
   cd server && npm install && cd ..
   ```

2. **Environment Configuration**

   ```bash
   # Copy environment template
   cp server/.env.example server/.env

   # Edit with your configuration
   nano server/.env
   ```

3. **Required Environment Variables**

   ```env
   # Core Configuration
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:5173

   # Database
   MONGODB_URI=mongodb://localhost:27017/medresearch-ai

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h

   # OpenAI
   OPENAI_API_KEY=sk-your-openai-api-key-here

   # Optional Services
   SENTRY_DSN=your-sentry-dsn-here
   PUBMED_API_BASE_URL=https://eutils.ncbi.nlm.nih.gov/entrez/eutils
   ```

4. **Database Setup**

   ```bash
   # For local MongoDB
   brew install mongodb/brew/mongodb-community
   brew services start mongodb/brew/mongodb-community

   # Or use MongoDB Atlas (recommended)
   # Update MONGODB_URI in .env with Atlas connection string
   ```

5. **Start Development**

   ```bash
   # Start both frontend and backend
   npm run dev:fullstack

   # Or start separately
   npm run dev          # Frontend only
   npm run server:dev   # Backend only
   ```

### Production Setup

1. **Install Dependencies**

   ```bash
   npm ci
   cd server && npm ci && cd ..
   ```

2. **Build Application**

   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   npm run start:production
   ```

## ⚙️ Configuration

### Frontend Configuration

**Vite Configuration** (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

**Tailwind Configuration** (`tailwind.config.js`)

```javascript
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          /* Medical blue palette */
        },
        secondary: {
          /* Gray scale */
        },
        medical: {
          /* Specialized colors */
        },
      },
    },
  },
}
```

### Backend Configuration

**Express Server** (`server/server.js`)

- Security middleware (Helmet, CORS, Rate limiting)
- Authentication middleware
- Request logging and monitoring
- Error handling with detailed logging
- Socket.IO integration for real-time features

**Database Configuration** (`server/config/database.js`)

- MongoDB connection with connection pooling
- Automatic reconnection handling
- Performance optimization settings
- Index management for search performance

## 📚 API Documentation

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "researcher@university.edu",
  "password": "SecurePassword123!",
  "firstName": "Dr. Jane",
  "lastName": "Smith",
  "organization": "University Medical Center",
  "specialization": ["oncology", "immunology"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "64f8a123b4c5d6e7f8901234",
      "email": "researcher@university.edu",
      "firstName": "Dr. Jane",
      "lastName": "Smith",
      "role": "user",
      "subscription": "free"
    }
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "researcher@university.edu",
  "password": "SecurePassword123!"
}
```

### Chat Endpoints

#### Create Chat Session

```http
POST /api/chat/sessions
Authorization: Bearer {token}
Content-Type: application/json

{
  "context": {
    "type": "paper_analysis",
    "researchPaper": "64f8a123b4c5d6e7f8901234",
    "specialization": "oncology"
  },
  "title": "Analysis of mRNA Vaccine Research"
}
```

#### Send Message

```http
POST /api/chat/sessions/{sessionId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Can you summarize the key findings of this paper?",
  "context": {
    "analysisType": "summary"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "response": {
      "content": "Based on the research paper, the key findings include...",
      "metadata": {
        "confidence": 0.92,
        "tokens": 245,
        "responseTime": 1230,
        "evidence": [
          {
            "type": "paper",
            "title": "Supporting Research Title",
            "relevanceScore": 0.89
          }
        ],
        "validation": {
          "hasCitations": true,
          "factChecked": true,
          "riskFlags": []
        }
      }
    }
  }
}
```

### Research Endpoints

#### Search Papers

```http
GET /api/research/papers?search=mRNA%20vaccine&field=oncology&sort=quality&page=1&limit=20
Authorization: Bearer {token}
```

#### Get Paper Details

```http
GET /api/research/papers/{paperId}
Authorization: Bearer {token}
```

#### Analyze Paper (Premium)

```http
POST /api/research/papers/{paperId}/analyze
Authorization: Bearer {token}
Content-Type: application/json

{
  "analysisType": "methodology",
  "additionalContext": "Focus on statistical analysis methods"
}
```

### Analytics Endpoints

#### Dashboard Analytics

```http
GET /api/analytics/dashboard?days=30
Authorization: Bearer {token}
```

#### Usage Analytics

```http
GET /api/analytics/usage?period=month&groupBy=day
Authorization: Bearer {token}
```

## 🎨 Frontend Features

### Component Architecture

```
src/
├── components/
│   ├── ResearchPaper.vue      # Paper display component
│   ├── ChatInterface.vue      # Real-time chat UI
│   ├── QuickActions.vue       # Action buttons
│   ├── SuggestionCard.vue     # AI suggestions
│   └── analytics/
│       ├── Dashboard.vue      # Analytics dashboard
│       └── Charts.vue         # Data visualization
├── services/
│   ├── api.ts                 # API communication
│   ├── websocket.ts           # Real-time features
│   └── auth.ts                # Authentication
├── composables/
│   ├── useAuth.ts             # Authentication logic
│   ├── useChat.ts             # Chat functionality
│   └── useResearch.ts         # Research operations
└── types/
    ├── api.ts                 # TypeScript interfaces
    ├── user.ts                # User types
    └── research.ts            # Research types
```

### Key Features

#### Responsive Design

- **Mobile-first**: Optimized for smartphones and tablets
- **Adaptive layouts**: Grid systems that adjust to screen size
- **Touch-friendly**: Large touch targets and gestures
- **Performance**: Optimized loading and rendering

#### Real-time Chat

- **WebSocket integration**: Instant message delivery
- **Typing indicators**: Real-time user activity
- **Message history**: Persistent conversation storage
- **Context awareness**: Maintains conversation context

#### Research Interface

- **Advanced search**: Multi-field filtering and sorting
- **Paper analysis**: AI-powered insights and summaries
- **Bookmark system**: Save and organize research
- **Citation tracking**: Reference management

## 🔧 Backend Services

### Core Services

#### OpenAI Service (`server/services/openaiService.js`)

**Features:**

- GPT-4 integration with medical specialization
- Custom system prompts for medical accuracy
- Response validation and confidence scoring
- Citation requirement enforcement
- Safety filtering and content moderation

**Anti-Hallucination Mechanisms:**

```javascript
// Citation checking
checkCitations(content) {
  const citationPatterns = [
    /\([^)]*\d{4}[^)]*\)/g,     // (Author, 2024)
    /\[[^\]]*\]/g,              // [1], [Author et al.]
    /doi:\s*[\d.\/]+/gi,        // DOI references
    /according to [^.]+/gi      // "according to..."
  ];
  return citationPatterns.some(pattern => pattern.test(content));
}

// Confidence scoring
calculateConfidence(content, validation, evidence) {
  let confidence = 0.8;
  if (validation.hasCitations) confidence += 0.1;
  confidence -= validation.riskFlags.length * 0.1;
  confidence += Math.min(0.15, evidence.length * 0.05);
  return Math.max(0.1, Math.min(1.0, confidence));
}
```

#### Authentication Service

- JWT token management with refresh tokens
- Role-based access control (user, researcher, admin)
- Session tracking and security monitoring
- Rate limiting by subscription tier
- Password security with bcrypt hashing

#### Research Service

- PubMed API integration for paper retrieval
- ClinicalTrials.gov data synchronization
- Semantic search with embeddings
- Quality scoring and relevance ranking
- Citation network analysis

### Database Models

#### User Model (`server/models/User.js`)

```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['user', 'researcher', 'admin'], default: 'user' },
  subscription: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
  specialization: [{ type: String, enum: [...medicalFields] }],
  apiUsage: {
    daily: { requests: Number, tokens: Number, date: Date },
    monthly: { requests: Number, tokens: Number, month: Number, year: Number },
  },
  preferences: {
    ai_settings: {
      response_length: { type: String, default: 'detailed' },
      include_citations: { type: Boolean, default: true },
      confidence_threshold: { type: Number, default: 0.8 },
    },
  },
})
```

#### Research Paper Model (`server/models/ResearchPaper.js`)

```javascript
const researchPaperSchema = new mongoose.Schema({
  title: { type: String, required: true, index: 'text' },
  abstract: { type: String, required: true, index: 'text' },
  authors: [{ name: String, affiliation: String, orcid: String }],
  journal: { name: String, impactFactor: Number },
  publicationDate: { type: Date, required: true },
  researchType: { type: String, enum: [...researchTypes] },
  medicalFields: [{ type: String, enum: [...medicalFields] }],
  qualityScore: { type: Number, min: 0, max: 10, default: 5 },
  aiProcessing: {
    embedding: [Number],
    confidenceScore: Number,
    lastProcessed: Date,
  },
  validation: {
    peerReviewed: Boolean,
    retracted: Boolean,
    flagged: Boolean,
  },
})
```

#### Chat Session Model (`server/models/ChatSession.js`)

```javascript
const chatSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  context: {
    type: { type: String, enum: ['research', 'general', 'paper_analysis'] },
    researchPaper: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchPaper' },
  },
  messages: [
    {
      type: { type: String, enum: ['user', 'assistant', 'system'] },
      content: String,
      timestamp: Date,
      metadata: {
        tokens: Number,
        confidence: Number,
        responseTime: Number,
        validation: Object,
      },
    },
  ],
  quality: {
    coherenceScore: Number,
    relevanceScore: Number,
    accuracyScore: Number,
    flagged: Boolean,
  },
})
```

## 🛡️ Validation System

### Anti-Hallucination Architecture

The validation system implements multiple layers of protection against AI hallucinations:

#### Layer 1: Input Validation

- Medical terminology verification
- Context appropriateness checking
- User intent classification
- Query complexity assessment

#### Layer 2: Response Generation

- Specialized medical prompts
- Temperature and parameter tuning
- Citation requirement enforcement
- Conservative response mode

#### Layer 3: Output Validation

```javascript
async validateResponse(content, context) {
  const validation = {
    hasCitations: this.checkCitations(content),
    riskFlags: [],
    confidence: 0.8
  };

  // Check for uncited medical claims
  const medicalClaims = this.extractMedicalClaims(content);
  for (const claim of medicalClaims) {
    if (!this.hasNearByCitation(content, claim)) {
      validation.riskFlags.push(`Uncited medical claim: ${claim}`);
    }
  }

  // Check for overconfident language
  const overconfidentPhrases = ['definitely', 'certainly', 'always', 'never'];
  for (const phrase of overconfidentPhrases) {
    if (content.toLowerCase().includes(phrase)) {
      validation.riskFlags.push(`Overconfident language: "${phrase}"`);
    }
  }

  return validation;
}
```

#### Layer 4: Evidence Verification

- Cross-reference with research database
- Citation accuracy checking
- Source reliability assessment
- Contradiction detection

### Quality Metrics

#### Confidence Scoring

- **Citation presence**: +10% confidence
- **Evidence support**: +5% per supporting source
- **Risk flags**: -10% per flag
- **Minimum threshold**: 70% for medical content

#### Safety Thresholds

- **High confidence (>90%)**: Direct display
- **Medium confidence (70-90%)**: Display with caveats
- **Low confidence (<70%)**: Require human review
- **Flagged content**: Block or redirect to sources

## 🔐 Security

### Authentication & Authorization

#### JWT Implementation

```javascript
// Token generation with secure practices
const generateToken = (userId) => {
  return jwt.sign({ id: userId, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: '15m',
    issuer: 'medresearch-ai',
    audience: 'medical-researchers',
  })
}

// Middleware for authentication
const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ message: 'Access denied' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
}
```

#### Session Management

- Secure session storage with encryption
- Session invalidation on logout
- Concurrent session limits
- Activity-based session timeout

### Rate Limiting

#### Subscription-Based Limits

```javascript
const rateLimits = {
  free: { daily: 20, hourly: 5, burst: 2 },
  premium: { daily: 200, hourly: 50, burst: 10 },
  enterprise: { daily: 1000, hourly: 200, burst: 50 },
}

// Rate limiting middleware
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.user?.subscription === 'enterprise',
  })
}
```

### Data Protection

#### Input Sanitization

- XSS protection with input encoding
- SQL injection prevention
- NoSQL injection protection
- File upload security

#### Data Encryption

- Passwords hashed with bcrypt (cost factor 12)
- Sensitive data encrypted at rest
- TLS/SSL for data in transit
- Environment variable protection

### Security Headers

```javascript
// Security middleware stack
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", 'https://api.openai.com'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }),

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
  }),
)
```

## 🚀 Deployment

### Production Checklist

#### Environment Setup

- [ ] Set strong JWT secrets (32+ characters)
- [ ] Configure MongoDB Atlas with authentication
- [ ] Set up OpenAI API with usage monitoring
- [ ] Configure environment-specific variables
- [ ] Enable SSL/TLS certificates
- [ ] Set up domain and DNS
- [ ] Configure CDN for static assets

#### Security Hardening

- [ ] Enable firewall rules
- [ ] Set up intrusion detection
- [ ] Configure log monitoring
- [ ] Enable automated backups
- [ ] Set up health checks
- [ ] Configure error tracking
- [ ] Enable performance monitoring

### Deployment Options

#### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci && cd server && npm ci

# Build application
COPY . .
RUN npm run build

# Start application
EXPOSE 3001
CMD ["npm", "run", "start:production"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongodb

  mongodb:
    image: mongo:7
    ports:
      - '27017:27017'
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

#### Cloud Deployment

**Vercel (Frontend + Serverless Functions)**

```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build" },
    { "src": "server/**/*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/server/$1" },
    { "src": "/(.*)", "dest": "/dist/$1" }
  ]
}
```

**Railway/Heroku (Full Stack)**

```json
{
  "scripts": {
    "build": "npm run build",
    "start": "npm run start:production"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### Performance Optimization

#### Database Optimization

```javascript
// Essential indexes for performance
db.researchpapers.createIndex({
  title: 'text',
  abstract: 'text',
  keywords: 'text',
})
db.researchpapers.createIndex({ publicationDate: -1 })
db.researchpapers.createIndex({ medicalFields: 1 })
db.researchpapers.createIndex({ qualityScore: -1 })

// Chat session indexes
db.chatsessions.createIndex({ userId: 1, createdAt: -1 })
db.chatsessions.createIndex({ sessionId: 1 })

// User indexes
db.users.createIndex({ email: 1 })
db.users.createIndex({ lastActivity: 1 })
```

#### Caching Strategy

```javascript
// Redis caching for frequent queries
const redis = require('redis')
const client = redis.createClient()

// Cache research paper searches
const cacheSearchResults = async (query, results) => {
  const key = `search:${crypto.createHash('md5').update(query).digest('hex')}`
  await client.setex(key, 300, JSON.stringify(results)) // 5 min cache
}

// Cache user sessions
const cacheUserSession = async (userId, sessionData) => {
  await client.setex(`user:${userId}`, 3600, JSON.stringify(sessionData))
}
```

## 🧪 Testing

### Test Structure

```
tests/
├── unit/
│   ├── frontend/
│   │   ├── components/
│   │   └── services/
│   └── backend/
│       ├── models/
│       ├── services/
│       └── routes/
├── integration/
│   ├── api/
│   └── database/
└── e2e/
    ├── auth/
    ├── chat/
    └── research/
```

### Frontend Testing

**Component Testing with Vitest**

```typescript
// tests/unit/components/ChatInterface.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ChatInterface from '@/components/ChatInterface.vue'

describe('ChatInterface', () => {
  it('sends message when enter is pressed', async () => {
    const wrapper = mount(ChatInterface, {
      props: {
        messages: [],
        visible: true,
      },
    })

    const input = wrapper.find('input[type="text"]')
    const sendSpy = vi.spyOn(wrapper.vm, '$emit')

    await input.setValue('Test message')
    await input.trigger('keyup.enter')

    expect(sendSpy).toHaveBeenCalledWith('sendMessage', 'Test message')
  })
})
```

### Backend Testing

**API Testing with Supertest**

```javascript
// tests/integration/auth.test.js
import request from 'supertest'
import app from '../../server/server.js'

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      }

      const response = await request(app).post('/api/auth/register').send(userData).expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.token).toBeDefined()
    })
  })
})
```

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:unit

# Run backend tests
cd server && npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- ChatInterface.test.ts

# Watch mode for development
npm run test:watch
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-feature`
3. **Make your changes** with proper testing
4. **Run the test suite**: `npm test`
5. **Commit your changes**: `git commit -m "Add new feature"`
6. **Push to your fork**: `git push origin feature/new-feature`
7. **Open a Pull Request**

### Code Standards

#### TypeScript/JavaScript

- Use TypeScript for new frontend code
- Follow ESLint configuration
- Use Prettier for code formatting
- Add JSDoc comments for functions
- Maintain test coverage above 80%

#### Vue Components

- Use Composition API with `<script setup>`
- Define props with TypeScript interfaces
- Use meaningful component names
- Keep components under 200 lines
- Add proper accessibility attributes

#### Backend Code

- Use ES modules syntax
- Add proper error handling
- Include input validation
- Write integration tests
- Document API endpoints

### Pull Request Guidelines

- Include description of changes
- Add tests for new features
- Update documentation if needed
- Ensure all tests pass
- Follow commit message conventions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation

- **Full API Docs**: Available at `/docs` endpoint
- **Frontend Components**: See component documentation in source
- **Backend Services**: Check service documentation in code

### Getting Help

- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Email security@medresearch-ai.com for security issues

### Professional Support

- **Enterprise Support**: Available for enterprise customers
- **Custom Development**: Contact for custom features
- **Training**: Available for team onboarding

---

**Built with ❤️ for the medical research community**

_Advancing medical research through AI-powered insights while maintaining the highest standards of accuracy and safety._
