import { categorizeApp } from './categorize';

const iconMap = new Map([
  ['google chrome', 'googlechrome'], ['firefox', 'firefoxbrowser'], ['microsoft edge', 'microsoftedge'],
  ['visual studio code', 'visualstudiocode'], ['intellij', 'intellijidea'], ['pycharm', 'pycharm'],
  ['webstorm', 'webstorm'], ['goland', 'goland'], ['postman', 'postman'],
  ['docker', 'docker'], ['git', 'git'], ['github desktop', 'github'],
  ['sublime', 'sublimetext'], ['notepad++', 'notepadplusplus'],
  ['discord', 'discord'], ['slack', 'slack'], ['telegram', 'telegram'],
  ['spotify', 'spotify'], ['vlc', 'vlc'], ['obs', 'obsstudio'],
  ['steam', 'steam'], ['epic', 'epicgames'], ['figma', 'figma'],
  ['blender', 'blender'], ['gimp', 'gimp'], ['virtualbox', 'virtualbox'],
  ['vmware', 'vmware'], ['postgresql', 'postgresql'], ['mysql', 'mysql'],
  ['mongodb', 'mongodb'], ['redis', 'redis'], ['dbeaver', 'dbeaver'],
  ['node.js', 'nodedotjs'], ['python', 'python'], ['java', 'java'],
  ['rust', 'rust'], ['photoshop', 'adobephotoshop'], ['premiere', 'adobepremierepro'],
  ['after effects', 'adobeaftereffects'], ['illustrator', 'adobeillustrator'],
  ['lightroom', 'adobelightroom'], ['notion', 'notion'], ['obsidian', 'obsidian'],
  ['wps', 'wps'], ['office', 'microsoftoffice'], ['wechat', 'wechat'],
  ['qq', 'tencentqq'], ['dingtalk', 'dingtalk'], ['feishu', 'lark'],
  ['bilibili', 'bilibili'], ['netflix', 'netflix'], ['twitch', 'twitch'],
  ['zoom', 'zoom'], ['teamviewer', 'teamviewer'], ['anydesk', 'anydesk'],
  ['matlab', 'mathworks'], ['anaconda', 'anaconda'], ['jupyter', 'jupyter'],
  ['cmake', 'cmake'], ['gradle', 'gradle'], ['maven', 'apachemaven'],
  ['terraform', 'terraform'], ['ansible', 'ansible'], ['jenkins', 'jenkins'],
  ['wireshark', 'wireshark'], ['putty', 'putty'], ['winscp', 'winscp'],
  ['everything', 'everything'], ['7-zip', '7zip'], ['winrar', 'winrar'],
  ['ccleaner', 'ccleaner'], ['bitwarden', 'bitwarden'], ['1password', '1password'],
  ['keepass', 'keepass'], ['cursor', 'cursor'], ['powershell', 'powershell'],
  ['terminal', 'windowsterminal'], ['nvidia', 'nvidia'], ['amd', 'amd'],
  ['intel', 'intel'], ['xbox', 'xbox'], ['minecraft', 'minecraft'],
  ['unity', 'unity'], ['unreal', 'unrealengine'], ['godot', 'godotengine'],
  ['arduino', 'arduino'], ['qt ', 'qt'], ['dotnet', 'dotnet'],
  ['xampp', 'xampp'], ['filezilla', 'filezilla'], ['zotero', 'zotero'],
  ['xmind', 'xmind'], ['canva', 'canva'], ['sketch', 'sketch'],
  ['trello', 'trello'], ['asana', 'asana'], ['todoist', 'todoist'],
  ['evernote', 'evernote'], ['signal', 'signal'], ['whatsapp', 'whatsapp'],
  ['skype', 'skype'], ['line', 'line'], ['krita', 'krita'],
  ['inkscape', 'inkscape'], ['autocad', 'autocad'], ['freecad', 'freecad'],
  ['solidworks', 'dassaultsystemes'], ['coreldraw', 'coreldraw'],
  ['audacity', 'audacity'], ['handbrake', 'handbrake'],
  ['shotcut', 'shotcut'], ['kdenlive', 'kdenlive'], ['openshot', 'openshot'],
  ['davinci resolve', 'davinciresolve'], ['vegas', 'vegas'],
  ['camtasia', 'techsmith'], ['potplayer', 'potplayer'],
  ['kodi', 'kodi'], ['plex', 'plex'], ['jellyfin', 'jellyfin'],
  ['libreoffice', 'libreoffice'], ['foxit', 'foxit'], ['acrobat', 'adobeacrobatreader'],
  ['draw.io', 'diagramsdotnet'], ['mermaid', 'mermaid'],
  ['calibre', 'calibre'],
  ['league of legends', 'leagueoflegends'], ['lol', 'leagueoflegends'],
  ['英雄联盟', 'leagueoflegends'],
  ['valorant', 'valorant'], ['无畏契约', 'valorant'], ['瓦罗兰特', 'valorant'],
  ['counter-strike', 'counterstrike'],
  ['cs2', 'counterstrike'], ['csgo', 'counterstrike'],
  ['dota', 'dota2'], ['pubg', 'pubg'],
  ['apex legends', 'apexlegends'], ['fortnite', 'fortnite'],
  ['overwatch', 'overwatch'], ['world of warcraft', 'worldofwarcraft'],
  ['warcraft', 'worldofwarcraft'], ['diablo', 'diablo'],
  ['hearthstone', 'hearthstone'], ['minecraft', 'minecraft'],
  ['terraria', 'terraria'], ['cyberpunk', 'cyberpunk'],
  ['elden ring', 'eldenring'], ['starfield', 'starfield'],
  ['rockstar', 'rockstargames'], ['ubisoft', 'ubisoft'],
  ['origin', 'origin'], ['gog', 'gogdotcom'],
  ['battle.net', 'battledotnet'], ['blizzard', 'blizzard'],
  ['xbox', 'xbox'], ['playstation', 'playstation'],
  ['百度网盘', 'baidu'], ['baidu', 'baidu'],
  ['钉钉', 'dingtalk'], ['微信', 'wechat'],
  ['bilibili', 'bilibili'], ['哔哩哔哩', 'bilibili'],
  ['知乎', 'zhihu'], ['csdn', 'csdn'],
  ['微博', 'sinaweibo'], ['豆瓣', 'douban'],
  ['网易云', 'neteasecloudmusic'], ['netease', 'neteasecloudmusic'],
  ['qq音乐', 'tencentqq'], ['酷狗', 'kugou'],
  ['有道', 'youdao'], ['youdao', 'youdao'],
  ['wps', 'wps'], ['剪映', 'capcut'], ['capcut', 'capcut'],
  ['夸克', 'quark'], ['阿里云', 'alibabacloud'],
  ['直播伴侣', 'tiktok'], ['抖音', 'tiktok'], ['douyin', 'tiktok'],
  ['飞书', 'lark'],
  ['搜狗', 'sogou'], ['卡巴', 'kaspersky'], ['kaspersky', 'kaspersky'],
  ['华为', 'huawei'],
  ['小米', 'xiaomi'], ['腾讯', 'tencent'],
  ['阿里', 'alibaba'], ['阿里巴巴', 'alibaba'],
  ['7-zip', '7zip'], ['bandizip', 'bandizip'], ['winrar', 'winrar'],
  ['snipaste', 'snipaste'], ['sharex', 'sharex'],
  ['powertoys', 'powertoys'], ['autohotkey', 'autohotkey'],
  ['ccleaner', 'ccleaner'], ['revo uninstaller', 'revo'],
  ['geek uninstaller', 'geek'], ['rufus', 'rufus'],
  ['cpu-z', 'cpuz'], ['gpu-z', 'gpuz'],
  ['hwinfo', 'hwinfo64'], ['aida64', 'aida64'],
  ['msi afterburner', 'msi afterburner'],
  ['crystaldiskinfo', 'crystaldiskinfo'],
  ['crystaldiskmark', 'crystaldiskmark'],
  ['vagrant', 'vagrant'],
  ['insomnia', 'insomnia'], ['cmder', 'cmder'],
  ['conemu', 'conemu'], ['alacritty', 'alacritty'],
  ['windows terminal', 'windowsterminal'],
  ['vim', 'vim'],
  ['neovim', 'neovim'], ['emacs', 'gnuemacs'],
  ['chatgpt', 'openai'], ['openai', 'openai'], ['claude', 'claude'],
  ['ollama', 'ollama'], ['hugging face', 'huggingface'],
  ['stable diffusion', 'stablediffusion'],
  ['party animals', 'partyanimals'], ['猛兽派对', 'partyanimals'],
  ['black myth', 'blackmythwukong'], ['黑神话', 'blackmythwukong'],
  ['baldur', 'baldursgate3'], ['bg3', 'baldursgate3'],
  ['dark souls', 'darksouls'], ['sekiro', 'sekiro'],
  ['hollow knight', 'hollowknight'], ['dead cells', 'deadcells'],
  ['hades', 'hades'], ['stardew valley', 'stardewvalley'],
  ['rimworld', 'rimworld'], ['factorio', 'factorio'],
  ['satisfactory', 'satisfactory'], ['subnautica', 'subnautica'],
  ['cuphead', 'cuphead'], ['celeste', 'celeste'],
  ['forza', 'forza'], ['halo', 'halo'],
  ['age of empires', 'ageofempires'],
  ['resident evil', 'resilientevil'], ['silent hill', 'silenthill'],
  ['god of war', 'godofwar'], ['ghost of tsushima', 'ghostoftsushima'],
  ['nier', 'nier'], ['persona', 'persona'],
  ['star citizen', 'starcitizen'],
  ['gta', 'grandtheftauto'], ['grand theft auto', 'grandtheftauto'],
  ['red dead', 'rockstargames'],
  ['网易云音乐', 'neteasecloudmusic'], ['netease cloud', 'neteasecloudmusic'],
  ['爱奇艺', 'iqiyi'], ['腾讯视频', 'tencentvideo'],
  ['优酷', 'youku'], ['豆瓣', 'douban'], ['知乎', 'zhihu'],
  ['微博', 'sinaweibo'], ['美团', 'meituan'], ['饿了么', 'eleme'],
  ['携程', 'ctrip'], ['去哪儿', 'qunar'],
  ['kubernetes', 'kubernetes'], ['podman', 'podman'],
  ['nginx', 'nginx'], ['apache', 'apache'],
  ['tomcat', 'apachetomcat'],
  ['gitlab', 'gitlab'], ['github', 'github'],
  ['bitbucket', 'bitbucket'], ['jira', 'jira'],
  ['confluence', 'confluence'],
  ['opera', 'opera'],
  ['brave', 'brave'], ['vivaldi', 'vivaldi'],
  ['safari', 'safari'], ['tor', 'torbrowser'],
  ['360', '360totalsecurity'],
  ['火绒', 'huorong'], ['nod32', 'eset'],
  ['malwarebytes', 'malwarebytes'], ['bitdefender', 'bitdefender'],
  ['norton', 'norton'], ['avg', 'avg'], ['avast', 'avast'],
]);

const ICON_CACHE_KEY = 'appsync_icon_cache';
const MAX_CACHE_SIZE = 50;

function loadCache(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(ICON_CACHE_KEY) || '{}'); } catch { return {}; }
}

function saveCache(cache: Record<string, string>) {
  try {
    const entries = Object.entries(cache).slice(-MAX_CACHE_SIZE);
    localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {}
}

let iconCache = loadCache();

function tryIcons(slug: string): string[] {
  const cached = iconCache[slug];
  if (cached) return [cached];
  return [
    `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`,
    `https://unpkg.com/simple-icons@latest/icons/${slug}.svg`,
  ];
}

export function cacheIconSvg(slug: string, svg: string) {
  iconCache[slug] = 'data:image/svg+xml;base64,' + btoa(svg);
  saveCache(iconCache);
}

export function getIconSlug(name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const [key, slug] of iconMap) {
    if (lower.includes(key)) return slug;
  }
}

export function getAppIconUrl(name: string): string[] {
  const slug = getIconSlug(name);
  return slug ? tryIcons(slug) : [];
}

const DARK_BG = '#E8E8E8';

export function isDarkBg() {
  if (typeof document === 'undefined') return false;
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const catIcons: Record<string, { bg: string; icon: string; color: string }> = {
  '浏览器': { bg: '#E8F0FE', icon: '🌐', color: '#1A73E8' },
  '开发工具': { bg: '#EADDFF', icon: '💻', color: '#6750A4' },
  '运行时': { bg: '#FFF3E0', icon: '⚙', color: '#E65100' },
  '数据库': { bg: '#E0F2F1', icon: '🗄', color: '#00695C' },
  '设计工具': { bg: '#FCE4EC', icon: '🎨', color: '#C62828' },
  '办公软件': { bg: '#E8EAF6', icon: '📄', color: '#283593' },
  '通讯工具': { bg: '#E0F7FA', icon: '💬', color: '#006064' },
  '媒体工具': { bg: '#FFF8E1', icon: '🎵', color: '#F57F17' },
  '安全软件': { bg: '#FFEBEE', icon: '🔒', color: '#B71C1C' },
  '系统工具': { bg: '#F3E5F5', icon: '🔧', color: '#6A1B9A' },
  '游戏': { bg: '#E8F5E9', icon: '🎮', color: '#1B5E20' },
  '云盘存储': { bg: '#E3F2FD', icon: '☁', color: '#0D47A1' },
  '远程工具': { bg: '#FFF8E1', icon: '📡', color: '#E65100' },
};

export function catIconBg(cat: string): string {
  if (isDarkBg()) return DARK_BG;
  return catIcons[cat]?.bg || '#F1F3F4';
}

export function catIconColor(cat: string): string {
  return catIcons[cat]?.color || '#5F6368';
}

export function getFallbackIcon(name: string): { bg: string; icon: string; color: string } {
  const { category } = categorizeApp(name);
  const fb = catIcons[category];
  return {
    bg: catIconBg(category),
    icon: fb?.icon || '📦',
    color: fb?.color || '#5F6368',
  };
}
