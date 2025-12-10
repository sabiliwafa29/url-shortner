const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
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