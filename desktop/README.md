# AppSync Desktop

AppSync 桌面客户端 - Windows 软件清单同步与下载导航工具。

## 技术栈

- **框架**: Tauri 2.x (Rust + React + TypeScript)
- **UI**: React 18 + Vite
- **扫描引擎**: Rust (winreg, sysinfo, process)
- **构建**: Vite + tauri-build

## 开发

```bash
npm install
npm run tauri dev
```

## 构建

```bash
npm run tauri build
```

## 目录结构

```
src/
  api/          # 后端 API 客户端
  components/   # UI 组件 (AppCard, Layout, ScanButton 等)
  pages/        # 页面 (Dashboard, Inventory, Downloads, History)
  utils/        # 工具函数 (categorize, i18n, hooks, icons)
src-tauri/src/
  scanner/      # Rust 扫描引擎 (registry, package_managers, runtimes)
  commands.rs   # Tauri 命令
```
