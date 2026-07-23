import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const zh: Record<string, string> = {
  'nav.dashboard': '概览',
  'nav.inventory': '软件列表',
  'nav.downloads': '下载中心',
  'nav.history': '历史记录',
  'nav.signOut': '退出登录',
  'nav.darkMode': '深色模式',
  'nav.language': '语言',

  'login.title': 'AppSync',
  'login.subtitle': '登录以继续',
  'login.subtitleRegister': '创建你的账户',
  'login.email': '邮箱',
  'login.emailPlaceholder': 'you@example.com',
  'login.password': '密码',
  'login.passwordPlaceholder': '请输入密码',
  'login.passwordPlaceholderRegister': '至少6位字符',
  'login.nickname': '昵称',
  'login.nicknamePlaceholder': '你的显示名称',
  'login.signIn': '登录',
  'login.createAccount': '创建账户',
  'login.switchToRegister': '没有账号？创建一个',
  'login.switchToLogin': '已有账号？去登录',
  'login.pleaseWait': '请稍候...',

  'dashboard.overview': '概览',
  'dashboard.runScan': '运行扫描以检测已安装软件',
  'dashboard.script': '生成安装脚本',
  'dashboard.export': '导出扫描结果',
  'dashboard.applications': '应用',
  'dashboard.scanTime': '扫描耗时',
  'dashboard.matched': '已匹配',
  'dashboard.unmatched': '未匹配',
  'dashboard.showSystem': '显示系统组件',
  'dashboard.hidden': '已隐藏',
  'dashboard.synced': '已同步至云端',
  'dashboard.local': '仅本地',
  'dashboard.notUploaded': '未上传',
  'dashboard.noPackages': '未发现 Python 或 Node.js 包',
  'dashboard.dialogError': '对话框错误',
  'dashboard.mode': '模式',

  'scan.title': '系统扫描',
  'scan.desc': '检测已安装的应用、运行时和包管理器',

  'scan.scanning': '扫描中',
  'scan.now': '开始扫描',
  'scan.failed': '扫描失败',
  'scan.progress': '扫描中... {p}%',

  'inventory.title': '软件清单',
  'inventory.noData': '暂无扫描数据，请先运行扫描',
  'inventory.search': '搜索软件...',
  'inventory.refresh': '刷新',
  'inventory.showSystem': '显示系统组件',
  'inventory.noMatch': '未找到匹配的应用',
  'inventory.submitFailed': '提交失败',
  'inventory.submitPlaceholder': '粘贴官方下载链接...',
  'inventory.allTypes': '全部分类',

  'downloads.title': '下载中心',
  'downloads.linkLibrary': '链接库',
  'downloads.refresh': '刷新',
  'downloads.current': '当前电脑',
  'downloads.missing': '缺失',
  'downloads.all': '全部',
  'downloads.matched': '已匹配',
  'downloads.unmatched': '未匹配',
  'downloads.copyAll': '复制全部链接',
  'downloads.search': '搜索名称...',

  'downloads.compare': '跨设备对比',
  'downloads.appsMissing': '个应用缺失',
  'downloads.submitFailed': '提交失败',
  'downloads.loading': '加载中...',
  'downloads.allTypes': '全部分类',
  'downloads.diffHint': '这些应用在旧电脑上有，但本机没有',
  'downloads.copiedUrls': '已复制{n}条链接！',
  'downloads.copyFailed': '复制失败',
  'downloads.noAppsFound': '未找到应用',
  'downloads.appsOnMachine': '台设备上的应用',
  'downloads.matchedCount': '已匹配 ({count})',
  'downloads.unmatchedCount': '未匹配 ({count})',
  'downloads.loadFailed': '加载清单失败',
  'downloads.refreshFailed': '刷新失败',

  'history.title': '扫描历史',
  'history.records': '条记录',
  'history.noData': '暂无扫描历史，请先运行扫描',
  'history.detail': '扫描详情',
  'history.machine': '机器',
  'history.scannedAt': '扫描时间',
  'history.mode': '模式',
  'history.apps': '应用',
  'history.runtimes': '运行时',
  'history.delete': '删除此记录',
  'history.deleted': '已删除',
  'history.loadFailed': '加载历史记录失败',
  'history.detailLoadFailed': '加载扫描详情失败',
  'history.deleteConfirm': '删除此扫描记录？此操作不可撤销。',
  'history.refresh': '刷新',
  'history.loading': '加载中...',
  'history.applications': '应用程序',
  'history.more': '还有{n}项',

  'confirm.title': '确认',
  'confirm.cancel': '取消',
  'confirm.signOut': '确定要退出登录吗？',
  'confirm.signOutBtn': '退出',
  'confirm.delete': '删除',

  'password.title': '修改密码',
  'password.current': '当前密码',
  'password.new': '新密码（至少6位）',
  'password.cancel': '取消',
  'password.save': '保存',
  'password.saving': '保存中...',
  'password.success': '密码已更新',
  'password.failed': '修改失败',

  'library.title': '下载链接库',
  'library.links': '条链接',
  'library.search': '搜索软件名称...',
  'library.noResults': '未找到链接',
  'library.tryAgain': '试试其他搜索词',
  'library.loading': '加载中...',

  'library.verified': '已验证',
  'library.community': '社区',
  'library.loadFailed': '加载链接失败',
  'library.copyTitle': '复制',
  'library.openTitle': '打开',

  'appcard.open': '打开',
  'appcard.search': '搜索',
  'appcard.community': '社区',
  'appcard.official': '官方',
  'appcard.submitLink': '+ 提交官方链接',
  'appcard.submit': '提交',
  'appcard.cancel': '取消',
  'appcard.submitted': '已提交！等待管理员审核',
  'appcard.submitPlaceholder': '粘贴官方下载链接...',
  'appcard.publisher': '发布者',
  'appcard.path': '路径',
  'appcard.installed': '安装日期',

  'category.all': '全部分类',
  'category.other': '其他',

  'error.title': '出错了',
  'error.unexpected': '发生了意外错误',
  'error.reload': '重新加载',


  'toast.copied': '已复制！',
  'toast.scanDeleted': '扫描已删除',
  'toast.deleteFailed': '删除失败',
  'toast.saved': '已保存至',
};

const en: Record<string, string> = {
  'nav.dashboard': 'Dashboard',
  'nav.inventory': 'Software List',
  'nav.downloads': 'Downloads',
  'nav.history': 'History',
  'nav.signOut': 'Sign Out',
  'nav.darkMode': 'Dark Mode',
  'nav.language': 'Language',

  'login.title': 'AppSync',
  'login.subtitle': 'Sign in to continue',
  'login.subtitleRegister': 'Create your account',
  'login.email': 'Email',
  'login.emailPlaceholder': 'you@example.com',
  'login.password': 'Password',
  'login.passwordPlaceholder': 'Enter your password',
  'login.passwordPlaceholderRegister': 'At least 6 characters',
  'login.nickname': 'Nickname',
  'login.nicknamePlaceholder': 'Your display name',
  'login.signIn': 'Sign In',
  'login.createAccount': 'Create Account',
  'login.switchToRegister': "Don't have an account? Create one",
  'login.switchToLogin': 'Already have an account? Sign in',
  'login.pleaseWait': 'Please wait...',

  'dashboard.overview': 'Overview',
  'dashboard.runScan': 'Run a scan to detect installed software',
  'dashboard.script': 'Generate Script',
  'dashboard.export': 'Export JSON',
  'dashboard.applications': 'Applications',
  'dashboard.scanTime': 'Scan Time',
  'dashboard.matched': 'Matched',
  'dashboard.unmatched': 'Unmatched',
  'dashboard.showSystem': 'Show system components',
  'dashboard.hidden': 'hidden',
  'dashboard.synced': 'Synced to cloud',
  'dashboard.local': 'Local only',
  'dashboard.notUploaded': 'Not uploaded',
  'dashboard.noPackages': 'No Python or Node.js packages found.',
  'dashboard.dialogError': 'Dialog error',
  'dashboard.mode': 'mode',

  'scan.title': 'System Scan',
  'scan.desc': 'Detect installed applications, runtimes, and packages',

  'scan.scanning': 'Scanning',
  'scan.now': 'Scan Now',
  'scan.failed': 'Scan failed',
  'scan.progress': 'Scanning... {p}%',

  'inventory.title': 'Software Inventory',
  'inventory.noData': 'No scan data. Run a scan first.',
  'inventory.search': 'Search software...',
  'inventory.refresh': 'Refresh',
  'inventory.showSystem': 'Show system components',
  'inventory.noMatch': 'No matching apps found.',
  'inventory.submitFailed': 'Submit failed',
  'inventory.submitPlaceholder': 'Paste official download URL...',
  'inventory.allTypes': 'All Types',

  'downloads.title': 'Downloads',
  'downloads.linkLibrary': 'Link Library',
  'downloads.refresh': 'Refresh',
  'downloads.current': 'Current',
  'downloads.missing': 'Missing',
  'downloads.all': 'All',
  'downloads.matched': 'Matched',
  'downloads.unmatched': 'Unmatched',
  'downloads.copyAll': 'Copy All Links',
  'downloads.search': 'Search by name...',

  'downloads.compare': 'Cross-Device Comparison',
  'downloads.appsMissing': 'apps missing',
  'downloads.submitFailed': 'Submit failed',
  'downloads.loading': 'Loading...',
  'downloads.allTypes': 'All Types',
  'downloads.diffHint': 'These apps are on your old machine but not on this one',
  'downloads.copiedUrls': 'Copied {n} URLs!',
  'downloads.copyFailed': 'Failed to copy',
  'downloads.noAppsFound': 'No apps found.',
  'downloads.appsOnMachine': 'apps on this machine',
  'downloads.matchedCount': 'Matched ({count})',
  'downloads.unmatchedCount': 'Unmatched ({count})',
  'downloads.loadFailed': 'Failed to load inventories',
  'downloads.refreshFailed': 'Failed to refresh',

  'history.title': 'Scan History',
  'history.records': 'scan record(s)',
  'history.noData': 'No scan history yet. Run a scan first.',
  'history.detail': 'Scan Details',
  'history.machine': 'Machine',
  'history.scannedAt': 'Scanned at',
  'history.mode': 'Mode',
  'history.apps': 'Apps',
  'history.runtimes': 'Runtimes',
  'history.delete': 'Delete this scan record',
  'history.deleted': 'Scan deleted',
  'history.loadFailed': 'Failed to load history',
  'history.detailLoadFailed': 'Failed to load scan details',
  'history.deleteConfirm': 'Delete this scan record? This cannot be undone.',
  'history.refresh': 'Refresh',
  'history.loading': 'Loading...',
  'history.applications': 'Applications',
  'history.more': '+{n} more',

  'confirm.title': 'Confirm',
  'confirm.cancel': 'Cancel',
  'confirm.signOut': 'Are you sure you want to sign out?',
  'confirm.signOutBtn': 'Sign Out',
  'confirm.delete': 'Delete',

  'password.title': 'Change Password',
  'password.current': 'Current password',
  'password.new': 'New password (6+ chars)',
  'password.cancel': 'Cancel',
  'password.save': 'Save',
  'password.saving': 'Saving...',
  'password.success': 'Password updated',
  'password.failed': 'Password change failed',

  'library.title': 'Download Link Library',
  'library.links': 'software links',
  'library.search': 'Search by software name...',
  'library.noResults': 'No links found',
  'library.tryAgain': 'Try a different search term',
  'library.loading': 'Loading...',

  'library.verified': 'Verified',
  'library.community': 'Community',
  'library.loadFailed': 'Failed to load links',
  'library.copyTitle': 'Copy',
  'library.openTitle': 'Open',

  'appcard.open': 'Open',
  'appcard.search': 'Search',
  'appcard.community': 'Community',
  'appcard.official': 'Official',
  'appcard.submitLink': '+ Submit official link',
  'appcard.submit': 'Submit',
  'appcard.cancel': 'Cancel',
  'appcard.submitted': 'Submitted! Admin will review it.',
  'appcard.submitPlaceholder': 'Paste official download URL...',
  'appcard.publisher': 'Publisher',
  'appcard.path': 'Path',
  'appcard.installed': 'Installed',

  'category.all': 'All Categories',
  'category.other': 'Other',

  'error.title': 'Something went wrong',
  'error.unexpected': 'An unexpected error occurred',
  'error.reload': 'Reload App',


  'toast.copied': 'Copied!',
  'toast.scanDeleted': 'Scan deleted',
  'toast.deleteFailed': 'Failed to delete',
  'toast.saved': 'Saved to',
};

type Lang = 'zh' | 'en';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const dicts: Record<Lang, Record<string, string>> = { zh, en };

export const LangContext = createContext<LangCtx>({
  lang: 'zh',
  setLang: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('appsync_lang');
    return (saved === 'en' || saved === 'zh') ? saved : 'zh';
  });

  useEffect(() => {
    localStorage.setItem('appsync_lang', lang);
  }, [lang]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    let s = dicts[lang][key] || en[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.replace(`{${k}}`, String(v));
      }
    }
    return s;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
