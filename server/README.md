# MedResearch AI - Backend

Enterprise-grade medical research AI assistant with validation, authentication, and analytics.

## 🚀 Quick Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- OpenAI API key

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Environment setup:**

   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

3. **Required Environment Variables:**

   ```bash
   OPENAI_API_KEY=your-openai-api-key
   MONGODB_URI=mongodb://localhost:27017/medresearch-ai
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

### Core Features

- **🤖 AI Integration**: OpenAI GPT-4 with validation
- **🔒 Authentication**: JWT with role-based access
- **📊 Analytics**: Usage tracking and insights
- **🔍 Validation**: Anti-hallucination mechanisms
- **📝 Audit Logging**: Enterprise compliance
- **⚡ Rate Limiting**: Subscription-based limits

### API Endpoints

```
Authentication:
POST /api/auth/register    - User registration
POST /api/auth/login       - User login
GET  /api/auth/me         - Get profile
POST /api/auth/logout     - Logout

Chat:
POST /api/chat/sessions              - Create chat session
GET  /api/chat/sessions              - Get user sessions
GET  /api/chat/sessions/:id          - Get specific session
POST /api/chat/sessions/:id/messages - Send message

Research:
GET  /api/research/papers            - Search papers
GET  /api/research/papers/:id        - Get paper details
POST /api/research/papers/:id/bookmark - Bookmark paper
POST /api/research/papers/:id/analyze  - AI analysis

Analytics:
GET  /api/analytics/dashboard        - User dashboard
GET  /api/analytics/usage           - Usage metrics
GET  /api/analytics/research-insights - Research insights
```

### Validation System

1. **Citation Checking**: Ensures medical claims have sources
2. **Confidence Scoring**: AI response reliability metrics
3. **Fact Verification**: Cross-reference with research database
4. **Safety Filters**: Content moderation
5. **Quality Scoring**: Response coherence and relevance

## 🛠️ Development

### Database Models

- **User**: Authentication, preferences, usage tracking
- **ResearchPaper**: Medical research data with AI processing
- **ChatSession**: Conversation history with validation metadata

### Middleware

- **Authentication**: JWT token validation
- **Rate Limiting**: Subscription-based API limits
- **Error Handling**: Comprehensive error management
- **Logging**: Winston-based audit trails

### Services

- **OpenAI Service**: AI integration with validation
- **Research Service**: PubMed/clinical trials integration
- **Analytics Service**: Usage and performance metrics

## 🔧 Configuration

### Subscription Tiers

```javascript
free: { daily: 20, monthly: 500 }
premium: { daily: 200, monthly: 5000 }
enterprise: { daily: 1000, monthly: 25000 }
```

### Security Features

- JWT authentication with session management
- Rate limiting by IP and user
- Input validation and sanitization
- MongoDB injection protection
- CORS and helmet security headers

## 📈 Monitoring

### Logs

- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only
- `logs/chat-audit.log` - Chat interactions audit

### Health Check

```bash
GET /health
```

## 🚀 Production Deployment

### Environment Variables

Set all variables from `.env.example` in production:

- Use strong JWT secrets
- Configure MongoDB Atlas
- Set proper CORS origins
- Enable SSL/TLS
- Configure log rotation

### Performance

- MongoDB indexes for search performance
- Connection pooling for database
- Rate limiting for API protection
- Caching for frequent queries

## 📞 Support

For technical issues or questions about the medical AI validation system, refer to the audit logs and error tracking systems.


## 🚀 Multi-Agent Workflow

This repo implements a **modular multi-agent system** using OpenAI models.

### Agents:
- **ResearchAgent** → analyzes medical literature.
- **TrialMatchingAgent** → identifies clinical trials based on patient/research data.
- **ExplainerAgent** → produces patient-friendly summaries.

### Coordinator
`Coordinator.js` orchestrates agent workflows:
1. ResearchAgent analyzes user query.
2. TrialMatchingAgent maps results to trials.
3. ExplainerAgent simplifies results for users.

### Architecture Diagram
```mermaid
flowchart TD
    U[User] -->|Query| FE[Vue Frontend]
    FE --> BE[Node Backend]
    BE --> C[Coordinator Agent]
    C --> R[Research Agent]
    C --> T[Trial Matching Agent]
    C --> E[Explainer Agent]
    R --> DB[(Research Papers DB)]
    T --> DB
    E --> BE
    BE --> FE
    FE --> U

# UPDATE!!! Multi-agent Workflow (VUE+ VITE  + Tailwind PWA, Node/Express + OpenAI + LangChain)

## Executive Summary

This project transforms the existing repository into a modern, production-ready multi-agent chatbot application for drug and medical trial research. It leverages **vanilla JavaScript, Tailwind CSS, Node.js/Express, and OpenAI’s API** with LangChain.js to orchestrate specialized agents. The app is lightweight (<50MB), installable as a PWA or Electron app, resilient to API downtime with caching and fallbacks, and designed for clean, accessible UX.

### Benefits

* **Resilience**: Multiple fallback APIs (PubMed, ClinicalTrials.gov, Europe PMC) ensure uptime.
* **Efficiency**: Intelligent caching and rate-limiting reduce API costs.
* **User-Centric**: Clean Tailwind UI, fast load times, responsive and accessible design.
* **Scalability**: Modular microservice-ready architecture with CI/CD and monitoring hooks.
* **Production-Ready**: Tested, secure, and compliant with modern MedTech and UX best practices.

---

## Architecture Diagram

```ascii
                    ┌──────────────────────────┐
                    │      User (Chat UI)      │
                    │  (Vanilla JS + Tailwind) │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │    Supervisor Agent      │
                    │ (LangChain.js Orchestration)
                    └─────────────┬────────────┘
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌────────────────┐       ┌────────────────┐       ┌──────────────────┐
│ Data Retrieval │       │   Caching      │       │ Error Handling   │
│  Agent         │       │   Agent        │       │   Agent          │
│ - OpenAI API   │       │ - SQLite/TTL   │       │ - User-friendly  │
│ - PubMed/NIH   │       │ - IndexedDB    │       │   messages       │
└────────────────┘       └────────────────┘       └──────────────────┘
        │                         │                         │
        ▼                         ▼                         ▼
┌────────────────┐       ┌────────────────┐       ┌──────────────────┐
│ Analysis Agent │──────▶│ Response Agent │──────▶│   Chat Frontend  │
│ Summaries,     │       │ Format answers │       │   (WebSocket)    │
│ trends,        │       │ context-aware  │       │   Tailwind UI    │
└────────────────┘       └────────────────┘       └──────────────────┘
```

---

## Changelog

### Added

* Executive Summary added to README.
* ASCII architecture diagram of multi-agent workflow added to README.

### Changed

* Documentation updated to reflect migration from SyneticX to OpenAI + fallback APIs.

### Fixed

* Consolidated requirements and streamlined project structure documentation.
