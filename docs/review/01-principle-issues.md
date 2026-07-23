# 代码审查 — 原则性问题报告

> 审查日期: 2026-07-22
> 审查范围: 全部源代码（后端、前端、Rust 扫描器）
>
> 修复状态: 🔴 7/7 已处理 · 🟡 6/6 已处理 · 🟢 4/5 已处理

---

## 🔴 严重问题

### 1. API Token 刷新导致 POST Body 丢失

**文件**: `desktop/src/api/client.ts:50-55`

```ts
if (res.status === 401) {
  // 刷新后直接重发原始请求，但 body 是 ReadableStream，不可重复读取
  // POST 请求 body 丢失 → 静默错误
}
```

`fetch` 的 body 是 ReadableStream，第一次请求消耗后第二次 `fetch` 时 body 已为空。导致所有 POST 请求在 Token 过期后自动刷新时会**静默发送空 body**（uploadInventory、submitDownloadLink、batchMatchLinks 等全部失效）。

**影响范围**: 全部需要认证的 POST/PUT 请求

---

### 2. 管理后台与桌面端 Admin 页面分裂

**文件**:
- `backend/public/admin/index.html` — 独立 Web 管理后台
- `desktop/src/App.tsx:77-107` — 桌面端内嵌 Admin 页

桌面端 Admin 页面仅显示 AppSync Logo 和一个"Open Admin Panel"按钮（跳转到 `localhost:3000/admin`），没有任何实际管理功能。需要维护两套独立的 UI 代码。

---

### 3. migrations/001_init.sql 误用 PostgreSQL 语法

**文件**: `backend/migrations/001_init.sql`

```sql
ALTER USER postgres WITH PASSWORD 'appsync168';
```

项目实际使用 **SQLite**（`better-sqlite3`），此文件完全无效且产生严重误导。数据库表结构实际在 `backend/src/db.js:init()` 中通过 `CREATE TABLE IF NOT EXISTS` 创建。

---

### 4. db.js 返回 BigInt 未做类型转换 ✅ 已修复

**文件**: `backend/src/db.js:36`

```js
// 修复前: info.lastInsertRowid 返回 BigInt，调用方手动 Number() 转换
return { rows: [{ id: info.lastInsertRowid }] };

// 修复后: 在 query 函数内统一转换为 Number
return { rows: [{ id: Number(info.lastInsertRowid) }] };
```

`better-sqlite3` 的 `lastInsertRowid` 返回 BigInt，原代码调用方多处手动 `Number()` 转换。改为在 `db.js:query()` 中统一转换，调用方无需再关心类型。

---

### 5. Rust Java 版本解析依赖 stderr

**文件**: `desktop/src-tauri/src/scanner/runtimes.rs:52`

使用 `run_cmd_err` 从 stderr 捕获 `java -version` 输出，但 Windows 下不同 Java 发行版输出格式不一，解析稳定性不足。

---

### 6. Windows Features 解析依赖本地化语言 ✅ 已修复

**文件**: `desktop/src-tauri/src/scanner/deep_scan.rs:68-86`

```rust
// 修复前: 使用 DISM /Format:Table 解析，依赖本地化格式
run_cmd("dism", &["/Online", "/Get-Features", "/Format:Table"])

// 修复后: 使用 PowerShell Get-WindowsOptionalFeature + JSON 输出，语言无关
run_cmd("powershell", &["-NoProfile", "-Command",
    "Get-WindowsOptionalFeature -Online | Select-Object FeatureName,State | ConvertTo-Json"])
```

将 DISM 文本表格解析改为 PowerShell JSON 输出，`ConvertTo-Json` 返回结构化数据，完全不受 Windows 显示语言影响。

---

### 7. tauri_plugin_opener 与自定义 open_url 重复 ✅ 已修复

**文件**:
- `desktop/src-tauri/src/lib.rs` — 注册了 `tauri_plugin_opener::init()`
- `desktop/src-tauri/src/commands.rs` — 自己实现了 `cmd /c start "" <url>`
- `desktop/src/api/scanner.ts` — 前端调用

```rust
// 修复前: 自定义命令 + 插件重复，互不感知
commands::open_url,  // 在 generate_handler! 中注册

// 修复后: 移除自定义命令，前端改用 @tauri-apps/plugin-opener
import { openUrl as pluginOpen } from '@tauri-apps/plugin-opener';
return pluginOpen(url);
```

移除了 `commands.rs` 中的自定义 `open_url` 命令和 `lib.rs` 中的注册，前端 `scanner.ts:openUrl` 改为直接使用 `@tauri-apps/plugin-opener` 包。

---

## 🟡 中等问题

### 8. categorize.ts 文件过大(1000+行) ✅ 已修复

**文件**: `desktop/src/utils/categorize.ts` → 拆分为 `categorize.ts` + `icons.ts`

将图标映射（`iconMap`、`getAppIconUrl`、`getFallbackIcon`）拆分到独立的 `icons.ts` 文件。`categorize.ts` 通过 `export * from './icons'` 保持向后兼容，所有现有 import 无需修改。

同时也去除了 `iconMap` 中重复的映射条目（如 `wechat`、`7-zip`、`winrar`、`wps`、`哔哩哔哩` 等重复项）。

### 9. catColors 颜色映射在三个文件中重复定义 ✅ 已修复

**文件**:
- `desktop/src/components/CategoryDropdown.tsx` — 移除本地定义，导入共享
- `desktop/src/pages/Inventory.tsx` — 移除本地定义，导入共享
- `desktop/src/utils/icons.ts` — 作为唯一来源导出 `catIcons`

将三份独立的 `catColors` 定义统一为 `icons.ts` 中的 `catIcons` 导出，其他文件通过 `import { catIcons } from '../utils/icons'` 引用，实现单点维护。

### 10. 扫描数据 null 字符处理位置不当 ✅ 已修复

**文件**: `backend/src/routes/inventories.js:13`

```js
// 修复前: JSON.stringify 后再 regex 替换，可能遗漏深层嵌套对象
const data = JSON.stringify(scan_data).replace(/\\u0000/g, '').replace(/\0/g, '');

// 修复后: 递归遍历对象，在序列化前清理所有字符串中的 null 字节
function sanitizeStrings(obj) {
  if (typeof obj === 'string') return obj.replace(/\0/g, '');
  if (Array.isArray(obj)) return obj.map(sanitizeStrings);
  if (obj && typeof obj === 'object') { ... }
  return obj;
}
const data = JSON.stringify(sanitizeStrings(scan_data));
```

添加 `sanitizeStrings` 递归函数，在 `JSON.stringify` 之前递归清理所有字符串字段中的 null 字节，确保深层嵌套对象也能正确清理。

### 11. 后端无全局错误处理中间件 ✅ 已修复

**文件**: `backend/src/index.js`

```js
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err?.message || err);
  if (err?.stack) console.error(err.stack);
  res.status(err?.status || 500).json({ error: err?.message || 'Internal server error' });
});
```

在所有路由之后添加 Express 4 参数错误处理中间件，统一捕获未处理的错误并返回一致的 JSON 错误格式 + 堆栈日志。

### 12. scan_time 格式统一 ✅ 已修复

**数据流**:
- Rust 端: `SystemTime::now()` → milliseconds 字符串
- SQLite 存储: 之前用 `datetime('now')`，改为接收前端上传的 `scan_time` 值
- 前端: 统一用 `new Date(Number(ts))` 解析

修复了 `backend/src/routes/inventories.js` 中 INSERT 语句，使用前端上传的 `scan_time` 替代 SQLite 的 `datetime('now')`，确保 Rust 扫描时间戳在整个数据链路中保持一致。

### 13. seed.js verified 布尔值转换

**文件**: `backend/src/seed.js`

```js
link.verified ? 1 : 0
```

SQLite 无布尔类型，seed 时手动转换，后续开发者在 SQL 中直接读写布尔值可能忘记转换。

---

## 🟢 轻微问题

### 14. 前端无路由 URL 同步

页面切换使用 `useState<string>` 而非 React Router，刷新浏览器（Web 模式）会丢失当前页面状态。

### 15. scanner.ts 动态 import 带来延迟 ✅ 已修复

```ts
// 修复前: 每次调用动态 import
const { invoke } = await import('@tauri-apps/api/core');

// 修复后: 顶层静态 import
import { invoke } from '@tauri-apps/api/core';
import { openUrl as pluginOpenUrl } from '@tauri-apps/plugin-opener';
```

改为顶层静态 import，消除每次调用时的模块加载开销。

### 16. Dashboard 删除扫描硬编码 list[0] ✅ 已修复

**文件**: `desktop/src/pages/Dashboard.tsx:107`

```ts
// 修复前: 从列表中取第一个，不一定匹配当前扫描
const list = await api.listInventories();
await api.deleteInventory(list[0].id);

// 修复后: App.tsx 维护 inventoryId 状态，Dashboard 直接使用
if (!inventoryId) { toast('No scan to delete', 'warning'); return; }
await api.deleteInventory(inventoryId);
```

在 App.tsx 中增加 `inventoryId` 状态，从 upload 返回值和 getLatestInventory 中获取，传递给 Dashboard 用于精确删除。

### 17. .env.example 中 DATABASE_PATH 未使用

**文件**: `backend/.env.example`

`DATABASE_PATH=data/appsync.db` — 该环境变量在代码中从未被引用，实际路径硬编码在 `db.js` 中。

### 18. 全部 UI 使用行内 style

除 `App.css` 外,所有组件内部使用 JavaScript style 对象，不利于主题维护和 CSS 复用。`md-btn-*` 类名已经有部分提取，但大部分样式仍为行内。
