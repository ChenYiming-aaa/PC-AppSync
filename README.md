<p align="right">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">中文</a>
</p>

<div align="center">
  <h1>AppSync（应用同步）</h1>
  <p><em>appsync-backend / desktop</em></p>
  <p>Windows software inventory scanning & cross-device synchronization tool</p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js" alt="Node">
    <img src="https://img.shields.io/badge/Rust-1.70%2B-000000?logo=rust" alt="Rust">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
    <img src="https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri" alt="Tauri">
    <img src="https://img.shields.io/github/license/ChenYiming-aaa/PC-AppSync" alt="License">
    <img src="https://img.shields.io/github/last-commit/ChenYiming-aaa/PC-AppSync" alt="Last Commit">
    <img src="https://img.shields.io/github/languages/code-size/ChenYiming-aaa/PC-AppSync" alt="Code Size">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
  </p>
</div>

---

AppSync is a Windows desktop tool that solves the "what software did I have installed on my old computer and where do I download it again?" problem when switching machines. It scans installed applications, runtimes, and package manager packages, syncs them to the cloud, and enables cross-device comparison.

## Table of Contents

- [Background](#background)
- [Features](#features)
- [Install](#install)
- [Usage](#usage)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## Background

Moving to a new Windows PC is often a painful experience. You forget what software you had installed, struggle to remember download sources, and spend hours manually reinstalling everything. AppSync was created to digitize this process — scan your old machine, upload the inventory, then compare and restore on your new machine with a single click.

The built-in download link library covers 650+ applications across 13 categories, making it easy to find official download pages for the software you need.

## Features

- **One-Click System Scan** — Scans installed software from Windows Registry, package managers (winget, Chocolatey, Scoop), and runtime environments (Python, Node.js, Java, Go, .NET, Rust, Git, Docker)
- **Cloud Sync** — Upload scan results to the backend with JWT-based authentication and cross-device access
- **Cross-Device Comparison** — Compare two machines side-by-side; toggle between "current PC" and "missing from old PC" views
- **Download Link Library** — 650+ built-in download links across 13 categories, searchable and filterable
- **Batch Link Matching** — Automatically matches scanned apps against the download link library
- **Install Script Generation** — Generate PowerShell restore scripts for pip and npm packages
- **Export** — Export scan results as JSON or CSV via native save dialog
- **Scan History** — View and manage all past scans
- **App Categorization** — Auto-categorizes apps into 13 groups (Browser, Development, Runtimes, etc.)
- **App Groups** — Groups related sub-components (e.g., NVIDIA driver suite) under a parent name
- **i18n** — Full Chinese and English localization, toggleable in-app
- **Dark Mode** — Light/dark theme toggle, persisted to localStorage
- **Admin Panel** — Web-based admin panel for verifying community-submitted download links

## Install

### Prerequisites

- **Node.js** 20+
- **Rust** 1.70+
- **Windows** 10/11 (scanning engine is Windows-specific)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Edit JWT_SECRET to a random value
npm run seed            # Seed the built-in download links
npm run seed-admin      # Create an admin user
npm start               # Starts on http://localhost:3000
```

### Desktop Client

```bash
cd desktop
npm install
npm run tauri dev       # Development mode (Vite + Tauri hot-reload)
```

### Build for Production

```bash
npm run tauri build     # Generates MSI/NSIS installer
```

### Run Tests

```bash
.\run-tests.bat         # Runs backend, frontend, and Rust tests
```

## Usage

1. **Start the backend** — Run `npm start` in the `backend/` directory
2. **Launch the desktop app** — Run `npm run tauri dev` in the `desktop/` directory
3. **Scan your PC** — Click the **Scan** button to inventory all installed software, runtimes, and packages
4. **Sync to cloud** — Log in to upload scan results to the backend
5. **Compare devices** — On your new PC, scan again and select the old PC's scan from history to see what's missing
6. **Restore** — Use the generated install scripts or download links to reinstall missing software

### CLI (Backend API)

The backend exposes a REST API on `http://localhost:3000/api/v1`:

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/auth/register` | POST | Register a new user |
| `/api/v1/auth/login` | POST | Log in (returns JWT) |
| `/api/v1/inventories` | GET | List scan inventories |
| `/api/v1/inventories` | POST | Upload a scan result |
| `/api/v1/inventories/:id/compare/:targetId` | GET | Compare two scans |
| `/api/v1/downloads` | GET | List download links |
| `/api/v1/downloads` | POST | Submit a download link |
| `/api/v1/admin/links/pending` | GET | List pending links (admin) |

## Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | API server port |
| `JWT_SECRET` | *(required)* | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `ADMIN_INVITE_CODE` | *(required)* | Code required for admin registration |

### Desktop (environment variable)

| Variable | Description |
|---|---|
| `VITE_API_BASE` | Backend API URL (default: `http://localhost:3000/api/v1`) |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Desktop (Tauri 2)                │
│  ┌───────────────────────────────────────────┐  │
│  │  Frontend (React 19 + TypeScript + Vite)  │  │
│  │  - Dashboard, Inventory, Downloads, etc.  │  │
│  └────────────────────┬──────────────────────┘  │
│  ┌────────────────────▼──────────────────────┐  │
│  │  Rust Scanning Engine                     │  │
│  │  - Registry Scanner (winreg)              │  │
│  │  - Package Manager Scanner (winget/choco) │  │
│  │  - Runtime Detector                       │  │
│  └────────────────────┬──────────────────────┘  │
└───────────────────────┼─────────────────────────┘
                        │ HTTP
┌───────────────────────▼─────────────────────────┐
│              Backend (Node.js + Express)          │
│  - Authentication (JWT + bcrypt)                 │
│  - Inventory Management                          │
│  - Download Link Library                         │
│  - SQLite Database (better-sqlite3)              │
│  - Admin Panel (web-based)                       │
└─────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Tauri 2.x (Rust + React + TypeScript) |
| Frontend UI | React 19 + TypeScript + Vite 7 |
| Scanning Engine | Rust (winreg, sysinfo) |
| Backend API | Node.js + Express 4 |
| Database | SQLite (better-sqlite3, WAL mode) |
| Authentication | JWT + bcryptjs |
| Icons | lucide-react |

## Screenshots

> Coming soon

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, bug reports, feature requests, and the pull request process.

### Contributors

<a href="https://github.com/ChenYiming-aaa/PC-AppSync/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ChenYiming-aaa/PC-AppSync" alt="Contributors" />
</a>

## License

[MIT](LICENSE) © 2026
