const cloudinary = require('cloudinary').v2;
const { logger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
  /**
   * Upload file to Cloudinary
   * @param {string} filePath - Local file path
   * @param {string} fileName - Original file name
   * @param {string} folder - Cloudinary folder (optional)
   * @returns {Promise<Object>} Cloudinary upload result
   */
  static async uploadFile(filePath, fileName, folder = 'research-papers') {
    try {
      logger.info(`Uploading file to Cloudinary: ${fileName}`);

      const uploadOptions = {
        resource_type: 'raw',
        folder: folder,
        public_id: `${path.parse(fileName).name}-${Date.now()}`,
        overwrite: false,
        invalidate: true
      };

      const result = await cloudinary.uploader.upload(filePath, uploadOptions);

      logger.info(`File uploaded successfully to Cloudinary: ${result.public_id}`);

      // Generate preview URL for PDF (opens in browser instead of downloading)
      const previewUrl = this.generatePreviewUrl(result.public_id, result.format);
      
      return {
        public_id: result.public_id,
        url: previewUrl, // Use preview URL instead of download URL
        secure_url: previewUrl, // Use preview URL for secure as well
        resource_type: result.resource_type,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      logger.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Upload file from buffer to Cloudinary
   * @param {Buffer} buffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} folder - Cloudinary folder (optional)
   * @returns {Promise<Object>} Cloudinary upload result
   */
  static async uploadBuffer(buffer, fileName, folder = 'research-papers') {
    try {
      logger.info(`Uploading buffer to Cloudinary: ${fileName}`);

      const uploadOptions = {
        resource_type: 'raw',
        folder: folder,
        public_id: `${path.parse(fileName).name}-${Date.now()}`,
        overwrite: false,
        invalidate: true
      };

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              logger.error('Cloudinary upload stream error:', error);
              reject(new Error(`Failed to upload buffer to Cloudinary: ${error.message}`));
            } else {
              logger.info(`Buffer uploaded successfully to Cloudinary: ${result.public_id}`);
              // Generate preview URL for PDF (opens in browser instead of downloading)
              const previewUrl = this.generatePreviewUrl(result.public_id, result.format);
              
              resolve({
                public_id: result.public_id,
                url: previewUrl, // Use preview URL instead of download URL
                secure_url: previewUrl, // Use preview URL for secure as well
                resource_type: result.resource_type,
                format: result.format,
                bytes: result.bytes
              });
            }
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      logger.error('Cloudinary buffer upload error:', error);
      throw new Error(`Failed to upload buffer to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteFile(publicId) {
    try {
      logger.info(`Deleting file from Cloudinary: ${publicId}`);

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw'
      });

      if (result.result === 'ok') {
        logger.info(`File deleted successfully from Cloudinary: ${publicId}`);
        return { success: true, message: 'File deleted successfully' };
      } else {
        logger.warn(`File deletion result from Cloudinary: ${result.result}`);
        return { success: false, message: `Deletion result: ${result.result}` };
      }
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
      throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
    }
  }

  /**
   * Get file URL from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - URL options
   * @returns {string} File URL
   */
  static getFileUrl(publicId, options = {}) {
    try {
      const defaultOptions = {
        resource_type: 'raw',
        secure: true,
        ...options
      };

      return cloudinary.url(publicId, defaultOptions);
    } catch (error) {
      logger.error('Error generating Cloudinary URL:', error);
      throw new Error(`Failed to generate file URL: ${error.message}`);
    }
  }

  /**
   * Download file from Cloudinary to local path
   * @param {string} publicId - Cloudinary public ID
   * @param {string} localPath - Local path to save file
   * @returns {Promise<string>} Local file path
   */
  static async downloadFile(publicId, localPath) {
    try {
      logger.info(`Downloading file from Cloudinary: ${publicId}`);

      const url = this.getFileUrl(publicId);
      
      // Use axios to download the file
      const axios = require('axios');
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          logger.info(`File downloaded successfully: ${localPath}`);
          resolve(localPath);
        });
        writer.on('error', reject);
      });
    } catch (error) {
      logger.error('Cloudinary download error:', error);
      throw new Error(`Failed to download file from Cloudinary: ${error.message}`);
    }
  }

  /**
   * Generate preview URL for PDF files
   * @param {string} publicId - Cloudinary public ID
   * @param {string} format - File format
   * @returns {string} Preview URL
   */
  static generatePreviewUrl(publicId, format) {
    try {
      // For PDFs, use a simple URL that should open in browser
      // The key is to avoid download-inducing parameters
      const options = {
        resource_type: 'raw',
        secure: true
      };

      return cloudinary.url(publicId, options);
    } catch (error) {
      logger.error('Error generating preview URL:', error);
      // Fallback to regular URL if preview generation fails
      return cloudinary.url(publicId, { resource_type: 'raw', secure: true });
    }
  }

  /**
   * Check if Cloudinary is configured
   * @returns {boolean} Configuration status
   */
  static isConfigured() {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && 
              process.env.CLOUDINARY_API_KEY && 
              process.env.CLOUDINARY_API_SECRET);
  }
}

module.exports = CloudinaryService; 