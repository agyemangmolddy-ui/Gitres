const express = require('express');
const { pool } = require('../lib/db');
const { requireAuth, requireRole } = require('../lib/auth');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 24, 1), 100);
    const search = String(req.query.search || '').trim().slice(0, 100);
    const category = String(req.query.category || '').trim().slice(0, 40);
    const values = [];
    let where = "status = 'published'";
    if (search) { values.push(`%${search}%`); where += ` AND (title ILIKE $1 OR description ILIKE $1 OR category ILIKE $1)`; }
    if (category && category !== 'all') { values.push(category); where += ` AND category = $${values.length}`; }
    values.push(limit);
    const result = await pool.query(
      `SELECT id, title, description, category, price, currency, coverage, records_label, licence_summary, created_at
       FROM datasets WHERE ${where} ORDER BY created_at DESC LIMIT $${values.length}`, values
    );
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, count: result.rowCount, datasets: result.rows });
  } catch (error) { next(error); }
});

router.get('/review-queue', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id,title,description,category,price,currency,coverage,source_description,created_at FROM datasets WHERE status='pending' ORDER BY created_at ASC LIMIT 100");
    res.json({ success: true, datasets: result.rows });
  } catch (error) { next(error); }
});

router.get('/mine', requireAuth, requireRole('seller', 'admin'), async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id,title,category,price,currency,status,created_at FROM datasets WHERE seller_id=$1 ORDER BY created_at DESC LIMIT 100', [req.user.id]);
    res.json({ success: true, datasets: result.rows });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requireRole('seller', 'admin'), async (req, res, next) => {
  try {
    const { title, description, category, price, coverage, recordsLabel, licenceSummary, sourceDescription, rightsConfirmed, privacyConfirmed } = req.body || {};
    const allowed = ['payments','banking','business','markets','mobility','economy','other'];
    if (typeof title !== 'string' || title.trim().length < 4 || title.length > 120) return res.status(400).json({ error: 'Enter a dataset title between 4 and 120 characters.' });
    if (typeof description !== 'string' || description.trim().length < 20 || description.length > 2000) return res.status(400).json({ error: 'Add a clear description of at least 20 characters.' });
    if (!allowed.includes(category)) return res.status(400).json({ error: 'Choose a valid category.' });
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount < 0 || amount > 10000000) return res.status(400).json({ error: 'Enter a valid price in GHS.' });
    if (typeof sourceDescription !== 'string' || sourceDescription.trim().length < 10) return res.status(400).json({ error: 'Describe the data source and how it was collected.' });
    if (rightsConfirmed !== true || privacyConfirmed !== true) return res.status(400).json({ error: 'Confirm your rights to share the data and that it contains no identifiable personal or financial records.' });
    const result = await pool.query(
      `INSERT INTO datasets (seller_id,title,description,category,price,currency,coverage,records_label,licence_summary,source_description,rights_confirmed,privacy_confirmed,status)
       VALUES ($1,$2,$3,$4,$5,'GHS',$6,$7,$8,$9,true,true,'pending')
       RETURNING id,title,status,created_at`,
      [req.user.id,title.trim(),description.trim(),category,amount,coverage || null,recordsLabel || null,licenceSummary || null,sourceDescription.trim()]
    );
    res.status(201).json({ success: true, dataset: result.rows[0], message: 'Your listing was submitted for review. It will not appear publicly until approved.' });
  } catch (error) { next(error); }
});

router.patch('/:id/review', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!['published','rejected'].includes(status)) return res.status(400).json({ error: 'Review status must be published or rejected.' });
    const result = await pool.query('UPDATE datasets SET status=$1, reviewed_at=NOW() WHERE id=$2 RETURNING id,status', [status, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Dataset not found.' });
    res.json({ success: true, dataset: result.rows[0] });
  } catch (error) { next(error); }
});

module.exports = router;