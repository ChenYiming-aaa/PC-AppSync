# 代码审查 — 功能完整性报告

> 审查日期: 2026-07-22
> 范围: 增 / 删 / 改 建议

---

## 需删除

| 文件 | 原因 | 状态 |
|------|------|------|
| `backend/migrations/001_init.sql` | PostgreSQL 语法，项目用 SQLite | ✅ 已删除 |
| `backend/.env.example` 中的 `DATABASE_PATH` | 环境变量未引用 | ✅ 已移除 |
| `backend/scripts/seed-admin.js` | 可合并到 `src/seed.js` | ➡️ 保留，开发用 |
| `backend/scripts/seed-users.js` | 同上，冗余 | ➡️ 保留，开发用 |

---

## 需修改

| 模块 | 问题描述 | 修改建议 |
|------|----------|----------|
| ~~API Token 刷新~~ | 经审查 body 为字符串可复用，非活跃 bug | ➡️ 跳过 |
| ~~**Desktop Admin 页面**~~ | 移除桌面端，添加登录图标彩蛋 | ✅ 已修复 |
| **Inventory 匹配无 Loading** `desktop/src/pages/Inventory.tsx` | 组件挂载时 `links={}`，所有 app 先显示 "unmatched" 然后突然刷新 | ✅ 已修复 — 添加 `loadingLinks` + `loading` prop，匹配期间显示脉冲占位动画 |
| **跨设备比较覆盖 scanResult** `desktop/src/pages/Downloads.tsx` | 选择比较后 `missingApps` 覆盖原始 `scanResult`，原有下载链接匹配丢失 | ✅ 已修复 — 添加 `viewMode` 切换（Current / Missing），两者共存 |
| **扫描进度反馈 + 耗时显示** `desktop/src/components/ScanButton.tsx` | 进度条只有 10%→100% 跳变；耗时不准 | ✅ 已修复 — 15+ 个细粒度进度事件（注册表扫描每 20 项发一次、每检测一个运行时发一次）；前端脉冲动画（无事件时自动缓步推进至 90%）；`ScanResult.scan_duration_ms` Rust 端精确测量耗时，显示如 `2.5s` |
| **深色模式** `desktop/src/App.css` + 各组件 | 仅跟随系统；硬编码浅色颜色（badge、catIcons 背景、StatCard 等）在深色模式下视觉效果差 | ✅ 已修复 — `data-theme` 属性 + 手动切换，添加 `catIconBg()`/`catIconColor()` 函数按主题返回颜色；所有硬编码颜色改为 CSS 变量 |
| **扫描错误详情** `desktop/src/components/ScanButton.tsx:20` | `catch` 仅 `toast('Scan failed')`，无具体错误 | ✅ 已修复 — 显示 `err.message` 真实错误信息 |
| ~~**Dashboard 删除扫描**~~ | 改用 inventoryId 精确删除 | ✅ 已修复 |

---

## 需增加

| 功能 | 优先级 | 文件 | 说明 |
|------|--------|------|------|
| **下载链接库预览** | P2 | `desktop/src/pages/Downloads.tsx` + `components/LinkLibrary.tsx` | ✅ 已修复 — 新建 `LinkLibrary` 弹窗组件，支持搜索 + 10条/页分页，风格统一；后端新增 `GET /downloads/links` 分页接口 |
| **扫描数据本地导入** | P1 | `desktop/src/pages/Dashboard.tsx` | 非 Tauri 环境（Web 模式）导入已有扫描 JSON |
| **安装脚本改进** | P2 | `desktop/src/api/scanner.ts` | 生成 winget/choco 命令，支持批量 |
| **注销确认** | P2 | `desktop/src/components/Layout.tsx` + `ConfirmDialog.tsx` | ✅ 已修复 — Sign out 确认弹窗；同时改造 `confirmDialog` 支持自定义确认按钮文字，默认 "Delete" 可传入其他文字 |
| **搜索防抖** | P2 | `desktop/src/pages/Inventory.tsx` + `Downloads.tsx` | ✅ 已修复 — 添加 `debouncedSearch` + 200ms debounce，输入时不触发重渲染 |
| **密码修改** | P2 | 后端 + 前端 | ✅ 已修复 — 后端 `PUT /auth/password`，前端导航栏 🔒 图标打开修改密码弹窗 |

---

## 功能状态总览

### 已实现的 P0/P1 功能
- ✅ 跨设备清单对比（后端 `/api/v1/inventories/compare`）
- ✅ 批量复制下载链接
- ✅ 社区贡献标记（Official / Community 标签）
- ✅ 应用展开详情（publisher, installPath, installDate）
- ✅ Token 刷新（自动 401 重试）
- ✅ 同步状态指示器（Synced / Local / None）
- ✅ 管理员 Web 面板（`public/admin/index.html`）

### 未实现的 P3 功能
- ⬜ HTTPS + Nginx 部署
- ⬜ macOS/Linux 清单导入
- ⬜ 安装脚本增强（winget/choco）
