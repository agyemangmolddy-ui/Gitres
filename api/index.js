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

// Vercel rewrites /api/:path* to this function with the original path in ?path=.
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
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'DataVault', database: 'connected' });
  } catch {
    res.status(503).json({ ok: false, service: 'DataVault', database: 'unavailable' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'API route not found.' });
});

// Keep API failures JSON, including malformed request bodies from express.json().
app.use((err, _req, res, _next) => {
  console.error('API error:', err.message);
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
  res.status(err.status >= 400 && err.status < 600 ? err.status : 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'A server error occurred. Please try again.'
      : (err.message || 'Something went wrong. Please try again.')
  });
});

module.exports = app;