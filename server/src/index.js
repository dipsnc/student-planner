import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getPool, ensureSchema } from './mysql.js';
import authRouter from './routes/auth.js';
import todosRouter from './routes/todos.js';
import eventsRouter from './routes/events.js';
import sessionsRouter from './routes/sessions.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || undefined; // default same-origin

app.use(express.json());
app.use(cookieParser());
if (CORS_ORIGIN) {
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
}

// health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// routers (protected via simple session middleware)
app.use('/api/auth', authRouter);
app.use('/api/todos', todosRouter);
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);

// Serve frontend statically from repo root
const rootDir = path.resolve(__dirname, '..', '..');
app.use(express.static(rootDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

(async () => {
  try {
    // init db and schema
    await getPool();
    await ensureSchema();
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();