# Student Planner

This project is a simple student planner SPA with a Node.js + Express + MySQL backend.

## Getting Started

1. Start MySQL via Docker (recommended):
   - Install Docker Desktop
   - Run: `docker compose up -d`

2. Configure server environment:
   - Copy `server/.env.example` to `server/.env` and adjust if needed.

3. Start the server:
   - `npm --prefix server install` (if you plan to run locally)
   - `npm --prefix server start`
   - Open http://localhost:3000

The server will auto-create required tables on first start.

## API Overview
- Auth: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Todos: `GET /api/todos`, `POST /api/todos`, `PATCH /api/todos/:id`, `DELETE /api/todos/:id`
- Events: `GET /api/events`, `POST /api/events/upsert`, `DELETE /api/events/:id`
- Sessions: `GET /api/sessions`, `POST /api/sessions`
