const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function runSeed() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Connected for seeding...');
    await client.query('BEGIN');

    // Check existing
    const existingUsers = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('Database already has data. Skipping seed.');
      await client.query('ROLLBACK');
      await client.end();
      process.exit(0);
    }

    const password = await bcrypt.hash('Password123', 10);
    const users = [
      { email: 'admin@example.com', password, name: 'Admin User' },
      { email: 'john@example.com', password, name: 'John Doe' },
      { email: 'jane@example.com', password, name: 'Jane Smith' },
    ];

    for (const user of users) {
      await client.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3)',
        [user.email, user.password, user.name]
      );
    }

    const usersResult = await client.query('SELECT id FROM users ORDER BY id');
    const userIds = usersResult.rows.map(r => r.id);

    const urls = [
      { userId: userIds[0], originalUrl: 'https://github.com', shortCode: 'github', title: 'GitHub' },
      { userId: userIds[0], originalUrl: 'https://stackoverflow.com', shortCode: 'stack', title: 'StackOverflow' },
      { userId: userIds[1], originalUrl: 'https://www.npmjs.com', shortCode: 'npm', title: 'npm' },
      { userId: userIds[1], originalUrl: 'https://nodejs.org', shortCode: 'nodejs', title: 'Node.js' },
      { userId: userIds[2], originalUrl: 'https://www.postgresql.org', shortCode: 'postgres', title: 'PostgreSQL' },
      { userId: userIds[2], originalUrl: 'https://redis.io', shortCode: 'redis', title: 'Redis' },
    ];

    for (const u of urls) {
      await client.query(
        `INSERT INTO urls (user_id, original_url, short_code, title, is_active) VALUES ($1, $2, $3, $4, $5)`,
        [u.userId, u.originalUrl, u.shortCode, u.title, true]
      );
    }

    const urlsResult = await client.query('SELECT id FROM urls ORDER BY id');
    const urlIds = urlsResult.rows.map(r => r.id);

    const devices = ['desktop', 'mobile', 'tablet'];
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const oses = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
    const countries = ['US', 'GB', 'CA', 'DE', 'FR', 'JP', 'AU'];

    for (const urlId of urlIds) {
      const clickCount = Math.floor(Math.random() * 11) + 5;
      for (let i = 0; i < clickCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const clickedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        await client.query(
          `INSERT INTO analytics (url_id, ip_address, device_type, browser, os, country, clicked_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            urlId,
            `192.168.1.${Math.floor(Math.random() * 255)}`,
            devices[Math.floor(Math.random() * devices.length)],
            browsers[Math.floor(Math.random() * browsers.length)],
            oses[Math.floor(Math.random() * oses.length)],
            countries[Math.floor(Math.random() * countries.length)],
            clickedAt,
          ]
        );
      }
      await client.query('UPDATE urls SET click_count = (SELECT COUNT(*) FROM analytics WHERE url_id = $1) WHERE id = $1', [urlId]);
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully (client)');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed (client):', err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

runSeed();
