import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let db: any = null;

// In-memory fallback
const memoryUsers = new Map<string, User>();
const memoryHistory: any[] = [];

try {
  const Database = require('better-sqlite3');
  const dbPath = process.env.VERCEL ? '/tmp/database.sqlite' : path.join(process.cwd(), 'database.sqlite');
  db = new Database(dbPath);

  // إنشاء جدول المستخدمين إذا لم يكن موجوداً
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      picture TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS file_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT NOT NULL,
      file_name TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
} catch (error) {
  console.error('Failed to initialize SQLite, falling back to memory database:', error);
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export function saveFileHistory(uid: string, fileName: string, toolName: string) {
  if (db) {
    const stmt = db.prepare(`
      INSERT INTO file_history (uid, file_name, tool_name)
      VALUES (?, ?, ?)
    `);
    stmt.run(uid, fileName, toolName);
  } else {
    memoryHistory.push({
      id: memoryHistory.length + 1,
      uid,
      file_name: fileName,
      tool_name: toolName,
      timestamp: new Date().toISOString()
    });
  }
}

export function getFileHistory(uid: string) {
  if (db) {
    const stmt = db.prepare(`
      SELECT id, uid, file_name as fileName, tool_name as toolName, timestamp
      FROM file_history
      WHERE uid = ?
      ORDER BY timestamp DESC
      LIMIT 50
    `);
    return stmt.all(uid) as { id: number; uid: string; fileName: string; toolName: string; timestamp: string }[];
  } else {
    return memoryHistory
      .filter(h => h.uid === uid)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50)
      .map(h => ({
        id: h.id,
        uid: h.uid,
        fileName: h.file_name,
        toolName: h.tool_name,
        timestamp: h.timestamp
      }));
  }
}

export function upsertUser(user: User) {
  if (db) {
    // If a user with the same email exists but has a different ID, delete it to avoid UNIQUE constraint failure
    try {
      const checkEmail = db.prepare('SELECT id FROM users WHERE email = ?');
      const existingByEmail = checkEmail.get(user.email) as { id: string } | undefined;
      if (existingByEmail && existingByEmail.id !== user.id) {
        const deleteOld = db.prepare('DELETE FROM users WHERE id = ?');
        deleteOld.run(existingByEmail.id);
      }
    } catch (err) {
      console.error('Error checking/clearing unique email constraint in sqlite:', err);
    }

    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, picture, last_login)
      VALUES (@id, @name, @email, @picture, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        picture = excluded.picture,
        last_login = CURRENT_TIMESTAMP
    `);
    stmt.run(user);
  } else {
    // Fallback: Remove old user map entries by email
    for (const [id, u] of memoryUsers.entries()) {
      if (u.email === user.email && id !== user.id) {
        memoryUsers.delete(id);
      }
    }
    memoryUsers.set(user.id, user);
  }
}

export function getUserById(id: string): User | undefined {
  if (db) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  } else {
    return memoryUsers.get(id);
  }
}
