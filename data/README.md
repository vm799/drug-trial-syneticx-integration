# 📊 Data Directory

This directory contains sample data files for testing the Knowledge Graph construction system.

## 📁 Directory Structure

```
data/
├── samples/           # Sample data files for testing
│   ├── structured/    # JSON, CSV, XML files
│   ├── unstructured/  # TXT, MD, HTML files
│   └── mixed/         # Combined datasets
├── user-uploads/      # User-uploaded files (gitignored)
├── processed/         # Processed knowledge graphs (gitignored) 
└── schemas/           # Custom schema definitions
```

## 🔄 How to Add Your Data

### Option 1: Direct File Placement
Place your files in the appropriate subdirectory:
- **JSON/CSV/XML**: `data/samples/structured/`
- **Text/PDF/HTML**: `data/samples/unstructured/`
- **Mixed formats**: `data/samples/mixed/`

### Option 2: API Upload (Coming Soon)
```javascript
// Future file upload endpoint
POST /api/knowledge-graph/upload
Content-Type: multipart/form-data
```

### Option 3: Direct API Call
```javascript
POST /api/knowledge-graph/construct
{
  "documents": [
    {
      "type": "json",
      "content": "your-json-string-here",
      "metadata": {"title": "Your Data", "id": "custom1"}
    }
  ],
  "userQuery": {
    "query": "Build knowledge graph from my data",
    "primaryIntent": "knowledge_graph_construction"
  }
}
```

## 🧪 Testing Your Data

After placing files here, use:
```bash
# Test with your files
node test-knowledge-graph-custom.js

# Or use the API demo
curl -X POST http://localhost:3001/api/knowledge-graph/demo
```