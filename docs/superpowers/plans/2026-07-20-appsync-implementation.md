# AppSync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows desktop app (Tauri + Rust + React) + Node.js backend that scans installed software/runtimes, syncs inventory to cloud, and provides official download links.

**Architecture:** Two independent subsystems: a Node.js/Express REST API (backend) with PostgreSQL, and a Tauri desktop client (Rust scanner + React UI). Communication via HTTPS JSON. No search API dependency -- fallback opens system browser.

**Tech Stack:** Tauri 2.x, Rust, React 18, Node.js 20+, Express, PostgreSQL 14+

---

## File Structure

```
appsync/
  backend/
    src/
      index.js
      config.js
      db.js
      middleware/auth.js
      routes/auth.js
      routes/inventories.js
      routes/downloads.js
      seed.js
    migrations/001_init.sql
    data/builtin-links.json
    package.json
    .env.example
  desktop/
    src/
      App.tsx
      main.tsx
      api/client.ts
      api/scanner.ts
      pages/Dashboard.tsx
      pages/Inventory.tsx
      pages/Downloads.tsx
      components/Layout.tsx
      components/LoginForm.tsx
      components/AppCard.tsx
      components/ScanButton.tsx
      types.ts
    src-tauri/
      src/main.rs
      src/commands.rs
      src/scanner/mod.rs
      src/scanner/registry.rs
      src/scanner/package_managers.rs
      src/scanner/runtimes.rs
      src/scanner/deep_scan.rs
      Cargo.toml
      tauri.conf.json
    index.html
    package.json
    tsconfig.json
    vite.config.ts
```


## Phase 1: Backend API

### Task 1: Project scaffolding and database setup

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `backend/.env`
- Create: `backend/src/config.js`
- Create: `backend/src/db.js`
- Create: `backend/migrations/001_init.sql`
- Create: `backend/src/index.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "appsync-backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "migrate": "psql $DATABASE_URL -f migrations/001_init.sql",
    "seed": "node src/seed.js"
  },
  "dependencies": {
    "express": "^4.19.0",
    "pg": "^8.12.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0"
  }
}
```

- [ ] **Step 2: Create .env.example**

```
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/appsync
JWT_SECRET=change-this-to-a-random-secret
JWT_EXPIRES_IN=7d
```

- [ ] **Step 3: Create src/config.js**

```js
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
```

- [ ] **Step 4: Create src/db.js**

```js
const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({ connectionString: config.databaseUrl });

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
```

### Task 2: User authentication routes

**Files:**
- Create: ackend/src/middleware/auth.js
- Create: ackend/src/routes/auth.js

- [ ] **Step 1: Create auth middleware**

\\\js
const jwt = require('jsonwebtoken');
const config = require('../config');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    req.isAdmin = decoded.isAdmin || false;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
\\\

- [ ] **Step 2: Create auth routes**

\\\js
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const authMiddleware = require('../middleware/auth');

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const existing = await db.query('SELECT id FROM users WHERE email = \', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, nickname) VALUES (\, \, \) RETURNING id, email, nickname, created_at',
      [email, passwordHash, nickname || email.split('@')[0]]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const result = await db.query('SELECT id, email, password_hash, nickname, is_admin FROM users WHERE email = \', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.id, isAdmin: user.is_admin }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({
      token,
      user: { id: user.id, email: user.email, nickname: user.nickname, is_admin: user.is_admin }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, nickname, is_admin, created_at FROM users WHERE id = \', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
\\\

- [ ] **Step 3: Test auth endpoints**

Run:
\\\
curl -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}'
\\\
Expected: 201 with token + user

Run:
\\\
curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}'
\\\
Expected: 200 with token

- [ ] **Step 4: Commit**

\\\
git add backend/src/middleware/auth.js backend/src/routes/auth.js
git commit -m "feat(backend): user registration and login with JWT"
\\\

---

### Task 3: Inventory CRUD routes

**Files:**
- Create: ackend/src/routes/inventories.js

- [ ] **Step 1: Create inventory routes**

`js
const { Router } = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { scan_data, machine_name, scan_mode, scan_time } = req.body;
    if (!scan_data) {
      return res.status(400).json({ error: 'scan_data required' });
    }
    const result = await db.query(
      'INSERT INTO inventories (user_id, scan_data, machine_name, scan_mode, scan_time) VALUES (\, \, \, \, \) RETURNING id, created_at',
      [req.userId, JSON.stringify(scan_data), machine_name || null, scan_mode || 'standard', scan_time || new Date().toISOString()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Upload inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, machine_name, scan_mode, scan_time, created_at FROM inventories WHERE user_id = \ ORDER BY scan_time DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List inventories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, machine_name, scan_mode, scan_time, scan_data, created_at FROM inventories WHERE user_id = \ ORDER BY scan_time DESC LIMIT 1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No inventory found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get latest inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, machine_name, scan_mode, scan_time, scan_data, created_at FROM inventories WHERE id = \ AND user_id = \',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM inventories WHERE id = \ AND user_id = \ RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
`

- [ ] **Step 2: Test inventory upload**

Run:
`
curl -X POST http://localhost:3000/api/v1/inventories -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d '{"scan_data":{"machine_name":"TEST-PC","scan_time":"2026-07-20T10:00:00Z","applications":[{"name":"TestApp","version":"1.0"}],"runtimes":[]},"machine_name":"TEST-PC"}'
`
Expected: 201 with id

- [ ] **Step 3: Commit**
`
git add backend/src/routes/inventories.js
git commit -m "feat(backend): inventory CRUD routes"
`

---
### Task 4: Download links search routes

**Files:**
- Create: ackend/src/routes/downloads.js

- [ ] **Step 1: Create download routes**

`js
const { Router } = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query param q required' });
    const result = await db.query(
      'SELECT id, software_name, aliases, official_url, direct_download_url, category, verified FROM download_links WHERE software_name ILIKE \ OR \ = ANY(aliases) ORDER BY verified DESC, software_name ASC LIMIT 20',
      ['%' + q + '%', q]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/links', async (req, res) => {
  try {
    const { software_name, aliases, official_url, direct_download_url, category } = req.body;
    if (!software_name || !official_url) {
      return res.status(400).json({ error: 'software_name and official_url required' });
    }
    const result = await db.query(
      'INSERT INTO download_links (software_name, aliases, official_url, direct_download_url, category, contributor_id) VALUES (\, \, \, \, \, \) RETURNING id',
      [software_name, aliases || [], official_url, direct_download_url || null, category || null, req.userId]
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Submitted for review' });
  } catch (err) {
    console.error('Submit link error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/links/pending', async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  const result = await db.query(
    'SELECT dl.*, u.email as contributor_email FROM download_links dl LEFT JOIN users u ON dl.contributor_id = u.id WHERE dl.verified = false ORDER BY dl.created_at ASC'
  );
  res.json(result.rows);
});

router.put('/links/:id/verify', async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin only' });
  const result = await db.query(
    'UPDATE download_links SET verified = \, updated_at = NOW() WHERE id = \ RETURNING id',
    [req.body.verified === true, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ updated: true });
});

module.exports = router;
`

- [ ] **Step 2: Test search endpoint**

Run:
`
curl -H "Authorization: Bearer TOKEN" "http://localhost:3000/api/v1/downloads/search?q=vscode"
`
Expected: 200 with results (once seeded)

- [ ] **Step 3: Commit**
`
git add backend/src/routes/downloads.js
git commit -m "feat(backend): download links search and contribution routes"
`

---
### Task 5: Seed built-in download links

**Files:**
- Create: ackend/data/builtin-links.json
- Create: ackend/src/seed.js

- [ ] **Step 1: Create seed script**

`js
const db = require('./db');
const links = require('../data/builtin-links.json');

async function seed() {
  console.log('Seeding download links...');
  let count = 0;
  for (const link of links) {
    const existing = await db.query('SELECT id FROM download_links WHERE software_name = \', [link.software_name]);
    if (existing.rows.length === 0) {
      await db.query(
        'INSERT INTO download_links (software_name, aliases, official_url, direct_download_url, category, verified) VALUES (\, \, \, \, \, \)',
        [link.software_name, link.aliases, link.official_url, link.direct_download_url || null, link.category, link.verified]
      );
      count++;
    }
  }
  console.log('Seeded ' + count + ' new links');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
`

- [ ] **Step 2: Create builtin-links.json with 40+ entries**

Run: 
ode -e "const l=require('./backend/data/builtin-links.json'); console.log(l.length + ' entries loaded')"
Expected: Prints entry count

- [ ] **Step 3: Run seed**
`
cd backend && node src/seed.js
`

- [ ] **Step 4: Commit**
`
git add backend/data/builtin-links.json backend/src/seed.js
git commit -m "feat(backend): seed built-in download links"
`

---

## Phase 2: Desktop Scanner (Rust/Tauri)

### Task 6: Tauri project scaffolding

**Files:**
- Create: desktop/ (via 
pm create tauri-app)
- Create: desktop/src-tauri/Cargo.toml
- Create: desktop/src-tauri/src/main.rs
- Create: desktop/src-tauri/src/commands.rs
- Create: desktop/src-tauri/src/scanner/mod.rs

- [ ] **Step 1: Scaffold Tauri project**
`
npm create tauri-app@latest desktop -- --template react-ts
cd desktop && npm install
`

- [ ] **Step 2: Add Rust scanner dependencies**

In desktop/src-tauri/Cargo.toml, add:
`	oml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
winreg = "0.52"
sysinfo = "0.30"
regex = "1"
`

- [ ] **Step 3: Create scanner mod.rs**

`ust
pub mod registry;
pub mod package_managers;
pub mod runtimes;
pub mod deep_scan;

use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct OsInfo {
    pub family: String,
    pub edition: String,
    pub version: String,
    pub build: String,
    pub architecture: String,
}

#[derive(Debug, Serialize)]
pub struct Application {
    pub name: String,
    pub version: String,
    pub publisher: Option<String>,
    pub source: String,
    pub install_path: Option<String>,
    pub install_date: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Package {
    pub name: String,
    pub version: String,
}

#[derive(Debug, Serialize)]
pub struct Runtime {
    pub name: String,
    pub version: String,
    pub install_path: Option<String>,
    pub packages: Vec<Package>,
}

#[derive(Debug, Serialize)]
pub struct DeepScan {
    pub vscode_extensions: Vec<Package>,
    pub path_entries: Vec<String>,
    pub wsl_distributions: Vec<Package>,
    pub windows_features: Vec<Package>,
}

#[derive(Debug, Serialize)]
pub struct ScanResult {
    pub version: String,
    pub machine_name: String,
    pub scan_time: String,
    pub scan_mode: String,
    pub os: OsInfo,
    pub applications: Vec<Application>,
    pub runtimes: Vec<Runtime>,
    pub deep_scan: Option<DeepScan>,
}
`

- [ ] **Step 4: Create commands.rs**

`ust
use crate::scanner;
use std::time::SystemTime;

#[tauri::command]
pub fn scan_standard() -> Result<scanner::ScanResult, String> {
    let machine_name = std::env::var("COMPUTERNAME").unwrap_or_else(|_| "UNKNOWN".to_string());
    let scan_time = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| chrono::DateTime::from_timestamp(d.as_secs() as i64, 0).unwrap().to_rfc3339())
        .unwrap_or_else(|_| String::new());

    Ok(scanner::ScanResult {
        version: "1.0".to_string(),
        machine_name,
        scan_time,
        scan_mode: "standard".to_string(),
        os: scanner::registry::get_os_info(),
        applications: scanner::registry::get_installed_apps(),
        runtimes: scanner::runtimes::detect_runtimes(),
        deep_scan: None,
    })
}

#[tauri::command]
pub fn scan_deep() -> Result<scanner::ScanResult, String> {
    let mut result = scan_standard()?;
    result.scan_mode = "deep".to_string();
    result.deep_scan = Some(scanner::deep_scan::run_deep_scan());
    Ok(result)
}
`

- [ ] **Step 5: Create main.rs**

`ust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod scanner;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::scan_standard,
            commands::scan_deep,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
`

- [ ] **Step 6: Verify build**
`
cd desktop && cargo build
`
Expected: Build succeeds (scanner modules will have placeholder implementations)

- [ ] **Step 7: Commit**
`
git add desktop/src-tauri/
git commit -m "feat(desktop): Tauri project scaffolding with scanner modules"
`

---
### Task 7: Registry scanner (Windows installed apps)

**Files:**
- Create: desktop/src-tauri/src/scanner/registry.rs

- [ ] **Step 1: Create registry scanner**

`ust
use super::{Application, OsInfo};
use winreg::enums::*;
use winreg::RegKey;

pub fn get_os_info() -> OsInfo {
    OsInfo {
        family: "Windows".to_string(),
        edition: get_registry_string(r"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName")
            .unwrap_or_else(|| "Windows".to_string()),
        version: get_registry_string(r"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "DisplayVersion")
            .unwrap_or_else(|| "Unknown".to_string()),
        build: get_registry_string(r"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuild")
            .unwrap_or_else(|| "Unknown".to_string()),
        architecture: if std::env::consts::ARCH == "x86_64" { "x86_64".to_string() } else { "x86".to_string() },
    }
}

fn get_registry_string(path: &str, key: &str) -> Option<String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    hklm.open_subkey_with_flags(path, KEY_READ).ok()
        .and_then(|k| k.get_value(key).ok())
}

pub fn get_installed_apps() -> Vec<Application> {
    let mut apps = Vec::new();
    let paths = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
    ];
    for path in &paths {
        if let Ok(hklm) = RegKey::predef(HKEY_LOCAL_MACHINE).open_subkey_with_flags(*path, KEY_READ) {
            for name in hklm.enum_keys().filter_map(|k| k.ok()) {
                if let Ok(key) = hklm.open_subkey_with_flags(&name, KEY_READ) {
                    let display_name: Option<String> = key.get_value("DisplayName").ok();
                    if let Some(name) = display_name {
                        if name.trim().is_empty() { continue; }
                        apps.push(Application {
                            name: name.clone(),
                            version: key.get_value("DisplayVersion").ok().unwrap_or_default(),
                            publisher: key.get_value("Publisher").ok(),
                            source: "registry".to_string(),
                            install_path: key.get_value("InstallLocation").ok(),
                            install_date: key.get_value("InstallDate").ok(),
                        });
                    }
                }
            }
        }
    }
    dedup_apps(apps)
}

fn dedup_apps(apps: Vec<Application>) -> Vec<Application> {
    let mut seen = std::collections::HashSet::new();
    apps.into_iter().filter(|a| seen.insert(a.name.clone())).collect()
}
`

- [ ] **Step 2: Build to verify**
`
cd desktop && cargo build
`
Expected: Build succeeds

- [ ] **Step 3: Commit**
`
git add desktop/src-tauri/src/scanner/registry.rs
git commit -m "feat(desktop): Windows registry scanner for installed apps"
`

---
### Task 8: Package manager detection (winget, choco, scoop)

**Files:**
- Create: desktop/src-tauri/src/scanner/package_managers.rs

- [ ] **Step 1: Create package managers scanner**

`ust
use super::Application;
use std::process::Command;

pub fn get_winget_apps() -> Vec<Application> {
    let output = Command::new("winget").args(["list", "--accept-source-agreements"]).output();
    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);
            parse_winget_output(&text)
        }
        _ => Vec::new(),
    }
}

fn parse_winget_output(text: &str) -> Vec<Application> {
    let mut apps = Vec::new();
    for line in text.lines().skip(2) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
            apps.push(Application {
                name: parts[0].to_string(),
                version: parts.get(1).unwrap_or(&"").to_string(),
                publisher: None,
                source: "winget".to_string(),
                install_path: None,
                install_date: None,
            });
        }
    }
    apps
}

pub fn get_choco_apps() -> Vec<Application> {
    let output = Command::new("choco").args(["list", "--local-only"]).output();
    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);
            text.lines().filter_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 && !parts[0].starts_with("Chocolatey") {
                    Some(Application {
                        name: parts[0].to_string(),
                        version: parts[1].to_string(),
                        publisher: None,
                        source: "choco".to_string(),
                        install_path: None,
                        install_date: None,
                    })
                } else { None }
            }).collect()
        }
        _ => Vec::new(),
    }
}

pub fn get_scoop_apps() -> Vec<Application> {
    let output = Command::new("scoop").args(["list"]).output();
    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);
            text.lines().skip(2).filter_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    Some(Application {
                        name: parts[0].to_string(),
                        version: parts[1].to_string(),
                        publisher: None,
                        source: "scoop".to_string(),
                        install_path: None,
                        install_date: None,
                    })
                } else { None }
            }).collect()
        }
        _ => Vec::new(),
    }
}
`

- [ ] **Step 2: Update registry.rs to also call package managers**

Add to get_installed_apps() in registry.rs:
`ust
// Merge package manager results
let mut all_apps = apps;
let more = package_managers::get_winget_apps();
let more2 = package_managers::get_choco_apps();
let more3 = package_managers::get_scoop_apps();
all_apps.extend(more);
all_apps.extend(more2);
all_apps.extend(more3);
dedup_apps(all_apps)
`

Also add mod package_managers; in mod.rs.

- [ ] **Step 3: Build to verify**
`
cd desktop && cargo build
`

- [ ] **Step 4: Commit**
`
git add desktop/src-tauri/src/scanner/package_managers.rs
git commit -m "feat(desktop): winget, choco, scoop package manager detection"
`

---
### Task 9: Runtime detection (Java, Python, Node, Go, .NET, Git, Docker)

**Files:**
- Create: desktop/src-tauri/src/scanner/runtimes.rs

- [ ] **Step 1: Create runtime detector**

`ust
use super::{Runtime, Package};
use std::process::Command;

fn run_cmd(program: &str, args: &[&str]) -> Option<String> {
    Command::new(program).args(args).output().ok()
        .filter(|o| o.status.success())
        .and_then(|o| String::from_utf8(o.stdout).ok())
}

fn run_cmd_err(program: &str, args: &[&str]) -> Option<String> {
    Command::new(program).args(args).output().ok()
        .filter(|o| o.status.success())
        .and_then(|o| {
            let s = String::from_utf8_lossy(&o.stdout).to_string();
            if s.trim().is_empty() {
                String::from_utf8(o.stderr).ok()
            } else { Some(s) }
        })
}

fn parse_version(output: &str) -> String {
    output.lines().next().unwrap_or("").trim().to_string()
}

pub fn detect_runtimes() -> Vec<Runtime> {
    let mut runtimes = Vec::new();

    // Python
    if let Some(ver) = run_cmd("python", &["--version"]) {
        let packages = run_cmd("pip", &["list", "--format=json"])
            .and_then(|s| serde_json::from_str::<Vec<Package>>(&s).ok())
            .unwrap_or_default();
        runtimes.push(Runtime {
            name: "Python".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages,
        });
    }

    // Node.js
    if let Some(ver) = run_cmd("node", &["--version"]) {
        let packages = run_cmd("npm", &["list", "-g", "--depth=0", "--json"])
            .and_then(|s| {
                let v: serde_json::Value = serde_json::from_str(&s).ok()?;
                v["dependencies"].as_object().map(|deps| {
                    deps.iter().map(|(name, info)| Package {
                        name: name.clone(),
                        version: info["version"].as_str().unwrap_or("").to_string(),
                    }).collect()
                })
            })
            .unwrap_or_default();
        runtimes.push(Runtime {
            name: "Node.js".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages,
        });
    }

    // Java
    if let Some(ver) = run_cmd_err("java", &["-version"]) {
        runtimes.push(Runtime {
            name: "Java".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    // Go
    if let Some(ver) = run_cmd("go", &["version"]) {
        runtimes.push(Runtime {
            name: "Go".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    // .NET SDKs
    if let Some(sdks) = run_cmd("dotnet", &["--list-sdks"]) {
        runtimes.push(Runtime {
            name: ".NET SDK".to_string(),
            version: sdks.lines().last().unwrap_or("").trim().to_string(),
            install_path: None,
            packages: sdks.lines().map(|l| Package {
                name: l.to_string(),
                version: String::new(),
            }).collect(),
        });
    }

    // .NET Runtimes
    if let Some(rts) = run_cmd("dotnet", &["--list-runtimes"]) {
        runtimes.push(Runtime {
            name: ".NET Runtime".to_string(),
            version: String::new(),
            install_path: None,
            packages: rts.lines().map(|l| Package {
                name: l.to_string(),
                version: String::new(),
            }).collect(),
        });
    }

    // Rust
    if let Some(ver) = run_cmd("rustc", &["--version"]) {
        runtimes.push(Runtime {
            name: "Rust".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    // Git
    if let Some(ver) = run_cmd("git", &["--version"]) {
        runtimes.push(Runtime {
            name: "Git".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    // Docker
    if let Some(ver) = run_cmd("docker", &["version", "--format", "{{.Server.Version}}"]) {
        runtimes.push(Runtime {
            name: "Docker".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    runtimes
}
`

- [ ] **Step 2: Add serde_json dependency to Cargo.toml if not present**

- [ ] **Step 3: Build to verify**
`
cd desktop && cargo build
`

- [ ] **Step 4: Commit**
`
git add desktop/src-tauri/src/scanner/runtimes.rs
git commit -m "feat(desktop): runtime detection for Java, Python, Node, Go, .NET, Rust, Git, Docker"
`

---
### Task 10: Deep scan (VS Code extensions, WSL, PATH, Windows features)

**Files:**
- Create: desktop/src-tauri/src/scanner/deep_scan.rs

- [ ] **Step 1: Create deep scan module**

`ust
use super::{DeepScan, Package};
use std::process::Command;

fn run_cmd(program: &str, args: &[&str]) -> Option<String> {
    Command::new(program).args(args).output().ok()
        .filter(|o| o.status.success())
        .and_then(|o| String::from_utf8(o.stdout).ok())
}

pub fn run_deep_scan() -> DeepScan {
    DeepScan {
        vscode_extensions: get_vscode_extensions(),
        path_entries: get_path_entries(),
        wsl_distributions: get_wsl_distros(),
        windows_features: get_windows_features(),
    }
}

fn get_vscode_extensions() -> Vec<Package> {
    run_cmd("code", &["--list-extensions", "--show-versions"])
        .map(|output| {
            output.lines().filter_map(|line| {
                let mut parts = line.splitn(2, '@');
                Some(Package {
                    name: parts.next()?.to_string(),
                    version: parts.next().unwrap_or("").to_string(),
                })
            }).collect()
        })
        .unwrap_or_default()
}

fn get_path_entries() -> Vec<String> {
    std::env::var("PATH").unwrap_or_default()
        .split(';')
        .map(|s| s.to_string())
        .collect()
}

fn get_wsl_distros() -> Vec<Package> {
    run_cmd("wsl", &["--list", "-v"])
        .map(|output| {
            output.lines().skip(1).filter_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    Some(Package {
                        name: parts[0].to_string(),
                        version: parts.get(2).unwrap_or(&"").to_string(),
                    })
                } else { None }
            }).collect()
        })
        .unwrap_or_default()
}

fn get_windows_features() -> Vec<Package> {
    run_cmd("dism", &["/Online", "/Get-Features", "/Format:Table"])
        .map(|output| {
            output.lines().skip(2).filter_map(|line| {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 2 {
                    Some(Package {
                        name: parts[0].trim().to_string(),
                        version: parts[1].trim().to_string(),
                    })
                } else { None }
            }).collect()
        })
        .unwrap_or_default()
}
`

- [ ] **Step 2: Build to verify**
`
cd desktop && cargo build
`

- [ ] **Step 3: Commit**
`
git add desktop/src-tauri/src/scanner/deep_scan.rs
git commit -m "feat(desktop): deep scan for VS Code extensions, WSL, PATH, Windows features"
`

---
## Phase 3: Desktop UI (React + Tauri)

### Task 11: React types and API client

**Files:**
- Create: desktop/src/types.ts
- Create: desktop/src/api/client.ts
- Create: desktop/src/api/scanner.ts

- [ ] **Step 1: Create types.ts**

`	s
export interface OsInfo {
  family: string;
  edition: string;
  version: string;
  build: string;
  architecture: string;
}

export interface Application {
  name: string;
  version: string;
  publisher?: string;
  source: string;
  install_path?: string;
  install_date?: string;
}

export interface Package {
  name: string;
  version: string;
}

export interface Runtime {
  name: string;
  version: string;
  install_path?: string;
  packages: Package[];
}

export interface DeepScan {
  vscode_extensions: Package[];
  path_entries: string[];
  wsl_distributions: Package[];
  windows_features: Package[];
}

export interface ScanResult {
  version: string;
  machine_name: string;
  scan_time: string;
  scan_mode: string;
  os: OsInfo;
  applications: Application[];
  runtimes: Runtime[];
  deep_scan?: DeepScan;
}

export interface DownloadLink {
  id: number;
  software_name: string;
  aliases: string[];
  official_url: string;
  direct_download_url?: string;
  category?: string;
  verified: boolean;
}

export interface User {
  id: number;
  email: string;
  nickname: string;
  is_admin: boolean;
}
`

- [ ] **Step 2: Create api/client.ts**

`	s
const API_BASE = 'http://localhost:3000/api/v1';

function getToken(): string | null {
  return localStorage.getItem('appsync_token');
}

function setToken(token: string) {
  localStorage.setItem('appsync_token', token);
}

function clearToken() {
  localStorage.removeItem('appsync_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  register: (email: string, password: string, nickname?: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname }),
    }).then(r => { setToken(r.token); return r; }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(r => { setToken(r.token); return r; }),

  logout: () => clearToken(),

  getProfile: () => request<User>('/auth/profile'),

  uploadInventory: (scanResult: ScanResult) =>
    request<{ id: number }>('/inventories', {
      method: 'POST',
      body: JSON.stringify({
        scan_data: scanResult,
        machine_name: scanResult.machine_name,
        scan_mode: scanResult.scan_mode,
        scan_time: scanResult.scan_time,
      }),
    }),

  getLatestInventory: () => request<{ id: number; scan_data: ScanResult }>('/inventories/latest'),

  listInventories: () => request<Array<{ id: number; machine_name: string; scan_time: string }>>('/inventories'),

  searchDownloadLinks: (q: string) =>
    request<DownloadLink[]>('/downloads/search?q=' + encodeURIComponent(q)),

  submitDownloadLink: (data: { software_name: string; official_url: string; aliases?: string[]; category?: string }) =>
    request<{ id: number }>('/downloads/links', { method: 'POST', body: JSON.stringify(data) }),
};
`

- [ ] **Step 3: Create api/scanner.ts**

`	s
import { invoke } from '@tauri-apps/api/core';
import type { ScanResult } from '../types';

export async function scanStandard(): Promise<ScanResult> {
  return invoke('scan_standard');
}

export async function scanDeep(): Promise<ScanResult> {
  return invoke('scan_deep');
}
`

- [ ] **Step 4: Commit**
`
git add desktop/src/types.ts desktop/src/api/client.ts desktop/src/api/scanner.ts
git commit -m "feat(desktop): React types and API client"
`

---
### Task 12: Login form component

**Files:**
- Create: desktop/src/components/LoginForm.tsx

- [ ] **Step 1: Create LoginForm component**

`	sx
import { useState } from 'react';
import { api } from '../api/client';

interface Props {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await api.register(email, password, nickname || undefined);
      } else {
        await api.login(email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 24 }}>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label><br />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: 8 }} />
        </div>
        {isRegister && (
          <div style={{ marginBottom: 12 }}>
            <label>Nickname</label><br />
            <input value={nickname} onChange={e => setNickname(e.target.value)}
              style={{ width: '100%', padding: 8 }} />
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label>Password</label><br />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ width: '100%', padding: 8 }} />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '8px 24px' }}>
          {isRegister ? 'Register' : 'Login'}
        </button>
        <button type="button" onClick={() => setIsRegister(!isRegister)} style={{ marginLeft: 8 }}>
          {isRegister ? 'Switch to Login' : 'Switch to Register'}
        </button>
      </form>
    </div>
  );
}
`

- [ ] **Step 2: Commit**
`
git add desktop/src/components/LoginForm.tsx
git commit -m "feat(desktop): login/register form component"
`

---
### Task 13: Layout and sub-components

**Files:**
- Create: desktop/src/components/Layout.tsx
- Create: desktop/src/components/AppCard.tsx
- Create: desktop/src/components/ScanButton.tsx

- [ ] **Step 1: Create Layout.tsx**

`	sx
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  userEmail?: string;
  onLogout: () => void;
}

export function Layout({ children, currentPage, onNavigate, userEmail, onLogout }: Props) {
  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'inventory', label: 'Software List' },
    { key: 'downloads', label: 'Downloads' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '12px 24px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>AppSync</h1>
        <div>
          {userEmail && <span style={{ marginRight: 12 }}>{userEmail}</span>}
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>
      <nav style={{ display: 'flex', gap: 4, padding: '8px 24px', borderBottom: '1px solid #eee' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => onNavigate(tab.key)}
            style={{ fontWeight: currentPage === tab.key ? 'bold' : 'normal' }}>
            {tab.label}
          </button>
        ))}
      </nav>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
`

- [ ] **Step 2: Create AppCard.tsx**

`	sx
interface Props {
  name: string;
  version: string;
  source?: string;
  downloadUrl?: string;
  onSearch?: () => void;
}

export function AppCard({ name, version, source, downloadUrl, onSearch }: Props) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <strong>{name}</strong>
        <span style={{ marginLeft: 8, color: '#666' }}>v{version}</span>
        {source && <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>({source})</span>}
      </div>
      <div>
        {downloadUrl ? (
          <a href={downloadUrl} target="_blank" rel="noreferrer">
            <button>Open Download</button>
          </a>
        ) : onSearch ? (
          <button onClick={onSearch}>Search Official Site</button>
        ) : (
          <span style={{ color: '#999', fontSize: 12 }}>No link</span>
        )}
      </div>
    </div>
  );
}
`

- [ ] **Step 3: Create ScanButton.tsx**

`	sx
import { useState } from 'react';
import { scanStandard, scanDeep } from '../api/scanner';
import type { ScanResult } from '../types';

interface Props {
  onScanComplete: (result: ScanResult) => void;
}

export function ScanButton({ onScanComplete }: Props) {
  const [scanning, setScanning] = useState(false);
  const [mode, setMode] = useState<'standard' | 'deep'>('standard');

  const handleScan = async () => {
    setScanning(true);
    try {
      const result = mode === 'standard' ? await scanStandard() : await scanDeep();
      onScanComplete(result);
    } catch (err) {
      console.error('Scan failed:', err);
      alert('Scan failed. Check console for details.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ marginBottom: 12 }}>
        <label>
          <input type="radio" checked={mode === 'standard'} onChange={() => setMode('standard')} /> Standard Scan
        </label>
        <label style={{ marginLeft: 12 }}>
          <input type="radio" checked={mode === 'deep'} onChange={() => setMode('deep')} /> Deep Scan
        </label>
      </div>
      <button onClick={handleScan} disabled={scanning}
        style={{ padding: '12px 48px', fontSize: 18, cursor: scanning ? 'wait' : 'pointer' }}>
        {scanning ? 'Scanning...' : 'Scan Now'}
      </button>
    </div>
  );
}
`

- [ ] **Step 4: Commit**
`
git add desktop/src/components/Layout.tsx desktop/src/components/AppCard.tsx desktop/src/components/ScanButton.tsx
git commit -m "feat(desktop): layout, app card, and scan button components"
`

---
### Task 14: Pages (Dashboard, Inventory, Downloads)

**Files:**
- Create: desktop/src/pages/Dashboard.tsx
- Create: desktop/src/pages/Inventory.tsx
- Create: desktop/src/pages/Downloads.tsx

- [ ] **Step 1: Create Dashboard.tsx**

`	sx
import type { ScanResult } from '../types';
import { ScanButton } from '../components/ScanButton';

interface Props {
  lastScan: ScanResult | null;
  onScanComplete: (result: ScanResult) => void;
}

export function Dashboard({ lastScan, onScanComplete }: Props) {
  const appCount = lastScan?.applications.length ?? 0;
  const runtimeCount = lastScan?.runtimes.length ?? 0;

  return (
    <div>
      <h2>Overview</h2>
      {lastScan ? (
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{appCount}</div>
            <div style={{ color: '#666' }}>Applications</div>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{runtimeCount}</div>
            <div style={{ color: '#666' }}>Runtimes</div>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{lastScan.machine_name}</div>
            <div style={{ color: '#666' }}>Machine</div>
          </div>
        </div>
      ) : (
        <p style={{ color: '#999' }}>No scan data yet. Run a scan to get started.</p>
      )}
      <ScanButton onScanComplete={onScanComplete} />
      {lastScan && (
        <p style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          Last scanned: {new Date(lastScan.scan_time).toLocaleString()} | Mode: {lastScan.scan_mode}
        </p>
      )}
    </div>
  );
}
`

- [ ] **Step 2: Create Inventory.tsx**

`	sx
import { useState } from 'react';
import type { ScanResult, Application, Runtime } from '../types';
import { AppCard } from '../components/AppCard';

interface Props {
  scanResult: ScanResult | null;
  onSearchDownload: (name: string) => void;
}

export function Inventory({ scanResult, onSearchDownload }: Props) {
  const [tab, setTab] = useState<'apps' | 'runtimes' | 'deep'>('apps');

  if (!scanResult) {
    return <p>No scan data. Run a scan first.</p>;
  }

  return (
    <div>
      <h2>Software Inventory</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setTab('apps')} style={{ fontWeight: tab === 'apps' ? 'bold' : 'normal' }}>
          Applications ({scanResult.applications.length})
        </button>
        <button onClick={() => setTab('runtimes')} style={{ fontWeight: tab === 'runtimes' ? 'bold' : 'normal', marginLeft: 8 }}>
          Runtimes ({scanResult.runtimes.length})
        </button>
        <button onClick={() => setTab('deep')} style={{ fontWeight: tab === 'deep' ? 'bold' : 'normal', marginLeft: 8 }}>
          Deep Scan
        </button>
      </div>

      {tab === 'apps' && (
        <div>
          {scanResult.applications.map((app, i) => (
            <AppCard key={i} name={app.name} version={app.version} source={app.source}
              onSearch={() => onSearchDownload(app.name)} />
          ))}
        </div>
      )}

      {tab === 'runtimes' && (
        <div>
          {scanResult.runtimes.map((rt, i) => (
            <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <strong>{rt.name}</strong> <span style={{ color: '#666' }}>v{rt.version}</span>
              {rt.packages.length > 0 && (
                <details>
                  <summary>Packages ({rt.packages.length})</summary>
                  <div style={{ maxHeight: 200, overflow: 'auto', marginTop: 8 }}>
                    {rt.packages.map((pkg, j) => (
                      <div key={j} style={{ fontSize: 12, padding: '2px 0' }}>
                        {pkg.name}@{pkg.version}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'deep' && (
        <div>
          <p>VS Code Extensions: {scanResult.deep_scan?.vscode_extensions.length ?? 0}</p>
          <p>WSL Distributions: {scanResult.deep_scan?.wsl_distributions.length ?? 0}</p>
          <p>PATH Entries: {scanResult.deep_scan?.path_entries.length ?? 0}</p>
        </div>
      )}
    </div>
  );
}
`

- [ ] **Step 3: Create Downloads.tsx**

`	sx
import { useState } from 'react';
import type { ScanResult, DownloadLink } from '../types';
import { AppCard } from '../components/AppCard';
import { api } from '../api/client';

interface Props {
  scanResult: ScanResult | null;
}

export function Downloads({ scanResult }: Props) {
  const [links, setLinks] = useState<Record<string, DownloadLink>>({});
  const [searching, setSearching] = useState<string | null>(null);

  const handleSearch = async (appName: string) => {
    setSearching(appName);
    try {
      const results = await api.searchDownloadLinks(appName);
      if (results.length > 0) {
        setLinks(prev => ({ ...prev, [appName]: results[0] }));
      } else {
        // Fallback: open browser search
        window.open('https://www.google.com/search?q=' + encodeURIComponent(appName + ' official download'), '_blank');
      }
    } finally {
      setSearching(null);
    }
  };

  if (!scanResult) return <p>No scan data. Run a scan first.</p>;

  return (
    <div>
      <h2>Downloads</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Applications from your old machine. Click to download on your new machine.
      </p>
      {scanResult.applications.map((app, i) => {
        const link = links[app.name];
        return (
          <AppCard key={i} name={app.name} version={app.version}
            downloadUrl={link?.official_url}
            onSearch={searching === app.name ? undefined : () => handleSearch(app.name)} />
        );
      })}
    </div>
  );
}
`

- [ ] **Step 4: Commit**
`
git add desktop/src/pages/
git commit -m "feat(desktop): dashboard, inventory, and downloads pages"
`

---
### Task 15: App.tsx main entry (wire everything together)

**Files:**
- Modify: desktop/src/App.tsx

- [ ] **Step 1: Create App.tsx**

`	sx
import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Downloads } from './pages/Downloads';
import { api } from './api/client';
import type { ScanResult, User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState('dashboard');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [token, setToken] = useState(() => localStorage.getItem('appsync_token'));

  useEffect(() => {
    if (token) {
      api.getProfile().then(setUser).catch(() => {
        localStorage.removeItem('appsync_token');
        setToken(null);
      });
    }
  }, [token]);

  const handleLogin = async () => {
    const token = localStorage.getItem('appsync_token');
    if (token) {
      try {
        const profile = await api.getProfile();
        setUser(profile);
        setToken(token);
      } catch {
        // handle error silently
      }
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setToken(null);
  };

  const handleScanComplete = async (result: ScanResult) => {
    setScanResult(result);
    try {
      await api.uploadInventory(result);
      alert('Scan result uploaded to cloud!');
    } catch {
      alert('Scan complete but upload failed. Check your connection.');
    }
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <Layout currentPage={page} onNavigate={setPage} userEmail={user.email} onLogout={handleLogout}>
      {page === 'dashboard' && (
        <Dashboard lastScan={scanResult} onScanComplete={handleScanComplete} />
      )}
      {page === 'inventory' && (
        <Inventory scanResult={scanResult} onSearchDownload={(name) => {
          window.open('https://www.google.com/search?q=' + encodeURIComponent(name + ' official download'), '_blank');
        }} />
      )}
      {page === 'downloads' && <Downloads scanResult={scanResult} />}
    </Layout>
  );
}
`

- [ ] **Step 2: Build and verify**
`
cd desktop && npm run build
`
Expected: Build succeeds

- [ ] **Step 3: Commit**
`
git add desktop/src/App.tsx
git commit -m "feat(desktop): wire App.tsx with auth, scan, and pages"
`

---

## Phase 4: Integration and Polish

### Task 16: Download link database (builtin-links.json)

**Files:**
- Create: ackend/data/builtin-links.json (expand to 50+ entries)

- [ ] **Step 1: Add 50+ entries covering major categories**

Categories to include:
- **Browsers (3):** Chrome, Firefox, Edge
- **Development (15):** VS Code, IntelliJ IDEA, PyCharm, WebStorm, GoLand, Sublime Text, Notepad++, VS 2022 Community, Git, GitHub Desktop, Postman, Insomnia, Docker Desktop, Vagrant, Putty
- **Runtimes (8):** Python, Node.js, Java JDK (Oracle + OpenJDK), Go, Rust, .NET SDK, Ruby, PHP
- **Database (5):** DBeaver, MySQL Workbench, PostgreSQL, pgAdmin, Redis Desktop Manager
- **Design (4):** Figma, GIMP, Inkscape, Blender
- **Communication (5):** Slack, Discord, Telegram, WeChat, Zoom
- **Media (5):** VLC, OBS Studio, Spotify, PotPlayer, Foobar2000
- **Utility (8):** 7-Zip, Everything, PowerToys, AutoHotkey, Windows Terminal, ShareX, Snipaste, Advanced IP Scanner
- **Office (3):** WPS Office, LibreOffice, Foxit Reader
- **Security (3):** Bitdefender, Malwarebytes, 1Password

- [ ] **Step 2: Seed database**
`
cd backend && node src/seed.js
`
Expected: Seeds all new links

- [ ] **Step 3: Commit**
`
git add backend/data/builtin-links.json
git commit -m "data: add 50+ built-in download links"
`

---
### Task 17: Final integration test

- [ ] **Step 1: Start backend**
`
cd backend && npm start
`
Expected: API running on port 3000

- [ ] **Step 2: Run migration + seed**
`
cd backend && npm run migrate && npm run seed
`

- [ ] **Step 3: Start desktop in dev mode**
`
cd desktop && npm run tauri dev
`

- [ ] **Step 4: Test full flow**
1. Register a new account
2. Run standard scan
3. Verify scan results appear in Dashboard
4. Upload to cloud (automatic)
5. Logout and login again
6. Open Downloads page to see app list with download links

- [ ] **Step 5: Test fallback search**
1. Find an app not in the built-in database
2. Click "Search Official Site"
3. Verify browser opens with search results

- [ ] **Step 6: Commit final integration**
`
git add .
git commit -m "chore: integration wiring complete"
`

---
### Task 18: (Cleanup) Fix Rust Cargo.toml for chrono dependency

**Files:**
- Modify: desktop/src-tauri/src/commands.rs

- [ ] **Step 1: Simplify commands.rs to not need chrono**

Replace the scan_time generation in commands.rs with a simple string approach:

`ust
use crate::scanner;
use std::time::{SystemTime, UNIX_EPOCH};

#[tauri::command]
pub fn scan_standard() -> Result<scanner::ScanResult, String> {
    let machine_name = std::env::var("COMPUTERNAME").unwrap_or_else(|_| "UNKNOWN".to_string());
    let scan_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| String::new());

    Ok(scanner::ScanResult {
        version: "1.0".to_string(),
        machine_name,
        scan_time,
        scan_mode: "standard".to_string(),
        os: scanner::registry::get_os_info(),
        applications: scanner::registry::get_installed_apps(),
        runtimes: scanner::runtimes::detect_runtimes(),
        deep_scan: None,
    })
}

#[tauri::command]
pub fn scan_deep() -> Result<scanner::ScanResult, String> {
    let mut result = scan_standard()?;
    result.scan_mode = "deep".to_string();
    result.deep_scan = Some(scanner::deep_scan::run_deep_scan());
    Ok(result)
}
`

- [ ] **Step 2: Commit**
`
git add desktop/src-tauri/src/commands.rs
git commit -m "fix(desktop): remove chrono dependency, use epoch seconds"
`

---
