# Research Companion Backend

A comprehensive Node.js/Express backend API for the Research Companion platform with microservices integration.

## 🚀 Features

### Core Features
- **User Management**: Registration, authentication, profile management
- **Paper Management**: Upload, CRUD operations, metadata extraction
- **Search & Discovery**: Full-text search, advanced filtering
- **Analytics**: Statistics, insights, system health monitoring
- **Microservices Integration**: Seamless integration with Python microservices

### Technical Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **File Upload**: Multer with Cloudinary integration
- **Cloud Storage**: Cloudinary for scalable file storage
- **Search**: MongoDB text search with weighted indexing
- **Validation**: Express-validator with Joi schemas
- **Logging**: Winston with file rotation
- **Security**: Helmet, CORS, rate limiting

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection & indexes
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── paperController.js    # Paper management
│   │   ├── searchController.js   # Search functionality
│   │   └── analyticsController.js # Analytics & insights
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── upload.js            # File upload handling
│   │   └── errorHandler.js      # Global error handling
│   ├── models/
│   │   ├── User.js              # User schema & methods
│   │   └── Paper.js             # Paper schema & methods
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── papers.js            # Paper routes
│   │   ├── search.js            # Search routes
│   │   └── analytics.js         # Analytics routes
│   ├── services/
│   │   └── microserviceClient.js # Python microservices integration
│   ├── utils/
│   │   └── logger.js            # Winston logger configuration
│   └── app.js                   # Main application file
├── uploads/                     # File upload directory (fallback)
├── logs/                        # Application logs
├── scripts/                     # Migration scripts
│   └── migrateToCloudinary.js   # Cloudinary migration script
├── package.json                 # Dependencies & scripts
├── CLOUDINARY_SETUP.md          # Cloudinary setup guide
├── env.example                  # Environment variables template
├── start.sh                     # Startup script
└── postman_collection.json      # API testing collection
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB 5+
- Python microservices running on port 5001

### Quick Start

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Run the startup script**
   ```bash
   ./start.sh
   ```

   Or manually:
   ```bash
   # Install dependencies
   npm install
   
   # Create environment file
   cp env.example .env
   
   # Create directories
   mkdir -p uploads logs
   
   # Start development server
   npm run dev
   ```

3. **Configure environment variables**
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/research_companion
   JWT_SECRET=your-super-secret-jwt-key
   PYTHON_SERVICE_URL=http://localhost:5001
   
   # Cloudinary Configuration (Optional - falls back to local storage)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/research_companion |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `PYTHON_SERVICE_URL` | Microservices URL | http://localhost:5001 |
| `MAX_FILE_SIZE` | Max upload size (bytes) | 10485760 (10MB) |
| `UPLOAD_DIR` | Upload directory | ./uploads |
| `TEMP_DIR` | Temporary files directory | ./temp |
| `LOG_LEVEL` | Logging level | info |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | (optional) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | (optional) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | (optional) |

### Database Setup

The application automatically:
- Connects to MongoDB
- Creates text search indexes
- Sets up collections with proper schemas

### Cloudinary Integration

The backend supports Cloudinary for scalable cloud storage:

- **Automatic Fallback**: If Cloudinary is not configured, falls back to local storage
- **File Processing**: Files are temporarily downloaded for metadata extraction
- **Direct Downloads**: Cloudinary files are served via secure URLs
- **Migration Support**: Script to migrate existing files to Cloudinary

For detailed setup instructions, see [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md).

### Microservices Integration

The backend integrates with Python microservices for:
- **PDF Metadata Extraction**: Automatic extraction of paper metadata
- **AI Analysis**: Gemini-powered research analysis
- **Text Processing**: Advanced text cleaning and processing

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Protected routes require Bearer token:
```
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update profile
- `PUT /auth/change-password` - Change password

#### Papers
- `POST /papers/upload` - Upload paper with optional metadata
- `POST /papers/metadatafromai` - Extract metadata from PDF using AI
- `GET /papers` - Get all papers (paginated)
- `GET /papers/:id` - Get specific paper
- `PUT /papers/:id` - Update paper metadata
- `DELETE /papers/:id` - Delete paper
- `GET /papers/:id/download` - Download paper file
- `GET /papers/user` - Get user's papers

#### Search
- `GET /search` - Basic search
- `POST /search/advanced` - Advanced search with filters
- `GET /search/suggestions` - Search suggestions
- `GET /search/keywords` - Popular keywords
- `GET /search/stats` - Search statistics

#### Analytics
- `GET /analytics/uploads` - Upload statistics
- `GET /analytics/user` - User statistics
- `GET /analytics/health` - System health
- `GET /analytics/insights` - Research insights

## 🔍 Search Features

### Text Search
- Full-text search across titles, abstracts, keywords
- Weighted scoring (title: 10x, keywords: 8x, summary: 6x)
- Relevance-based sorting

### Advanced Filtering
- Journal name filtering
- Author filtering
- Date range filtering
- Keyword-based filtering

### Search Suggestions
- Auto-complete from titles and keywords
- Real-time suggestions

## 📊 Analytics & Insights

### Upload Statistics
- Total papers and users
- Monthly upload trends
- Top keywords and journals

### User Analytics
- Personal upload statistics
- Download tracking
- Research interest analysis

### System Health
- Database connectivity
- Microservice health
- File system status

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Token expiration handling

### Input Validation
- Request validation with express-validator
- File type and size validation
- SQL injection prevention
- XSS protection

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Request size limits

## 🧪 Testing

### Postman Collection
Import `postman_collection.json` to test all endpoints:

1. **Health Check**: Verify API is running
2. **Register**: Create a new user account
3. **Login**: Get authentication token
4. **Upload Paper**: Test file upload with optional metadata
5. **Extract Metadata**: Test AI metadata extraction
5. **Search**: Test search functionality
6. **Analytics**: Check statistics and insights

### Manual Testing
```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"John","lastName":"Doe"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔄 Microservices Integration

### Python Service Communication
The backend communicates with Python microservices for:

1. **PDF Processing**
   - File upload to Node.js
   - Forward to Python service for metadata extraction
   - Store extracted metadata in MongoDB

2. **AI Analysis**
   - Send paper content to Python service
   - Receive AI-powered analysis results
   - Store analysis in paper document

### Error Handling
- Graceful degradation if microservices are unavailable
- Fallback to basic metadata extraction
- Comprehensive error logging

## 📈 Performance Features

### Database Optimization
- Text search indexes with weights
- Compound indexes for common queries
- Efficient pagination

### File Handling
- Stream-based file uploads
- Efficient file storage
- Automatic cleanup

### Caching Strategy
- Response compression
- Static file serving
- Database query optimization

## 🚨 Error Handling

### Global Error Handler
- MongoDB validation errors
- JWT authentication errors
- File system errors
- Network errors (microservices)

### Logging
- Winston logger with file rotation
- Error tracking with stack traces
- Request/response logging
- Performance monitoring

## 🔧 Development

### Scripts
```bash
npm run dev      # Start development server
npm start        # Start production server
npm test         # Run tests
npm run lint     # Lint code
```

### Debugging
- Detailed error messages in development
- Request/response logging
- Database query logging
- Microservice communication logging

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure secure JWT secret
- [ ] Set up MongoDB with authentication
- [ ] Configure file storage (S3 recommended)
- [ ] Set up logging with rotation
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL certificates
- [ ] Configure monitoring and alerts

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper validation and error handling
3. Include tests for new features
4. Update documentation
5. Follow security best practices

## 📝 License

MIT License - see LICENSE file for details

---

**Note**: This backend is designed to work seamlessly with the Python microservices. Ensure the microservices are running on the configured URL before testing the full functionality. 