const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');
const CloudinaryService = require('../services/cloudinaryService');
const axios = require('axios');

// Ensure upload directory exists (for temporary storage)
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage - use memory storage for Cloudinary
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedMimeTypes = ['application/pdf'];
  const allowedExtensions = ['.pdf'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(fileExtension)) {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  
  // Check file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
  if (file.size > maxSize) {
    return cb(new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`), false);
  }
  
  cb(null, true);
};

// Create multer instance with fields support
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 1 // Only allow 1 file per request
  }
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'url', maxCount: 1 },
  { name: 'metadata', maxCount: 1 }
]);

// Utility function to validate PDF URL
const validatePdfUrl = async (url) => {
  try {
    const response = await axios.head(url, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status < 400
    });
    
    const contentType = response.headers['content-type'];
    const contentLength = response.headers['content-length'];
    
    // Check if it's a PDF
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error('URL does not point to a PDF file');
    }
    
    // Check file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new Error(`PDF file size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }
    
    return true;
  } catch (error) {
    logger.error('PDF URL validation failed:', error);
    throw new Error('Invalid PDF URL or unable to access the file');
  }
};

// Utility function to download PDF from URL
const downloadPdfFromUrl = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 5,
      maxContentLength: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
    });
    
    const buffer = Buffer.from(response.data);
    const filename = `downloaded-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
    const filePath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filePath, buffer);
    
    return {
      buffer,
      filename,
      filePath,
      size: buffer.length,
      mimetype: 'application/pdf'
    };
  } catch (error) {
    logger.error('PDF download failed:', error);
    throw new Error('Failed to download PDF from URL');
  }
};

// Wrapper middleware with error handling and Cloudinary upload
const uploadMiddleware = async (req, res, next) => {
  // Use the fields middleware to handle both file and URL uploads
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      logger.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: err.message
        }
      });
    } else if (err) {
      logger.error('File upload error:', err);
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_VALIDATION_ERROR',
          message: err.message
        }
      });
    }

    // Check if this is a URL-based upload
    let pdfUrl = null;
    let uploadedFile = null;
    
    // Check for URL in body
    if (req.body && req.body.url) {
      pdfUrl = req.body.url;
    }
    
    // Check for file upload
    if (req.files && req.files.file && req.files.file[0]) {
      uploadedFile = req.files.file[0];
    }
    
    // Log for debugging
    logger.info('Request body keys:', Object.keys(req.body || {}));
    logger.info('Files received:', req.files ? Object.keys(req.files) : 'none');
    logger.info('URL found:', pdfUrl);
    logger.info('File found:', uploadedFile ? uploadedFile.originalname : 'none');

    if (pdfUrl) {
      // Handle URL-based upload
      try {
        logger.info(`Processing PDF URL: ${pdfUrl}`);
        
        // Validate URL
        await validatePdfUrl(pdfUrl);
        
        // Download PDF
        const downloadedFile = await downloadPdfFromUrl(pdfUrl);
        
        // Create file info similar to multer
        req.fileInfo = {
          originalName: downloadedFile.filename,
          filename: downloadedFile.filename,
          path: downloadedFile.filePath,
          size: downloadedFile.size,
          mimetype: downloadedFile.mimetype,
          cloudinary: null,
          source: 'url',
          url: pdfUrl
        };
        
        // Always try to use Cloudinary first
        if (CloudinaryService.isConfigured()) {
          logger.info('Uploading downloaded PDF to Cloudinary');
          
          const cloudinaryResult = await CloudinaryService.uploadBuffer(
            downloadedFile.buffer,
            downloadedFile.filename
          );
          
          req.fileInfo.cloudinary = cloudinaryResult;
          req.fileInfo.path = null; // No local path for Cloudinary
        } else {
          logger.warn('Cloudinary not configured, using local storage for URL download');
        }
        
        next();
      } catch (error) {
        logger.error('URL processing error:', error);
        return res.status(400).json({
          success: false,
          error: {
            code: 'URL_PROCESSING_ERROR',
            message: error.message
          }
        });
      }
    } else if (uploadedFile) {
      // Handle file upload
      try {
        // Always try to use Cloudinary first
        if (CloudinaryService.isConfigured()) {
          // Upload to Cloudinary
          logger.info('Uploading file to Cloudinary');
          
          const cloudinaryResult = await CloudinaryService.uploadBuffer(
            uploadedFile.buffer,
            uploadedFile.originalname
          );
          
          req.fileInfo = {
            originalName: uploadedFile.originalname,
            filename: uploadedFile.originalname,
            path: null, // No local path for Cloudinary
            size: uploadedFile.size,
            mimetype: uploadedFile.mimetype,
            cloudinary: cloudinaryResult,
            source: 'file'
          };
        } else {
          logger.warn('Cloudinary not configured, falling back to local storage');
          
          // Fallback to local storage
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(uploadedFile.originalname);
          const name = path.basename(uploadedFile.originalname, ext);
          const filename = `${name}-${uniqueSuffix}${ext}`;
          const filePath = path.join(uploadDir, filename);
          
          // Write buffer to file
          fs.writeFileSync(filePath, uploadedFile.buffer);
          
          req.fileInfo = {
            originalName: uploadedFile.originalname,
            filename: filename,
            path: filePath,
            size: uploadedFile.size,
            mimetype: uploadedFile.mimetype,
            cloudinary: null,
            source: 'file'
          };
        }
        
        next();
      } catch (error) {
        logger.error('File processing error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'FILE_PROCESSING_ERROR',
            message: 'Failed to process uploaded file'
          }
        });
      }
    } else {
      // No file or URL provided
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_PROVIDED',
          message: 'No file or URL provided'
        }
      });
    }
  });
};

module.exports = { uploadMiddleware }; 