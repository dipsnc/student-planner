import { Router } from 'express';
import { requireAuth } from '../session.js';
import { getPool } from '../mysql.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.query('SELECT * FROM events WHERE user_id = :uid', { uid: req.userId });
  res.json(rows);
});

// Upsert by id
router.post('/upsert', async (req, res) => {
  const { id, title, day, time, linkTaskId } = req.body;
  const db = await getPool();
  await db.query(
    `INSERT INTO events (id, user_id, title, day, time, linkTaskId)
     VALUES (:id, :uid, :title, :day, :time, :linkTaskId)
     ON DUPLICATE KEY UPDATE title = VALUES(title), day = VALUES(day), time = VALUES(time), linkTaskId = VALUES(linkTaskId)`,
    { id, uid: req.userId, title, day, time: time || null, linkTaskId: linkTaskId || null }
  );
  res.json({ id, title, day, time, linkTaskId });
});

router.delete('/:id', async (req, res) => {
  const db = await getPool();
  await db.query('DELETE FROM events WHERE id = :id AND user_id = :uid', { id: req.params.id, uid: req.userId });
  res.json({ ok: true });
});

export default router;