export interface CategoryInfo {
  name: string;
  icon: string;
  keywords: string[];
}

export const CATEGORIES: CategoryInfo[] = [
  { name: '浏览器', icon: '🌐', keywords: ['chrome', 'firefox', 'edge', 'opera', 'brave', 'safari', '浏览器', '360se', '百分'] },
  { name: '开发工具', icon: '💻', keywords: ['code', 'intellij', 'pycharm', 'webstorm', 'goland', 'visual studio', 'git', 'docker', 'postman', 'notepad++', 'sublime', 'terminal', 'putty', 'winscp', 'cmder', 'sdk', 'msys2', 'dotnet'] },
  { name: '运行时', icon: '⚙️', keywords: ['java', 'jdk', 'jre', 'python', 'node', 'go', 'rust', 'ruby', 'php', 'runtime', 'openjdk'] },
  { name: '数据库', icon: '🗄️', keywords: ['mysql', 'postgres', 'sql', 'oracle', 'mongodb', 'redis', 'dbeaver', 'navicat', 'pgadmin', 'heidisql', 'workbench'] },
  { name: '设计工具', icon: '🎨', keywords: ['photoshop', 'figma', 'blender', 'gimp', 'inkscape', 'cad', 'illustrator', 'premiere', 'after effects', 'design'] },
  { name: '办公软件', icon: '📄', keywords: ['office', 'wps', 'word', 'excel', 'powerpoint', 'outlook', 'notion', 'obsidian', 'libreoffice', 'foxit', 'pdf', 'acrobat', 'markdown'] },
  { name: '通讯工具', icon: '💬', keywords: ['wechat', '微信', 'discord', 'slack', 'telegram', 'zoom', 'teamview', '钉钉', '飞书', 'qq', 'skype', 'whatsapp', '信'] },
  { name: '媒体工具', icon: '🎵', keywords: ['vlc', 'potplayer', 'spotify', 'obs', 'foobar', '网易云', '酷狗', '暴风', 'kmplayer', 'media player', 'music', 'player'] },
  { name: '安全软件', icon: '🔒', keywords: ['360', '火绒', 'bitdefender', 'malwarebytes', 'nod32', '杀毒', 'defender', 'antivirus', 'avg', 'avast', '卡巴'] },
  { name: '系统工具', icon: '🔧', keywords: ['7-zip', 'everything', 'powertoys', 'autohotkey', 'sharex', 'snipaste', 'ccleaner', 'cpu', 'gpu', 'mem', 'driver', 'disk', 'backup', '压缩'] },
  { name: '游戏', icon: '🎮', keywords: ['steam', 'epic', 'origin', 'ubisoft', 'game', 'launcher', 'blizzard', 'battle', 'xbox', 'gog', 'wegame', '腾讯游戏'] },
];

export function categorizeApp(name: string): { category: string; icon: string } {
  const lower = name.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return { category: cat.name, icon: cat.icon };
    }
  }
  return { category: '其他', icon: '📦' };
}
