const { Pool } = require('pg');
const url = process.env.DATABASE_URL || '';

// Determine whether to use SSL.
// - Railway internal hosts ("*.railway.internal" or "postgres.railway.internal") typically do NOT use SSL.
// - Public hosts (railway.app, rlwy.net, proxy hosts) require SSL.
const shouldUseSSL = (() => {
  if (!url) return false;
  const lc = url.toLowerCase();
  if (lc.includes('.railway.internal') || lc.includes('.railway.internal:') || lc.includes('postgres.railway.internal')) {
    return false;
  }
  if (lc.includes('railway.app') || lc.includes('rlwy.net') || lc.includes('proxy')) {
    return true;
  }
  // Default to true in production unless explicitly internal
  if (process.env.NODE_ENV === 'production') return true;
  return false;
})();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  // Do not crash the entire process on a single client error; log and allow
  // the application to attempt recovery or handle the error per-request.
});

module.exports = pool;