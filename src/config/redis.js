const Redis = require('ioredis');

// If no REDIS_URL is provided, export a safe noop stub so the app can run
// without a Redis instance (useful for deployments that don't configure Redis).
let redisUrl = process.env.REDIS_URL || '';
// Treat localhost/127.0.0.1 Redis URLs as "not configured" in non-production
// to avoid noisy ECONNREFUSED logs when developers don't run Redis locally.
if (redisUrl && process.env.NODE_ENV !== 'production') {
  const lc = redisUrl.toLowerCase();
  if (lc.includes('localhost') || lc.includes('127.0.0.1')) {
    console.warn('⚠️  REDIS_URL points to localhost and NODE_ENV!=production — ignoring local Redis for development');
    redisUrl = '';
  }
}

if (!redisUrl) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  No REDIS_URL provided — running without Redis cache');
  }

  const noop = {
    connect: async () => {},
    disconnect: async () => {},
    on: () => {},
    get: async () => null,
    set: async () => {},
    del: async () => {},
    // allow checking for truthiness in other modules
    _isNoop: true,
  };

  module.exports = noop;
} else {
  const redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
      // Stop retrying after 3 attempts in development
      if (times > 3) {
        console.warn('⚠️  Redis not available - running without cache (OK for development)');
        return null;
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true, // Don't connect immediately
    enableOfflineQueue: false,
  });

  // In test environment do not attempt to connect (keep silent)
  if (process.env.NODE_ENV !== 'test') {
    // Try to connect but don't crash if it fails
    redis.connect().catch(() => {
      console.warn('⚠️  Redis not available - running without cache (OK for development)');
    });

    redis.on('connect', () => {
      console.log('✅ Connected to Redis');
    });
  }

  redis.on('error', (err) => {
    // Only log once, don't spam console
    if (!redis._errorLogged) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('⚠️  Redis connection error - app will continue without cache');
      }
      redis._errorLogged = true;
    }
  });

  module.exports = redis;
}