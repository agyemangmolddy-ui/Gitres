const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../lib/db');
const { signSession, setSessionCookie, requireAuth, COOKIE_NAME } = require('../lib/auth');

const router = express.Router();
const googleClient = new OAuth2Client();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a little and try again.' }
});
const adminEmails = () => (process.env.ADMIN_EMAILS || '')
  .split(',').map(x => x.trim().toLowerCase()).filter(Boolean);

router.get('/google/config', (_req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ success: false, error: 'Google sign-in is not configured yet.' });
  }
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, clientId: process.env.GOOGLE_CLIENT_ID });
});

router.post('/google', authLimiter, async (req, res, next) => {
  try {
    const credential = req.body?.credential;
    if (typeof credential !== 'string' || !credential) {
      return res.status(400).json({ success: false, error: 'Google did not return a sign-in credential.' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ success: false, error: 'Google sign-in is not configured yet.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || profile.email_verified !== true) {
      return res.status(401).json({ success: false, error: 'Google could not verify this email address.' });
    }

    const email = profile.email.trim().toLowerCase();
    const subject = profile.sub;
    const name = String(profile.name || profile.given_name || email.split('@')[0]).trim().slice(0, 80) || 'Google user';
    const allowedAdmins = adminEmails();

    let result = await pool.query(
      'SELECT id,name,email,role,google_sub FROM users WHERE google_sub=$1 OR email=$2 LIMIT 1',
      [subject, email]
    );
    let user = result.rows[0];

    if (user) {
      if (user.google_sub && user.google_sub !== subject) {
        return res.status(409).json({ success: false, error: 'This email is already linked to a different Google account.' });
      }
      const role = allowedAdmins.includes(email) ? 'admin' : user.role;
      result = await pool.query(
        'UPDATE users SET google_sub=$1, role=$2 WHERE id=$3 RETURNING id,name,email,role',
        [subject, role, user.id]
      );
      user = result.rows[0];
    } else {
      const role = allowedAdmins.includes(email) ? 'admin' : 'buyer';
      result = await pool.query(
        'INSERT INTO users (name,email,password_hash,role,google_sub) VALUES ($1,$2,NULL,$3,$4) RETURNING id,name,email,role',
        [name, email, role, subject]
      );
      user = result.rows[0];
    }

    setSessionCookie(res, signSession(user));
    res.json({ success: true, user });
  } catch (error) {
    if (error.name === 'Error' && /Token used too early|Token used too late|Invalid token|Wrong number of segments/i.test(error.message)) {
      return res.status(401).json({ success: false, error: 'Google sign-in expired or could not be verified. Please try again.' });
    }
    next(error);
  }
});

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
    const accountRole = adminEmails().includes(cleanEmail) ? 'admin' : requestedRole;
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
    if (!user || !user.password_hash || typeof password !== 'string' || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const accountRole = adminEmails().includes(user.email) ? 'admin' : user.role;
    if (accountRole !== user.role) {
      await pool.query('UPDATE users SET role=$1 WHERE id=$2', [accountRole, user.id]);
      user.role = accountRole;
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

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  res.json({ success: true });
});

module.exports = router;