import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from '../mysql.js';
import { createSession, clearSession, getSession } from '../session.js';

const router = Router();

router.get('/me', async (req, res) => {
  const s = getSession(req);
  if (!s) return res.json({ user: null });
  try {
    const { getUserById } = await import('../mysql.js');
    const user = await getUserById(s.userId);
    if (!user) return res.json({ user: null });
    return res.json({ user });
  } catch (e) {
    return res.json({ user: { id: s.userId } });
  }
});

router.post(
  '/signup',
  body('name').isString().isLength({ min: 1 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { name, email, password } = req.body;
      const existing = await findUserByEmail(email);
      if (existing) return res.status(400).json({ error: 'Email already exists' });

      const password_hash = await bcrypt.hash(password, 10);
      const userId = await createUser({ name, email, password_hash });

      const sid = createSession(userId);
      res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax' });
      return res.status(201).json({ id: userId, name, email });
    } catch (err) {
      return res.status(500).json({ error: 'Signup failed' });
    }
  }
);

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const sid = createSession(user.id);
    res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax' });
    res.json({ id: user.id, name: user.name, email: user.email });
  }
);

router.post('/logout', (req, res) => {
  clearSession(req, res);
  res.json({ ok: true });
});

export default router;