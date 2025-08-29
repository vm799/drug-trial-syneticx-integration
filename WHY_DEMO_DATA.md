# 🤔 Why Am I Seeing Demo Data? Complete Guide

## **📊 Current Data Source Status**

### **✅ Working Right Now (Real Data)**
- **ClinicalTrials.gov**: Live clinical trial data - ✅ **ACTIVE**
- **Yahoo Finance**: Real-time financial data - ✅ **ACTIVE**

### **⚠️ Need Setup (Currently Showing Demo Data)**
- **USPTO API**: Patent data - 🔑 **NEEDS API KEY**
- **Alpha Vantage**: Advanced financial metrics - 🔑 **NEEDS API KEY**
- **OpenAI**: AI insights - 🔑 **NEEDS API KEY**

---

## **🔍 Why Demo Data Appears**

### **1. Missing API Keys**
The platform automatically falls back to demo data when:
- API keys are not configured
- API endpoints return authorization errors (401/403)
- Rate limits are exceeded

### **2. Network/Service Issues**
Demo data is shown when:
- External APIs are temporarily unavailable
- Network connectivity issues occur
- API endpoints return server errors (500/404)

### **3. Fallback Strategy**
This is actually a **FEATURE**, not a bug:
- Ensures the platform always works
- Provides realistic examples for demonstration
- Allows testing without external dependencies

---

## **🚀 How to Get Real Data (3 Options)**

### **Option 1: Quick API Setup (Recommended)**

#### **USPTO API (Free)**
```bash
# 1. Go to: https://developer.uspto.gov/
# 2. Register for free account
# 3. Get API key (1000 requests/hour free)
# 4. Add to .env file:
USPTO_API_KEY=your_key_here
```

#### **Alpha Vantage (Free Tier)**
```bash
# 1. Go to: https://www.alphavantage.co/support/#api-key
# 2. Register for free account
# 3. Get API key (500 requests/day free)
# 4. Add to .env file:
ALPHA_VANTAGE_KEY=your_key_here
```

#### **OpenAI (Pay-per-use)**
```bash
# 1. Go to: https://platform.openai.com/api-keys
# 2. Add payment method
# 3. Get API key (very affordable)
# 4. Add to .env file:
OPENAI_API_KEY=your_key_here
```

### **Option 2: Upload Your Own Data (Immediate)**

#### **CSV Templates Available**
- **Patents**: `/sample-data/patents-sample.csv`
- **Clinical Trials**: `/sample-data/clinical-trials-sample.csv`
- **Financial Data**: `/sample-data/financial-data-sample.csv`

#### **Upload Process**
1. Go to **Data Management** tab
2. Click **Upload Data**
3. Select data type and upload CSV
4. System automatically processes and validates
5. Build knowledge graphs from your data

### **Option 3: Use Working APIs (Already Available)**

#### **ClinicalTrials.gov - Always Working**
- ✅ No API key required
- ✅ No rate limits
- ✅ Real clinical trial data
- ✅ Use in Research Insights tab

#### **Yahoo Finance - Always Working**
- ✅ No API key required
- ✅ No rate limits
- ✅ Real financial market data
- ✅ Use in Competitive Intelligence tab

---

## **🔧 Environment Variables Setup**

### **Create .env File**
```bash
# Create .env file in project root
touch .env
```

### **Add API Keys**
```bash
# .env file contents
MONGODB_URI=your_mongodb_connection_string

# USPTO API (Free)
USPTO_API_KEY=your_uspto_api_key_here

# Alpha Vantage (Free tier)
ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here

# OpenAI (Pay-per-use)
OPENAI_API_KEY=your_openai_api_key_here
```

### **Restart Application**
```bash
# After adding .env file
npm run dev
```

---

## **📊 Data Source Dashboard**

### **Real-Time Monitoring**
The **Data Management** tab now includes a **Data Source Status Dashboard** that shows:
- ✅ Which APIs are working (real data)
- ⚠️ Which APIs need configuration
- ❌ Which APIs have failed
- 🔧 Setup guides for each service

### **Automatic Testing**
- Click **"Test All APIs"** to check current status
- Real-time updates on API health
- Clear indicators of data source status

---

## **🎯 Immediate Actions You Can Take**

### **Right Now (No Setup Required)**
1. **Use ClinicalTrials.gov data** in Research Insights tab
2. **Use Yahoo Finance data** in Competitive Intelligence tab
3. **Upload your own CSV files** in Data Management tab
4. **View data source status** in Data Management tab

### **This Week (Quick Setup)**
1. **Get USPTO API key** (5 minutes, free)
2. **Get Alpha Vantage key** (2 minutes, free)
3. **Configure environment variables**
4. **Test real patent and financial data**

### **Long Term (Premium Features)**
1. **OpenAI API** for AI-powered insights
2. **Custom data feeds** from your internal sources
3. **Advanced analytics** with real-time data
4. **Knowledge graphs** from multiple live sources

---

## **💡 Pro Tips**

### **Start with What Works**
- ClinicalTrials.gov and Yahoo Finance are **always available**
- Use these for immediate real data insights
- Build knowledge graphs from working sources

### **Gradual API Setup**
- Don't try to set up all APIs at once
- Start with USPTO (most valuable for patents)
- Add Alpha Vantage for financial analysis
- Add OpenAI last for AI insights

### **Data Upload Strategy**
- Upload your own data while setting up APIs
- Use provided CSV templates as starting points
- Combine uploaded data with live API feeds

---

## **🔍 Troubleshooting**

### **Common Issues**

#### **"Authorization Error"**
- **Cause**: Missing or invalid API key
- **Solution**: Check .env file and restart application

#### **"Endpoint Not Valid"**
- **Cause**: API service temporarily down
- **Solution**: Wait and retry, or use demo data temporarily

#### **"Rate Limit Exceeded"**
- **Cause**: Free API limits reached
- **Solution**: Wait for reset or upgrade to paid plan

### **Getting Help**
1. **Check Data Source Status Dashboard**
2. **View browser console for error details**
3. **Test individual APIs**
4. **Use demo data while troubleshooting**

---

## **🎉 Success Path**

### **Week 1: Immediate Real Data**
- ✅ ClinicalTrials.gov (working)
- ✅ Yahoo Finance (working)
- ✅ Upload your own CSV files
- ✅ Build first knowledge graphs

### **Week 2: Enhanced APIs**
- 🔑 USPTO API setup
- 🔑 Alpha Vantage setup
- ✅ Real patent data
- ✅ Advanced financial metrics

### **Week 3: AI-Powered Insights**
- 🔑 OpenAI API setup
- ✅ AI-generated insights
- ✅ Comprehensive analysis
- ✅ Production-ready platform

---

## **🏆 Bottom Line**

**Demo data is NOT a problem - it's a feature!**

The platform intelligently falls back to demo data when:
- APIs aren't configured yet
- Services are temporarily unavailable
- You want to test functionality

**To get real data:**
1. **Use working APIs** (ClinicalTrials.gov, Yahoo Finance)
2. **Upload your own data** (immediate)
3. **Set up API keys** (quick and free)
4. **Monitor status** in Data Management tab

**You're already getting real value from working APIs, and can easily add more real data sources!**

---

**🚀 Ready to get real data? Start with the Data Management tab and follow the setup guides!**