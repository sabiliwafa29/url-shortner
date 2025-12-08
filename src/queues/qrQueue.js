const { Queue, QueueScheduler } = require('bullmq');

const connection = { connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } };

// Create a queue and a scheduler for delayed/retry support
const qrQueue = new Queue('qr', connection);
const qrQueueScheduler = new QueueScheduler('qr', connection);

module.exports = {
  qrQueue,
  qrQueueScheduler,
};
