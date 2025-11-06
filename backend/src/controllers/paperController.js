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
  logger.info(`Upload paper request received for user ID: ${req.user._id}`, { fileInfo: req.fileInfo, body: req.body });
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
        logger.info('Metadata parsed successfully:', { parsedMetadata });
      } catch (parseError) {
        logger.error('Failed to parse metadata:', { parseError, metadata });
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
    logger.info('Constructing paper metadata');
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
    logger.info('Creating paper document in database');
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
    logger.info(`Paper document created with ID: ${paper._id}`);

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
    logger.error('Paper upload error:', { error, userId: req.user?._id, fileInfo: req.fileInfo });
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
  logger.info(`Get related papers request for paper ID: ${req.params.paperId}`);
  try {
    const { paperId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(paperId)) {
      logger.warn(`Invalid paper ID provided for related papers: ${paperId}`);
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid paper ID' }
      });
    }
    const basePaper = await Paper.findById(paperId);
    if (!basePaper) {
      logger.warn(`Base paper not found for related papers search: ${paperId}`);
      return res.status(404).json({
        success: false,
        error: { code: 'PAPER_NOT_FOUND', message: 'Paper not found' }
      });
    }

    logger.info(`Building query for related papers to: ${paperId}`);
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
      logger.info('No keywords, authors, or journal to relate by. Using title words.');
      query.$or.push({ title: { $regex: basePaper.title.split(' ').slice(0, 3).join('|'), $options: 'i' } });
    }

    const related = await Paper.find(query)
      .limit(10)
      .sort({ downloadCount: -1, createdAt: -1 })
      .populate('uploadedBy', 'firstName lastName');

    logger.info(`Found ${related.length} related papers for paper ID: ${paperId}`);
    res.json({
      success: true,
      data: { papers: related.map(p => p.getPublicData()) }
    });
  } catch (error) {
    logger.error('Get related papers error:', { error, paperId: req.params.paperId });
    res.status(500).json({
      success: false,
      error: { code: 'RELATED_FAILED', message: 'Failed to get related papers' }
    });
  }
};

// Toggle favorite for current user
const toggleFavorite = async (req, res) => {
  logger.info(`Toggle favorite request for paper ID: ${req.params.paperId} by user ID: ${req.user._id}`);
  try {
    const { paperId } = req.params;
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(paperId)) {
      logger.warn(`Invalid paper ID for toggle favorite: ${paperId}`);
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid paper ID' } });
    }

    const paper = await Paper.findById(paperId).select('_id isPublic uploadedBy');
    if (!paper) {
      logger.warn(`Paper not found for toggle favorite: ${paperId}`);
      return res.status(404).json({ success: false, error: { code: 'PAPER_NOT_FOUND', message: 'Paper not found' } });
    }

    // Only allow favoriting public papers or own private ones
    if (!paper.isPublic && paper.uploadedBy.toString() !== userId.toString()) {
      logger.warn(`Access denied to favorite paper: ${paperId} by user: ${userId}`);
      return res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'Cannot favorite this paper' } });
    }

    const user = await User.findById(userId).select('favorites');
    const already = user.favorites?.some(id => id.toString() === paperId);
    logger.info(`Paper ${paperId} is currently ${already ? 'favorited' : 'not favorited'} by user ${userId}. Toggling.`);

    let updated;
    if (already) {
      updated = await User.findByIdAndUpdate(userId, { $pull: { favorites: paperId } }, { new: true }).select('favorites');
    } else {
      updated = await User.findByIdAndUpdate(userId, { $addToSet: { favorites: paperId } }, { new: true }).select('favorites');
    }

    logger.info(`Favorite status updated for paper ${paperId} by user ${userId}. New favorite status: ${!already}`);
    res.json({
      success: true,
      data: { favorited: !already, favoritesCount: updated.favorites.length }
    });
  } catch (error) {
    logger.error('Toggle favorite error:', { error, paperId: req.params.paperId, userId: req.user._id });
    res.status(500).json({ success: false, error: { code: 'FAVORITE_FAILED', message: 'Failed to update favorites' } });
  }
};

// Get current user's favorite papers
const getFavoritePapers = async (req, res) => {
  logger.info(`Get favorite papers request for user ID: ${req.user._id}`);
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: 'favorites',
      match: { $or: [{ isPublic: true }, { uploadedBy: userId }] },
      options: { sort: { createdAt: -1 }, limit: 50 },
      select: ''
    });

    const papers = (user.favorites || []).map((p) => p.getPublicData());
    logger.info(`Found ${papers.length} favorite papers for user ID: ${userId}`);
    res.json({ success: true, data: { papers } });
  } catch (error) {
    logger.error('Get favorites error:', { error, userId: req.user._id });
    res.status(500).json({ success: false, error: { code: 'FAVORITES_FAILED', message: 'Failed to fetch favorites' } });
  }
};

// Get all papers with pagination
const getAllPapers = async (req, res) => {
  logger.info('Get all papers request', { query: req.query });
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
    logger.info('Building query for all papers');
    const query = { isPublic: true };
    if (uploadedBy) {
      query.uploadedBy = uploadedBy;
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;
    logger.info('Executing query for all papers with pagination', { query, sortOptions, limit: limitNum, skip });

    // Execute query
    const papers = await Paper.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const totalItems = await Paper.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);
    logger.info(`Found ${papers.length} papers out of ${totalItems} total.`);

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
    logger.error('Get papers error:', { error, query: req.query });
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
  logger.info(`Get paper by ID request for paper ID: ${req.params.paperId}`);
  try {
    const { paperId } = req.params;

    const paper = await Paper.findById(paperId)
      .populate('uploadedBy', 'firstName lastName email');

    if (!paper) {
      logger.warn(`Paper not found by ID: ${paperId}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    // Check if user can access this paper
    logger.info(`Checking access for paper ID: ${paperId} for user ID: ${req.user._id}`);
    if (!paper.isPublic && paper.uploadedBy._id.toString() !== req.user._id.toString()) {
      logger.warn(`Access denied for paper ID: ${paperId} for user ID: ${req.user._id}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this paper'
        }
      });
    }

    logger.info(`Paper retrieved successfully: ${paperId}`);
    res.json({
      success: true,
      data: {
        paper: paper.getPublicData()
      }
    });
  } catch (error) {
    logger.error('Get paper error:', { error, paperId: req.params.paperId });
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
  logger.info(`Update paper request for paper ID: ${req.params.paperId} by user ID: ${req.user._id}`, { body: req.body });
  try {
    const { paperId } = req.params;
    const updateData = req.body;

    const paper = await Paper.findById(paperId);

    if (!paper) {
      logger.warn(`Paper not found for update: ${paperId}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    // Check if user owns this paper
    logger.info(`Checking ownership for paper ID: ${paperId} by user ID: ${req.user._id}`);
    if (paper.uploadedBy.toString() !== req.user._id.toString()) {
      logger.warn(`Access denied to update paper ID: ${paperId} by user ID: ${req.user._id}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only update your own papers'
        }
      });
    }

    // Update paper
    logger.info(`Updating paper ID: ${paperId}`);
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
    logger.error('Update paper error:', { error, paperId: req.params.paperId, body: req.body, userId: req.user._id });
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
  logger.info(`Delete paper request for paper ID: ${req.params.paperId} by user ID: ${req.user._id}`);
  try {
    const { paperId } = req.params;

    const paper = await Paper.findById(paperId);

    if (!paper) {
      logger.warn(`Paper not found for deletion: ${paperId}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    // Check if user owns this paper
    logger.info(`Checking ownership for deletion of paper ID: ${paperId} by user ID: ${req.user._id}`);
    if (paper.uploadedBy.toString() !== req.user._id.toString()) {
      logger.warn(`Access denied for deletion of paper ID: ${paperId} by user ID: ${req.user._id}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only delete your own papers'
        }
      });
    }

    // Delete file from storage
    logger.info(`Deleting associated file for paper ID: ${paperId}`);
    try {
      if (paper.cloudinary && paper.cloudinary.public_id) {
        // Delete from Cloudinary
        logger.info(`Deleting from Cloudinary: ${paper.cloudinary.public_id}`);
        await CloudinaryService.deleteFile(paper.cloudinary.public_id);
      } else if (paper.filePath && fs.existsSync(paper.filePath)) {
        // Delete local file
        logger.info(`Deleting local file: ${paper.filePath}`);
        fs.unlinkSync(paper.filePath);
      }
    } catch (fileError) {
      logger.warn('Failed to delete file:', { fileError, paperId });
    }

    // Delete from database
    logger.info(`Deleting paper document from database: ${paperId}`);
    await Paper.findByIdAndDelete(paperId);

    logger.info(`Paper deleted: ${paperId} by user: ${req.user._id}`);

    res.json({
      success: true,
      message: 'Paper deleted successfully'
    });
  } catch (error) {
    logger.error('Delete paper error:', { error, paperId: req.params.paperId, userId: req.user._id });
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
  logger.info(`Download paper request for paper ID: ${req.params.paperId}`);
  try {
    const { paperId } = req.params;

    const paper = await Paper.findById(paperId);

    if (!paper) {
      logger.warn(`Paper not found for download: ${paperId}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    // Increment download count
    logger.info(`Incrementing download count for paper: ${paperId}`);
    await paper.incrementDownloadCount();

    if (paper.cloudinary && paper.cloudinary.secure_url) {
      // Redirect to Cloudinary URL for download
      logger.info(`Redirecting to Cloudinary URL for paper: ${paperId}`);
      res.redirect(paper.cloudinary.secure_url);
    } else if (paper.filePath && fs.existsSync(paper.filePath)) {
      // Stream local file
      logger.info(`Streaming local file for paper: ${paperId}`);
      res.setHeader('Content-Type', paper.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${paper.fileName}"`);
      res.setHeader('Content-Length', paper.fileSize);

      const fileStream = fs.createReadStream(paper.filePath);
      fileStream.pipe(res);
    } else {
      logger.warn(`File not found for paper: ${paperId}`);
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
    logger.error('Download paper error:', { error, paperId: req.params.paperId, userId: req.user?._id });
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
  logger.info(`Get user papers request for user ID: ${req.params.userId || req.user._id}`, { query: req.query });
  try {
    const userId = req.params.userId || req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    logger.info(`Querying papers for user ID: ${userId}`, { limit: limitNum, skip });
    const papers = await Paper.findByUser(userId, { isPublic: true })
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalItems = await Paper.countDocuments({ 
      uploadedBy: userId, 
      isPublic: true 
    });
    const totalPages = Math.ceil(totalItems / limitNum);
    logger.info(`Found ${papers.length} papers for user ID: ${userId} out of ${totalItems} total.`);

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
    logger.error('Get user papers error:', { error, userId: req.params.userId || req.user._id, query: req.query });
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
  logger.info(`Extract metadata from AI request received`, { fileInfo: req.fileInfo });
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
        logger.info(`File is on Cloudinary, downloading temporarily for processing: ${fileInfo.cloudinary.public_id}`);
        // Download from Cloudinary to temp location for processing
        const tempDir = process.env.TEMP_DIR || './temp';
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFileName = `temp-${Date.now()}-${fileInfo.originalName}`;
        filePathForProcessing = path.join(tempDir, tempFileName);
        
        logger.info(`Downloading to temp path: ${filePathForProcessing}`);
        await CloudinaryService.downloadFile(
          fileInfo.cloudinary.public_id,
          filePathForProcessing
        );
      }

      logger.info(`Calling metadata extraction microservice for file: ${filePathForProcessing}`);
      const metadataResponse = await microserviceClient.extractMetadata(filePathForProcessing, true);
      metadata = metadataResponse.metadata;
      processingInfo = metadataResponse.processing_info;
      logger.info('Metadata extraction microservice call successful.');

      // Clean up temp file if it was created
      if (filePathForProcessing && filePathForProcessing !== fileInfo.path) {
        try {
          logger.info(`Cleaning up temporary file: ${filePathForProcessing}`);
          fs.unlinkSync(filePathForProcessing);
        } catch (cleanupError) {
          logger.warn('Failed to cleanup temp file:', cleanupError);
        }
      }
    } catch (error) {
      logger.error('Metadata extraction microservice failed:', { error, fileInfo });
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
    logger.error('Metadata extraction error:', { error, fileInfo: req.fileInfo });
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
  logger.info('Extract metadata from URL request received', { body: req.body });
  try {
    const { url } = req.body;
    
    if (!url) {
      logger.warn('No URL provided in extract metadata from URL request');
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
        logger.info(`Validating PDF URL: ${url}`);
        const response = await axios.head(url, {
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: (status) => status < 400
        });
        
        const contentType = response.headers['content-type'];
        const contentLength = response.headers['content-length'];
        logger.info('URL validation headers:', { contentType, contentLength });
        
        if (!contentType || !contentType.includes('application/pdf')) {
          throw new Error('URL does not point to a PDF file');
        }
        
        const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
        if (contentLength && parseInt(contentLength) > maxSize) {
          throw new Error(`PDF file size exceeds ${maxSize / (1024 * 1024)}MB limit`);
        }
        
        logger.info('PDF URL validation successful');
        return true;
      } catch (error) {
        logger.error('PDF URL validation failed', { error, url });
        throw new Error('Invalid PDF URL or unable to access the file');
      }
    };

    // Download PDF from URL
    const downloadPdfFromUrl = async (url) => {
      try {
        logger.info(`Downloading PDF from URL: ${url}`);
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          maxRedirects: 5,
          maxContentLength: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
        });
        
        const buffer = Buffer.from(response.data);
        logger.info(`Downloaded ${buffer.length} bytes from ${url}`);
        const tempDir = process.env.TEMP_DIR || './temp';
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const filename = `temp-${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
        const filePath = path.join(tempDir, filename);
        
        fs.writeFileSync(filePath, buffer);
        logger.info(`PDF saved to temporary file: ${filePath}`);
        
        return {
          buffer,
          filename,
          filePath,
          size: buffer.length,
          mimetype: 'application/pdf'
        };
      } catch (error) {
        logger.error('Failed to download PDF from URL', { error, url });
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
      logger.info(`Calling metadata extraction microservice for downloaded file: ${downloadedFile.filePath}`);
      const metadataResponse = await microserviceClient.extractMetadata(downloadedFile.filePath, true);
      metadata = metadataResponse.metadata;
      processingInfo = metadataResponse.processing_info;
      logger.info('Metadata extraction from downloaded file successful.');

      // Clean up temp file
      try {
        logger.info(`Cleaning up temporary downloaded file: ${downloadedFile.filePath}`);
        fs.unlinkSync(downloadedFile.filePath);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp file:', cleanupError);
      }
    } catch (error) {
      logger.error('Metadata extraction failed for URL-downloaded file', { error, url, downloadedFile });
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
    logger.error('URL-based metadata extraction error:', { error, url: req.body.url });
    res.status(500).json({
      success: false,
      error: {
        code: 'EXTRACTION_FAILED',
        message: error.message || 'Failed to extract metadata from URL'
      }
    });
  }
};

// Analyze paper with Gorard Sieve
const analyzeGorardSieve = async (req, res) => {
  logger.info(`Gorard Sieve analysis request for paper ID: ${req.params.paperId} by user ID: ${req.user._id}`);
  try {
    const { paperId } = req.params;

    const paper = await Paper.findById(paperId);

    if (!paper) {
      logger.warn(`Paper not found for Gorard Sieve analysis: ${paperId}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAPER_NOT_FOUND',
          message: 'Paper not found'
        }
      });
    }

    // Check if user owns this paper
    logger.info(`Checking ownership for Gorard Sieve analysis of paper ID: ${paperId} by user ID: ${req.user._id}`);
    if (paper.uploadedBy.toString() !== req.user._id.toString()) {
      logger.warn(`Access denied for Gorard Sieve analysis of paper ID: ${paperId} by user ID: ${req.user._id}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only analyze your own papers'
        }
      });
    }

    logger.info(`Starting Gorard Sieve analysis for paper: ${paperId}`);

    // Get file path for processing
    let filePathForProcessing = paper.filePath;
    
    // If file is in Cloudinary, download it temporarily
    if (!filePathForProcessing && paper.cloudinary) {
      logger.info(`File for Gorard Sieve analysis is on Cloudinary, downloading temporarily: ${paper.cloudinary.public_id}`);
      const tempDir = process.env.TEMP_DIR || './temp';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFileName = `temp-${Date.now()}-${paper.fileName}`;
      filePathForProcessing = path.join(tempDir, tempFileName);
      
      logger.info(`Downloading to temp path for analysis: ${filePathForProcessing}`);
      await CloudinaryService.downloadFile(
        paper.cloudinary.public_id,
        filePathForProcessing
      );
    }

    // Validate that a file path exists for processing
    if (!filePathForProcessing) {
      logger.error(`File path not available for Gorard Sieve analysis of paper: ${paperId}`);
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_NOT_AVAILABLE',
          message: 'The paper file is not available for analysis. It may not have been uploaded correctly.'
        }
      });
    }

    // Perform Gorard Sieve analysis
    let analysisResult;
    try {
      logger.info(`Calling Gorard Sieve analysis microservice for file: ${filePathForProcessing}`);
      analysisResult = await microserviceClient.analyzeGorardSieve(filePathForProcessing);
      logger.info('Gorard Sieve analysis microservice call successful');
    } catch (error) {
      logger.error('Gorard Sieve analysis microservice failed:', { error, paperId });
      
      // Clean up temp file if it was created
      if (filePathForProcessing && filePathForProcessing !== paper.filePath) {
        try {
          logger.info(`Cleaning up temporary file after failed analysis: ${filePathForProcessing}`);
          fs.unlinkSync(filePathForProcessing);
        } catch (cleanupError) {
          logger.warn('Failed to cleanup temp file:', cleanupError);
        }
      }
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'GORARD_ANALYSIS_FAILED',
          message: 'Failed to analyze paper with Gorard Sieve. Please try again.',
          details: error.message
        }
      });
    }

    // Clean up temp file if it was created
    if (filePathForProcessing && filePathForProcessing !== paper.filePath) {
      try {
        logger.info(`Cleaning up temporary file after successful analysis: ${filePathForProcessing}`);
        fs.unlinkSync(filePathForProcessing);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp file:', cleanupError);
      }
    }

    // Update paper with Gorard Sieve results
    logger.info(`Updating paper ${paperId} with Gorard Sieve results`);
    const gorardRating = analysisResult.gorard_sieve_rating;
    
    paper.gorard_sieve_rating = {
      design: {
        score: gorardRating.design.score,
        reasoning: gorardRating.design.reasoning
      },
      scale: {
        score: gorardRating.scale.score,
        reasoning: gorardRating.scale.reasoning
      },
      completeness_of_data: {
        score: gorardRating.completeness_of_data.score,
        reasoning: gorardRating.completeness_of_data.reasoning
      },
      data_quality: {
        score: gorardRating.data_quality.score,
        reasoning: gorardRating.data_quality.reasoning
      },
      fidelity: {
        score: gorardRating.fidelity.score,
        reasoning: gorardRating.fidelity.reasoning
      },
      validity: {
        score: gorardRating.validity.score,
        reasoning: gorardRating.validity.reasoning
      },
      overall_rating: gorardRating.overall_rating,
      analysis_date: new Date()
    };

    await paper.save();
    logger.info(`Paper ${paperId} saved with new Gorard Sieve rating.`);

    logger.info(`Gorard Sieve analysis completed for paper: ${paperId}. Overall rating: ${gorardRating.overall_rating}/4`);

    res.json({
      success: true,
      message: 'Gorard Sieve analysis completed successfully',
      data: {
        gorard_sieve_rating: paper.gorard_sieve_rating
      }
    });
  } catch (error) {
    logger.error('Gorard Sieve analysis error:', { error, paperId: req.params.paperId, userId: req.user._id });
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_FAILED',
        message: 'Failed to analyze paper with Gorard Sieve'
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
  getFavoritePapers,
  analyzeGorardSieve
}; 