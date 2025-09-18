const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('redis');

// Redis client for production (fallback to memory store if Redis unavailable)
let redisClient = null;
let store = null;

// Initialize Redis connection
async function initializeRedis() {
  try {
    if (process.env.REDIS_URL) {
      redisClient = Redis.createClient({
        url: process.env.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.warn('[RATE LIMITER] Redis connection refused, falling back to memory store');
            return undefined; // Fall back to memory store
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('[RATE LIMITER] Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('[RATE LIMITER] Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      redisClient.on('error', (err) => {
        console.warn('[RATE LIMITER] Redis error:', err.message);
        redisClient = null;
        store = null;
      });

      redisClient.on('connect', () => {
        console.log('[RATE LIMITER] Connected to Redis');
      });

      await redisClient.connect();
      store = new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      });
    }
  } catch (error) {
    console.warn('[RATE LIMITER] Failed to connect to Redis, using memory store:', error.message);
    redisClient = null;
    store = null;
  }
}

// Initialize Redis on startup
initializeRedis();

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

  // Use Redis store if available, otherwise use memory store
  if (store) {
    config.store = store;
  }

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
    redisConnected: redisClient !== null,
    storeType: store ? 'redis' : 'memory',
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
  getRateLimitStatus,
  initializeRedis
};
