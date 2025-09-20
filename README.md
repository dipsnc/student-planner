# Student Planner

This project is a simple student planner SPA with a Node.js + Express + MySQL backend.

## Getting Started

### Option A: Run with local MySQL (no Docker)
1. Install MySQL locally (Windows: use MySQL Installer or WAMP/XAMPP). Note your MySQL host, port, username, and password.
2. Copy env file and set your local credentials:
   - `Copy-Item server/.env.example server/.env` (PowerShell)
   - Edit `server/.env` and set DB_USER/DB_PASSWORD/DB_PORT if needed.
   - The server will automatically create the `student_planner` database and tables on first run.
3. Install and start the server:
   - `npm --prefix server install`
   - `npm --prefix server start`
   - Open http://localhost:3000

### Option B: Run with Docker (MySQL in container)
1. Install Docker Desktop and start it.
2. `docker compose up -d`
3. Copy `server/.env.example` to `server/.env` (defaults match compose).
4. `npm --prefix server install` and `npm --prefix server start`
5. Open http://localhost:3000

The server auto-creates the database (if missing) and required tables on first start.

## API Overview
- Auth: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Todos: `GET /api/todos`, `POST /api/todos`, `PATCH /api/todos/:id`, `DELETE /api/todos/:id`
- Events: `GET /api/events`, `POST /api/events/upsert`, `DELETE /api/events/:id`
- Sessions: `GET /api/sessions`, `POST /api/sessions`
