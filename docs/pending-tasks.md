# AppSync 待完成任务清单

> 最后更新: 2026-07-23
> 注意: 设计规范文档 (`docs/superpowers/specs/...`) 和实现计划 (`docs/superpowers/plans/...`) 已删除，因代码已大幅偏离原有 PostgreSQL 架构和 deep_scan 设计。

---

## P0 — 核心功能（已完成）

### ✅ P0-1: 跨设备清单对比 💯

| 项目 | 说明 |
|------|------|
| **状态** | ✅ 已完成 |
| **描述** | 后端已有 `GET /inventories/compare?other_id=xxx` 接口。前端 Downloads 页支持跨设备对比，默认显示差异列表。 |
| **涉及文件** | `backend/src/routes/inventories.js`, `desktop/src/pages/Downloads.tsx` |

### ✅ P0-2: 内置下载链接库

| 项目 | 说明 |
|------|------|
| **状态** | ✅ 已完成 |
| **描述** | 内置链接库已覆盖常见软件分类，`backend/data/builtin-links.json` 持续扩充中。 |
| **涉及文件** | `backend/data/builtin-links.json` |

---

## P1 — 重要功能（已完成）

### ✅ P1-1: 同步状态指示器 💯

| 项目 | 说明 |
|------|------|
| **状态** | ✅ 已完成 |
| **描述** | Dashboard 显示同步状态：扫描后自动上传，通过 `localStorage` 记录同步状态显示。 |
| **涉及文件** | `desktop/src/pages/Dashboard.tsx` |

### ✅ P1-2: 刷新 Token 接口 💯

| 项目 | 说明 |
|------|------|
| **状态** | ✅ 已完成 |
| **描述** | 后端 `POST /auth/refresh` 已实现。前端 `client.ts` 在 401 时自动尝试刷新。 |
| **涉及文件** | `backend/src/routes/auth.js`, `desktop/src/api/client.ts` |

### ✅ P1-3: 管理员审核页面 💯

| 项目 | 说明 |
|------|------|
| **状态** | ✅ 已完成（独立 Web 面板） |
| **描述** | 独立 Web 管理面板 (`backend/public/admin/index.html`) 提供链接审核、用户管理功能。 |
| **涉及文件** | `backend/public/admin/index.html`, `backend/src/routes/downloads.js` |

---

## P2 — 体验优化（已完成）

### ✅ P2-1: 批量复制链接 💯

| 项目 | 说明 |
|------|------|
| **状态** | ✅ 已完成 |
| **描述** | Downloads 页支持一键复制所有已匹配链接到剪贴板。 |
| **涉及文件** | `desktop/src/pages/Downloads.tsx` |

### ✅ P2-2: 社区贡献标记 💯

| 项目 | 说明 |
|------|------|
| **状态** | ✅ 已完成 |
| **描述** | AppCard 区分内置库和社区贡献链接，显示不同标签。 |
| **涉及文件** | `desktop/src/components/AppCard.tsx` |

### ✅ P2-3: 应用展开详情 💯

| 项目 | 说明 |
|------|------|
| **状态** | ✅ 已完成 |
| **描述** | Inventory 页点击应用行展开显示发布者、安装路径、安装日期等详细信息。 |
| **涉及文件** | `desktop/src/components/AppCard.tsx`, `desktop/src/pages/Inventory.tsx` |

---

## P3 — 长期规划（待完成）

### ☐ P3-1: HTTPS + 部署

| 项目 | 说明 |
|------|------|
| **描述** | 后端需要 HTTPS 证书和 Nginx 反向代理，部署到云服务器。桌面客户端需要自动更新机制（GitHub Releases + Tauri updater）。 |
| **预估工时** | 3-4 小时 |



---

## 实现状态总览

```
P0: ✅ 跨设备对比    ✅ 链接库扩充
P1: ✅ 同步指示器    ✅ 刷新 Token    ✅ 审核页面(独立web)    ✅ 用户管理
P2: ✅ 批量复制      ✅ 社区贡献标签  ✅ 应用展开详情
P3: ☐ HTTPS+部署
```

> 文档记录：`docs/review/01-principle-issues.md`（已修复问题追踪）
> `docs/review/02-function-review.md`（功能完整性审查）
> `docs/review/03-ui-layout-optimization.md`（UI 优化记录）
> `docs/review/04-code-review-final.md`（最终代码审查及修复状态）
