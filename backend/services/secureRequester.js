const axios = require('axios');
const urlValidator = require('./urlValidator');
const requestLogger = require('./requestLogger');

class SecureRequester {
  constructor() {
    this.defaultConfig = {
      timeout: 10000, // 10 seconds
      maxContentLength: 5 * 1024 * 1024, // 5MB
      maxRedirects: 3,
      headers: {
        'User-Agent': 'StoryLift/1.0 (Job Description Scraper)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive'
      }
    };
  }

  async secureGet(urlString, requestContext = {}) {
    const startTime = Date.now();
    const requestId = requestLogger.generateRequestId();
    
    try {
      // Validate URL first
      const validation = await urlValidator.validateURL(urlString);
      if (!validation.isValid) {
        // Log security event for blocked URL
        requestLogger.logSecurityEvent({
          event: 'URL_VALIDATION_FAILED',
          severity: 'WARNING',
          url: urlString,
          clientIp: requestContext.clientIp,
          userId: requestContext.userId,
          details: validation.errors.join(', '),
          requestId
        });
        
        throw new Error(`URL validation failed: ${validation.errors.join(', ')}`);
      }

      // Get platform-specific configuration
      const platformConfig = validation.config || {};

      // Build request configuration
      const requestConfig = {
        ...this.defaultConfig,
        timeout: platformConfig.timeout || this.defaultConfig.timeout,
        maxContentLength: this.parseMaxSize(platformConfig.max_size) || this.defaultConfig.maxContentLength,
        validateStatus: (status) => status >= 200 && status < 400,
        // Security headers
        headers: {
          ...this.defaultConfig.headers,
          'Referer': new URL(urlString).origin,
          'Origin': new URL(urlString).origin
        }
      };

      // Log outbound request
      requestLogger.logOutboundRequest({
        method: 'GET',
        url: urlString,
        userAgent: this.defaultConfig.headers['User-Agent'],
        clientIp: requestContext.clientIp,
        userId: requestContext.userId,
        endpoint: requestContext.endpoint,
        requestId
      });

      // Log request for security monitoring
      console.log(`[SECURE REQUEST] Fetching URL: ${urlString} (Platform: ${validation.platform.name})`);

      // Make the request
      const response = await axios.get(urlString, requestConfig);
      const responseTime = Date.now() - startTime;

      // Additional security checks on response
      await this.validateResponse(response, urlString);

      // Log successful response
      requestLogger.logOutboundResponse({
        url: urlString,
        status: response.status,
        statusText: response.statusText,
        contentLength: response.data.length,
        responseTime,
        requestId,
        success: true
      });

      // Log successful request
      console.log(`[SECURE REQUEST] Success: ${urlString} (${response.status}, ${this.formatBytes(response.data.length)})`);

      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
        platform: validation.platform,
        finalUrl: response.request.res.responseUrl || urlString,
        requestId,
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log failed response
      requestLogger.logOutboundResponse({
        url: urlString,
        status: error.response?.status || 0,
        statusText: error.response?.statusText || 'ERROR',
        contentLength: 0,
        responseTime,
        requestId,
        success: false
      });

      // Log security-relevant errors
      console.error(`[SECURE REQUEST] Failed: ${urlString} - ${error.message}`);

      // Log security event for failed requests
      requestLogger.logSecurityEvent({
        event: 'REQUEST_FAILED',
        severity: 'ERROR',
        url: urlString,
        clientIp: requestContext.clientIp,
        userId: requestContext.userId,
        details: error.message,
        requestId
      });

      // Re-throw with security context
      if (error.response) {
        throw new Error(`Request failed with status ${error.response.status}: ${error.message}`);
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Domain not found or DNS resolution failed');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - server took too long to respond');
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Connection refused by server');
      } else {
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  async validateResponse(response, originalUrl) {
    // Check for suspicious redirects
    const finalUrl = response.request.res.responseUrl || originalUrl;
    if (finalUrl !== originalUrl) {
      const validation = await urlValidator.validateURL(finalUrl);
      if (!validation.isValid) {
        throw new Error(`Redirect to unauthorized domain: ${finalUrl}`);
      }
    }

    // Check content type
    const contentType = response.headers['content-type'] || '';
    if (!contentType.toLowerCase().includes('text/html') &&
        !contentType.toLowerCase().includes('application/xhtml')) {
      console.warn(`[SECURE REQUEST] Unexpected content type: ${contentType} for URL: ${originalUrl}`);
    }

    // Check response size
    const contentLength = parseInt(response.headers['content-length']) || response.data.length;
    if (contentLength > this.defaultConfig.maxContentLength) {
      throw new Error(`Response too large: ${this.formatBytes(contentLength)}`);
    }
  }

  parseMaxSize(sizeString) {
    if (!sizeString) return null;

    const units = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i);
    if (!match) return null;

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();

    return value * (units[unit] || 1);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Health check method for testing
  async healthCheck() {
    try {
      const allowedDomains = await urlValidator.getAllowedDomains();
      return {
        status: 'healthy',
        allowedDomainsCount: allowedDomains.length,
        sampleDomains: allowedDomains.slice(0, 3)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new SecureRequester();