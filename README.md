<p align="right">
  <a href="README.en.md">English</a> | <a href="README.md">中文</a>
</p>

<div align="center">
  <h1>AppSync（应用同步）</h1>
  <p><em>appsync-backend / desktop</em></p>
  <p>Windows 软件清单扫描与跨设备同步工具</p>

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

AppSync 是一款 Windows 桌面工具，旨在解决换电脑时「我原来装了什么软件？去哪下载？」的难题。它扫描本地已安装的软件、运行时环境和包管理器包，将清单同步到云端，并支持跨设备对比。

## 目录

- [背景](#背景)
- [功能特性](#功能特性)
- [安装](#安装)
- [使用指南](#使用指南)
- [配置](#配置)
- [系统架构](#系统架构)
- [截图](#截图)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 背景

换一台新 Windows 电脑往往伴随着痛苦的软件重装过程——忘记装过什么软件、找不到下载源、花费大量时间手动恢复。AppSync 的目标是将这一过程数字化：扫描旧电脑、上传清单、在新电脑上对比并一键恢复。

内置的下载链接库涵盖 650+ 款软件，覆盖 13 个分类，让你快速找到所需软件的官方下载页面。

## 功能特性

- **一键系统扫描** — 从 Windows 注册表、包管理器（winget、Chocolatey、Scoop）和运行时环境（Python、Node.js、Java、Go、.NET、Rust、Git、Docker）中扫描已安装软件
- **云端同步** — 基于 JWT 认证，将扫描结果上传至后端，跨设备访问
- **跨设备对比** — 并排对比两台机器的软件清单，一键查看「旧电脑有、新电脑缺」的软件
- **下载链接库** — 内置 650+ 条下载链接，覆盖 13 个分类，支持搜索和筛选
- **批量链接匹配** — 自动将扫描到的应用与下载链接库匹配
- **安装脚本生成** — 生成 PowerShell 恢复脚本（pip 和 npm 包）
- **导出功能** — 通过原生保存对话框导出扫描结果为 JSON 或 CSV
- **扫描历史** — 查看和管理所有历史扫描记录
- **应用分类** — 自动将应用归入 13 个类别（浏览器、开发工具、运行时等）
- **应用分组** — 将相关子组件（如 NVIDIA 驱动套件）归组到父名称下
- **国际化** — 完整的中英文本地化，应用内可切换
- **深色模式** — 明/暗主题切换，自动保存到 localStorage
- **管理后台** — 基于 Web 的管理面板，用于审核社区提交的下载链接

## 安装

### 环境要求

- **Node.js** 20+
- **Rust** 1.70+
- **Windows** 10/11（扫描引擎仅支持 Windows）

### 后端

```bash
cd backend
npm install
cp .env.example .env   # 编辑 JWT_SECRET 为随机值
npm run seed            # 导入内置下载链接
npm run seed-admin      # 创建管理员用户
npm start               # 启动在 http://localhost:3000
```

### 桌面客户端

```bash
cd desktop
npm install
npm run tauri dev       # 开发模式（Vite + Tauri 热重载）
```

### 生产构建

```bash
npm run tauri build     # 生成 MSI/NSIS 安装包
```

### 运行测试

```bash
.\run-tests.bat         # 运行后端、前端和 Rust 测试
```

## 使用指南

1. **启动后端** — 在 `backend/` 目录下运行 `npm start`
2. **启动桌面应用** — 在 `desktop/` 目录下运行 `npm run tauri dev`
3. **扫描电脑** — 点击 **扫描** 按钮，盘点所有已安装的软件、运行时和包
4. **同步到云端** — 登录后将扫描结果上传到后端
5. **跨设备对比** — 在新电脑上再次扫描，从历史记录中选择旧电脑的扫描结果进行对比
6. **恢复软件** — 使用生成的安装脚本或下载链接重新安装缺失的软件

### API 接口

后端在 `http://localhost:3000/api/v1` 提供 REST API：

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/v1/auth/register` | POST | 注册用户 |
| `/api/v1/auth/login` | POST | 登录（返回 JWT） |
| `/api/v1/inventories` | GET | 获取扫描清单列表 |
| `/api/v1/inventories` | POST | 上传扫描结果 |
| `/api/v1/inventories/:id/compare/:targetId` | GET | 对比两次扫描 |
| `/api/v1/downloads` | GET | 获取下载链接列表 |
| `/api/v1/downloads` | POST | 提交下载链接 |
| `/api/v1/admin/links/pending` | GET | 查看待审核链接（管理员） |

## 配置

### 后端 (`backend/.env`)

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3000` | API 服务端口 |
| `JWT_SECRET` | *(必填)* | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | `7d` | Token 过期时间 |
| `ADMIN_INVITE_CODE` | *(必填)* | 管理员注册邀请码 |

### 桌面端（环境变量）

| 变量 | 说明 |
|---|---|
| `VITE_API_BASE` | 后端 API 地址（默认：`http://localhost:3000/api/v1`） |

## 系统架构

```
┌─────────────────────────────────────────────────┐
│              桌面客户端 (Tauri 2)                  │
│  ┌───────────────────────────────────────────┐  │
│  │ 前端 (React 19 + TypeScript + Vite)       │  │
│  │ 仪表盘 / 清单 / 下载 / 历史记录           │  │
│  └────────────────────┬──────────────────────┘  │
│  ┌────────────────────▼──────────────────────┐  │
│  │ Rust 扫描引擎                             │  │
│  │ - 注册表扫描 (winreg)                     │  │
│  │ - 包管理器扫描 (winget/choco/scoop)       │  │
│  │ - 运行时检测                              │  │
│  └────────────────────┬──────────────────────┘  │
└───────────────────────┼─────────────────────────┘
                        │ HTTP
┌───────────────────────▼─────────────────────────┐
│          后端服务 (Node.js + Express)             │
│  - 身份认证 (JWT + bcrypt)                      │
│  - 清单管理                                     │
│  - 下载链接库                                    │
│  - SQLite 数据库 (better-sqlite3)               │
│  - 管理后台 (Web)                               │
└─────────────────────────────────────────────────┘
```

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Tauri 2.x (Rust + React + TypeScript) |
| 前端 UI | React 19 + TypeScript + Vite 7 |
| 扫描引擎 | Rust (winreg, sysinfo) |
| 后端 API | Node.js + Express 4 |
| 数据库 | SQLite (better-sqlite3, WAL 模式) |
| 认证系统 | JWT + bcryptjs |
| 图标库 | lucide-react |

## 截图

> 即将推出

## 贡献指南

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解行为准则、Bug 报告、功能建议和 Pull Request 流程的详细信息。

### 贡献者

<a href="https://github.com/ChenYiming-aaa/PC-AppSync/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ChenYiming-aaa/PC-AppSync" alt="Contributors" />
</a>

## 许可证

[MIT](LICENSE) © 2026
