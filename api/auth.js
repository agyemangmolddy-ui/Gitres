const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { pool } = require('../lib/db');
const { signSession, setSessionCookie, requireAuth, COOKIE_NAME } = require('../lib/auth');
const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts. Please wait a little and try again.' } });
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 80) return res.status(400).json({ error: 'Enter your name (2–80 characters).' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (typeof password !== 'string' || password.length < 10 || password.length > 72) return res.status(400).json({ error: 'Use a password between 10 and 72 characters.' });
    const requestedRole = role || 'buyer';
    if (!['buyer','seller'].includes(requestedRole)) return res.status(400).json({ error: 'Invalid account type.' });
    const hash = await bcrypt.hash(password, 12);
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    const accountRole = adminEmails.includes(cleanEmail) ? 'admin' : requestedRole;
    const result = await pool.query('INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role,created_at', [cleanName,cleanEmail,hash,accountRole]);
    const user = result.rows[0];
    setSessionCookie(res, signSession(user));
    res.status(201).json({ success: true, user });
  } catch (error) { next(error); }
});
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password;
    const result = await pool.query('SELECT id,name,email,password_hash,role FROM users WHERE email=$1 LIMIT 1', [email]);
    const user = result.rows[0];
    if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes(user.email) && user.role !== 'admin') {
      await pool.query("UPDATE users SET role='admin' WHERE id=$1", [user.id]);
      user.role = 'admin';
    }
    const { password_hash, ...safeUser } = user;
    setSessionCookie(res, signSession(safeUser));
    res.json({ success: true, user: safeUser });
  } catch (error) { next(error); }
});
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id,name,email,role,created_at FROM users WHERE id=$1', [req.user.id]);
    if (!result.rowCount) return res.status(401).json({ error: 'Account not found.' });
    res.json({ success: true, user: result.rows[0] });
  } catch (error) { next(error); }
});
router.post('/logout', (_req, res) => { res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' }); res.json({ success: true }); });
module.exports = router;