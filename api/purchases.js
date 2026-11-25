const express = require('express');
const { pool } = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const router = express.Router();
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const datasetId = String(req.body?.datasetId || '');
    const note = String(req.body?.note || '').trim().slice(0, 1000);
    const dataset = await pool.query("SELECT id,title,seller_id,price,currency FROM datasets WHERE id=$1 AND status='published'", [datasetId]);
    if (!dataset.rowCount) return res.status(404).json({ error: 'This dataset is not available.' });
    if (dataset.rows[0].seller_id === req.user.id) return res.status(400).json({ error: 'You cannot request your own dataset.' });
    const result = await pool.query(
      "INSERT INTO purchase_requests (buyer_id,dataset_id,price,currency,buyer_note,status) VALUES ($1,$2,$3,$4,$5,'pending') RETURNING id,status,created_at",
      [req.user.id,datasetId,dataset.rows[0].price,dataset.rows[0].currency,note || null]
    );
    res.status(201).json({ success: true, request: result.rows[0], message: 'Your request has been sent. No payment has been taken.' });
  } catch (error) { next(error); }
});
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT pr.id,pr.status,pr.price,pr.currency,pr.created_at,d.title AS dataset_title
       FROM purchase_requests pr JOIN datasets d ON d.id=pr.dataset_id
       WHERE pr.buyer_id=$1 ORDER BY pr.created_at DESC LIMIT 100`, [req.user.id]);
    res.json({ success: true, requests: result.rows });
  } catch (error) { next(error); }
});
module.exports = router;