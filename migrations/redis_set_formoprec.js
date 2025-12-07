const Redis = require('ioredis');

async function run() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(redisUrl, { lazyConnect: false, enableOfflineQueue: true });
  try {
    await client.connect();
    const payload = JSON.stringify({
      id: 8,
      originalUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdtB5MkraelZsDLf7px-hgNLZy2l8n2I8RW2_9_KIGSIJzcUQ/viewform?usp=sf_link',
      expiresAt: '2025-12-27T14:36:16.781Z',
      isActive: true
    });
    await client.setex('url:formoprec', 7 * 24 * 60 * 60, payload);
    console.log('setex OK');
    await client.quit();
  } catch (err) {
    console.error('redis set error:', err);
    try { await client.quit(); } catch (e) {}
    process.exit(1);
  }
}

run().then(()=>process.exit(0));
