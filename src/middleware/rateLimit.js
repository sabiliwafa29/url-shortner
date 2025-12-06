const rateLimit = require('express-rate-limit');
const redis = require('../config/redis');

/**
 * Create rate limiter with Redis store
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    
    // Use Redis for distributed rate limiting
    store: {
      async increment(key) {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
        }
        return {
          totalHits: count,
          resetTime: new Date(Date.now() + windowMs)
        };
      },
      
      async decrement(key) {
        const count = await redis.decr(key);
        return;
      },
      
      async resetKey(key) {
        await redis.del(key);
      }
    }
  });
}

// Different rate limiters for different endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'API rate limit exceeded'
});

const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many requests'
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  strictLimiter
};