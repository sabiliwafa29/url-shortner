const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const before = await client.query('SELECT id,is_active,expires_at FROM urls WHERE short_code=$1', ['formoprec']);
    console.log('before:', before.rows[0]);
    await client.query('UPDATE urls SET is_active=true WHERE short_code=$1', ['formoprec']);
    const after = await client.query('SELECT id,is_active,expires_at FROM urls WHERE short_code=$1', ['formoprec']);
    console.log('after:', after.rows[0]);
    await client.end();
  } catch (err) {
    console.error('error:', err);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

run().then(() => process.exit(0));
