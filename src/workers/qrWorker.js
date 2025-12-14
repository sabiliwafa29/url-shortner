const { Worker } = require('bullmq');
const QRCode = require('qrcode');
const pool = require('../config/database');
const redis = require('../config/redis');
const logger = require('../config/logger');


// Determine effective Redis URL and whether Redis should be considered disabled.
let effectiveRedisUrl = process.env.REDIS_URL || '';
if (effectiveRedisUrl && process.env.NODE_ENV !== 'production') {
  const lc = effectiveRedisUrl.toLowerCase();
  if (lc.includes('localhost') || lc.includes('127.0.0.1')) {
    effectiveRedisUrl = '';
  }
}

const isTest = process.env.NODE_ENV === 'test' || process.env.DISABLE_REDIS === 'true';
const redisDisabled = isTest || !effectiveRedisUrl;
const connection = { connection: { url: effectiveRedisUrl || '' } };

async function processJob(job) {
  const { urlId, shortCode, shortUrl } = job.data;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(shortUrl);

    // Update DB
    await pool.query('UPDATE urls SET qr_code = $1 WHERE id = $2', [qrCodeDataUrl, urlId]);

    // Update Redis cache if present
    try {
      const key = `url:${shortCode}`;
      const cached = await redis.get(key);
      if (cached) {
        const data = JSON.parse(cached);
        data.qrCode = qrCodeDataUrl;
        await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(data));
      }
    } catch (err) {
      // Non-fatal: log and continue
      logger.error('Failed to update Redis cache with QR', err);
    }

    return { success: true };
  } catch (err) {
    logger.error('QR worker error', err);
    throw err;
  }
}

// Only create a real Worker if Redis is configured
if (redisDisabled) {
  // Export a lightweight object for testing which exposes the processor
  module.exports = { process: processJob };
} else {
  const worker = new Worker('qr', processJob, connection);

  worker.on('completed', (job) => {
    logger.info(`QR job ${job.id} completed for urlId=${job.data.urlId}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`QR job ${job ? job.id : 'unknown'} failed`, err);
  });

  module.exports = worker;
}
