const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`📦 MongoDB Connected: ${conn.connection.host}`);

    // Create text indexes for search functionality
    await createSearchIndexes();

  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createSearchIndexes = async () => {
  try {
    // Create text index for papers collection
    const Paper = require('../models/Paper');
    await Paper.collection.createIndex({
      title: 'text',
      detailed_summary: 'text',
      abstract: 'text',
      keywords: 'text',
      journalName: 'text',
      authors: 'text'
    }, {
      weights: {
        title: 10,
        keywords: 8,
        detailed_summary: 6,
        abstract: 4,
        journalName: 2,
        authors: 2
      },
      name: 'paper_search_index'
    });

    logger.info('✅ Search indexes created successfully');
  } catch (error) {
    logger.warn('⚠️ Search indexes creation failed:', error.message);
  }
};

module.exports = { connectDB }; 