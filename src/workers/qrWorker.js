const { Worker } = require('bullmq');
const QRCode = require('qrcode');
const pool = require('../config/database');
const redis = require('../config/redis');
const logger = require('../config/logger');

const connection = { connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } };

// Worker to generate QR codes and update DB
const worker = new Worker(
  'qr',
  async job => {
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
  },
  connection
);

worker.on('completed', (job) => {
  logger.info(`QR job ${job.id} completed for urlId=${job.data.urlId}`);
});

worker.on('failed', (job, err) => {
  logger.error(`QR job ${job ? job.id : 'unknown'} failed`, err);
});

module.exports = worker;
