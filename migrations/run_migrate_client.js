const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    console.log('Running migrations via direct client...');
    await client.connect();
    const migrationFile = path.join(__dirname, '001_create_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    await client.query(sql);
    console.log('✅ Migrations completed successfully (client)');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed (client):', err);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

run();
