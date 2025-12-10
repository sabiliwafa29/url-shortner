const { Queue, QueueScheduler } = require('bullmq');

const isTest = process.env.NODE_ENV === 'test' || process.env.DISABLE_REDIS === 'true';

// If we're running tests, return a lightweight noop queue to avoid connecting to Redis/BullMQ.
if (isTest) {
  const noopQueue = {
    add: async () => null,
    on: () => {},
    close: async () => null,
    // expose scheduler placeholder for compatibility
    scheduler: { close: async () => null }
  };

  module.exports = noopQueue;
} else {
  const connection = { connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } };

  // Create a queue and a scheduler for delayed/retry support
  const qrQueue = new Queue('qr', connection);
  const qrQueueScheduler = new QueueScheduler('qr', connection);

  // attach scheduler for convenience
  qrQueue.scheduler = qrQueueScheduler;

  module.exports = qrQueue;
}
