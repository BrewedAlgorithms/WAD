#!/usr/bin/env node

/**
 * Migration script to move existing files from local storage to Cloudinary
 * Usage: node scripts/migrateToCloudinary.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const CloudinaryService = require('../src/services/cloudinaryService');
const Paper = require('../src/models/Paper');
const fs = require('fs');
const path = require('path');
const { logger } = require('../src/utils/logger');

class CloudinaryMigration {
  constructor() {
    this.migratedCount = 0;
    this.failedCount = 0;
    this.skippedCount = 0;
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }

  async migrateFiles() {
    logger.info('Starting Cloudinary migration...');

    // Check if Cloudinary is configured
    if (!CloudinaryService.isConfigured()) {
      logger.error('Cloudinary is not configured. Please set CLOUDINARY_* environment variables.');
      process.exit(1);
    }

    // Find all papers with local file paths
    const papers = await Paper.find({
      filePath: { $exists: true, $ne: null },
      'cloudinary.public_id': { $exists: false }
    });

    logger.info(`Found ${papers.length} papers to migrate`);

    for (const paper of papers) {
      try {
        await this.migratePaper(paper);
      } catch (error) {
        logger.error(`Failed to migrate paper ${paper._id}:`, error);
        this.failedCount++;
      }
    }

    this.printSummary();
  }

  async migratePaper(paper) {
    logger.info(`Migrating paper: ${paper.title} (${paper._id})`);

    // Check if local file exists
    if (!fs.existsSync(paper.filePath)) {
      logger.warn(`Local file not found for paper ${paper._id}: ${paper.filePath}`);
      this.skippedCount++;
      return;
    }

    try {
      // Upload to Cloudinary
      const cloudinaryResult = await CloudinaryService.uploadFile(
        paper.filePath,
        paper.fileName,
        'research-papers'
      );

      // Update paper with Cloudinary info
      await Paper.findByIdAndUpdate(paper._id, {
        cloudinary: cloudinaryResult,
        filePath: null // Remove local path
      });

      logger.info(`Successfully migrated paper ${paper._id} to Cloudinary`);
      this.migratedCount++;

      // Optionally delete local file (uncomment if desired)
      // fs.unlinkSync(paper.filePath);
      // logger.info(`Deleted local file: ${paper.filePath}`);

    } catch (error) {
      logger.error(`Failed to upload paper ${paper._id} to Cloudinary:`, error);
      throw error;
    }
  }

  printSummary() {
    logger.info('\n=== Migration Summary ===');
    logger.info(`Total papers processed: ${this.migratedCount + this.failedCount + this.skippedCount}`);
    logger.info(`Successfully migrated: ${this.migratedCount}`);
    logger.info(`Failed: ${this.failedCount}`);
    logger.info(`Skipped (file not found): ${this.skippedCount}`);
    logger.info('========================\n');
  }

  async run() {
    try {
      await this.connect();
      await this.migrateFiles();
    } catch (error) {
      logger.error('Migration failed:', error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new CloudinaryMigration();
  migration.run();
}

module.exports = CloudinaryMigration; 