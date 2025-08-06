# Research Companion API Backend

A comprehensive backend API for a research companion software where multiple users can signup, login, upload research papers, and search through them.

## 🚀 Features

### Core Features
1. **User Management**
   - User registration and authentication
   - JWT-based authentication
   - User profile management

2. **Research Paper Management**
   - Upload research papers (PDF files)
   - Extract and store metadata
   - Paper categorization and tagging

3. **Search & Discovery**
   - Full-text search across papers
   - Search by metadata (title, keywords, journal, etc.)
   - Advanced filtering options

4. **Paper Metadata**
   - Title, summary, abstract
   - Keywords (array of strings)
   - Paper link, journal name
   - Upload date, author information

## 📋 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Authentication APIs

### 1. User Registration
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "institution": "Stanford University",
  "researchInterests": ["AI", "Machine Learning"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "institution": "Stanford University",
      "researchInterests": ["AI", "Machine Learning"],
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 2. User Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt_token_here"
  }
}
```

### 3. Get User Profile
**GET** `/auth/profile`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "institution": "Stanford University",
      "researchInterests": ["AI", "Machine Learning"],
      "uploadedPapers": 15,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

## 📄 Research Paper APIs

### 1. Extract Metadata from PDF (Preview)
**POST** `/papers/metadatafromai`

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: PDF file (required)

**Description:** Extracts metadata from a PDF file using AI without saving to database. This endpoint can be used as a preview before uploading to see what metadata will be extracted.

**Response:**
```json
{
  "success": true,
  "message": "Metadata extracted successfully",
  "data": {
    "metadata": {
      "title": "Advanced Machine Learning Techniques",
      "detailed_summary": "A comprehensive study on ML techniques...",
      "abstract": "This paper presents novel approaches...",
      "keywords": ["Machine Learning", "AI", "Neural Networks"],
      "authors": ["John Doe", "Jane Smith"],
      "journalName": "Nature",
      "publication_date": "2023-01-15",
      "doi": "10.1038/s41586-023-00000-0",
      "gemini_analysis": {
        "research_area": "Machine Learning",
        "methodology": "The study employs...",
        "key_findings": ["Finding 1", "Finding 2"],
        "limitations": ["Limitation 1"],
        "research_impact": "Significant impact on...",
        "future_directions": ["Future work 1"]
      },
      "confidence_score": 0.95
    },
    "processing_info": {
      "file_size": 2048576,
      "pages_processed": 15,
      "extraction_method": "gemini_ai",
      "ai_processing_time": 2.5,
      "gemini_tokens_used": 1500
    },
    "file_info": {
      "originalName": "research_paper.pdf",
      "size": 2048576,
      "mimetype": "application/pdf"
    }
  }
}
```

### 2. Upload Research Paper
**POST** `/papers/upload`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>
```

**Form Data:**
- `file`: PDF file
- IMPORTANT: Metadata Need to be Generated from Microservice

**Response:**
```json
{
  "success": true,
  "message": "Paper uploaded successfully",
  "data": {
    "paper": {
      "_id": "paper_id",
      "title": "Advanced Machine Learning Techniques",
      "detailed_summary": "A comprehensive study on ML techniques",
      "abstract": "This paper presents...",
      "keywords": ["Machine Learning", "AI", "Neural Networks"],
      "paperLink": "https://example.com/paper.pdf",
      "journalName": "Nature",
      "authors": ["John Doe", "Jane Smith"],
      "publication_date": "2017-12-04",
      "gemini_analysis": {
            "research_area": "Natural Language Processing / Deep Learning",
            "methodology": "The paper introduces a novel neural network architecture, the Transformer, for sequence transduction tasks. This model eschews the recurrent and convolutional layers common in prior architectures, relying entirely on a self-attention mechanism. It employs an encoder-decoder structure where both components are built from stacks of multi-head self-attention layers and position-wise feed-forward networks. To incorporate sequence order, it introduces positional encodings added to the input embeddings.",
            "key_findings": [
                "The Transformer architecture, based solely on attention, can outperform state-of-the-art models that use recurrence or convolution on machine translation tasks.",
                "The model is significantly more parallelizable than recurrent models like RNNs, leading to a substantial reduction in training time.",
                "On the WMT 2014 English-to-German translation task, the Transformer achieved a new state-of-the-art BLEU score of 28.4, an improvement of over 2 BLEU.",
                "On the WMT 2014 English-to-French task, the model set a new single-model state-of-the-art BLEU score of 41.0.",
                "Multi-head attention is a key component that allows the model to jointly attend to information from different representation subspaces at different positions."
            ],
            "limitations": [
                "The model's self-attention mechanism has a computational complexity that is quadratic with respect to the input sequence length, which can be a bottleneck for extremely long sequences.",
                "The model has no inherent understanding of sequence order and relies entirely on the injection of positional encodings, a separate, non-integrated mechanism.",
                "The effectiveness of the model is dependent on a large amount of training data and significant computational resources (e.g., multiple GPUs), although less than prior SOTA models."
            ],
            "research_impact": "This paper is seminal, fundamentally shifting the paradigm in natural language processing and beyond. The Transformer architecture's effectiveness and parallelizability led to its widespread adoption, becoming the foundational building block for nearly all modern large-scale language models, including BERT, GPT, T5, and their successors. It effectively ended the dominance of recurrent neural networks in sequence modeling and catalyzed a new era of research into pre-training and large language models that has transformed the field of AI.",
            "future_directions": []
      },
      "uploadedBy": "user_id",
      "fileName": "paper_123.pdf",
      "fileSize": 2048576,
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 2. Get All Papers (with pagination)
**GET** `/papers?page=1&limit=10&sort=uploadedAt&order=desc`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `sort`: Sort field (uploadedAt, title, journalName)
- `order`: Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "papers": [
      {
        "_id": "paper_id",
        "title": "Advanced Machine Learning Techniques",
        "detailed_summary": "A comprehensive study on ML techniques",
        "keywords": ["Machine Learning", "AI"],
        "journalName": "Nature",
        "authors": ["John Doe"],
        "uploadedBy": {
          "_id": "user_id",
          "firstName": "John",
          "lastName": "Doe"
        },
        "uploadedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 3. Get Paper by ID
**GET** `/papers/:paperId`

**Response:**
```json
{
  "success": true,
  "data": {
    "paper": {
      "_id": "paper_id",
      "title": "Advanced Machine Learning Techniques",
      "detailed_summary": "A comprehensive study on ML techniques",
      "abstract": "This paper presents...",
      "keywords": ["Machine Learning", "AI", "Neural Networks"],
      "paperLink": "https://example.com/paper.pdf",
      "journalName": "Nature",
      "authors": ["John Doe", "Jane Smith"],
      "uploadedBy": {
        "_id": "user_id",
        "firstName": "John",
        "lastName": "Doe"
      },
      "fileName": "paper_123.pdf",
      "fileSize": 2048576,
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 4. Update Paper Metadata
**PUT** `/papers/:paperId`

**Request Body:**
```json
{
  "title": "Updated Title",
  "detailed_summary": "Updated summary",
  "abstract": "Updated abstract",
  "keywords": ["Updated", "Keywords"],
  "paperLink": "https://updated-link.com",
  "journalName": "Updated Journal",
  "authors": ["Updated Author"]
}
```

### 5. Delete Paper
**DELETE** `/papers/:paperId`

**Response:**
```json
{
  "success": true,
  "message": "Paper deleted successfully"
}
```

### 6. Download Paper
**GET** `/papers/:paperId/download`

**Response:** File download

---

## 🔍 Search APIs

### 1. Search Papers
**GET** `/search?q=machine learning&filters=keywords&page=1&limit=10`

**Query Parameters:**
- `q`: Search query
- `filters`: Search in specific fields (title, abstract, keywords, all)
- `page`: Page number
- `limit`: Items per page
- `sort`: Sort field
- `order`: Sort order

**Response:**
```json
{
  "success": true,
  "data": {
    "papers": [
      {
        "_id": "paper_id",
        "title": "Machine Learning Applications",
        "detailed_summary": "Study on ML applications",
        "keywords": ["Machine Learning", "AI"],
        "journalName": "Nature",
        "uploadedAt": "2024-01-15T10:30:00Z",
        "relevanceScore": 0.95
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "hasNext": true,
      "hasPrev": false
    },
    "searchStats": {
      "query": "machine learning",
      "totalResults": 25,
      "searchTime": 0.15
    }
  }
}
```

### 2. Advanced Search
**POST** `/search/advanced`

**Request Body:**
```json
{
  "query": "machine learning",
  "filters": {
    "keywords": ["AI", "Neural Networks"],
    "journalName": "Nature",
    "dateRange": {
      "start": "2023-01-01",
      "end": "2024-01-01"
    },
    "uploadedBy": "user_id"
  },
  "sortBy": "relevance",
  "page": 1,
  "limit": 10
}
```

### 3. Get Search Suggestions
**GET** `/search/suggestions?q=mach`

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "machine learning",
      "machine vision",
      "machine translation"
    ]
  }
}
```

---

## 📊 Analytics APIs

### 1. Get Upload Statistics
**GET** `/analytics/uploads`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPapers": 150,
    "totalUsers": 25,
    "papersThisMonth": 15,
    "topKeywords": [
      {"keyword": "Machine Learning", "count": 45},
      {"keyword": "AI", "count": 32}
    ],
    "topJournals": [
      {"journal": "Nature", "count": 20},
      {"journal": "Science", "count": 15}
    ]
  }
}
```

### 2. Get User Statistics
**GET** `/analytics/user/:userId`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe"
    },
    "stats": {
      "totalUploads": 15,
      "totalDownloads": 45,
      "favoriteKeywords": ["AI", "ML"],
      "uploadTrend": [
        {"month": "2024-01", "count": 5},
        {"month": "2024-02", "count": 3}
      ]
    }
  }
}
```

---

## 🗄️ Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required),
  lastName: String (required),
  institution: String,
  researchInterests: [String],
  role: String (default: "user"),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Paper Collection
```javascript
{
  _id: ObjectId,
  title: String (required),
  summary: String,
  abstract: String,
  keywords: [String],
  paperLink: String,
  journalName: String,
  authors: [String],
  uploadedBy: ObjectId (ref: User),
  fileName: String (required),
  filePath: String (required),
  fileSize: Number,
  mimeType: String,
  isPublic: Boolean (default: true),
  downloadCount: Number (default: 0),
  uploadedAt: Date,
  updatedAt: Date
}
```

### Search Index
```javascript
// Text index on paper collection
{
  title: "text",
  summary: "text", 
  abstract: "text",
  keywords: "text",
  journalName: "text",
  authors: "text"
}
```

---

## 🔄 API Flow

### User Registration Flow
1. User submits registration form
2. Validate email uniqueness
3. Hash password
4. Create user document
5. Generate JWT token
6. Return user data and token

### Paper Upload Flow
1. User uploads PDF file
2. Validate file type and size
3. Extract text content (optional)
4. Store file in cloud storage
5. Create paper document with metadata
6. Index for search
7. Return paper data

### Search Flow
1. User submits search query
2. Parse query and filters
3. Search MongoDB text index
4. Apply additional filters
5. Calculate relevance scores
6. Paginate results
7. Return formatted results

---

## 🛠️ Technical Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **File Storage**: AWS S3 / Local storage
- **Search**: MongoDB text search
- **Validation**: Joi / Express-validator
- **Documentation**: Swagger/OpenAPI

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── auth.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── paperController.js
│   │   └── searchController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   └── Paper.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── papers.js
│   │   └── search.js
│   ├── services/
│   │   ├── fileService.js
│   │   └── searchService.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── helpers.js
│   └── app.js
├── uploads/
├── tests/
├── package.json
└── README.md
```

---

## 🚀 Getting Started

1. Install dependencies
2. Set up MongoDB connection
3. Configure environment variables
4. Run migrations (if any)
5. Start the server

```bash
npm install
npm run dev
```

---

## 🔒 Security Considerations

- JWT token expiration
- Password hashing with bcrypt
- File upload validation
- Rate limiting
- Input sanitization
- CORS configuration
- Environment variable protection 