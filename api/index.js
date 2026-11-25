const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRouter = require('./auth');
const datasetsRouter = require('./datasets');
const purchasesRouter = require('./purchases');
const { pool } = require('../lib/db');

const app = express();
app.disable('x-powered-by');
// Vercel rewrites /api/* to this function and passes the original route in ?path=.
app.use((req, _res, next) => {
  if (req.query && typeof req.query.path === 'string') {
    const extra = new URLSearchParams(req.query);
    extra.delete('path');
    req.url = '/api/' + String(req.query.path).split('/').filter(Boolean).join('/') + (extra.toString() ? '?' + extra.toString() : '');
  }
  next();
});
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 180, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/auth', authRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/purchases', purchasesRouter);
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, service: 'DataVault API', database: 'connected' }); }
  catch { res.status(503).json({ ok: false, service: 'DataVault API', database: 'unavailable' }); }
});
app.use((err, _req, res, _next) => {
  console.error('API error:', err.message);
  if (err.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});
module.exports = app;