const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters']
  },
  detailed_summary: {
    type: String,
    trim: true,
    maxlength: [5000, 'Summary cannot exceed 5000 characters']
  },
  abstract: {
    type: String,
    trim: true,
    maxlength: [10000, 'Abstract cannot exceed 10000 characters']
  },
  keywords: [{
    type: String,
    trim: true,
    maxlength: [100, 'Keyword cannot exceed 100 characters']
  }],
  paperLink: {
    type: String,
    trim: true,
    maxlength: [500, 'Paper link cannot exceed 500 characters']
  },
  journalName: {
    type: String,
    trim: true,
    maxlength: [200, 'Journal name cannot exceed 200 characters']
  },
  authors: [{
    type: String,
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  }],
  publication_date: {
    type: Date
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  // Legacy file path (for backward compatibility)
  filePath: {
    type: String,
    required: false // Made optional for Cloudinary migration
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  // Cloudinary fields
  cloudinary: {
    public_id: {
      type: String,
      required: false
    },
    url: {
      type: String,
      required: false
    },
    secure_url: {
      type: String,
      required: false
    },
    resource_type: {
      type: String,
      default: 'raw'
    },
    format: {
      type: String
    },
    bytes: {
      type: Number
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  // Gemini AI Analysis fields
  gemini_analysis: {
    research_area: {
      type: String,
      trim: true
    },
    methodology: {
      type: String,
      trim: true
    },
    key_findings: [{
      type: String,
      trim: true
    }],
    limitations: [{
      type: String,
      trim: true
    }],
    research_impact: {
      type: String,
      trim: true
    },
    future_directions: [{
      type: String,
      trim: true
    }]
  },
  // Processing metadata
  processing_info: {
    extraction_method: {
      type: String,
      default: 'gemini_ai'
    },
    ai_processing_time: {
      type: Number
    },
    gemini_tokens_used: {
      type: Number
    },
    confidence_score: {
      type: Number,
      default: 0.95
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted file size
paperSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for download URL
paperSchema.virtual('downloadUrl').get(function() {
  return `/api/v1/papers/${this._id}/download`;
});

// Virtual for file URL (Cloudinary or local)
paperSchema.virtual('fileUrl').get(function() {
  if (this.cloudinary && this.cloudinary.secure_url) {
    return this.cloudinary.secure_url;
  }
  return this.downloadUrl;
});

// Indexes for search and performance
paperSchema.index({ title: 1 });
paperSchema.index({ keywords: 1 });
paperSchema.index({ authors: 1 });
paperSchema.index({ journalName: 1 });
paperSchema.index({ uploadedBy: 1, uploadedAt: -1 });
paperSchema.index({ publication_date: -1 });
paperSchema.index({ isPublic: 1 });

// Pre-save middleware to update timestamps
paperSchema.pre('save', function(next) {
  if (this.isNew) {
    this.uploadedAt = new Date();
  }
  this.updatedAt = new Date();
  next();
});

// Method to increment download count
paperSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

// Method to get public paper data (without sensitive info)
paperSchema.methods.getPublicData = function() {
  const paperObject = this.toObject();
  delete paperObject.filePath; // Don't expose file path
  return paperObject;
};

// Static method to find papers by user
paperSchema.statics.findByUser = function(userId, options = {}) {
  const query = { uploadedBy: userId };
  if (options.isPublic !== undefined) {
    query.isPublic = options.isPublic;
  }
  return this.find(query).populate('uploadedBy', 'firstName lastName email');
};

// Static method to search papers
paperSchema.statics.searchPapers = function(searchQuery, options = {}) {
  const query = { isPublic: true };
  
  // Build search query using regex instead of text search
  if (searchQuery && searchQuery.trim()) {
    const searchRegex = new RegExp(searchQuery.trim(), 'i');
    query.$or = [
      { title: searchRegex },
      { abstract: searchRegex },
      { detailed_summary: searchRegex },
      { keywords: { $in: [searchRegex] } },
      { authors: { $in: [searchRegex] } },
      { journalName: searchRegex }
    ];
  }
  
  // Apply filters
  if (options.keywords && options.keywords.length > 0) {
    query.keywords = { $in: options.keywords };
  }
  
  if (options.journalName) {
    query.journalName = new RegExp(options.journalName, 'i');
  }
  
  if (options.uploadedBy) {
    query.uploadedBy = options.uploadedBy;
  }
  
  if (options.authors && options.authors.length > 0) {
    query.authors = { $in: options.authors };
  }
  
  if (options.dateRange) {
    const dateQuery = {};
    if (options.dateRange.start) {
      dateQuery.$gte = new Date(options.dateRange.start);
    }
    if (options.dateRange.end) {
      dateQuery.$lte = new Date(options.dateRange.end);
    }
    if (Object.keys(dateQuery).length > 0) {
      query.publication_date = dateQuery;
    }
  }
  
  // Build sort options
  const sortOptions = {};
  if (options.sortBy) {
    sortOptions[options.sortBy] = options.sortOrder === 'desc' ? -1 : 1;
  } else {
    // Default sort by upload date
    sortOptions.uploadedAt = -1;
  }
  
  return this.find(query)
    .sort(sortOptions)
    .populate('uploadedBy', 'firstName lastName');
};

module.exports = mongoose.model('Paper', paperSchema); 