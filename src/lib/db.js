import Database from 'better-sqlite3';
import path from 'path';
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);
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
export function saveFileHistory(uid, fileName, toolName) {
    const stmt = db.prepare(`
    INSERT INTO file_history (uid, file_name, tool_name)
    VALUES (?, ?, ?)
  `);
    stmt.run(uid, fileName, toolName);
}
export function getFileHistory(uid) {
    const stmt = db.prepare(`
    SELECT id, uid, file_name as fileName, tool_name as toolName, timestamp
    FROM file_history
    WHERE uid = ?
    ORDER BY timestamp DESC
    LIMIT 50
  `);
    return stmt.all(uid);
}
export function upsertUser(user) {
    // If a user with the same email exists but has a different ID, delete it to avoid UNIQUE constraint failure
    try {
        const checkEmail = db.prepare('SELECT id FROM users WHERE email = ?');
        const existingByEmail = checkEmail.get(user.email);
        if (existingByEmail && existingByEmail.id !== user.id) {
            const deleteOld = db.prepare('DELETE FROM users WHERE id = ?');
            deleteOld.run(existingByEmail.id);
        }
    }
    catch (err) {
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
}
export function getUserById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
}
