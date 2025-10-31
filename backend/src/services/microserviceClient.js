const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { logger } = require('../utils/logger');

class MicroserviceClient {
  constructor() {
    this.baseURL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 300000, // 5 minutes for large file processing
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`Microservice request successful: ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Microservice request failed:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        throw error;
      }
    );
  }

  /**
   * Extract metadata from PDF using Python microservice
   * @param {string} filePath - Path to the PDF file
   * @param {boolean} needDetailedSummary - Whether to generate detailed summary
   * @returns {Promise<Object>} - Extracted metadata
   */
  async extractMetadata(filePath, needDetailedSummary = true) {
    try {
      logger.info(`Extracting metadata from: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('need_detailed_summary', needDetailedSummary.toString());

      const response = await this.client.post('/pdf/extract-metadata', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      if (response.data.success) {
        logger.info('Metadata extraction successful');
        return response.data;
      } else {
        throw new Error('Metadata extraction failed: ' + response.data.error?.message);
      }
    } catch (error) {
      logger.error('Metadata extraction error:', error);
      
      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        throw new Error(errorData.error?.message || 'Metadata extraction failed');
      } else if (error.request) {
        // Network error
        throw new Error('Microservice is unavailable. Please try again later.');
      } else {
        // Other error
        throw new Error(error.message || 'Metadata extraction failed');
      }
    }
  }

  /**
   * Analyze research content using Python microservice
   * @param {Object} analysisRequest - Analysis request object
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeResearch(analysisRequest) {
    try {
      logger.info('Starting research analysis');
      
      const response = await this.client.post('/research/analyze', analysisRequest);
      
      if (response.data.success) {
        logger.info('Research analysis successful');
        return response.data;
      } else {
        throw new Error('Research analysis failed: ' + response.data.error?.message);
      }
    } catch (error) {
      logger.error('Research analysis error:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(errorData.error?.message || 'Research analysis failed');
      } else if (error.request) {
        throw new Error('Microservice is unavailable. Please try again later.');
      } else {
        throw new Error(error.message || 'Research analysis failed');
      }
    }
  }

  /**
   * Check if microservice is healthy
   * @returns {Promise<boolean>} - Health status
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      logger.warn('Microservice health check failed:', error.message);
      return false;
    }
  }

  /**
   * Analyze paper using Gorard Sieve rubric
   * @param {string} filePath - Path to the PDF file
   * @returns {Promise<Object>} - Gorard Sieve rating results
   */
  async analyzeGorardSieve(filePath) {
    try {
      logger.info(`Starting Gorard Sieve analysis for: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      const response = await this.client.post('/gorard-sieve/analyze-gorard-sieve', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      if (response.data.success) {
        logger.info('Gorard Sieve analysis successful');
        return response.data;
      } else {
        throw new Error('Gorard Sieve analysis failed: ' + response.data.error?.message);
      }
    } catch (error) {
      logger.error('Gorard Sieve analysis error:', error);
      
      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        throw new Error(errorData.error?.message || 'Gorard Sieve analysis failed');
      } else if (error.request) {
        // Network error
        throw new Error('Microservice is unavailable. Please try again later.');
      } else {
        // Other error
        throw new Error(error.message || 'Gorard Sieve analysis failed');
      }
    }
  }

  /**
   * Get microservice documentation URL
   * @returns {string} - Documentation URL
   */
  getDocumentationUrl() {
    return `${this.baseURL}/docs`;
  }
}

module.exports = new MicroserviceClient(); 