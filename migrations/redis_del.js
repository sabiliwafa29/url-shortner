const Redis = require('ioredis');

async function run(key = 'url:formoprec') {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(redisUrl, { lazyConnect: false, enableOfflineQueue: true });
  try {
    await client.connect();
    const res = await client.del(key);
    console.log('deleted:', res);
    await client.quit();
  } catch (err) {
    console.error('redis error:', err);
    try { await client.quit(); } catch (e) {}
    process.exit(1);
  }
}

const key = process.argv[2] || 'url:formoprec';
run(key).then(() => process.exit(0));
