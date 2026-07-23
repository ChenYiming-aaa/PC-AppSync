# AppSync 发布与部署计划

> **For agentic workers:** 本计划包含三个独立阶段，建议按 Task 1 → Task 2 → Task 3 顺序执行。每步完成后验证测试通过再继续。

**目标：** 将 AppSync 从本地开发状态推进到可对外发布的产品：生成 MSI 安装包、上传 GitHub、部署云端后端。

**架构：**
- **桌面客户端（Tauri 2 + React + Rust）** → 打包为 MSI 安装包，用户下载安装后可直接使用
- **云端后端（Node.js + Express + SQLite）** → 部署到免费云平台，桌面客户端通过 `VITE_API_BASE` 连接
- **数据流**：桌面端扫描本机 → 上传清单到云端 → 跨设备对比时从云端拉取数据

**Tech Stack：** Tauri 2 / Rust / React / Vite / Node.js / Express / SQLite / Railway.app

---

## 阶段总览

```
Task 1: README + GitHub          ← 基础，无依赖
Task 2: MSI 打包                 ← 独立编译，可并行
Task 3: 后端部署到 Railway.app   ← 依赖 GitHub 仓库
```

---

## Task 1: README + GitHub 上传

**目标：** 编写专业 README，创建 GitHub 仓库，推送全部代码（排除 node_modules、target、data 等）

### Step 1：编写 README.md

**创建 `D:\vibecoding\app迁移工具\README.md`：**

```markdown
# AppSync - 软件清单同步与下载导航工具

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

AppSync 是一款 Windows 桌面工具，帮你解决换电脑时"不知道装了哪些软件、去哪下载"的问题。

## 功能

- **一键扫描** — 扫描本机已安装的软件和运行时环境（Python、Node.js、Java、Go、.NET 等）
- **云端同步** — 扫描结果上传云端，多台设备间共享清单
- **跨设备对比** — 旧电脑有的、新电脑没有的软件一目了然
- **下载导航** — 内置 650+ 常用软件官方下载链接，一键直达
- **社区贡献** — 用户可提交新的下载链接，管理员审核后入库

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Tauri 2 (Rust) |
| 前端 UI | React 19 + TypeScript + Vite |
| 扫描引擎 | Rust (winreg, sysinfo) |
| 后端 API | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT + bcrypt |

## 快速开始

### 下载安装包

从 [Releases](https://github.com/你的用户名/appsync/releases) 下载最新 MSI 安装包，运行即可。

### 从源码构建

**前置条件：**
- Node.js 20+
- Rust 1.70+
- 系统：Windows 10/11

```bash
# 克隆仓库
git clone https://github.com/你的用户名/appsync.git
cd appsync

# 安装后端依赖
cd backend && npm install
# 初始化数据库
npm run seed
npm run seed-admin
# 启动后端
npm start

# 安装桌面端依赖
cd ../desktop && npm install
# 启动开发模式
npm run tauri dev
```

### 运行测试

```bash
.\run-tests.bat
```

## 配置

### 后端（`backend/.env`）

```
PORT=3000
JWT_SECRET=你的随机密钥
JWT_EXPIRES_IN=7d
```

### 桌面端（环境变量）

```
VITE_API_BASE=http://你的服务器地址/api/v1
```

> 生产部署时设置 `VITE_API_BASE` 指向云端后端地址。

## 项目结构

```
├── backend/          # Node.js 后端 API
│   ├── src/          # 源代码
│   ├── tests/        # 测试
│   ├── scripts/      # 工具脚本
│   └── data/         # 数据库 + 内置链接库
├── desktop/          # Tauri 桌面客户端
│   ├── src/          # React 前端
│   ├── src-tauri/    # Rust 扫描引擎
│   └── public/       # 静态资源
├── docs/             # 文档
└── scripts/          # 测试脚本
```

## License

MIT
```

### Step 2：创建 `.github/workflows/ci.yml`（CI 配置，可选）

创建 `D:\vibecoding\app迁移工具\.github\workflows\ci.yml`：

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Backend tests
        working-directory: backend
        run: |
          npm install
          npm test
      - name: Frontend tests
        working-directory: desktop
        run: |
          npm install
          npm test
      - name: Rust tests
        working-directory: desktop/src-tauri
        run: cargo test
```

### Step 3：创建 GitHub 仓库并推送

```bash
# 本地操作
cd D:\vibecoding\app迁移工具

# 确保 .gitignore 覆盖了所有不需要的文件
# 检查现有的 .gitignore

git add README.md .github/workflows/ci.yml
git commit -m "docs: add README and CI workflow"

# 创建 GitHub 仓库（使用 gh CLI）
gh repo create appsync --public --source=. --remote=origin --push

# 如果没有 gh CLI，手动操作：
# 1. 浏览器打开 https://github.com/new
# 2. 创建名为 appsync 的公开仓库
# 3. 不勾选任何初始化选项
# 4. 执行：
#    git remote add origin https://github.com/你的用户名/appsync.git
#    git branch -M main
#    git push -u origin main
```

### Step 4：验证

```bash
# 确认仓库已推送
gh repo view appsync --json url

# 确认 CI 运行
# 浏览器打开 https://github.com/你的用户名/appsync/actions
```

---

## Task 2：打包 MSI 安装包

**目标：** 通过 Tauri 2 的内置 bundler 生成 Windows MSI 安装包，用户下载后一键安装。

### 现状分析

当前 `tauri.conf.json` 已有：
```json
"bundle": {
  "active": true,
  "targets": "all",
  "icon": [...]
}
```

`"targets": "all"` 在 Windows 上会生成 MSI 和 NSIS 两种格式。但当前配置缺少：
1. MSI 专用的 WiX 配置（Tauri 2 MSI 需要）
2. 发布者信息
3. 版本号同步
4. 后端自动启动机制（桌面端需要连接后端）

### Step 1：完善 Tauri 打包配置

修改 `desktop/src-tauri/tauri.conf.json`：

```json
{
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.ico"],
    "windows": {
      "wix": null,
      "nsis": {
        "installMode": "currentUser"
      }
    }
  }
}
```

> **注意：** Tauri 2 的 MSI 打包依赖 WiX Toolset。如果构建环境中没有安装，Tauri 会自动处理。但建议先验证环境：
> ```bash
> # 验证 Rust 工具链
> rustup show
> # 验证 Tauri CLI
> npx @tauri-apps/cli@latest --version
> ```

### Step 2：构建 MSI

```bash
cd D:\vibecoding\app迁移工具\desktop

# 构建生产版本（生成 MSI + NSIS）
npm run tauri build

# 如果只想构建 MSI：
# npx tauri build --bundles msi
```

**预期输出：**
- `desktop/src-tauri/target/release/bundle/msi/AppSync_0.1.0_x64_en-US.msi`
- `desktop/src-tauri/target/release/bundle/nsis/AppSync_0.1.0_x64-setup.exe`

### Step 3：发布到 GitHub Releases

```bash
# 创建发布
cd D:\vibecoding\app迁移工具

# 打标签
git tag v0.1.0
git push origin v0.1.0

# 创建 Release 并上传安装包
gh release create v0.1.0 \
  --title "AppSync v0.1.0" \
  --notes "初始版本发布。" \
  "desktop/src-tauri/target/release/bundle/msi/AppSync_0.1.0_x64_en-US.msi" \
  "desktop/src-tauri/target/release/bundle/nsis/AppSync_0.1.0_x64-setup.exe"

# 如果没有 gh CLI，手动上传：
# 浏览器打开 https://github.com/你的用户名/appsync/releases/new
# 标签：v0.1.0
# 上传 MSI 和 exe 文件
```

### Step 4：验证安装包

将生成的 MSI 复制到一台干净的 Windows 机器，双击安装：
- [ ] 安装过程无报错
- [ ] 启动 AppSync 后能看到登录界面
- [ ] 创建 `backend/.env` 并启动后端后，能成功登录
- [ ] 扫描功能正常运行

---

## Task 3：后端部署到 Railway.app

**目标：** 将 Node.js 后端部署到免费云平台，桌面端通过配置 `VITE_API_BASE` 连接云端。

### 选型理由

| 平台 | 免费额度 | 适合场景 | 选择 |
|------|---------|---------|------|
| **Railway.app** | 每月 $5 免费额度，500小时/月 | Node.js 一键部署 | ✅ 推荐 |
| Render.com | 免费 Web Service（休眠） | Node.js 部署 | ⚠️ 会休眠 |
| Fly.io | 3 台共享 VM | Docker 部署 | ⚠️ 需 Dockerfile |
| Koyeb | 免费 1 核 1G | Node.js 部署 | ⚠️ 次选 |

**选 Railway.app 理由：** 免费额度充足、Node.js 零配置部署、自动 SSL、GitHub 自动同步、无需操心服务器。

### Step 1：创建 Railway 账号

1. 打开 https://railway.app/
2. 使用 GitHub 账号登录
3. 授权 Railway 访问你的 GitHub 仓库

### Step 2：添加生产环境配置

创建 `D:\vibecoding\app迁移工具\backend\Procfile`：

```
web: node src/index.js
```

创建 `D:\vibecoding\app迁移工具\backend\.env.production`（示例，**不要提交到 Git**）：

```
PORT=3000
JWT_SECRET=生产环境的随机密钥
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:1420
NODE_ENV=production
```

> Railway.app 会自动识别 Node.js 项目，读取 `package.json` 的 `start` 脚本。

### Step 3：Railway 部署

1. 在 Railway Dashboard 点击 **New Project**
2. 选择 **Deploy from GitHub repo**
3. 选择 `你的用户名/appsync`
4. **关键：** Railway 会识别整个 monorepo。需要设置 **Root Directory** 为 `backend`
5. 添加环境变量（与 `.env.production` 内容一致）：
   - `PORT=3000`
   - `JWT_SECRET=<生成一个随机密钥>`
   - `JWT_EXPIRES_IN=7d`
   - `CORS_ORIGIN=http://localhost:1420`（后续改为桌面端实际地址）
   - `NODE_ENV=production`
6. 点击 **Deploy**

### Step 4：生成 JWT 密钥

```bash
# PowerShell 生成 64 位随机十六进制密钥
$key = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
Write-Host "JWT_SECRET=$key"
```

### Step 5：配置桌面端连接云端

桌面端已通过 `VITE_API_BASE` 环境变量支持配置后端地址：

```bash
# 构建时指定云端地址
cd desktop
$env:VITE_API_BASE="https://你的-app.railway.app/api/v1"
npm run tauri build
```

或者编译后在运行时修改 `client.ts` 中的默认值。

### Step 6：初始化生产数据库

Railway 部署启动后，需要一次性的数据库初始化：

```bash
# 找到 Railway 分配的域名（如 appsync-production.up.railway.app）
# 通过 API 健康检查确认服务运行
curl https://你的-app.railway.app/api/v1/health

# 种子内置下载链接（通过 API 或 Railway CLI）
# 安装 Railway CLI:
# npm i -g @railway/cli
# railway login
# railway run --services appsync-backend node src/seed.js
# railway run --services appsync-backend node scripts/seed-admin.js
```

### Step 7：验证部署

- [ ] `https://你的-app.railway.app/api/v1/health` 返回 `{"status":"ok","db":"connected"}`
- [ ] 注册新用户成功
- [ ] 上传清单成功
- [ ] 搜索下载链接成功

---

## 备用方案

如果 Railway.app 不可用，备选方案：

| 方案 | 费用 | 配置复杂度 | 说明 |
|------|------|-----------|------|
| **Render.com** | 免费 | 低 | Web Service 选 Node，设定构建命令，会自动检测 |
| **Fly.io** | 免费 3 VM | 中 | 需要写 `Dockerfile`，用 `flyctl launch` 部署 |
| **Oracle Cloud** | 永久免费 | 高 | 申请 ARM 实例，自行配置 Nginx + PM2 |

### Render.com 快速部署

```yaml
# render.yaml
services:
  - type: web
    name: appsync-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && node src/index.js
    envVars:
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: NODE_ENV
        value: production
```

---

## 安全检查清单

部署前逐一确认：

| 项目 | 状态 |
|------|------|
| `backend/.env` 中的 JWT_SECRET 已更换为生产密钥 | ☐ |
| `backend/.env` 不在 Git 跟踪中 (`git ls-files backend/.env`) | ☐ |
| CSP 已配置（已在 `tauri.conf.json` 中设置） | ✅ |
| CORS 已限制为桌面端域名 | ☐ |
| Express 错误处理不泄露堆栈信息 | ☐ |
| Rate limiting 已启用 | ✅ |
| SQLite 数据库不在仓库中（已在 .gitignore） | ✅ |
| `node_modules` 不在仓库中 | ✅ |

---

## 时间预估

| 任务 | 预估时间 |
|------|---------|
| README.md + CI 配置 | 20 分钟 |
| 创建 GitHub 仓库并推送 | 10 分钟 |
| Tauri 打包配置完善 | 15 分钟 |
| 构建 MSI | 10-30 分钟（取决于编译速度） |
| 创建 Release | 10 分钟 |
| Railway.app 注册 + 部署 | 30 分钟 |
| 数据库初始化 + 验证 | 15 分钟 |
| **合计** | **1.5 - 2 小时** |
