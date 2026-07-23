const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = process.env.TEST_DB_PATH || path.join(dbDir, 'appsync.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT,
      is_admin INTEGER DEFAULT 0,
      token_version INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      scan_data TEXT NOT NULL,
      machine_name TEXT,
      scan_mode TEXT DEFAULT 'standard',
      scan_time TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_inventories_user_id ON inventories(user_id);
    CREATE INDEX IF NOT EXISTS idx_inventories_scan_time ON inventories(scan_time);

    CREATE TABLE IF NOT EXISTS download_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      software_name TEXT NOT NULL,
      aliases TEXT DEFAULT '[]',
      official_url TEXT NOT NULL,
      direct_download_url TEXT,
      category TEXT,
      verified INTEGER DEFAULT 0,
      contributor_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_download_links_name ON download_links(software_name);
    CREATE INDEX IF NOT EXISTS idx_download_links_verified ON download_links(verified);
  `);
  try { db.exec('ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0'); } catch {}
  console.log('Database initialized');
}

init();

module.exports = {
  query: (sql, params = []) => {
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    try {
      if (isSelect) {
        const rows = db.prepare(sql).all(...params);
        return { rows };
      } else {
        const stmt = db.prepare(sql);
        const info = stmt.run(...params);
        return { rows: [{ id: Number(info.lastInsertRowid) }], changes: info.changes };
      }
    } catch (err) {
      console.error('SQLite error:', err.message);
      console.error('SQL:', sql);
      throw err;
    }
  },
  close: () => db.close(),
  db,
};
