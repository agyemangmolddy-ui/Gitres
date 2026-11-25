const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRouter = require('./auth');
const bundlesRouter = require('./bundles');
const ordersRouter = require('./orders');
const { pool } = require('../lib/db');

const app = express();
app.disable('x-powered-by');
// Vercel runs this app behind its proxy; trust the platform's forwarded client IP.
app.set('trust proxy', 1);

app.use((req, _res, next) => {
  if (req.query && typeof req.query.path === 'string') {
    const extra = new URLSearchParams(req.query);
    extra.delete('path');
    req.url = '/api/' + req.query.path.split('/').filter(Boolean).join('/') +
      (extra.toString() ? '?' + extra.toString() : '');
  }
  next();
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 180,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

app.use('/api/auth', authRouter);
app.use('/api/bundles', bundlesRouter);
app.use('/api/orders', ordersRouter);

app.get('/api/health', async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({
      ok: false, service: 'DataVault', code: 'DATABASE_URL_MISSING',
      error: 'The store database is not connected. Add DATABASE_URL to the deployment environment.'
    });
  }
  try {
    const check = await pool.query(
      "SELECT to_regclass('public.users') AS users_table, to_regclass('public.telecom_bundles') AS bundles_table, to_regclass('public.bundle_orders') AS orders_table"
    );
    const schemaReady = Object.values(check.rows[0]).every(Boolean);
    if (!schemaReady) {
      return res.status(503).json({
        ok: false, service: 'DataVault', code: 'DATABASE_SCHEMA_MISSING',
        error: 'The database is connected, but its tables are not ready. Run npm run db:migrate.'
      });
    }
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, service: 'DataVault', database: 'connected', schema: 'ready' });
  } catch (error) {
    console.error('DataVault health check failed:', error.code || error.message);
    res.status(503).json({
      ok: false, service: 'DataVault', code: 'DATABASE_UNAVAILABLE',
      error: 'The database could not be reached. Check the Neon connection string and database availability.'
    });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'API route not found.' });
});

app.use((err, _req, res, _next) => {
  console.error('DataVault API failure:', { code: err.code, message: err.message, stack: err.stack });
  if (res.headersSent) return;
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'The request body is not valid JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'The request is too large.' });
  }
  if (err.code === '23505') {
    return res.status(409).json({ success: false, error: 'This record already exists.' });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({
      success: false, code: 'DATABASE_URL_MISSING',
      error: 'The store database is not connected. Add DATABASE_URL to your Vercel environment variables.'
    });
  }
  if (err.code === '42P01') {
    return res.status(503).json({
      success: false, code: 'DATABASE_SCHEMA_MISSING',
      error: 'The database tables are missing. Run npm run db:migrate against your Neon database.'
    });
  }
  if (err.code === '42703') {
    return res.status(503).json({
      success: false, code: 'DATABASE_SCHEMA_OUTDATED',
      error: 'The database needs the latest schema update. Run npm run db:migrate again.'
    });
  }
  if (['ECONNREFUSED','ECONNRESET','ENOTFOUND','ETIMEDOUT','28P01','3D000'].includes(err.code)) {
    return res.status(503).json({
      success: false, code: 'DATABASE_UNAVAILABLE',
      error: 'The store database is unavailable. Check your Neon connection string and database status.'
    });
  }
  res.status(err.status >= 400 && err.status < 600 ? err.status : 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'The request could not be completed. Check the server logs for details.'
      : (err.message || 'Something went wrong. Please try again.')
  });
});

module.exports = app;