const { Queue, QueueScheduler } = require('bullmq');

const isTest = process.env.NODE_ENV === 'test' || process.env.DISABLE_REDIS === 'true';

// Determine if Redis should be considered disabled for this environment.
let effectiveRedisUrl = process.env.REDIS_URL || '';
if (effectiveRedisUrl && process.env.NODE_ENV !== 'production') {
  const lc = effectiveRedisUrl.toLowerCase();
  if (lc.includes('localhost') || lc.includes('127.0.0.1')) {
    effectiveRedisUrl = '';
  }
}

const redisDisabled = isTest || !effectiveRedisUrl;

// If Redis disabled (tests or no configured Redis), return a lightweight noop queue to avoid connecting to Redis/BullMQ.
if (redisDisabled) {
  const noopQueue = {
    add: async () => null,
    on: () => {},
    close: async () => null,
    // expose scheduler placeholder for compatibility
    scheduler: { close: async () => null }
  };

  module.exports = noopQueue;
} else {
  const connection = { connection: { url: effectiveRedisUrl } };

  // Create a queue and a scheduler for delayed/retry support
  const qrQueue = new Queue('qr', connection);
  const qrQueueScheduler = new QueueScheduler('qr', connection);

  // attach scheduler for convenience
  qrQueue.scheduler = qrQueueScheduler;

  module.exports = qrQueue;
}
