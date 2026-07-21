# AppSync — 软件清单同步与下载导航工具 设计文档

## 1. 概述

### 1.1 产品定位
AppSync 是一款 **Windows 桌面客户端 + 云端服务** 的软件清单管理工具。它不是传统意义上的应用迁移工具，而是通过扫描当前电脑已安装的软件和运行时环境，将清单同步到云端，在新电脑上登录后即可查看并一键导航到官方下载页面，解决换电脑时"不知道装了哪些软件、去哪下载"的问题。

### 1.2 核心价值
- 告别对照旧电脑逐一下载的繁琐过程
- 记录运行时环境版本（Java/Python/Node 等）及其包/库依赖
- 提供精确的官方下载链接，避免从非官方渠道下载到捆绑恶意软件的版本

### 1.3 目标用户
- 经常换电脑或重装系统的开发者
- 需要维护多台开发机环境一致性的技术人员
- IT 管理员（批量管理多台机器的软件清单）

---

## 2. 系统架构

### 2.1 整体架构图

```
┌──────────────────────────┐     ┌──────────────────────────┐
│  旧电脑 (Windows)         │     │  新电脑 (Windows)         │
│                          │     │                          │
│  ┌────────────────────┐  │     │  ┌────────────────────┐  │
│  │  桌面客户端 (Tauri) │  │     │  │  桌面客户端 (Tauri) │  │
│  │                    │  │     │  │                    │  │
│  │  ┌──────────────┐  │  │     │  │  ┌──────────────┐  │  │
│  │  │  扫描引擎     │  │  │     │  │  │  清单浏览器   │  │  │
│  │  └──────┬───────┘  │  │     │  │  └──────┬───────┘  │  │
│  │         │          │  │     │  │         │          │  │
│  │  ┌──────▼───────┐  │  │     │  │  ┌──────▼───────┐  │  │
│  │  │  清单 JSON   │  │  │     │  │  │  清单 JSON   │  │  │
│  │  └──────────────┘  │  │     │  │  └──────────────┘  │  │
│  └────────┬───────────┘  │     │  └────────┬───────────┘  │
└───────────┼──────────────┘     └───────────┼──────────────┘
            │ HTTPS (REST JSON)              │
            ▼                                ▼
    ┌───────────────────────────────────────────┐
    │            云端后端 (Node.js)               │
    │                                           │
    │  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
    │  │  账号系统 │  │  清单API  │  │ 下载库API│ │
    │  │ JWT Auth │  │  CRUD    │  │ 搜索+贡献│ │
    │  └──────────┘  └────┬─────┘  └────┬────┘ │
    │                     │             │       │
    │           ┌─────────▼─────────────▼───┐  │
    │           │      PostgreSQL          │  │
    │           │  users + inventories +   │  │
    │           │  download_links          │  │
    │           └──────────────────────────┘  │
    └───────────────────────────────────────────┘
```

### 2.2 子系统职责

| 子系统 | 语言/框架 | 核心职责 |
|--------|----------|---------|
| 桌面客户端 | Tauri (Rust + Web UI) | 扫描、展示清单、账号管理、下载导航 |
| 扫描引擎 | Rust (Tauri 内嵌) | Windows 本地应用/环境扫描 |
| 前端 UI | React (Tauri WebView) | 用户交互、数据可视化 |
| 后端 API | Node.js + Express | 账号认证、清单存储、下载链接服务 |
| 数据库 | PostgreSQL | 持久化存储 |

### 2.3 技术选型理由

**Tauri 选型理由：**
- 打包体积小（<10MB），适合"装机必备工具"的定位
- Rust 编写的扫描引擎性能优异、类型安全
- Web UI 方便做出简洁现代的界面
- 相比 Electron 内存占用减少 80%

**Node.js + Express 选型理由：**
- 与前端共享 JavaScript/TypeScript 技能栈
- 生态成熟、开发效率高
- 轻量级部署，一台低配云服务器即可运行

**PostgreSQL 选型理由：**
- JSON 文档存储（清单本身就是 JSON 结构）
- 支持全文搜索（下载链接搜索）
- 成熟稳定，免费托管选项多

---

## 3. 扫描引擎设计（Rust）

### 3.1 扫描层级

#### 第一层：基础扫描（默认执行）

| 扫描源 | 技术方案 | 产出 |
|--------|---------|------|
| Windows 注册表 (32/64位) | `winreg` crate 读取 `Uninstall` 路径 | 软件名、版本、发布者、安装路径、安装日期 |
| Windows Store 应用 | 调用 `Get-AppxPackage` PowerShell | UWP 应用名、版本 |
| Winget 包管理器 | `winget list` 命令输出解析 | 包名、ID、版本、源 |
| Chocolatey | `choco list --local-only` | 包名、版本 |
| Scoop | `scoop list` | 应用名、版本、桶名 |
| OS 信息 | `sysinfo` crate | Windows 版本、Build、架构 |

#### 第二层：运行时环境探测（默认执行）

| 运行时 | 检测命令 | 额外数据 |
|--------|---------|---------|
| Java | `java -version 2>&1` | 版本、JVM 厂商、位数 |
| Python | `python --version` + `pip list --format=json` | 版本、所有包名+版本 |
| Node.js | `node --version` + `npm list -g --depth=0 --json` | 版本、全局包列表 |
| Go | `go version` | 版本、GOOS/GOARCH |
| .NET SDK | `dotnet --list-sdks` | 已装 SDK 版本列表 |
| .NET Runtime | `dotnet --list-runtimes` | 已装运行时列表 |
| Rust | `rustc --version` + `cargo --version` | 版本 |
| Git | `git --version` | 版本 |
| Docker | `docker version --format json` | 版本、引擎信息 |

#### 第三层：深度扫描（可选，默认关闭）

| 扫描项 | 方案 |
|--------|------|
| VS Code 扩展 | `code --list-extensions --show-versions` |
| PATH 环境变量 | `std::env::var("PATH")` 解析 |
| WSL 发行版 | `wsl --list -v` |
| Windows 可选功能 | `DISM /Online /Get-Features` |
| Chrome/Edge 扩展 | 读取浏览器扩展目录的 Manifest |
| npm 全局包 | `npm list -g --depth=0`（已有一级覆盖） |

### 3.2 扫描结果数据结构

```json
{
  "version": "1.0",
  "machine_name": "DESKTOP-ABC123",
  "scan_time": "2026-07-20T10:30:00.000Z",
  "scan_mode": "standard",
  "os": {
    "family": "Windows",
    "edition": "Windows 11 Pro",
    "version": "23H2",
    "build": "22631.2428",
    "architecture": "x86_64"
  },
  "applications": [
    {
      "name": "Visual Studio Code",
      "version": "1.90.2",
      "publisher": "Microsoft Corporation",
      "source": "registry",
      "install_path": "C:\\Program Files\\Microsoft VS Code",
      "install_date": "2026-03-15"
    }
  ],
  "runtimes": [
    {
      "name": "Python",
      "version": "3.12.4",
      "install_path": "C:\\Python312",
      "packages": [
        { "name": "requests", "version": "2.31.0" },
        { "name": "flask", "version": "3.0.0" }
      ]
    }
  ],
  "deep_scan": {
    "vscode_extensions": [
      { "name": "ms-python.python", "version": "2024.8.0" }
    ],
    "path_entries": ["C:\\Python312\\Scripts", "..."],
    "wsl_distributions": [
      { "name": "Ubuntu-22.04", "state": "Running", "version": "2" }
    ],
    "windows_features": [
      { "name": "Microsoft-Hyper-V", "state": "Enabled" }
    ]
  }
}
```

### 3.3 扫描规则
- 基础扫描 + 运行时探测为默认执行，耗时约 5-15 秒
- 深度扫描由用户手动触发，耗时约 30-60 秒
- 每次扫描生成唯一 UUID，覆盖上传前保留上一次扫描备份
- 注册表去重：同一软件出现在多源时，优先使用安装版信息（非便携版）

---

## 4. 后端 API 设计（Node.js + Express）

### 4.1 接口列表

#### 账号系统

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/v1/auth/register` | 注册 | 否 |
| POST | `/api/v1/auth/login` | 登录返回 JWT | 否 |
| POST | `/api/v1/auth/refresh` | 刷新 Token | 需 JWT |
| GET | `/api/v1/auth/profile` | 获取用户信息 | 需 JWT |

**注册请求体：**
```json
{
  "email": "user@example.com",
  "password": "user_password_plaintext",
  "nickname": "MyPC"
}
```

**登录响应：**
```json
{
  "token": "jwt...",
  "expires_in": 604800,
  "user": { "id": 1, "email": "user@example.com", "nickname": "MyPC" }
}
```

#### 清单管理

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/v1/inventories` | 上传扫描清单 | 需 JWT |
| GET | `/api/v1/inventories` | 获取所有清单 | 需 JWT |
| GET | `/api/v1/inventories/latest` | 获取最新清单 | 需 JWT |
| GET | `/api/v1/inventories/:id` | 获取指定清单详情 | 需 JWT |
| DELETE | `/api/v1/inventories/:id` | 删除清单 | 需 JWT |

**上传清单：** 直接上传扫描产出 JSON，服务端校验结构后存入 PostgreSQL JSONB 字段。

#### 下载链接服务

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/v1/downloads/search?q=xxx` | 搜索软件下载链接（仅查本地库） | 需 JWT |
| POST | `/api/v1/downloads/links` | 提交新的下载链接 | 需 JWT |
| GET | `/api/v1/downloads/links/pending` | 获取待审核链接（管理员） | 需 JWT + Admin |
| PUT | `/api/v1/downloads/links/:id/verify` | 审核通过/拒绝链接 | 需 JWT + Admin |

### 4.2 数据库表结构

#### `users` 表
```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname      VARCHAR(100),
  is_admin      BOOLEAN DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `inventories` 表
```sql
CREATE TABLE inventories (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_data     JSONB NOT NULL,
  machine_name  VARCHAR(255),
  scan_mode     VARCHAR(20) DEFAULT 'standard',
  scan_time     TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventories_user_id ON inventories(user_id);
CREATE INDEX idx_inventories_scan_time ON inventories(scan_time);
```

#### `download_links` 表
```sql
CREATE TABLE download_links (
  id                  SERIAL PRIMARY KEY,
  software_name       VARCHAR(255) NOT NULL,
  aliases             TEXT[] DEFAULT '{}',
  official_url        VARCHAR(1000) NOT NULL,
  direct_download_url VARCHAR(1000),
  category            VARCHAR(100),
  verified            BOOLEAN DEFAULT false,
  contributor_id      INTEGER REFERENCES users(id),
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_download_links_name ON download_links(software_name);
CREATE INDEX idx_download_links_verified ON download_links(verified);
```

### 4.3 配置与环境变量

```
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/appsync
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

---

## 5. 下载链接库

### 5.1 数据来源分级

| 级别 | 来源 | 可信度 | 更新方式 |
|------|------|--------|---------|
| **L1 官方库** | 官方 API/已知固定下载 URL | ★★★★★ | 自动检查 URL 可用性 |
| **L2 内置库** | 项目维护者手动录入的前 500+ 软件 | ★★★★☆ | 随版本更新发布 |
| **L3 社区贡献** | 用户提交 + 审核合入 | ★★★☆☆ | 按需审核合并 |
| **L4 搜索兜底** | 搜索引擎实时查找 | ★★☆☆☆ | 实时，结果需人工确认 |

### 5.2 内置库分类

初始 500 条覆盖以下分类：

| 分类 | 示例 | 预计数量 |
|------|------|---------|
| 浏览器 | Chrome, Firefox, Edge | 10 |
| 办公 | Office, WPS, Notion, Obsidian | 20 |
| 开发 IDE | VS Code, IDEA, PyCharm, WebStorm | 30 |
| 运行时 | JDK, Python, Node, Go, Rust | 20 |
| 数据库工具 | MySQL Workbench, DBeaver, Navicat | 15 |
| 设计工具 | Photoshop, Figma, Sketch | 15 |
| 通讯 | WeChat, Discord, Slack, Telegram | 15 |
| 媒体 | VLC, PotPlayer, Spotify, OBS | 20 |
| 安全 | 火绒, 360, Bitdefender | 15 |
| 驱动 | GeForce Experience, Intel DSA | 10 |
| 工具 | 7-Zip, Everything, Notepad++, Git | 30 |
| 系统增强 | PowerToys, AutoHotkey, Clash | 20 |
| 其他 | 高频软件长尾 | 280 |

### 5.3 兜底搜索策略

当内置库和社区库都无法匹配时，客户端直接调用系统默认浏览器，打开搜索引擎搜索 `"{软件名} 官方下载"` 或 `"{software name} official download"`。

- 搜索仅在客户端本地触发，后端不参与
- 默认使用用户系统默认搜索引擎
- 不依赖任何第三方搜索 API，零成本

---

## 6. 桌面客户端 UI 设计

### 6.1 页面结构

采用三页导航，极简风格：

**页面 ① 清单总览 (Dashboard)**
- 当次扫描统计：应用总数、运行时数量、未匹配链接数
- 大按钮「立即扫描」
- 最近一次扫描时间
- 登录/未登录状态标识
- 同步状态：本地仅存 / 已上传云端

**页面 ② 软件列表 (Inventory)**
- 分 tab 展示：全部应用 / 运行时 / 深度扫描
- 每个软件显示：名称 + 版本 + 下载链接状态（🟢 已收录 / 🟡 需搜索 / ⚪ 未知）
- 点击展开详情：发布者、安装路径、安装日期
- 搜索/过滤框

**页面 ③ 下载中心 (Downloads)**
- 默认筛选：旧电脑有 + 新电脑没有的软件
- 每个软件显示：名称 + 版本 + 下载按钮
  - 内置库匹配 → 直接跳转到官方下载页
  - 社区匹配 → 跳转并标注"社区贡献"
  - 未匹配 → 显示"搜索官网"按钮，点击后联网搜索，展示结果供选择
- 批量复制链接功能

### 6.2 用户操作流程

**旧电脑流程：**
```
安装 AppSync → 注册/登录 → 点击"立即扫描"
    → 扫描完成 → 确认清单 → 自动上传云端
```

**新电脑流程：**
```
安装 AppSync → 登录同个账号 → 清单自动同步
    → 进入下载中心 → 逐个/批量下载软件
```

---

## 7. 安全与稳定性

### 7.1 安全措施
- 密码 bcrypt 哈希存储
- JWT Token 认证（7 天有效期）
- 所有 API 通过 HTTPS
- 扫描引擎仅读取信息，不写入/修改系统
- 下载链接不包含付费推广链接，仅收录官方渠道

### 7.2 数据隐私
- 清单数据仅所有者可见
- 扫描数据不包含任何用户文件内容
- 用户可随时删除自己的清单数据
- 开源后端源码，接受社区审计

### 7.3 错误处理
- 扫描引擎超时保护（默认 60 秒后超时）
- 部分扫描失败不影响整体结果（记录失败原因）
- 网络断开时清单自动保存本地，联网后提示上传

---

## 8. 数据流总结

```
[用户点击"扫描"]
    → Rust 扫描引擎遍历注册表/包管理器/环境变量
    → 组装 JSON 清单
    → 前端展示扫描结果
    → 用户确认后 POST 到后端
    → 后端校验 JSON 结构，存入 PostgreSQL JSONB 字段
    
[用户搜索下载链接]
    → 前端 GET /api/v1/downloads/search?q=xxx
    → 后端查 download_links 表（模糊匹配 name + aliases）
    → 命中 verified=true 记录 → 返回官方下载链接
    → 未命中 → 客户端打开系统浏览器搜索 "{软件名} 官方下载"
```

---

## 9. 部署方案

### 9.1 后端部署
- **推荐方案：** Node.js + PM2 部署在云服务器（最低配置 1C2G）
- **数据库：** PostgreSQL 14+（可使用 Supabase 免费层 / 自建）
- **域名 + HTTPS：** Nginx 反向代理 + Let's Encrypt 自动续签

### 9.2 桌面客户端分发
- **下载页：** 部署在同一个域名下的静态页面
- **自动更新：** Tauri 内置 updater，通过 GitHub Releases 分发
- **安装包格式：** .msi + 便携版 .exe

---

## 10. 扩展性考虑

### 未来可能的扩展方向
- macOS/Linux 清单导入（文件导入，非客户端）
- 软件配置文件迁移（如 VS Code settings.json）
- 团队版功能（管理员查看所有组员软件清单）
- 软件安装脚本生成（自动生成安装 CMD/PowerShell 脚本）

---

## 11. 非功能性需求

| 维度 | 指标 |
|------|------|
| 扫描速度 | 标准模式 <15 秒，深度模式 <60 秒 |
| 客户端安装包 | <20MB |
| 启动时间 | <2 秒 |
| API 响应 | 清单操作 <500ms，搜索 <2s |
| 并发用户 | MVP 支持 100 并发 |
| 数据存储 | 单用户清单约 50-200KB JSON |
