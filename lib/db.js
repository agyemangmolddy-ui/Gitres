const { Pool } = require('pg');
if (!process.env.DATABASE_URL) console.warn('DATABASE_URL is not configured. Database requests will fail until Neon is connected.');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});
module.exports = { pool };