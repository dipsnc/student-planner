import mysql from 'mysql2/promise';

let pool;

async function ensureDatabaseExists() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'password';
  const database = process.env.DB_NAME || 'student_planner';

  const conn = await mysql.createConnection({ host, port, user, password, namedPlaceholders: true });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();
}

export async function getPool() {
  if (!pool) {
    await ensureDatabaseExists();
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'student_planner',
      connectionLimit: 10,
      namedPlaceholders: true
    });
  }
  return pool;
}

export async function ensureSchema() {
  const db = await getPool();
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await db.query(`CREATE TABLE IF NOT EXISTS todos (
    id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    due_at DATETIME NULL,
    reminder TINYINT(1) DEFAULT 0,
    done TINYINT(1) DEFAULT 0,
    created_at BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await db.query(`CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    day TINYINT NOT NULL,
    time VARCHAR(16) NULL,
    linkTaskId VARCHAR(64) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

  await db.query(`CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(16) NOT NULL,
    completedAt BIGINT NOT NULL,
    day VARCHAR(64) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
}

export async function findUserByEmail(email) {
  const db = await getPool();
  const [rows] = await db.query('SELECT * FROM users WHERE email = :email', { email });
  return rows[0] || null;
}

export async function createUser({ name, email, password_hash }) {
  const db = await getPool();
  const [res] = await db.query(
    'INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :password_hash)',
    { name, email, password_hash }
  );
  return res.insertId;
}
