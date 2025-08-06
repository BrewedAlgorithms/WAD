# Python Microservices for Research Companion

This directory contains Python microservices that provide specialized processing capabilities for the Research Companion application. These services integrate with the Node.js backend and leverage **Google Gemini API** for advanced AI-powered operations like PDF metadata extraction, content analysis, and intelligent text processing.

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP/REST    ┌─────────────────────┐    Gemini API    ┌─────────────────┐
│   Node.js       │ ◄──────────────► │   Python            │ ◄──────────────► │   Google        │
│   Backend       │                 │   Microservices     │                 │   Gemini API    │
│                 │                 │                     │                 │                 │
│ - API Gateway   │                 │ - PDF Processing    │                 │ - Text Analysis │
│ - User Mgmt     │                 │ - Metadata Extract  │                 │ - Content Gen   │
│ - File Storage  │                 │ - Text Analysis     │                 │ - Summarization │
│ - Search        │                 │ - Content Analysis  │                 │ - Translation   │
└─────────────────┘                 └─────────────────────┘                 └─────────────────┘
```

## 🚀 Available Microservices

### Unified Platform (Recommended)
**Main Service**: `main.py`  
**Port**: `5001`  
**Endpoint**: `http://localhost:5001/`

**All services are now available through a unified interface:**

- **Content Summarizer**: `http://localhost:5001/content-summarizer/`
- **PDF Metadata Extraction**: `http://localhost:5001/pdf-metadata/`
- **Research Analyzer**: `http://localhost:5001/research-analyzer/`

**Quick Start (Unified Mode)**:
```bash
# Run all services on one port
python run_unified.py

# Or directly
python main.py
```

### Individual Services (Legacy Mode)

### 1. PDF Metadata Extraction Service (Gemini-Powered)
**Service**: `pdf_metadata_extract.py`  
**Port**: `5001`  
**Endpoint**: `http://localhost:5001/extract-metadata`

**Capabilities** (Enhanced with Gemini AI):
- Extract title, authors, abstract from PDF using AI analysis
- Intelligent keyword extraction and research area identification
- Advanced publication date and journal information extraction
- Smart parsing of references and citations with context
- Handle multiple PDF formats with improved accuracy
- **AI-powered content understanding** for better metadata extraction
- **Context-aware processing** for research papers, articles, reports

**API Endpoints**:
```http
POST /extract-metadata
Content-Type: multipart/form-data

Body:
- file: PDF file (binary)

Sample Response:
{
    "success": true,
    "metadata": {
        "title": "Attention Is All You Need",
        "authors": [
            {
                "name": "Ashish Vaswani",
                "affiliation": "Google Brain",
                "email": null
            },
            {
                "name": "Noam Shazeer",
                "affiliation": "Google Brain",
                "email": null
            },
            {
                "name": "Niki Parmar",
                "affiliation": "Google Research",
                "email": null
            },
            {
                "name": "Jakob Uszkoreit",
                "affiliation": "Google Research",
                "email": null
            },
            {
                "name": "Llion Jones",
                "affiliation": "Google Research",
                "email": null
            },
            {
                "name": "Aidan N. Gomez",
                "affiliation": "University of Toronto",
                "email": null
            },
            {
                "name": "Łukasz Kaiser",
                "affiliation": "Google Brain",
                "email": null
            },
            {
                "name": "Illia Polosukhin",
                "affiliation": "Google Research",
                "email": null
            }
        ],
        "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.0 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature.",
        "keywords": [
            "Transformer",
            "attention mechanism",
            "self-attention",
            "sequence transduction",
            "machine translation",
            "neural networks"
        ],
        "journal": {
            "name": "Conference on Neural Information Processing Systems (NIPS 2017)",
            "volume": null,
            "issue": null,
            "pages": null
        },
        "publication_date": "2017-12-04",
        "doi": null,
        "references": [],
        "confidence_score": 0.95,
        "ai_enhanced": true,
        "gemini_analysis": {
            "research_area": "Natural Language Processing (NLP), specifically sequence transduction and machine translation.",
            "methodology": "The paper proposes a novel network architecture, the Transformer, which eschews recurrence and convolutions. It is based entirely on a self-attention mechanism, specifically multi-head attention. The model uses an encoder-decoder structure composed of stacked self-attention and position-wise feed-forward layers. To account for the lack of recurrence, it injects 'positional encodings' to provide the model with information about the sequence order.",
            "key_findings": [
                "The proposed Transformer architecture outperforms previous state-of-the-art models, including ensembles, on WMT 2014 English-to-German and English-to-French translation tasks.",
                "The model is significantly more parallelizable and can be trained in a fraction of the time required by models based on recurrent or convolutional layers.",
                "It achieves a new single-model state-of-the-art BLEU score of 41.0 on the English-to-French task.",
                "The paper successfully demonstrates that a model relying solely on attention mechanisms can achieve superior performance in sequence transduction tasks, challenging the dominance of RNNs and LSTMs."
            ],
            "limitations": [
                "The model has no inherent understanding of sequence order and relies entirely on positional encodings injected into the input embeddings.",
                "The effectiveness of the model is primarily demonstrated on machine translation tasks, with its performance on other types of sequence-to-sequence problems not explored in the provided text.",
                "The self-attention mechanism has a computational complexity that is quadratic with respect to the sequence length, which can be a bottleneck for extremely long sequences (this is an inferred limitation, not explicitly stated in the text)."
            ],
            "research_impact": "This paper is foundational in modern NLP. The introduction of the Transformer architecture marked a paradigm shift away from recurrent models. Its parallelizable nature enabled the training of much larger and more powerful language models, leading directly to the development of subsequent influential models like BERT, GPT, and T5. The Transformer has become the de-facto standard architecture for a vast range of NLP tasks and beyond.",
            "future_directions": []
        }
    },
    "processing_info": {
        "file_size": 569417,
        "pages_processed": 1,
        "extraction_method": "hybrid_with_gemini",
        "ai_processing_time": null,
        "gemini_tokens_used": null
    }
}
```

### 2. Content Summarization Service (Gemini-Powered)
**Service**: `content_summarizer.py`  
**Port**: `5003`  
**Endpoint**: `http://localhost:5003/summarize`

**Capabilities**:
- **AI-powered abstractive text summarization** using Gemini
- Intelligent key findings extraction with context
- Research methodology identification and analysis
- **Multi-level summarization** (executive, technical, detailed)
- **Citation-aware summarization** that preserves important references
- **Domain-specific summarization** for different research fields

### 3. Research Analysis Service (Gemini-Powered)
**Service**: `research_analyzer.py`  
**Port**: `5004`  
**Endpoint**: `http://localhost:5004/analyze`

**Capabilities**:
- **AI-powered research trend analysis**
- **Intelligent paper recommendations** based on content
- **Cross-reference analysis** and citation network mapping
- **Research gap identification** using AI analysis
- **Collaborative author network analysis**

## 📁 Project Structure

```
microservices_python/
├── README.md
├── requirements.txt
├── main.py                    # Unified FastAPI application
├── run_unified.py            # Startup script for unified mode
├── config/
│   ├── __init__.py
│   ├── settings.py
│   └── logging.py
├── services/
│   ├── __init__.py
│   ├── pdf_metadata_extract.py
│   ├── content_summarizer.py
│   └── research_analyzer.py
├── utils/
│   ├── __init__.py
│   ├── pdf_utils.py
│   ├── text_utils.py
│   ├── gemini_client.py
│   └── validators.py
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

## 🛠️ Technical Stack

- **Framework**: FastAPI (Python)
- **AI/ML**: **Google Gemini API** (Primary AI engine)
- **PDF Processing**: PyPDF2, pdfplumber, pdf2doi
- **Text Processing**: spaCy, NLTK, **Gemini-powered analysis**
- **ML/AI**: **Gemini API integration**, scikit-learn, tensorflow/pytorch
- **Validation**: Pydantic
- **Testing**: pytest
- **Containerization**: Docker
- **AI Client**: **google-generativeai** (Gemini API client)

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
cd microservices_python
pip install -r requirements.txt
```

### 2. Environment Variables
Create `.env` file:
```env
# Service Configuration
SERVICE_PORT=5001
SERVICE_HOST=0.0.0.0
LOG_LEVEL=INFO

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro
GEMINI_MAX_TOKENS=8192
GEMINI_TEMPERATURE=0.1

# PDF Processing
MAX_FILE_SIZE=50MB
SUPPORTED_FORMATS=pdf
TEMP_DIR=/tmp/pdf_processing

# ML Models
SPACY_MODEL=en_core_web_sm
NLTK_DATA_PATH=/usr/local/share/nltk_data

# AI Processing
ENABLE_GEMINI_ANALYSIS=true
GEMINI_TIMEOUT=30
GEMINI_RETRY_ATTEMPTS=3
```

### 3. Gemini API Setup
1. **Get API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Set Environment Variable**: Add your API key to `.env` file
3. **Test Connection**: Run the test script to verify Gemini API access

```bash
# Test Gemini API connection
python utils/test_gemini_connection.py
```

### 4. Run Services

#### Unified Mode (Recommended)
```bash
# Run all services on one port
python run_unified.py

# Or directly
python main.py

# Using uvicorn
uvicorn main:app --host 0.0.0.0 --port 5001
```

#### Individual Services (Legacy Mode)
```bash
# Run PDF metadata extraction service
python services/pdf_metadata_extract.py

# Run content summarization service
python services/content_summarizer.py

# Run research analyzer service
python services/research_analyzer.py

# Or using uvicorn
uvicorn services.pdf_metadata_extract:app --host 0.0.0.0 --port 5001
uvicorn services.content_summarizer:app --host 0.0.0.0 --port 5003
uvicorn services.research_analyzer:app --host 0.0.0.0 --port 5004
```

### 5. Docker Setup
```bash
# Build and run with Docker
docker-compose up --build
```

## 🔗 Integration with Node.js Backend

### Node.js Integration Code
```javascript
// In your Node.js backend
const axios = require('axios');

class PDFService {
  constructor() {
    this.microserviceUrl = process.env.PYTHON_MICROSERVICE_URL || 'http://localhost:5001';
  }

  async extractMetadata(pdfBuffer) {
    try {
      const formData = new FormData();
      formData.append('file', pdfBuffer, {
        filename: 'document.pdf',
        contentType: 'application/pdf'
      });

      const response = await axios.post(
        `${this.microserviceUrl}/extract-metadata`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      return response.data;
    } catch (error) {
      console.error('PDF metadata extraction failed:', error);
      throw new Error('Failed to extract PDF metadata');
    }
  }
}
```

### Environment Variables for Node.js
Add to your Node.js `.env`:
```env
# Python Microservices
PYTHON_MICROSERVICE_URL=http://localhost:5001
PDF_PROCESSING_TIMEOUT=30000

# Gemini API (if needed in Node.js)
GEMINI_API_KEY=your_gemini_api_key_here
```

## 📊 API Documentation

### Unified Platform Endpoints

When running in unified mode, all services are available under different route prefixes:

#### Main Platform Endpoints
- **Root**: `GET /` - Platform information and service list
- **Health Check**: `GET /health` - Platform health status
- **Main Documentation**: `GET /docs` - Interactive API documentation

#### Service-Specific Endpoints

**Content Summarizer**:
- Base URL: `http://localhost:5001/content-summarizer/`
- Summarize: `POST /content-summarizer/summarize`
- Documentation: `http://localhost:5001/content-summarizer/docs`

**PDF Metadata Extraction**:
- Base URL: `http://localhost:5001/pdf-metadata/`
- Extract: `POST /pdf-metadata/extract-metadata`
- Documentation: `http://localhost:5001/pdf-metadata/docs`

**Research Analyzer**:
- Base URL: `http://localhost:5001/research-analyzer/`
- Analyze: `POST /research-analyzer/analyze`
- Documentation: `http://localhost:5001/research-analyzer/docs`

### Individual Service APIs

### PDF Metadata Extraction API (Gemini-Enhanced)

**Endpoint**: `POST /extract-metadata`

**Request**:
```http
POST /extract-metadata
Content-Type: multipart/form-data

Body:
- file: PDF file (required, max 50MB)
- enable_ai_analysis: boolean (optional, default: true)
- analysis_depth: string (optional, "basic" | "detailed" | "comprehensive")
```

**Response**:
```json
{
  "success": true,
  "metadata": {
    "title": "Advanced Machine Learning Techniques in Healthcare",
    "authors": [
      {
        "name": "John Doe",
        "affiliation": "Stanford University",
        "email": "john.doe@stanford.edu"
      },
      {
        "name": "Jane Smith",
        "affiliation": "MIT",
        "email": "jane.smith@mit.edu"
      }
    ],
    "abstract": "This paper presents novel machine learning techniques...",
    "keywords": [
      "Machine Learning",
      "Healthcare",
      "Deep Learning",
      "Medical Imaging"
    ],
    "journal": {
      "name": "Nature Medicine",
      "volume": "28",
      "issue": "3",
      "pages": "456-470"
    },
    "publication_date": "2024-01-15",
    "doi": "10.1038/s41591-024-01234-5",
    "references": [
      {
        "title": "Previous Research Paper",
        "authors": ["Author A", "Author B"],
        "year": 2023,
        "doi": "10.1000/example"
      }
    ],
    "confidence_score": 0.95,
    "processing_time": 2.3,
    "ai_enhanced": true,
    "gemini_analysis": {
      "research_area": "Healthcare AI",
      "methodology": "Deep Learning with Convolutional Neural Networks",
      "key_findings": [
        "Improved diagnostic accuracy by 23%",
        "Reduced false positive rate by 15%",
        "Novel attention mechanism for medical imaging"
      ],
      "limitations": [
        "Limited to specific medical imaging modalities",
        "Requires large annotated datasets",
        "Computational complexity may limit real-time deployment"
      ],
      "research_impact": "High - Potential for clinical deployment",
      "future_directions": [
        "Multi-modal data fusion",
        "Real-time processing optimization",
        "Clinical validation studies"
      ]
    }
  },
  "processing_info": {
    "file_size": 2048576,
    "pages_processed": 12,
    "extraction_method": "hybrid_with_gemini",
    "ai_processing_time": 1.8,
    "gemini_tokens_used": 2456
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "GEMINI_API_ERROR",
    "message": "Gemini API processing failed",
    "details": "Rate limit exceeded or API key invalid"
  }
}
```

### Content Summarization API (Gemini-Powered)

**Endpoint**: `POST /summarize`

**Request**:
```http
POST /summarize
Content-Type: application/json

{
  "text": "Research paper content...",
  "summary_type": "executive|technical|detailed",
  "max_length": 500,
  "include_citations": true
}
```

**Response**:
```json
{
  "success": true,
  "summary": {
    "executive_summary": "This research demonstrates...",
    "technical_summary": "The methodology employs...",
    "key_points": ["Point 1", "Point 2", "Point 3"],
    "citations": ["Author et al., 2023", "Previous work by..."],
    "confidence_score": 0.92,
    "processing_time": 1.5
  }
}
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
pytest tests/

# Run specific service tests
pytest tests/test_pdf_extract.py

# Run Gemini API tests
pytest tests/test_gemini_integration.py

# Run with coverage
pytest --cov=services tests/
```

### Test PDF Files
Place test PDF files in `tests/test_files/` directory.

## 📈 Performance Considerations

### Optimization Strategies
1. **Async Processing**: Handle large files asynchronously
2. **Gemini API Caching**: Cache AI analysis results
3. **Batch Processing**: Process multiple files in batches
4. **Resource Management**: Implement proper memory management
5. **Error Handling**: Graceful degradation for failed extractions
6. **AI Token Management**: Optimize Gemini API token usage
7. **Rate Limiting**: Respect Gemini API rate limits

### Monitoring
- Request/response times
- Memory usage
- Error rates
- Processing success rates
- **Gemini API usage and costs**
- **AI processing accuracy metrics**

## 🔒 Security Considerations

1. **File Validation**: Strict PDF validation
2. **Size Limits**: Configurable file size limits
3. **Input Sanitization**: Validate all inputs
4. **Rate Limiting**: Prevent abuse
5. **CORS Configuration**: Proper CORS setup
6. **Authentication**: Service-to-service authentication
7. **API Key Security**: Secure Gemini API key storage
8. **Data Privacy**: Ensure no sensitive data sent to external APIs

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -f docker/Dockerfile -t pdf-microservice .

# Run container
docker run -p 5001:5001 -e GEMINI_API_KEY=your_key pdf-microservice
```

### Docker Compose
```yaml
version: '3.8'
services:
  pdf-microservice:
    build: .
    ports:
      - "5001:5001"
    environment:
      - SERVICE_PORT=5001
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - ./uploads:/app/uploads
```

## 🔄 Development Workflow

1. **Local Development**: Run services locally for development
2. **Testing**: Comprehensive test suite including Gemini API tests
3. **Integration**: Test with Node.js backend
4. **Deployment**: Deploy to staging/production
5. **Monitoring**: Monitor performance, errors, and AI usage

## 📝 Future Enhancements

### Planned Services (Gemini-Powered)
1. **Advanced Text Analysis Service**: Sentiment analysis, topic modeling
2. **Research Trend Analysis**: AI-powered trend identification
3. **Citation Analysis**: Intelligent reference extraction and analysis
4. **Collaborative Filtering**: AI-powered paper recommendations
5. **Multi-language Research Support**: Process papers in different languages
6. **Real-time Research Updates**: WebSocket support for real-time AI analysis

### Advanced AI Features
1. **Custom Gemini Prompts**: Domain-specific prompts for different research areas
2. **Multi-modal Analysis**: Handle images, charts, and graphs in papers
3. **Research Quality Assessment**: AI-powered paper quality scoring
4. **Automated Literature Reviews**: Generate comprehensive literature reviews
5. **Research Gap Analysis**: Identify unexplored research areas
6. **Collaboration Network Analysis**: Map research collaboration patterns

## 🤝 Contributing

1. Follow Python coding standards (PEP 8)
2. Write comprehensive tests including AI integration tests
3. Update documentation
4. Use type hints
5. Follow semantic versioning
6. **Test Gemini API integration thoroughly**
7. **Monitor AI usage and costs**

## 📞 Support

For issues and questions:
- Create GitHub issues
- Check documentation
- Review test cases
- Monitor logs
- **Check Gemini API status and quotas** 