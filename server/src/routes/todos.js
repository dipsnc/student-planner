import { Router } from 'express';
import { requireAuth } from '../session.js';
import { getPool } from '../mysql.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.query('SELECT * FROM todos WHERE user_id = :uid', { uid: req.userId });
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { id, title, dueAt, reminder, done, createdAt } = req.body;
  const db = await getPool();
  await db.query(
    `INSERT INTO todos (id, user_id, title, due_at, reminder, done, created_at)
     VALUES (:id, :uid, :title, :due_at, :reminder, :done, :created_at)`,
    { id, uid: req.userId, title, due_at: dueAt ? new Date(dueAt) : null, reminder: reminder?1:0, done: done?1:0, created_at: createdAt||Date.now() }
  );
  res.status(201).json({ id, title, dueAt, reminder, done, createdAt });
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = [];
  const params = { id, uid: req.userId };
  if (typeof updates.title !== 'undefined') { fields.push('title = :title'); params.title = updates.title; }
  if (typeof updates.dueAt !== 'undefined') { fields.push('due_at = :due_at'); params.due_at = updates.dueAt ? new Date(updates.dueAt) : null; }
  if (typeof updates.reminder !== 'undefined') { fields.push('reminder = :reminder'); params.reminder = updates.reminder ? 1 : 0; }
  if (typeof updates.done !== 'undefined') { fields.push('done = :done'); params.done = updates.done ? 1 : 0; }
  if (!fields.length) return res.status(400).json({ error: 'No updates' });
  const db = await getPool();
  await db.query(`UPDATE todos SET ${fields.join(', ')} WHERE id = :id AND user_id = :uid`, params);
  res.json({ id, ...updates });
});

router.delete('/:id', async (req, res) => {
  const db = await getPool();
  await db.query('DELETE FROM todos WHERE id = :id AND user_id = :uid', { id: req.params.id, uid: req.userId });
  res.json({ ok: true });
});

export default router;