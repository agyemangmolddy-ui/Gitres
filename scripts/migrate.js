require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../lib/db');

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Add your Neon PostgreSQL connection string to .env first.');
  }
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await pool.query(sql);
  const check = await pool.query(
    "SELECT to_regclass('public.users') AS users_table, to_regclass('public.telecom_bundles') AS bundles_table, to_regclass('public.bundle_orders') AS orders_table"
  );
  if (!Object.values(check.rows[0]).every(Boolean)) {
    throw new Error('Migration ran, but one or more required DataVault tables are still missing.');
  }
  console.log('DataVault database migration completed. Required tables are ready.');
}

migrate()
  .catch(error => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());