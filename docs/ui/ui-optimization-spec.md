# AppSync UI 优化方案

## 一、整体问题分析

| 问题 | 影响 |
|------|------|
| 软件列表无分类，所有应用平铺显示 | 用户无法快速找到目标软件 |
| 无搜索过滤功能 | 软件多时全靠肉眼查找 |
| 无匹配状态概览 | 不知道多少软件已有下载链接 |
| 运行时包列表折叠不够直观 | 包多时查看不便 |
| Deep Scan 信息展示太简略 | 只有数字没有详情 |
| 界面只有基础布局，缺少视觉层次 | 使用体验粗糙 |

## 二、分类体系设计

### 2.1 应用分类规则

由于注册表扫描不提供分类信息，通过软件名称关键词匹配进行分类：

| 分类 | 匹配关键词 | 图标 |
|------|-----------|------|
| 浏览器 | chrome, firefox, edge, opera, brave, safari, 浏览器, 360se | 🌐 |
| 开发工具 | code, intellij, pycharm, webstorm, goland, visual studio, git, docker, postman, notepad++, sublime, vim, terminal, putty, winscp, cmder | 💻 |
| 运行时 | java, jdk, jre, python, node, go, rust, dotnet, .net, ruby, php | ⚙️ |
| 数据库 | mysql, postgres, sql, oracle, mongodb, redis, dbeaver, navicat, pgadmin | 🗄️ |
| 设计工具 | photoshop, figma, blender, gimp, inkscape, cad, illustrator, premiere, after effects | 🎨 |
| 办公软件 | office, wps, word, excel, powerpoint, outlook, notion, obsidian, libreoffice, foxit, pdf | 📄 |
| 通讯工具 | wechat, 微信, discord, slack, telegram, zoom, teamview, 钉钉, 飞书, qq | 💬 |
| 媒体工具 | vlc, potplayer, spotify, obs, foobar, 网易云, 酷狗, 暴风, kmplayer | 🎵 |
| 安全软件 | 360, 火绒, bitdefender, malwarebytes, nod32, 杀毒, defender, antivirus | 🔒 |
| 系统工具 | 7-zip, everything, powertoys, autohotkey, sharex, snipaste, ccleaner, defender, driver | 🔧 |
| 游戏 | steam, epic, origin, ubisoft, 游戏, game | 🎮 |
| 其他 | 未匹配上述关键词的软件 | 📦 |

### 2.2 匹配状态

| 状态 | 含义 | 显示 |
|------|------|------|
| 已匹配 | 在 builtin-links.json 中有对应记录 | 绿色 ✔ + Open Download 按钮 |
| 未匹配 | 数据库中没有对应记录 | 灰色 ✗ + Search Bing 按钮 |

---

## 三、页面详细设计

### 3.1 导航栏优化

```
┌──────────────────────────────────────────────────┐
│  AppSync                              admin@e..  │
│                                                    │
│  [ 仪表盘 ]  [ 软件列表 ]  [ 下载中心 ]            │
└──────────────────────────────────────────────────┘
```

### 3.2 仪表盘 (Dashboard)

```
┌──────────────────────────────────────────────────┐
│  上次扫描: 2026-07-20 18:30 | 模式: 标准           │
│                                                    │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │  47  │  │  8   │  │  12  │  │  35  │         │
│  │ 应用数│  │运行时│  │已匹配│  │未匹配│         │
│  └──────┘  └──────┘  └──────┘  └──────┘         │
│                                                    │
│              [ 开始扫描 ]  [ 深度扫描 ]              │
└──────────────────────────────────────────────────┘
```

### 3.3 软件列表 (Inventory)

```
┌──────────────────────────────────────────────────┐
│  🔍 搜索软件名称...                      [筛选 ▼]│
│                                                    │
│  总计: 47 款软件                                   │
│                                                    │
│  ▼ 浏览器 (3)                                      │
│  ├── Google Chrome        v130.0   [registry]      │
│  ├── Microsoft Edge       v128.0   [registry]      │
│  └── Mozilla Firefox      v130.0   [winget]        │
│                                                    │
│  ▼ 开发工具 (12)                                    │
│  ├── Visual Studio Code   v1.90    [registry]      │
│  ├── Git for Windows      v2.45    [registry]      │
│  ├── Docker Desktop       v4.32    [scoop]         │
│  └── ...                                           │
│                                                    │
│  ▼ 运行时 (8)                                       │
│  ├── Python 3.12.4                                 │
│  │   └── 📦 25 packages [展开]                     │
│  ├── Node.js v22.0.0                               │
│  │   └── 📦 12 packages [展开]                     │
│  └── ...                                           │
│                                                    │
│  ▼ 系统工具 (6)                                     │
│  ├── 7-Zip 24.09         [registry]                │
│  └── ...                                           │
└──────────────────────────────────────────────────┘
```

**功能明细：**
- 搜索框: 输入即时过滤，匹配软件名称
- 筛选下拉: 全部 / 浏览器 / 开发工具 / 运行时 / 数据库 / ...
- 分类折叠: 点击分类名展开/收起
- 展开包列表: 运行时行点击展开 pip/npm 包
- 来源标签: 灰色小字显示 [registry] / [winget] / [choco] / [scoop]

### 3.4 下载中心 (Downloads)

```
┌──────────────────────────────────────────────────┐
│  🔍 搜索软件...                      [筛选 ▼]    │
│                                                    │
│  ┌─────────┬──────────┬──────────┐                │
│  │ 全部 47 │ 已匹配 12│ 未匹配 35│                │
│  └─────────┴──────────┴──────────┘                │
│                                                    │
│  --- 已匹配 (12) ---                                │
│  ├── Google Chrome        v130.0  [打开下载] 🟢   │
│  ├── Visual Studio Code   v1.90   [打开下载] 🟢   │
│  ├── 7-Zip                v24.09  [打开下载] 🟢   │
│  └── ...                                           │
│                                                    │
│  --- 未匹配 (35) ---                                │
│  ├── 某软件A               v2.0   [Bing搜索] 🔍   │
│  ├── 某软件B               v1.5   [Bing搜索] 🔍   │
│  └── ...                                           │
└──────────────────────────────────────────────────┘
```

**功能明细：**
- 顶部统计切换: 点击全部/已匹配/未匹配快速过滤
- 搜索框: 按名称实时过滤
- 分组展示: 已匹配和未匹配分两组，已匹配在前
- 已匹配: 绿色状态 + "打开下载"按钮
- 未匹配: 灰色状态 + "Bing搜索"按钮

---

## 四、分类引擎实现方案

### 4.1 前端分类函数

新增 `desktop/src/utils/categorize.ts`:

```ts
const CATEGORY_RULES: { name: string; icon: string; keywords: string[] }[] = [
  { name: '浏览器', icon: '🌐', keywords: ['chrome', 'firefox', 'edge', 'opera', 'brave', 'safari', '浏览器', '360se'] },
  { name: '开发工具', icon: '💻', keywords: ['code', 'intellij', 'pycharm', 'webstorm', 'goland', 'visual studio', 'git', 'docker', 'postman', 'notepad++', 'sublime', 'terminal', 'putty', 'winscp', 'cmder', 'sdk', 'sql server management'] },
  { name: '运行时', icon: '⚙️', keywords: ['java', 'jdk', 'jre', 'python', 'node', 'go', 'rust', 'dotnet', '.net', 'ruby', 'php', 'runtime'] },
  { name: '数据库', icon: '🗄️', keywords: ['mysql', 'postgres', 'sql', 'oracle', 'mongodb', 'redis', 'dbeaver', 'navicat', 'pgadmin', 'heidisql'] },
  { name: '设计工具', icon: '🎨', keywords: ['photoshop', 'figma', 'blender', 'gimp', 'inkscape', 'cad', 'illustrator', 'premiere', 'after effects', 'design'] },
  { name: '办公软件', icon: '📄', keywords: ['office', 'wps', 'word', 'excel', 'powerpoint', 'outlook', 'notion', 'obsidian', 'libreoffice', 'foxit', 'pdf', 'adobe acrobat'] },
  { name: '通讯工具', icon: '💬', keywords: ['wechat', '微信', 'discord', 'slack', 'telegram', 'zoom', 'teamview', '钉钉', '飞书', 'qq', 'skype'] },
  { name: '媒体工具', icon: '🎵', keywords: ['vlc', 'potplayer', 'spotify', 'obs', 'foobar', '网易云', '酷狗', '暴风', 'kmplayer', 'media player'] },
  { name: '安全软件', icon: '🔒', keywords: ['360', '火绒', 'bitdefender', 'malwarebytes', 'nod32', '杀毒', 'defender', 'antivirus', 'avg', 'avast'] },
  { name: '系统工具', icon: '🔧', keywords: ['7-zip', 'everything', 'powertoys', 'autohotkey', 'sharex', 'snipaste', 'ccleaner', 'driver', 'cpu', 'gpu', 'mem'] },
  { name: '游戏', icon: '🎮', keywords: ['steam', 'epic', 'origin', 'ubisoft', 'game', 'launcher'] },
];

export function categorizeApp(name: string): { category: string; icon: string } {
  const lower = name.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return { category: rule.name, icon: rule.icon };
    }
  }
  return { category: '其他', icon: '📦' };
}
```

### 4.2 组件修改清单

| 文件 | 修改内容 |
|------|---------|
| `src/utils/categorize.ts` | 新建: 分类引擎 |
| `src/components/AppCard.tsx` | 新增分类图标、来源标签、匹配状态 |
| `src/pages/Dashboard.tsx` | 新增已匹配/未匹配计数卡片 |
| `src/pages/Inventory.tsx` | 改为分类折叠列表 + 搜索 + 筛选 |
| `src/pages/Downloads.tsx` | 改为分组展示 + 统计切换 + 搜索 |

---

## 五、页面组件结构

### 5.1 Dashboard 组件变更

```tsx
// 新增状态变量
const [matchCount, setMatchCount] = useState(0);
const totalApps = lastScan?.applications.length ?? 0;
const unmatched = totalApps - matchCount;

// 页面加载时统计已匹配数 (调用 Downloads 页类似的逻辑)
useEffect(() => {
  if (!lastScan) return;
  let count = 0;
  lastScan.applications.forEach(app => {
    api.searchDownloadLinks(app.name).then(results => {
      if (results.length > 0) count++;
    });
  });
}, [lastScan]);

// 卡片新增两项:
// Applications | Runtimes | Matched | Unmatched
```

### 5.2 Inventory 组件变更

```tsx
// 状态变量
const [search, setSearch] = useState('');
const [filterCategory, setFilterCategory] = useState('全部');
const [collapsed, setCollapsed] = useState<string[]>([]);

// 分类逻辑
const categorized = useMemo(() => {
  const groups: Record<string, Application[]> = {};
  scanResult.applications
    .filter(app => app.name.toLowerCase().includes(search.toLowerCase()))
    .forEach(app => {
      const { category } = categorizeApp(app.name);
      if (filterCategory === '全部' || category === filterCategory) {
        (groups[category] ||= []).push(app);
      }
    });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}, [scanResult, search, filterCategory]);
```

### 5.3 Downloads 组件变更

```tsx
// 状态变量
const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
const [search, setSearch] = useState('');

// 过滤逻辑
const filtered = scanResult.applications
  .filter(app => app.name.toLowerCase().includes(search.toLowerCase()))
  .filter(app => {
    if (filter === 'matched') return !!links[app.name];
    if (filter === 'unmatched') return !links[app.name];
    return true;
  });

// 分组: 已匹配在前，未匹配在后
const matched = filtered.filter(app => !!links[app.name]);
const unmatched = filtered.filter(app => !links[app.name]);
```

---

## 六、实现顺序

### 第1步: 分类引擎
- 创建 `src/utils/categorize.ts` — 纯数据函数，无 UI 依赖

### 第2步: 修改 AppCard
- 添加分类图标、来源标签、匹配状态指示灯

### 第3步: 重构 Inventory 页
- 分类折叠列表 + 搜索框 + 筛选下拉

### 第4步: 重构 Downloads 页
- 统计切换 + 分组 + 搜索框

### 第5步: 更新 Dashboard
- 新增匹配统计卡片
