# 🚀 Data Sources Setup Guide

## **Building a REAL Data-Driven Pharmaceutical Intelligence Platform**

This guide shows you how to replace mock data with live data feeds and file uploads to create a sustainable, revenue-generating platform.

---

## **📊 Available Data Sources**

### **1. Live API Feeds (No API Keys Required)**

#### **ClinicalTrials.gov API**
- **Endpoint**: `https://clinicaltrials.gov/api/v2`
- **Data**: Clinical trial information, phases, sponsors, outcomes
- **Rate Limit**: None (public API)
- **Setup**: Automatically configured, no API key needed
- **Status**: ✅ **READY TO USE**

#### **Yahoo Finance API**
- **Endpoint**: `https://query1.finance.yahoo.com/v8/finance`
- **Data**: Company financials, market data, stock prices
- **Rate Limit**: None (public API)
- **Setup**: Automatically configured, no API key needed
- **Status**: ✅ **READY TO USE**

#### **USPTO Public APIs**
- **Endpoint**: `https://developer.uspto.gov/`
- **Data**: Patent information, filing data, status updates
- **Rate Limit**: 1000 requests/hour (free tier)
- **Setup**: Requires registration for API key
- **Status**: 🔑 **REQUIRES API KEY**

### **2. Premium APIs (Require API Keys)**

#### **Alpha Vantage Financial API**
- **Cost**: Free tier available (500 requests/day)
- **Data**: Advanced financial metrics, earnings, forecasts
- **Setup**: Get API key from [Alpha Vantage](https://www.alphavantage.co/)
- **Status**: 🔑 **REQUIRES API KEY**

#### **Google Patents API**
- **Cost**: Free with Google Cloud account
- **Data**: Comprehensive patent data, citations, legal status
- **Setup**: Enable Google Patents API in Google Cloud Console
- **Status**: 🔑 **REQUIRES GOOGLE CLOUD SETUP**

#### **OpenAI API (for AI Insights)**
- **Cost**: Pay-per-use (very affordable)
- **Data**: AI-powered analysis and insights
- **Setup**: Get API key from [OpenAI](https://platform.openai.com/)
- **Status**: 🔑 **REQUIRES API KEY**

---

## **📁 File Upload Data Sources**

### **Supported Formats**
- **CSV**: Patent data, clinical trials, financial reports
- **JSON**: API responses, structured data exports
- **Excel**: Spreadsheet data, market research reports

### **Data Templates Available**
- Patent data with assignees, inventors, drug information
- Clinical trial data with phases, sponsors, outcomes
- Financial data with company metrics and performance
- Competitive intelligence with threat assessments

---

## **⚙️ Setup Instructions**

### **Step 1: Configure Environment Variables**

Create a `.env` file in your project root:

```bash
# Required for live data feeds
MONGODB_URI=your_mongodb_connection_string

# Optional: Premium API keys
ALPHA_VANTAGE_KEY=your_alpha_vantage_api_key
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
OPENAI_API_KEY=your_openai_api_key

# USPTO API (free, but requires registration)
USPTO_API_KEY=your_uspto_api_key
```

### **Step 2: Register Data Sources**

#### **Option A: Through the UI**
1. Go to **Data Management** tab
2. Click **Upload Data** button
3. Select data type and upload file
4. System automatically registers the source

#### **Option B: Through API**
```bash
curl -X POST http://localhost:3001/api/data-management/sources \
  -H "Content-Type: application/json" \
  -d '{
    "id": "clinical_trials_live",
    "name": "ClinicalTrials.gov Live Feed",
    "type": "api",
    "dataType": "clinical_trials",
    "url": "https://clinicaltrials.gov/api/v2/studies",
    "refreshInterval": 3600000
  }'
```

### **Step 3: Upload Sample Data Files**

#### **Patent Data Example (CSV)**
```csv
patentNumber,title,assignee,filingDate,expiryDate,status
US12345678,Novel Cancer Treatment,PharmaCorp Inc.,2020-01-15,2040-01-15,Active
US87654321,Diabetes Drug Formulation,BioTech Ltd,2019-06-20,2039-06-20,Active
```

#### **Clinical Trial Data Example (CSV)**
```csv
nctId,title,sponsor,phase,status,startDate,enrollment
NCT12345678,Phase II Cancer Study,PharmaCorp Inc.,II,Recruiting,2024-01-15,150
NCT87654321,Diabetes Drug Trial,BioTech Ltd,III,Active,2023-08-01,300
```

#### **Financial Data Example (CSV)**
```csv
companyName,symbol,marketCap,revenue,profitMargin
PharmaCorp Inc.,PHAR,5000000000,1000000000,0.15
BioTech Ltd,BIO,2500000000,500000000,0.12
```

---

## **🔧 Advanced Configuration**

### **Custom Data Schemas**

Define your own data structure:

```json
{
  "schema": {
    "patentNumber": { "type": "string", "required": true },
    "title": { "type": "string", "required": true },
    "filingDate": { "type": "date", "required": true },
    "expiryDate": { "type": "date", "required": true }
  },
  "transformations": {
    "normalizedTitle": {
      "type": "format",
      "format": "uppercase"
    },
    "daysUntilExpiry": {
      "type": "calculate",
      "formula": "Math.floor((new Date('{expiryDate}') - new Date()) / (1000 * 60 * 60 * 24))"
    }
  }
}
```

### **Scheduled Data Refresh**

Configure automatic data updates:

```json
{
  "refreshInterval": 3600000,
  "retryAttempts": 3,
  "backoffStrategy": "exponential"
}
```

---

## **📈 Knowledge Graph Construction**

### **Multi-Agent Processing**

The system automatically processes your data with specialized agents:

1. **Patent Analysis Agent**: Extracts patent entities, assignees, inventors
2. **Clinical Trial Agent**: Analyzes trial phases, sponsors, outcomes
3. **Financial Analysis Agent**: Processes market data and metrics
4. **Entity Resolution Agent**: Links entities across data sources
5. **Knowledge Integration Agent**: Builds unified knowledge graphs

### **Building Your First Knowledge Graph**

1. Upload data files for different domains
2. Go to **Data Management** → **Build New Graph**
3. Select data sources to include
4. System processes data and builds graph
5. Query the graph for insights

---

## **🔍 Data Quality Monitoring**

### **Automatic Quality Checks**
- Data validation against schemas
- Duplicate detection and removal
- Missing data identification
- Data freshness monitoring

### **Quality Reports**
- Source health status
- Data completeness metrics
- Refresh schedule compliance
- Error tracking and resolution

---

## **🚀 Deployment on Render**

### **Environment Variables for Render**
```yaml
# render.yaml
envVars:
  - key: MONGODB_URI
    value: your_mongodb_atlas_connection_string
  - key: ALPHA_VANTAGE_KEY
    value: your_alpha_vantage_api_key
  - key: OPENAI_API_KEY
    value: your_openai_api_key
```

### **MongoDB Atlas Setup**
1. Create MongoDB Atlas account
2. Create cluster (free tier available)
3. Add your IP to whitelist
4. Get connection string
5. Add to Render environment variables

---

## **💡 Best Practices**

### **Data Source Management**
- Use descriptive names for data sources
- Set appropriate refresh intervals
- Monitor data quality regularly
- Keep API keys secure

### **File Uploads**
- Validate data before upload
- Use consistent data formats
- Include metadata with uploads
- Clean up old data sources

### **Knowledge Graph Optimization**
- Start with focused data domains
- Build graphs incrementally
- Monitor processing performance
- Use insights for business decisions

---

## **🔗 Quick Start Commands**

### **Start the Platform**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm run start:production
```

### **Test Data Sources**
```bash
# Check system status
curl http://localhost:3001/api/data-management/system-status

# Get data sources
curl http://localhost:3001/api/data-management/sources

# Get quality report
curl http://localhost:3001/api/data-management/quality-report
```

---

## **📞 Support & Troubleshooting**

### **Common Issues**
1. **MongoDB Connection**: Check connection string and IP whitelist
2. **API Rate Limits**: Implement proper rate limiting and caching
3. **File Upload Errors**: Verify file format and size limits
4. **Data Processing**: Check data schema and validation rules

### **Getting Help**
- Check server logs for detailed error messages
- Verify environment variables are set correctly
- Test API endpoints individually
- Monitor data source health status

---

## **🎯 Next Steps**

1. **Upload Sample Data**: Start with the provided CSV templates
2. **Configure Live APIs**: Set up ClinicalTrials.gov and Yahoo Finance
3. **Build Knowledge Graph**: Process your first integrated dataset
4. **Monitor Quality**: Use the quality dashboard to track data health
5. **Scale Up**: Add more data sources and build comprehensive graphs

---

**🎉 Congratulations! You're now building a REAL data-driven pharmaceutical intelligence platform that can generate sustainable revenue through live data feeds and comprehensive analysis.**

The platform automatically handles:
- ✅ Data validation and quality monitoring
- ✅ Multi-agent knowledge graph construction
- ✅ Real-time data refresh and updates
- ✅ Comprehensive data source management
- ✅ Enterprise-grade data processing

**No more mock data - only real insights from real sources!**