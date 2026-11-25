const fs = require('fs');
const path = require('path');
const { pool } = require('../lib/db');
async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname,'..','db','schema.sql'),'utf8');
  await pool.query(sql);
  console.log('DataVault database schema is ready.');
}
migrate().catch(error => { console.error('Migration failed:',error.message); process.exitCode=1; }).finally(() => pool.end());