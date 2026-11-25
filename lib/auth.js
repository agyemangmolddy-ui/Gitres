const jwt = require('jsonwebtoken');
const COOKIE_NAME = 'datavault_session';
function signSession(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
}
function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || !process.env.JWT_SECRET) return res.status(401).json({ error: 'Please log in to continue.' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.clearCookie(COOKIE_NAME, { path: '/' }); return res.status(401).json({ error: 'Your session has expired. Please log in again.' }); }
}
function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'You do not have permission to do that.' });
}
module.exports = { signSession, setSessionCookie, requireAuth, requireRole, COOKIE_NAME };