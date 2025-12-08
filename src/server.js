const app = require('./app');
const logger = require('./config/logger');
const pool = require('./config/database');
const redis = require('./config/redis');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`
╔════════════════════════════════════════╗
║   URL Shortener API Server Running    ║
║   Port: ${PORT}                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}           ║
╚════════════════════════════════════════╝
  `);
});

async function shutdown(signal) {
  try {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        logger.error('Error closing server', err);
        process.exit(1);
      }

      try {
        // Close Postgres pool
        await pool.end();
        logger.info('Postgres pool has ended');
      } catch (e) {
        logger.error('Error ending Postgres pool', e);
      }

      try {
        // Disconnect Redis
        if (redis && typeof redis.disconnect === 'function') {
          await redis.disconnect();
          logger.info('Redis client disconnected');
        }
      } catch (e) {
        logger.error('Error disconnecting Redis', e);
      }

      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      logger.warn('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  } catch (err) {
    logger.error('Shutdown error', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason);
  shutdown('unhandledRejection');
});

module.exports = server;
