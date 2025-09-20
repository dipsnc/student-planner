# Student Planner

This project is a simple student planner SPA with a Node.js + Express + MySQL backend.

## Getting Started

### Cloning the repository and running locally
Follow these steps after cloning the repo to run the project on your machine.

Prerequisites
- Git
- Node.js (LTS recommended). Verify with: `node -v`
- MySQL 8.x (or compatible) running locally. Know your host, port, username, and password.

Steps
1. Clone the repository and go into the project directory
   - `git clone https://github.com/dipsnc/student-planner.git`
   - `cd student-planner`
   - If the changes are still on a feature branch, switch to it:
     - `git switch feat/node-express-mysql`

2. Configure the server environment variables
   - Copy the example env file:
     - PowerShell: `Copy-Item server/.env.example server/.env`
     - macOS/Linux: `cp server/.env.example server/.env`
   - Edit `server/.env` and set `DB_USER`, `DB_PASSWORD`, `DB_PORT` if needed to match your local MySQL.
   - The server will create the `student_planner` database and tables if they don’t exist.

3. Install backend dependencies
   - Option A (stay in project root): `npm --prefix server install`
   - Option B (cd into server):
     - `cd server`
     - `npm install`

4. Start the backend server
   - If you’re in project root: `npm --prefix server start`
   - If you’re in server folder: `npm start`
   - The server will start on http://localhost:3000 and serve the frontend and API.

5. Use the app
   - Open http://localhost:3000 in your browser.
   - Use Sign Up to create an account; then log in to access To-Do, Pomodoro, and Timetable.

Troubleshooting
- Cannot connect to MySQL (ECONNREFUSED): ensure the MySQL service is running and that `server/.env` matches your credentials.
- Access denied: check `DB_USER`/`DB_PASSWORD`, or create a dedicated MySQL user with privileges for `student_planner`.
- Port conflicts: if MySQL uses a non-default port, set `DB_PORT` accordingly in `server/.env`.
- Cookies/auth issues: ensure your browser allows cookies for `http://localhost:3000`.

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

The server auto-creates the database (if missing) and required tables on first run.

## API Overview
- Auth: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Todos: `GET /api/todos`, `POST /api/todos`, `PATCH /api/todos/:id`, `DELETE /api/todos/:id`
- Events: `GET /api/events`, `POST /api/events/upsert`, `DELETE /api/events/:id`
- Sessions: `GET /api/sessions`, `POST /api/sessions`
