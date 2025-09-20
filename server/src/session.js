import crypto from 'crypto';
import { getPool } from './mysql.js';

// Minimal cookie-based session management (no JWT) for simplicity
const SESSIONS = new Map(); // sid -> { userId, createdAt }

export function createSession(userId) {
  const sid = crypto.randomBytes(24).toString('hex');
  SESSIONS.set(sid, { userId, createdAt: Date.now() });
  return sid;
}

export function getSession(req) {
  const sid = req.cookies?.sid;
  if (!sid) return null;
  return SESSIONS.get(sid) || null;
}

export function requireAuth(req, res, next) {
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = s.userId;
  next();
}

export function clearSession(req, res) {
  const sid = req.cookies?.sid;
  if (sid) SESSIONS.delete(sid);
  res.clearCookie('sid', { httpOnly: true, sameSite: 'lax' });
}