import { Router } from 'express';
import { requireAuth } from '../session.js';
import { getPool } from '../mysql.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.query('SELECT * FROM sessions WHERE user_id = :uid', { uid: req.userId });
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { id, type, completedAt, day } = req.body;
  const db = await getPool();
  await db.query(
    `INSERT INTO sessions (id, user_id, type, completedAt, day)
     VALUES (:id, :uid, :type, :completedAt, :day)`,
    { id, uid: req.userId, type, completedAt, day }
  );
  res.status(201).json({ id, type, completedAt, day });
});

export default router;