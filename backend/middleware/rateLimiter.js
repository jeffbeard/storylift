const rateLimit = require('express-rate-limit');

// Rate limiting configurations
const createRateLimiter = (options) => {
  const config = {
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
    max: options.max || 100, // 100 requests default
    message: {
      error: 'Too many requests, please try again later',
      retryAfter: Math.ceil(options.windowMs / 1000) || 900
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      console.warn(`[RATE LIMITER] Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil(options.windowMs / 1000) || 900
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
    ...options
  };

  return rateLimit(config);
};

// Global rate limiter - applied to all routes
const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Global rate limit exceeded'
});

// Authentication endpoints - stricter limits
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many authentication attempts'
});

// Database read operations - moderate limits
const dbReadLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60, // 60 requests per window
  message: 'Too many read requests'
});

// Database write operations - stricter limits
const dbWriteLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 requests per window
  message: 'Too many write requests'
});

// File upload operations - very strict limits
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads'
});

// URL scraping operations - strict limits (expensive operations)
const scrapingLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 scraping requests per hour
  message: 'Too many URL scraping requests'
});

// Health check function
const getRateLimitStatus = () => {
  return {
    storeType: 'memory',
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  globalLimiter,
  authLimiter,
  dbReadLimiter,
  dbWriteLimiter,
  uploadLimiter,
  scrapingLimiter,
  getRateLimitStatus
};
