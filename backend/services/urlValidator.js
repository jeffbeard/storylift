const { URL } = require('url');
const db = require('../models/database');

class URLValidator {
  constructor() {
    this.platforms = null;
    this.allowedDomains = null;
    this.lastLoaded = 0;
    this.cacheTime = 5 * 60 * 1000; // Cache for 5 minutes
  }

  async loadJobPlatforms() {
    const now = Date.now();

    // Use cached data if it's still fresh
    if (this.platforms && (now - this.lastLoaded) < this.cacheTime) {
      return this.platforms;
    }

    try {
      const [rows] = await db.execute(
        'SELECT * FROM job_platforms WHERE status = ? ORDER BY name',
        ['active']
      );

      this.platforms = rows.map(row => ({
        name: row.name,
        domain: row.domain,
        domain_pattern: row.domain_pattern,
        category: row.category,
        region: row.region,
        is_ats: Boolean(row.is_ats),
        status: row.status,
        https_only: Boolean(row.https_only),
        scraping_config: {
          timeout: row.timeout_ms,
          max_size: `${row.max_size_mb}MB`
        }
      }));

      this.lastLoaded = now;
      this.allowedDomains = this.buildDomainAllowlist();

      return this.platforms;
    } catch (error) {
      console.error('Failed to load platforms from database:', error);
      // Return empty array if database fails
      return [];
    }
  }

  buildDomainAllowlist() {
    if (!this.platforms) return [];

    const domains = new Set();

    this.platforms.forEach(platform => {
      // Add base domain
      domains.add(platform.domain);

      // Add domain pattern if exists
      if (platform.domain_pattern) {
        domains.add(platform.domain_pattern);
      }
    });

    return Array.from(domains);
  }

  async validateURL(urlString) {
    try {
      // Load platforms from database
      const platforms = await this.loadJobPlatforms();

      // Parse URL
      const url = new URL(urlString);

      // Security checks
      const validationResult = {
        isValid: false,
        platform: null,
        config: null,
        errors: []
      };

      // Check protocol - HTTPS only for external requests
      if (url.protocol !== 'https:') {
        validationResult.errors.push('Only HTTPS URLs are allowed');
        return validationResult;
      }

      // Block internal/private networks
      if (this.isInternalAddress(url.hostname)) {
        validationResult.errors.push('Internal network addresses are not allowed');
        return validationResult;
      }

      // Check against domain allowlist
      const matchedPlatform = this.findMatchingPlatform(url.hostname, platforms);
      if (!matchedPlatform) {
        validationResult.errors.push(`Domain ${url.hostname} is not in the allowed platforms list`);
        return validationResult;
      }

      // Platform-specific HTTPS enforcement
      if (matchedPlatform.https_only && url.protocol !== 'https:') {
        validationResult.errors.push(`Platform ${matchedPlatform.name} requires HTTPS`);
        return validationResult;
      }

      // Success
      validationResult.isValid = true;
      validationResult.platform = matchedPlatform;
      validationResult.config = matchedPlatform.scraping_config || {};

      return validationResult;

    } catch (error) {
      return {
        isValid: false,
        platform: null,
        config: null,
        errors: [`Invalid URL format: ${error.message}`]
      };
    }
  }

  findMatchingPlatform(hostname, platforms = null) {
    const platformList = platforms || this.platforms || [];
    return platformList.find(platform => {
      // Exact domain match
      if (hostname === platform.domain || hostname === `www.${platform.domain}`) {
        return true;
      }

      // Pattern matching for subdomains
      if (platform.domain_pattern) {
        const pattern = platform.domain_pattern.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`, 'i');
        if (regex.test(hostname)) {
          return true;
        }
      }

      return false;
    });
  }

  isInternalAddress(hostname) {
    // Block localhost, private IPs, and internal domains
    const internalPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
      /^::1$/, // IPv6 localhost
      /^fe80:/, // IPv6 link-local
      /\.local$/i,
      /\.internal$/i,
      /\.lan$/i
    ];

    return internalPatterns.some(pattern => pattern.test(hostname));
  }

  async getAllowedDomains() {
    await this.loadJobPlatforms();
    return this.allowedDomains || [];
  }

  async getPlatformConfig(hostname) {
    const platforms = await this.loadJobPlatforms();
    const platform = this.findMatchingPlatform(hostname, platforms);
    return platform ? platform.scraping_config : null;
  }
}

module.exports = new URLValidator();