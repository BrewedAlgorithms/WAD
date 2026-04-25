#  — Research Companion

> **Your AI-Powered Research Paper Management Platform**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Python](https://img.shields.io/badge/Python-3.10+-yellow.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)

---

## What is Research Companion?

Research Companion is a sophisticated full-stack web application designed to revolutionize how researchers manage, analyze, and discover academic papers. Think of it as your personal research assistant that never sleeps — uploading papers gets you AI-powered metadata extraction, intelligent summaries, and deep research insights in seconds.

Built with a **microservices architecture**,  combines the best of Node.js, React, and Python to deliver a seamless, production-grade experience. Whether you're an individual researcher or part of a larger institution,  scales to meet your needs.

---

## Why Research Companion?

| Challenge | Research Companion's Solution |
|-----------|----------------|
| Manually extracting paper metadata is tedious | **AI-powered extraction** using Google Gemini — upload a PDF and get title, authors, abstract, keywords, and more in one click |
| Finding relevant papers across your collection is hard | **Full-text search** with MongoDB text indexes, advanced filters, and real-time suggestions |
| Understanding complex papers takes too long | **AI-generated summaries** at multiple levels — executive, technical, or detailed |
| Tracking research trends is overwhelming | **Research analyzer** identifies trends, key findings, limitations, and future directions |
| Managing uploads across devices is chaotic | **Centralized cloud storage** with Cloudinary integration — access your papers anywhere |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                               Architecture                               │
└────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │   Users     │
                                    │  (Browser)  │
                                    └──────┬──────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │    React Frontend       │
                              │    (Port 3001)         │
                              │    - Redux Toolkit     │
                              │    - Material-UI       │
                              │    - RTK Query         │
                              └────────────┬───────────┘
                                           │ HTTP/REST
                                           ▼
                              ┌────────────────────────┐
                              │   Node.js Backend      │
                              │   (Port 3003)          │
                              │    - Express.js        │
                              │    - JWT Auth          │
                              │    - MongoDB           │
                              └────────────┬───────────┘
                                           │
                          ┌────────────────┴────────────────┐
                          │                                 │
                          ▼                                 ▼
            ┌─────────────────────────┐     ┌─────────────────────────┐
            │   MongoDB Database       │     │   Python Microservices   │
            │   (Port 27017)          │     │   (Port 5001)            │
            │   - Users               │     │   - FastAPI              │
            │   - Papers              │     │   - Google Gemini API    │
            │   - Text Indexes        │     │   - PDF Processing       │
            └─────────────────────────┘     └─────────────────────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────────┐
                                          │   Google Gemini     │
                                          │   AI Platform       │
                                          └─────────────────────┘

Services:
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │  Frontend   │  │  Backend    │  │   Python    │  │   MongoDB   │
  │  localhost  │  │  localhost  │  │  localhost   │  │  localhost  │
  │   :3001     │  │   :3003     │  │    :5001    │  │   :27017    │
  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

---

## Features

### Authentication & User Management
- **JWT-based authentication** with secure password hashing (bcrypt)
- User registration with institution and research interests
- Profile management with session tracking
- Token expiration after 7 days

### Paper Management
- **Drag-and-drop PDF upload** with progress tracking
- **AI-powered metadata extraction** — extracts title, authors, abstract, keywords, journal info
- Paper categorization with custom tags
- Download tracking and sharing

### AI-Powered Analysis (Powered by Google Gemini)
- **Metadata Extraction** — Automatically extract comprehensive metadata from any research paper PDF
- **Content Summarization** — Multi-level summaries (executive, technical, detailed)
- **Research Analysis** — Identifies research area, methodology, key findings, limitations, impact
- **Cross-reference insights** — Understand paper relationships and citations

### Search & Discovery
- **Full-text search** across all paper fields
- **Advanced filters** — Filter by keywords, journal, date range, author
- **Real-time suggestions** as you type
- **Relevance scoring** for better results
- **Search history** and saved searches

### Analytics Dashboard
- Upload statistics and trends
- Top keywords and journals
- User activity metrics
- Research insights with interactive charts

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | Modern UI framework with type safety |
| Vite | Fast build tool and dev server |
| Redux Toolkit + RTK Query | State management and API caching |
| Material-UI (MUI) | Component library |
| React Router v6 | Client-side routing |
| React Hook Form + Yup | Form handling and validation |
| Recharts | Analytics charts |
| React Dropzone | File upload |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 18+ | JavaScript runtime |
| Express.js | REST API framework |
| MongoDB 6 + Mongoose | Database and ODM |
| JWT + bcrypt | Authentication |
| Multer | File upload handling |
| Joi | Request validation |

### Python Microservices
| Technology | Purpose |
|------------|---------|
| FastAPI | Async API framework |
| Google Gemini API | AI-powered processing |
| PyPDF2 / pdfplumber | PDF text extraction |
| Pydantic | Data validation |
| google-generativeai | Gemini API client |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker + Docker Compose | Containerization |
| Cloudinary | File storage |
| Nginx | Frontend proxy (Docker) |

---

## Getting Started

### Prerequisites

- **Docker** 24+ with Docker Compose v2
- **Node.js** 18+ (for local development)
- **Python** 3.10+ (for local microservices)
- **MongoDB** 6 (or Docker)

### Quick Start with Docker

The fastest way to get  running:

```bash
# 1. Clone the repository
cd 

# 2. Configure environment variables
# Edit these files:
#   - backend/.env
#   - microservices_python/.env

# 3. Start all services
docker compose up -d --build

# 4. Access the application
open http://localhost:3001
```

Services will be available at:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3003
- **Python Service**: http://localhost:5001
- **API Documentation**: http://localhost:5001/docs

### Local Development Setup

#### 1. MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name research_mongo mongo:6

# Or use the docker-compose service
docker compose up -d mongo
```

#### 2. Python Microservices

```bash
cd microservices_python

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# Run the service
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 5001 --reload
```

#### 3. Backend (Node.js)

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

#### 4. Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## Environment Configuration

### Backend (`backend/.env`)

```env
# Server
PORT=3003
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/research_companion

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Python Microservice
PYTHON_SERVICE_URL=http://localhost:5001

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

### Python Microservices (`microservices_python/.env`)

```env
# Service
SERVICE_PORT=5001
SERVICE_HOST=0.0.0.0
LOG_LEVEL=INFO

# Gemini API (Required for AI features)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.3
GEMINI_MAX_TOKENS=15000

# Processing
MAX_FILE_SIZE=10485760
```

---

## API Reference

### Base URL
```
http://localhost:3003/api/v1
```

### Authentication

All protected routes require a Bearer token:
```
Authorization: Bearer <jwt_token>
```

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "researcher@university.edu",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Doe",
  "institution": "MIT",
  "researchInterests": ["Machine Learning", "NLP"]
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "researcher@university.edu",
  "password": "securePassword123"
}
```

### Papers

#### Extract Metadata (Preview)
```http
POST /papers/metadatafromai
Content-Type: multipart/form-data

file: <PDF file>
```
*Returns AI-extracted metadata without saving to database. Use this to preview before uploading.*

#### Upload Paper
```http
POST /papers/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <PDF file>
```

#### Get All Papers
```http
GET /papers?page=1&limit=10&sort=uploadedAt&order=desc
```

#### Get Paper Details
```http
GET /papers/:paperId
```

#### Update Paper
```http
PUT /papers/:paperId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "keywords": ["AI", "Deep Learning"]
}
```

#### Delete Paper
```http
DELETE /papers/:paperId
Authorization: Bearer <token>
```

### Search

#### Basic Search
```http
GET /search?q=machine learning&filters=all&page=1&limit=10
```

#### Advanced Search
```http
POST /search/advanced
Content-Type: application/json

{
  "query": "transformer architecture",
  "filters": {
    "keywords": ["NLP", "Deep Learning"],
    "journalName": "NeurIPS",
    "dateRange": {
      "start": "2020-01-01",
      "end": "2024-12-31"
    }
  }
}
```

#### Search Suggestions
```http
GET /search/suggestions?q=neural
```

### Analytics

#### Upload Statistics
```http
GET /analytics/uploads
```

#### User Statistics
```http
GET /analytics/user/:userId
```

---

## Project Structure

```
/
├── docker-compose.yml           # Docker orchestration
├── DOCKER.md                    # Docker setup guide
├── README.md                    # This file
│
├── frontend/                    # React/TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Header, Sidebar, Footer, Loading
│   │   │   ├── forms/          # Login, Register, Upload forms
│   │   │   ├── layout/         # MainLayout, AuthLayout
│   │   │   ├── papers/         # PaperCard, PaperList, PaperDetail
│   │   │   ├── search/         # SearchBar, SearchFilters, Results
│   │   │   └── analytics/      # Charts, Stats, Insights
│   │   ├── pages/              # Route pages
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── dashboard/      # Dashboard, Profile
│   │   │   ├── papers/         # List, Detail, Upload
│   │   │   ├── search/         # Search, Advanced Search
│   │   │   └── analytics/     # Analytics Dashboard
│   │   ├── services/          # API integration layer
│   │   ├── store/              # Redux store and slices
│   │   ├── hooks/              # Custom React hooks
│   │   └── utils/             # Helpers, constants, theme
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── backend/                     # Node.js/Express API
│   ├── src/
│   │   ├── config/             # Database, auth config
│   │   ├── controllers/        # Route handlers
│   │   │   ├── authController.js
│   │   │   ├── paperController.js
│   │   │   ├── searchController.js
│   │   │   └── analyticsController.js
│   │   ├── middleware/         # Auth, upload, validation
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── User.js
│   │   │   └── Paper.js
│   │   ├── routes/             # API route definitions
│   │   ├── services/          # Business logic
│   │   │   ├── fileService.js
│   │   │   └── searchService.js
│   │   └── utils/              # Logger, helpers
│   ├── uploads/                # Uploaded files storage
│   ├── package.json
│   └── Dockerfile
│
└── microservices_python/        # Python AI services
    ├── main.py                 # Unified FastAPI application
    ├── run_unified.py          # Startup script
    ├── config/
    │   ├── settings.py
    │   └── logging.py
    ├── services/
    │   ├── pdf_metadata_extract.py   # PDF + Gemini extraction
    │   ├── content_summarizer.py      # AI summarization
    │   └── research_analyzer.py       # Research analysis
    ├── utils/
    │   ├── pdf_utils.py
    │   ├── gemini_client.py    # Gemini API integration
    │   └── validators.py
    ├── requirements.txt
    └── Dockerfile
```

---

## Docker Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| `mongo` | research_mongo | 27017 | MongoDB 6 database |
| `python` | research_python | 5001 | FastAPI + Gemini AI |
| `backend` | research_backend | 3003 | Express.js REST API |
| `frontend` | research_frontend | 3001 | React app (Nginx) |

### Useful Commands

```bash
# Start all services
docker compose up -d --build

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# Stop all services
docker compose down

# Rebuild a specific service
docker compose build backend && docker compose up -d backend

# Restart a service
docker compose restart python

# Shell into a container
docker exec -it research_backend sh

# Check container status
docker compose ps
```

---

## AI Capabilities (Gemini Integration)

 leverages **Google Gemini API** for advanced AI-powered features:

### 1. PDF Metadata Extraction
Upload any research paper PDF and get:
- Title, authors, affiliations
- Abstract and keywords
- Journal name, publication date, DOI
- Confidence score and processing info

### 2. Research Analysis
For each paper, Gemini provides:
- **Research Area** — Identified field and subfield
- **Methodology** — Techniques and approaches used
- **Key Findings** — Main contributions and results
- **Limitations** — Acknowledged constraints
- **Research Impact** — Significance and influence
- **Future Directions** — Potential next steps

### 3. Content Summarization
Generate multiple summary levels:
- **Executive Summary** — Quick overview for busy researchers
- **Technical Summary** — Methodological details
- **Detailed Summary** — Comprehensive breakdown

---

## Database Schema

### User Model
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

### Paper Model
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
  gemini_analysis: {
    research_area: String,
    methodology: String,
    key_findings: [String],
    limitations: [String],
    research_impact: String,
    future_directions: [String]
  },
  uploadedAt: Date,
  updatedAt: Date
}
```

---

## Security Features

- **JWT Authentication** with 7-day token expiration
- **bcrypt** password hashing with salt rounds
- **Input validation** using Joi/express-validator
- **File validation** — type and size checks
- **Rate limiting** on API endpoints
- **CORS configuration** for cross-origin safety
- **Environment variables** for secrets management
- **Cloudinary** for secure file storage

---

## Performance Optimizations

### Frontend
- Lazy loading and code splitting
- RTK Query caching
- Virtual scrolling for large lists
- Optimistic UI updates

### Backend
- MongoDB text indexes for fast search
- Pagination on all list endpoints
- Async processing for large files
- Connection pooling

### Python Services
- Async FastAPI endpoints
- Gemini API response caching
- Token optimization

---

## Monitoring & Health Checks

### Service Health Endpoints

```http
# Backend health
GET http://localhost:3003/health

# Python service health
GET http://localhost:5001/health

# API documentation
GET http://localhost:5001/docs
```

---

## Troubleshooting

### Common Issues

**Docker: Port already in use**
```bash
# Find and stop the process using the port
lsof -i :3001
kill -9 <PID>
```

**MongoDB connection refused**
```bash
# Ensure MongoDB is running
docker compose up -d mongo

# Check connection
docker compose logs mongo
```

**Gemini API errors**
```bash
# Verify API key is set correctly
cat microservices_python/.env | grep GEMINI_API_KEY

# Check API quota
# Visit: https://makersuite.google.com/app/apikey
```

**Frontend build fails**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style
- Frontend: ESLint + Prettier
- Backend: ESLint (Node.js standard)
- Python: PEP 8, type hints

### Testing
```bash
# Backend tests
cd backend && npm test

# Python tests
cd microservices_python && pytest tests/
```

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- **Google Gemini API** — For AI-powered research analysis
- **MongoDB** — For flexible document storage
- **Material-UI** — For beautiful UI components
- **FastAPI** — For high-performance Python APIs

---

<div align="center">

** — Research Companion**

*Empowering researchers with AI*

Built with passion for the research community

</div>