const { Client } = require('pg');

async function test() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Using DATABASE_URL length:', connectionString ? connectionString.length : 0);
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Attempting client.connect()...');
    await client.connect();
    console.log('Connected. Running SELECT NOW()...');
    const res = await client.query('SELECT NOW()');
    console.log('SELECT NOW() result:', res.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection test failed:', err);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

test();
