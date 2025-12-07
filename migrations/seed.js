const pool = require('../src/config/database');
const bcrypt = require('bcryptjs');
const logger = require('../src/config/logger');

/**
 * Seed database with sample data for development
 */
async function seedDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    logger.info('Starting database seeding...');

    // Check if data already exists
    const existingUsers = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      logger.info('Database already has data. Skipping seed.');
      await client.query('ROLLBACK');
      return;
    }

    // Create sample users
    const password = await bcrypt.hash('Password123', 10);
    
    const users = [
      { email: 'admin@example.com', password, name: 'Admin User' },
      { email: 'john@example.com', password, name: 'John Doe' },
      { email: 'jane@example.com', password, name: 'Jane Smith' },
    ];

    logger.info('Creating sample users...');
    for (const user of users) {
      await client.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3)',
        [user.email, user.password, user.name]
      );
    }

    // Get created users
    const usersResult = await client.query('SELECT id FROM users ORDER BY id');
    const userIds = usersResult.rows.map(row => row.id);

    // Create sample URLs
    const urls = [
      {
        userId: userIds[0],
        originalUrl: 'https://github.com',
        shortCode: 'github',
        title: 'GitHub - Where the world builds software'
      },
      {
        userId: userIds[0],
        originalUrl: 'https://stackoverflow.com',
        shortCode: 'stack',
        title: 'Stack Overflow - Where Developers Learn'
      },
      {
        userId: userIds[1],
        originalUrl: 'https://www.npmjs.com',
        shortCode: 'npm',
        title: 'npm - Node Package Manager'
      },
      {
        userId: userIds[1],
        originalUrl: 'https://nodejs.org',
        shortCode: 'nodejs',
        title: 'Node.js'
      },
      {
        userId: userIds[2],
        originalUrl: 'https://www.postgresql.org',
        shortCode: 'postgres',
        title: 'PostgreSQL Database'
      },
      {
        userId: userIds[2],
        originalUrl: 'https://redis.io',
        shortCode: 'redis',
        title: 'Redis'
      },
    ];

    logger.info('Creating sample URLs...');
    for (const url of urls) {
      await client.query(
        `INSERT INTO urls (user_id, original_url, short_code, title, is_active) 
         VALUES ($1, $2, $3, $4, $5)`,
        [url.userId, url.originalUrl, url.shortCode, url.title, true]
      );
    }

    // Get created URLs
    const urlsResult = await client.query('SELECT id FROM urls ORDER BY id');
    const urlIds = urlsResult.rows.map(row => row.id);

    // Create sample analytics
    logger.info('Creating sample analytics...');
    const devices = ['desktop', 'mobile', 'tablet'];
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const oses = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
    const countries = ['US', 'GB', 'CA', 'DE', 'FR', 'JP', 'AU'];
    
    for (const urlId of urlIds) {
      // Create 5-15 random clicks per URL
      const clickCount = Math.floor(Math.random() * 11) + 5;
      
      for (let i = 0; i < clickCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const clickedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        await client.query(
          `INSERT INTO analytics 
           (url_id, ip_address, device_type, browser, os, country, clicked_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            urlId,
            `192.168.1.${Math.floor(Math.random() * 255)}`,
            devices[Math.floor(Math.random() * devices.length)],
            browsers[Math.floor(Math.random() * browsers.length)],
            oses[Math.floor(Math.random() * oses.length)],
            countries[Math.floor(Math.random() * countries.length)],
            clickedAt
          ]
        );
      }

      // Update click count
      await client.query(
        'UPDATE urls SET click_count = (SELECT COUNT(*) FROM analytics WHERE url_id = $1) WHERE id = $1',
        [urlId]
      );
    }

    await client.query('COMMIT');
    
    logger.info('✅ Database seeded successfully!');
    logger.info(`Created ${users.length} users`);
    logger.info(`Created ${urls.length} URLs`);
    logger.info('Sample credentials:');
    logger.info('  Email: admin@example.com');
    logger.info('  Password: Password123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
