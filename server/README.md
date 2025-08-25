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
