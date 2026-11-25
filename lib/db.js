require('dotenv').config();
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn('DATABASE_URL is missing. Configure a Neon PostgreSQL connection string before using database features.');
}

const pool = new Pool({
  ...(databaseUrl ? { connectionString: databaseUrl } : {}),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: false
});

pool.on('error', error => {
  console.error('Unexpected idle PostgreSQL client error:', error.code || error.message);
});

module.exports = { pool, databaseConfigured: Boolean(databaseUrl) };