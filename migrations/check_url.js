const { Client } = require('pg');

async function check(shortCode) {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query('SELECT id, original_url, short_code, custom_alias, is_active, expires_at, created_at FROM urls WHERE short_code = $1 OR custom_alias = $1', [shortCode]);
    if (res.rows.length === 0) {
      console.log('NOT FOUND');
    } else {
      console.log('FOUND:', res.rows[0]);
    }
    await client.end();
  } catch (err) {
    console.error('ERROR:', err);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

const sc = process.argv[2] || 'formoprec';
check(sc).then(() => process.exit(0));
