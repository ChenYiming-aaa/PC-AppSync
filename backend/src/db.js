const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const databaseUrl = process.env.DATABASE_URL;

function convertParams(sql, params) {
  let idx = 0;
  const converted = sql.replace(/\?/g, () => '$' + (++idx)).replace(/datetime\('now'\)/g, 'NOW()');
  return { sql: converted, params };
}

let db;
let isPostgres = false;

if (databaseUrl) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 10000 });
  pool.on('error', err => console.error('PG pool error:', err.message));
  db = {
    query: async (sql, params) => {
      const adapted = convertParams(sql, params || []);
      try {
        const result = await pool.query(adapted.sql, adapted.params);
        return { rows: result.rows, changes: result.rowCount };
      } catch (err) {
        console.error('PG error:', err.message);
        console.error('SQL:', adapted.sql);
        throw err;
      }
    },
    close: async () => { await pool.end(); },
  };
  isPostgres = true;
  console.log('Database: PostgreSQL');
} else {
  var dbDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  var dbPath = process.env.TEST_DB_PATH || path.join(dbDir, 'appsync.db');
  var sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  db = {
    query: function(sql, params) {
      var isDDL = sql.trim().toUpperCase().startsWith('CREATE') || sql.trim().toUpperCase().startsWith('ALTER');
      try {
        if (isDDL) {
          sqlite.exec(sql);
          return { rows: [] };
        }
        var isSelect = sql.trim().toUpperCase().startsWith('SELECT');
        if (isSelect) {
          var rows = sqlite.prepare(sql).all.apply(sqlite.prepare(sql), params || []);
          return { rows: rows };
        } else {
          var stmt = sqlite.prepare(sql);
          var info = stmt.run.apply(stmt, params || []);
          var result = { changes: info.changes };
          if (sql.toUpperCase().indexOf('RETURNING') >= 0) {
            result.rows = [{ id: Number(info.lastInsertRowid) }];
          } else {
            result.rows = [];
          }
          return result;
        }
      } catch (err) {
        console.error('SQLite error:', err.message);
        console.error('SQL:', sql);
        throw err;
      }
    },
    close: function() { sqlite.close(); },
  };
  console.log('Database: SQLite');
}

function init() {
  var usersDDL, invDDL, linksDDL;
  
  if (isPostgres) {
    usersDDL = "CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, nickname TEXT, is_admin INTEGER DEFAULT 0, token_version INTEGER DEFAULT 0, created_at TEXT DEFAULT NOW(), updated_at TEXT DEFAULT NOW());";
    invDDL = "CREATE TABLE IF NOT EXISTS inventories (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, scan_data TEXT NOT NULL, machine_name TEXT, scan_mode TEXT DEFAULT 'standard', scan_time TEXT, created_at TEXT DEFAULT NOW());";
    linksDDL = "CREATE TABLE IF NOT EXISTS download_links (id SERIAL PRIMARY KEY, software_name TEXT NOT NULL, aliases TEXT DEFAULT '[]', official_url TEXT NOT NULL, direct_download_url TEXT, category TEXT, verified INTEGER DEFAULT 0, contributor_id INTEGER REFERENCES users(id), created_at TEXT DEFAULT NOW(), updated_at TEXT DEFAULT NOW());";
  } else {
    usersDDL = "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, nickname TEXT, is_admin INTEGER DEFAULT 0, token_version INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));";
    invDDL = "CREATE TABLE IF NOT EXISTS inventories (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, scan_data TEXT NOT NULL, machine_name TEXT, scan_mode TEXT DEFAULT 'standard', scan_time TEXT, created_at TEXT DEFAULT (datetime('now')));";
    linksDDL = "CREATE TABLE IF NOT EXISTS download_links (id INTEGER PRIMARY KEY AUTOINCREMENT, software_name TEXT NOT NULL, aliases TEXT DEFAULT '[]', official_url TEXT NOT NULL, direct_download_url TEXT, category TEXT, verified INTEGER DEFAULT 0, contributor_id INTEGER REFERENCES users(id), created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));";
  }

  db.query(usersDDL);
  db.query(invDDL);
  db.query("CREATE INDEX IF NOT EXISTS idx_inventories_user_id ON inventories(user_id);");
  db.query("CREATE INDEX IF NOT EXISTS idx_inventories_scan_time ON inventories(scan_time);");
  db.query(linksDDL);
  db.query("CREATE INDEX IF NOT EXISTS idx_download_links_name ON download_links(software_name);");
  db.query("CREATE INDEX IF NOT EXISTS idx_download_links_verified ON download_links(verified);");
  
  if (!isPostgres) {
    try { db.query("ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0"); } catch (e) {}
  }
  console.log('Database initialized');
}

init();

module.exports = db;
