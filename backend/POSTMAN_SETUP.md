# Postman Collection Setup Guide

This guide will help you set up and use the Postman collection to test the Research Companion backend API.

## 📁 Files

- `Research_Companion_API.postman_collection.json` - The complete Postman collection
- `POSTMAN_SETUP.md` - This setup guide

## 🚀 Quick Start

### 1. Import the Collection

1. Open Postman
2. Click "Import" button
3. Select the `Research_Companion_API.postman_collection.json` file
4. The collection will be imported with all endpoints organized by category

### 2. Set Up Environment Variables

The collection uses the following variables:

- `baseUrl`: The base URL of your backend server (default: `http://localhost:3000`)
- `authToken`: JWT token for authenticated requests (will be set after login)
- `paperId`: ID of a specific paper for testing (will be set after uploading a paper)

### 3. Start Your Backend Server

Make sure your backend server is running:

```bash
cd backend
npm install
npm start
```

The server should be running on `http://localhost:3000` (or the port specified in your `.env` file).

## 📋 Testing Workflow

### Step 1: Health Check
Start by testing the health endpoint to ensure the server is running:
- **Health Check** → Should return a success response

### Step 2: Authentication
1. **Register User** → Create a new account
2. **Login User** → Get authentication token
3. Copy the token from the login response and set it as the `authToken` variable

### Step 3: Paper Management
1. **Upload Paper** → Upload a research paper (requires authentication)
2. Copy the paper ID from the response and set it as the `paperId` variable
3. **Get All Papers** → View all public papers
4. **Get User Papers** → View papers uploaded by the current user
5. **Get Paper by ID** → View a specific paper
6. **Update Paper** → Modify paper details
7. **Download Paper** → Download the paper file
8. **Delete Paper** → Remove a paper (optional)

### Step 4: Search Functionality
1. **Basic Search** → Search papers with simple queries
2. **Advanced Search** → Search with filters and date ranges
3. **Get Search Suggestions** → Get autocomplete suggestions
4. **Get Popular Keywords** → View trending keywords
5. **Get Search Stats** → View search statistics

### Step 5: Analytics
1. **Get Upload Stats** → View upload statistics
2. **Get User Stats** → View user-specific analytics
3. **Get System Health** → Check system health metrics
4. **Get Research Insights** → View research insights

## 🔧 Environment Setup

### Local Development
- `baseUrl`: `http://localhost:3000`
- `authToken`: (set after login)
- `paperId`: (set after uploading a paper)

### Production
- `baseUrl`: `https://your-production-domain.com`
- `authToken`: (set after login)
- `paperId`: (set after uploading a paper)

## 📝 Request Examples

### Authentication
```json
// Register
POST {{baseUrl}}/api/v1/auth/register
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "institution": "Stanford University",
  "researchInterests": ["Machine Learning", "Computer Vision"]
}

// Login
POST {{baseUrl}}/api/v1/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}
```

### Paper Upload
```
POST {{baseUrl}}/api/v1/papers/upload
Content-Type: multipart/form-data

file: [PDF file]
metadata: {
  "title": "Attention Is All You Need",
  "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
  "keywords": ["Transformer", "attention mechanism", "self-attention", "sequence transduction", "machine translation", "encoder-decoder"],
  "authors": ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones", "Aidan N. Gomez", "Łukasz Kaiser", "Illia Polosukhin"],
  "journalName": "Conference on Neural Information Processing Systems (NIPS 2017)",
  "publication_date": "2017",
  "detailed_summary": "This paper introduces the Transformer, a novel network architecture for sequence transduction tasks that completely eschews recurrence and convolutions, relying solely on attention mechanisms.",
  "paperLink": "https://arxiv.org/abs/1706.03762",
  "gemini_analysis": {
    "research_area": "Natural Language Processing and Deep Learning",
    "methodology": "Proposal and evaluation of a novel neural network architecture, the Transformer, which is based entirely on attention mechanisms.",
    "key_findings": [
      "The Transformer model achieves state-of-the-art results on machine translation tasks",
      "The architecture is significantly more parallelizable than recurrent models",
      "By relying solely on self-attention, the model can effectively learn long-range dependencies"
    ],
    "limitations": [
      "The paper does not explicitly state limitations of the proposed model",
      "The model architecture lacks any inherent understanding of sequence order"
    ],
    "research_impact": "This paper is foundational in modern NLP. The introduction of the Transformer architecture marked a paradigm shift away from recurrent models towards fully attention-based models.",
    "future_directions": []
  },
  "confidence_score": 0.95
}
```

**Note**: The `metadata` field is optional. If not provided, the system will use basic file information. For metadata extraction, use the separate endpoint: `POST /api/v1/papers/metadatafromai`

### Extract Metadata from AI
```
POST {{baseUrl}}/api/v1/papers/metadatafromai
Content-Type: multipart/form-data

file: [PDF file]
```

This endpoint extracts metadata including Gemini analysis from the PDF file. No authentication required.

### Search
```json
// Basic Search
GET {{baseUrl}}/api/v1/search?q=machine learning&page=1&limit=10

// Advanced Search
POST {{baseUrl}}/api/v1/search/advanced
{
  "query": "artificial intelligence",
  "filters": {
    "keywords": ["AI", "machine learning"],
    "journalName": "Nature",
    "dateRange": {
      "start": "2023-01-01T00:00:00.000Z",
      "end": "2024-01-01T00:00:00.000Z"
    }
  },
  "sortBy": "uploadedAt",
  "page": 1,
  "limit": 20
}
```

## 🔒 Authentication

Most endpoints require authentication. The collection uses Bearer token authentication:

```
Authorization: Bearer {{authToken}}
```

To get the token:
1. Register or login using the auth endpoints
2. Copy the `token` field from the response
3. Set it as the `authToken` variable in Postman

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## 🧪 Testing Tips

1. **Start with Health Check**: Always test the health endpoint first
2. **Follow the Workflow**: Use the endpoints in the order listed above
3. **Save Tokens**: After login, save the token for subsequent requests
4. **Test Error Cases**: Try invalid data to test error handling
5. **Check Response Codes**: Verify HTTP status codes (200, 201, 400, 401, 404, 500)
6. **File Upload**: Use actual PDF files for paper upload testing

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**: Make sure the backend server is running
2. **401 Unauthorized**: Check if the auth token is valid and set correctly
3. **404 Not Found**: Verify the endpoint URL is correct
4. **500 Internal Server Error**: Check server logs for detailed error information

### Debug Steps

1. Check if MongoDB is running and accessible
2. Verify environment variables are set correctly
3. Check server logs in the `logs/` directory
4. Ensure all required dependencies are installed

## 📚 Additional Resources

- Backend README: `README_BACKEND.md`
- Environment setup: `env.example`
- API Documentation: Check the route files in `src/routes/`

## 🔄 Collection Updates

To update the collection when new endpoints are added:

1. Export the current collection from Postman
2. Replace the `Research_Companion_API.postman_collection.json` file
3. Re-import the updated collection

---

Happy testing! 🚀 