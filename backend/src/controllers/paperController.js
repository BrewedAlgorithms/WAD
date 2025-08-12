const mongoose = require('mongoose');
const Paper = require('../models/Paper');
const User = require('../models/User');
const microserviceClient = require('../services/microserviceClient');
const CloudinaryService = require('../services/cloudinaryService');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// Upload paper with metadata extraction
const uploadPaper = async (req, res) => {
  try {
    const { fileInfo } = req;
    const { metadata } = req.body; // Get metadata from request body
    const userId = req.user._id;

    logger.info(`Starting paper upload: ${fileInfo.originalName} by user: ${userId} (source: ${fileInfo.source})`);

    // Parse metadata if it's a string (from multipart/form-data)
    let parsedMetadata = null;
    if (metadata) {
      try {
        parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
        logger.info('Metadata parsed successfully:', parsedMetadata);
      } catch (parseError) {
        logger.error('Failed to parse metadata:', parseError);
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_METADATA',
            message: 'Invalid metadata format. Please provide valid JSON.'
          }
        });
      }
    }

    // Use provided metadata or fallback to basic file info
    const paperMetadata = parsedMetadata || {
      title: fileInfo.originalName.replace('.pdf', ''),
      detailed_summary: '',
      abstract: '',
      keywords: [],
      authors: [],
      journalName: '',
      publication_date: null,
      gemini_analysis: null
    };

    // Create paper document
    const paperData = {
      title: paperMetadata.title || fileInfo.originalName.replace('.pdf', ''),
      detailed_summary: paperMetadata.detailed_summary || '',
      abstract: paperMetadata.abstract || '',
      keywords: paperMetadata.keywords || [],
      paperLink: paperMetadata.paperLink || (fileInfo.source === 'url' ? fileInfo.url : ''),
      journalName: paperMetadata.journalName || '',
      authors: paperMetadata.authors || [],
      publication_date: paperMetadata.publication_date ? new Date(paperMetadata.publication_date) : null,
      uploadedBy: userId,
      fileName: fileInfo.originalName,
      fileSize: fileInfo.size,
      mimeType: fileInfo.mimetype,
      gemini_analysis: paperMetadata.gemini_analysis || null,
      processing_info: {
        extraction_method: parsedMetadata ? 'manual' : 'none',
        confidence_score: paperMetadata.confidence_score || 0.95,
        source: fileInfo.source || 'file'
      }
    };

    // Add file path or Cloudinary info
    if (fileInfo.cloudinary) {
      paperData.cloudinary = fileInfo.cloudinary;
    } else {
      paperData.filePath = fileInfo.path;
    }

    // Add source URL if it's a URL-based upload
    if (fileInfo.source === 'url' && fileInfo.url) {
      paperData.sourceUrl = fileInfo.url;
    }

    const paper = new Paper(paperData);
    await paper.save();

    // Populate user info
    await paper.populate('uploadedBy', 'firstName lastName email');

    logger.info(`Paper uploaded successfully: ${paper._id}`);

    res.status(201).json({
      success: true,
      message: 'Paper uploaded successfully',
      data: {
        paper: paper.getPublicData()
      }
    });
  } catch (error) {
    logger.error('Paper upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload paper'
      }
    });
  }
};

// Get related papers by shared keywords/authors/journal
const getRelatedPapers = async (req, res) => {
  try {
    const { paperId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(paperId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid paper ID' }
      });
    }
    const basePaper = await Paper.findById(paperId);
    if (!basePaper) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAPER_NOT_FOUND', message: 'Paper not found' }
      });
    }

    const query = {
      _id: { $ne: basePaper._id },
      isPublic: true,
      $or: []
    };

    if (basePaper.keywords && basePaper.keywords.length > 0) {
      query.$or.push({ keywords: { $in: basePaper.keywords } });
    }
    if (basePaper.authors && basePaper.authors.length > 0) {
      query.$or.push({ authors: { $in: basePaper.authors } });
    }
    if (basePaper.journalName) {
      query.$or.push({ journalName: basePaper.journalName });
    }

    if (query.$or.length === 0) {
      query.$or.push({ title: { $regex: basePaper.title.split(' ').slice(0, 3).join('|'), $options: 'i' } });
    }

    const related = await Paper.find(query)
      .limit(10)
      .sort({ downloadCount: -1, createdAt: -1 })
      .populate('uploadedBy', 'firstName lastName');

    res.json({
      success: true,
      data: { papers: related.map(p => p.getPublicData()) }
    });
  } catch (error) {
    logger.error('Get related papers error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'RELATED_FAILED', message: 'Failed to get related papers' }
    });
  }
};

// Toggle favorite for current user
const toggleFavorite = async (req, res) => {
  try {
    const { paperId } = req.params;
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(paperId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid paper ID' } });
    }

    const paper = await Paper.findById(paperId).select('_id isPublic uploadedBy');
    if (!paper) {
      return res.status(404).json({ success: false, error: { code: 'PAPER_NOT_FOUND', message: 'Paper not found' } });
    }

    // Only allow favoriting public papers or own private ones
    if (!paper.isPublic && paper.uploadedBy.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'Cannot favorite this paper' } });
    }

    const user = await User.findById(userId).select('favorites');
    const already = user.favorites?.some(id => id.toString() === paperId);

    let updated;
    if (already) {
      updated = await User.findByIdAndUpdate(userId, { $pull: { favorites: paperId } }, { new: true }).select('favorites');
    } else {
      updated = await User.findByIdAndUpdate(userId, { $addToSet: { favorites: paperId } }, { new: true }).select('favorites');
    }

    res.json({
      success: true,
      data: { favorited: !already, favoritesCount: updated.favorites.length }
    });
  } catch (error) {
    logger.error('Toggle favorite error:', error);
    res.status(500).json({ success: false, error: { code: 'FAVORITE_FAILED', message: 'Failed to update favorites' } });
  }
};

// Get current user's favorite papers
const getFavoritePapers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: 'favorites',
      match: { $or: [{ isPublic: true }, { uploadedBy: userId }] },
      options: { sort: { createdAt: -1 }, limit: 50 },
      select: ''
    });

    const papers = (user.favorites || []).map((p) => p.getPublicData());
    res.json({ success: true, data: { papers } });
  } catch (error) {
    logger.error('Get favorites error:', error);
    res.status(500).json({ success: false, error: { code: 'FAVORITES_FAILED', message: 'Failed to fetch favorites' } });
  }
};

// Get all papers with pagination
const getAllPapers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'uploadedAt',
      order = 'desc',
      uploadedBy
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Max 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { isPublic: true };
    if (uploadedBy) {
      query.uploadedBy = uploadedBy;
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    // Execute query
    const papers = await Paper.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const totalItems = await Paper.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      success: true,
      data: {
        papers: papers.map(paper => paper.getPublicData()),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get papers error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch papers'
      }
    });
  }
};

// Get paper by ID
const getPaperById = async (req, res) => {
  try {
    const { paperId } = req.params;

    const paper = await Paper.findById(paperId)
      .populate('uploadedBy', 'firstName lastName email');

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    // Check if user can access this paper
    if (!paper.isPublic && paper.uploadedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this paper'
        }
      });
    }

    res.json({
      success: true,
      data: {
        paper: paper.getPublicData()
      }
    });
  } catch (error) {
    logger.error('Get paper error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch paper'
      }
    });
  }
};

// Update paper metadata
const updatePaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const updateData = req.body;

    const paper = await Paper.findById(paperId);

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    // Check if user owns this paper
    if (paper.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only update your own papers'
        }
      });
    }

    // Update paper
    const updatedPaper = await Paper.findByIdAndUpdate(
      paperId,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'firstName lastName email');

    logger.info(`Paper updated: ${paperId} by user: ${req.user._id}`);

    res.json({
      success: true,
      message: 'Paper updated successfully',
      data: {
        paper: updatedPaper.getPublicData()
      }
    });
  } catch (error) {
    logger.error('Update paper error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update paper'
      }
    });
  }
};

// Delete paper
const deletePaper = async (req, res) => {
  try {
    const { paperId } = req.params;

    const paper = await Paper.findById(paperId);

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    // Check if user owns this paper
    if (paper.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only delete your own papers'
        }
      });
    }

    // Delete file from storage
    try {
      if (paper.cloudinary && paper.cloudinary.public_id) {
        // Delete from Cloudinary
        await CloudinaryService.deleteFile(paper.cloudinary.public_id);
      } else if (paper.filePath && fs.existsSync(paper.filePath)) {
        // Delete local file
        fs.unlinkSync(paper.filePath);
      }
    } catch (fileError) {
      logger.warn('Failed to delete file:', fileError);
    }

    // Delete from database
    await Paper.findByIdAndDelete(paperId);

    logger.info(`Paper deleted: ${paperId} by user: ${req.user._id}`);

    res.json({
      success: true,
      message: 'Paper deleted successfully'
    });
  } catch (error) {
    logger.error('Delete paper error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete paper'
      }
    });
  }
};

// Download paper
const downloadPaper = async (req, res) => {
  try {
    const { paperId } = req.params;

    const paper = await Paper.findById(paperId);

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    // Increment download count
    await paper.incrementDownloadCount();

    if (paper.cloudinary && paper.cloudinary.secure_url) {
      // Redirect to Cloudinary URL for download
      logger.info(`Redirecting to Cloudinary URL for paper: ${paperId}`);
      res.redirect(paper.cloudinary.secure_url);
    } else if (paper.filePath && fs.existsSync(paper.filePath)) {
      // Stream local file
      res.setHeader('Content-Type', paper.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${paper.fileName}"`);
      res.setHeader('Content-Length', paper.fileSize);

      const fileStream = fs.createReadStream(paper.filePath);
      fileStream.pipe(res);
    } else {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found'
        }
      });
    }

    logger.info(`Paper downloaded: ${paperId} by user: ${req.user._id}`);
  } catch (error) {
    logger.error('Download paper error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DOWNLOAD_FAILED',
        message: 'Failed to download paper'
      }
    });
  }
};

// Get user's papers
const getUserPapers = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const papers = await Paper.findByUser(userId, { isPublic: true })
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalItems = await Paper.countDocuments({ 
      uploadedBy: userId, 
      isPublic: true 
    });
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      success: true,
      data: {
        papers: papers.map(paper => paper.getPublicData()),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get user papers error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch user papers'
      }
    });
  }
};

// Extract metadata from AI (separate endpoint)
const extractMetadataFromAI = async (req, res) => {
  try {
    const { fileInfo } = req;

    logger.info(`Starting metadata extraction: ${fileInfo.originalName}`);

    // Extract metadata using Python microservice
    let metadata;
    let processingInfo;
    
    try {
      // If file is in Cloudinary, download it temporarily for processing
      let filePathForProcessing = fileInfo.path;
      
      if (!filePathForProcessing && fileInfo.cloudinary) {
        // Download from Cloudinary to temp location for processing
        const tempDir = process.env.TEMP_DIR || './temp';
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFileName = `temp-${Date.now()}-${fileInfo.originalName}`;
        filePathForProcessing = path.join(tempDir, tempFileName);
        
        await CloudinaryService.downloadFile(
          fileInfo.cloudinary.public_id,
          filePathForProcessing
        );
      }

      const metadataResponse = await microserviceClient.extractMetadata(filePathForProcessing, true);
      metadata = metadataResponse.metadata;
      processingInfo = metadataResponse.processing_info;

      // Clean up temp file if it was created
      if (filePathForProcessing && filePathForProcessing !== fileInfo.path) {
        try {
          fs.unlinkSync(filePathForProcessing);
        } catch (cleanupError) {
          logger.warn('Failed to cleanup temp file:', cleanupError);
        }
      }
    } catch (error) {
      logger.error('Metadata extraction failed:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'METADATA_EXTRACTION_FAILED',
          message: 'Failed to extract metadata from PDF. Please try again.',
          details: error.message
        }
      });
    }

    logger.info(`Metadata extraction successful: ${fileInfo.originalName}`);

    res.status(200).json({
      success: true,
      message: 'Metadata extracted successfully',
      data: {
        metadata: {
          title: metadata.title || fileInfo.originalName.replace('.pdf', ''),
          detailed_summary: metadata.detailed_summary || '',
          abstract: metadata.abstract || '',
          keywords: metadata.keywords || [],
          authors: metadata.authors || [],
          journal: metadata.journal || { name: metadata.journalName || '' },
          publication_date: metadata.publication_date || null,
          doi: metadata.doi || null,
          gemini_analysis: metadata.gemini_analysis || null,
          confidence_score: metadata.confidence_score || 0.95
        },
        processing_info: processingInfo || {
          file_size: fileInfo.size,
          extraction_method: 'gemini_ai',
          ai_processing_time: null
        },
        file_info: {
          originalName: fileInfo.originalName,
          size: fileInfo.size,
          mimetype: fileInfo.mimetype
        }
      }
    });
  } catch (error) {
    logger.error('Metadata extraction error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXTRACTION_FAILED',
        message: 'Failed to extract metadata from PDF'
      }
    });
  }
};

// Extract metadata from URL
const extractMetadataFromUrl = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_URL_PROVIDED',
          message: 'No URL provided'
        }
      });
    }

    logger.info(`Starting URL-based metadata extraction: ${url}`);

    // Validate and download PDF from URL
    const axios = require('axios');
    const path = require('path');
    const fs = require('fs');
    
    // Validate URL
    const validatePdfUrl = async (url) => {
      try {
        const response = await axios.head(url, {
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: (status) => status < 400
        });
        
        const contentType = response.headers['content-type'];
        const contentLength = response.headers['content-length'];
        
        if (!contentType || !contentType.includes('application/pdf')) {
          throw new Error('URL does not point to a PDF file');
        }
        
        const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
        if (contentLength && parseInt(contentLength) > maxSize) {
          throw new Error(`PDF file size exceeds ${maxSize / (1024 * 1024)}MB limit`);
        }
        
        return true;
      } catch (error) {
        throw new Error('Invalid PDF URL or unable to access the file');
      }
    };

    // Download PDF from URL
    const downloadPdfFromUrl = async (url) => {
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          maxRedirects: 5,
          maxContentLength: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
        });
        
        const buffer = Buffer.from(response.data);
        const tempDir = process.env.TEMP_DIR || './temp';
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const filename = `temp-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
        const filePath = path.join(tempDir, filename);
        
        fs.writeFileSync(filePath, buffer);
        
        return {
          buffer,
          filename,
          filePath,
          size: buffer.length,
          mimetype: 'application/pdf'
        };
      } catch (error) {
        throw new Error('Failed to download PDF from URL');
      }
    };

    // Validate URL
    await validatePdfUrl(url);
    
    // Download PDF
    const downloadedFile = await downloadPdfFromUrl(url);

    // Extract metadata using Python microservice
    let metadata;
    let processingInfo;
    
    try {
      const metadataResponse = await microserviceClient.extractMetadata(downloadedFile.filePath, true);
      metadata = metadataResponse.metadata;
      processingInfo = metadataResponse.processing_info;

      // Clean up temp file
      try {
        fs.unlinkSync(downloadedFile.filePath);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp file:', cleanupError);
      }
    } catch (error) {
      logger.error('Metadata extraction failed:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'METADATA_EXTRACTION_FAILED',
          message: 'Failed to extract metadata from PDF. Please try again.',
          details: error.message
        }
      });
    }

    logger.info(`URL-based metadata extraction successful: ${url}`);

    res.status(200).json({
      success: true,
      message: 'Metadata extracted successfully from URL',
      data: {
        metadata: {
          title: metadata.title || 'Downloaded PDF',
          detailed_summary: metadata.detailed_summary || '',
          abstract: metadata.abstract || '',
          keywords: metadata.keywords || [],
          authors: metadata.authors || [],
          journal: metadata.journal || { name: metadata.journalName || '' },
          publication_date: metadata.publication_date || null,
          doi: metadata.doi || null,
          gemini_analysis: metadata.gemini_analysis || null,
          confidence_score: metadata.confidence_score || 0.95
        },
        processing_info: processingInfo || {
          file_size: downloadedFile.size,
          extraction_method: 'gemini_ai',
          ai_processing_time: null,
          source: 'url'
        },
        file_info: {
          originalName: downloadedFile.filename,
          size: downloadedFile.size,
          mimetype: downloadedFile.mimetype,
          sourceUrl: url
        }
      }
    });
  } catch (error) {
    logger.error('URL-based metadata extraction error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXTRACTION_FAILED',
        message: error.message || 'Failed to extract metadata from URL'
      }
    });
  }
};

module.exports = {
  uploadPaper,
  getAllPapers,
  getPaperById,
  updatePaper,
  deletePaper,
  downloadPaper,
  getUserPapers,
  extractMetadataFromAI,
  extractMetadataFromUrl,
  getRelatedPapers,
  toggleFavorite,
  getFavoritePapers
}; 