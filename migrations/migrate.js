const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    
    const migrationFile = path.join(__dirname, '001_create_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();