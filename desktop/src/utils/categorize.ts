export interface CategoryInfo {
  name: string;
  icon: string;
  keywords: string[];
  system?: boolean;
}

// App groups: multiple detected entries rolled under one parent
export interface AppGroup {
  parentName: string;
  category: string;
  icon: string;
  keywords: string[];
}

export const APP_GROUPS: AppGroup[] = [
  { parentName: '抖音', category: '媒体工具', icon: '\u{1F3B5}', keywords: ['直播伴侣', 'webcast mate', '抖音安全', 'edragent', 'feige security'] },
  { parentName: 'Visual Studio 2022', category: '开发工具', icon: '\u{1F4BB}', keywords: ['vs_blend', 'vs_coreeditor', 'vs_filetracker', 'vs_github', 'vs_web', 'vs_wcf', 'sptools_', 'intelltrace', 'workflow manager', 'entity framework', 'visual studio installer', 'visual studio setup', 'visual studio vs', 'vs_wcf', 'vs_vsweb', 'microsoft visual studio installer'] },
  { parentName: 'NVIDIA 驱动', category: '系统组件', icon: '\u2699\uFE0F', keywords: ['nvidia app ', 'nvidia backend', 'nvidia container', 'nvidia localsystem', 'nvidia session', 'nvidia telemetry', 'nvidia user', 'nvidia installer', 'nvidia platform', 'nvidia watchdog', 'nvidia hd', 'nvidia physx', 'nvidia shadowplay', 'nvidia virtual audio', 'nvidia frameview', 'nvidia ai user', 'nvidia messagebus', 'nvidia nvdlisr', 'nvidia graphics driver'] },
  { parentName: 'CUDA 工具包', category: '系统组件', icon: '\u2699\uFE0F', keywords: ['nvidia cuda', 'cublas', 'cudart', 'cufft', 'curand', 'cusolver', 'cusparse', 'nvjitlink', 'nvjpeg', 'nvrtc', 'nvtx', 'nvfatbin', 'nvml', 'npp ', 'nvcc', 'cuobjdump', 'cupti', 'cuxxfilt', 'nvprune', 'opencl runtime', 'cuda profiler', 'cuda documentation', 'cuda ccc', 'demo suite', 'disassembler', 'occupancy', 'visual profiler', 'compute sanitizer'] },
  { parentName: 'Python 3.11', category: '运行时', icon: '\u2699\uFE0F', keywords: ['python 3.11.9', 'python 3.11'] },
  { parentName: 'Python 3.8', category: '运行时', icon: '\u2699\uFE0F', keywords: ['python 3.8.0', 'python 3.8'] },
  { parentName: 'WeGame', category: '游戏', icon: '\u{1F3AE}', keywords: ['wegame', '三角洲行动', '无畏契约助手', 'wegame '] },
  { parentName: 'Microsoft Office', category: '办公软件', icon: '\u{1F4C4}', keywords: ['office 16 click-to-run', 'office.actionserver', 'officepushnotification', 'microsoft.office.actionserver'] },
  { parentName: 'Windows SDK', category: '系统组件', icon: '\u2699\uFE0F', keywords: ['windows sdk', 'windows software development kit', 'windows app certification', 'sdk debuggers', 'sdk arm', 'sdk arm64', 'universal crt', 'winrt intellisense', 'wpt redistributables', 'windows mobile connectivity', 'windows ip over usb', 'windows desktop extension', 'windows iot extension', 'windows team extension'] },
  { parentName: 'Windows App Runtime', category: '系统组件', icon: '\u2699\uFE0F', keywords: ['windowsappruntime', 'winappruntime'] },
];

export function isSystemApp(name: string): boolean {
  const lower = name.toLowerCase();
  const sysCat = CATEGORIES.find(c => c.system);
  if (sysCat && sysCat.keywords.some(kw => lower.includes(kw))) return true;
  // Also check if it's a child of a system group
  return APP_GROUPS.some(g => g.category === '系统组件' && g.keywords.some(kw => lower.includes(kw)));
}

export function findAppGroup(name: string): AppGroup | undefined {
  const lower = name.toLowerCase();
  return APP_GROUPS.find(g => g.keywords.some(kw => lower.includes(kw)));
}

// Order matters: first match wins (开发工具 before 通讯 to catch 微信开发者工具)
export const CATEGORIES: CategoryInfo[] = [
  { name: '浏览器', icon: '\u{1F310}', keywords: ['chrome', 'firefox', 'edge', 'opera', 'brave', 'safari', '浏览器', '360se', '百分', 'vivaldi', 'tor', 'yandex', 'arc', 'maxthon', 'palemoon', 'waterfox', 'cent', 'kiwi', 'slimjet', 'whale', 'iron', '夸克', 'quark'] },
  { name: '开发工具', icon: '\u{1F4BB}', keywords: ['code', 'intellij', 'pycharm', 'webstorm', 'goland', 'visual studio', 'vscode', 'git', 'docker', 'postman', 'notepad++', 'sublime', 'terminal', 'putty', 'winscp', 'cmder', 'msys2', 'jetbrains', 'eclipse', 'netbeans', 'android studio', 'vim', 'neovim', 'emacs', 'github desktop', 'sourcetree', 'gitkraken', 'insomnia', 'jupyter', 'anaconda', 'cmake', 'gradle', 'maven', 'vagrant', 'virtualbox', 'vmware', 'wsl', 'yarn', 'pnpm', 'deno', 'kubernetes', 'minikube', 'helm', 'terraform', 'ansible', 'jenkins', 'teamcity', 'filezilla', 'putty', 'openssh', 'wireshark', 'fiddler', 'charles', 'curl', 'wget', 'tortoisegit', 'tortoisesvn', 'make', 'azure data studio', 'redis insight', 'xcode', 'clion', 'rider', 'rubymine', 'phpstorm', 'datagrip', 'unity', 'unreal', 'godot', 'cursor', 'copilot', 'cline', 'windurf', 'codeium', 'continue', 'editplus', 'nvm', 'anaconda3', 'anylogic', 'gurobi', 'matlab', 'stlink', 'stm32', 'keil', 'iar', 'arduino', 'esp32', 'vivado', 'qt ', 'mingw', 'switchhosts', 'trae', '微信开发者', 'xampp', 'prolog', 'stm32cube', 'cubemx', 'wechat devtools'] },
  { name: '运行时', icon: '\u2699\uFE0F', keywords: ['java', 'jdk', 'jre', 'python', 'node', 'golang', 'rust', 'ruby', 'php', 'runtime', 'openjdk', 'perl', 'lua', 'julia', 'erlang', 'elixir', 'haskell', 'scala', 'kotlin', 'dart', 'flutter', 'powershell', 'launcher'] },
  { name: '数据库', icon: '\u{1F5C4}\uFE0F', keywords: ['mysql', 'postgres', 'postgresql', 'sql', 'oracle', 'mongodb', 'redis', 'dbeaver', 'navicat', 'pgadmin', 'heidisql', 'workbench', 'ssms', 'cassandra', 'neo4j', 'couchdb', 'mariadb', 'firebird', 'supabase', 'dbvisualizer', 'tableplus', 'sqlite', 'sqlitestudio', 'memurai', 'azure cosmos', 'sql server'] },
  { name: '设计工具', icon: '\u{1F3A8}', keywords: ['photoshop', 'ps', 'figma', 'blender', 'gimp', 'inkscape', 'cad', 'illustrator', 'premiere', 'after effects', 'ae', 'indesign', 'lightroom', 'sketch', 'krita', 'paint.net', 'affinity', 'coreldraw', 'autocad', 'fusion 360', 'solidworks', 'freecad', 'davinci resolve', 'canva', 'aseprite', 'maya', '3ds max', 'cinema 4d', 'zbrush', 'procreate', 'eagle', 'billfish'] },
  { name: '办公软件', icon: '\u{1F4C4}', keywords: ['office', 'wps', 'word', 'excel', 'powerpoint', 'outlook', 'notion', 'obsidian', 'libreoffice', 'foxit', 'pdf', 'acrobat', 'markdown', 'onenote', 'evernote', 'joplin', 'todoist', 'ticktick', 'xmind', 'zotero', 'calibre', 'draw.io', 'monday', 'clickup', 'openoffice', 'sumatra', 'nitro', 'pdf24', 'drawio', '有道翻译', '有道词典', 'youdao'] },
  { name: '通讯工具', icon: '\u{1F4AC}', keywords: ['wechat', 'discord', 'slack', 'telegram', 'zoom', 'teamview', '钉钉', 'dingtalk', '飞书', 'feishu', 'lark', 'qq', 'skype', 'whatsapp', 'tim', 'teams', 'signal', 'viber', 'line', 'kakaotalk', 'messenger', 'element', 'hexchat', 'trello', 'asana', 'twist', 'webex', 'zoho', 'tencent meeting', 'voov', 'ooopz', 'oopz'] },
  { name: '媒体工具', icon: '\u{1F3B5}', keywords: ['vlc', 'potplayer', 'spotify', 'obs', 'foobar', 'netease music', '酷狗', 'kugou', '暴风', 'kmplayer', 'gom', 'media player', 'music', 'player', 'mpc', 'aimp', 'musicbee', 'xsplit', 'streamlabs', 'bandicam', 'audacity', 'audition', 'cubase', 'fl studio', 'ableton', 'handbrake', 'ffmpeg', 'losslesscut', 'shotcut', 'kdenlive', 'openshot', 'mpv', 'smplayer', 'vsdc', 'ocenaudio', 'reaper', 'lmms', 'bilibili', 'b站', '哔哩哔哩', 'iqiyi', '爱奇艺', 'tencent video', '腾讯视频', 'youku', '优酷', 'mango tv', '芒果', 'douyin', '抖音', 'twitch', 'netflix', 'disney', 'hbo', 'crunchyroll', '剪映', 'capcut', '必剪', 'vegas', 'camtasia', 'filmora', 'lightworks', 'hitfilm', 'kuwo', '酷我', 'plex', 'jellyfin', 'emby', 'kodi', 'mixxx', 'serato', 'traktor', 'geforce experience', '直播', '网易云'] },
  { name: '安全软件', icon: '\u{1F512}', keywords: ['360', '火绒', 'huorong', 'bitdefender', 'malwarebytes', 'nod32', '杀毒', 'defender', 'antivirus', 'avg', 'avast', '卡巴', 'kaspersky', 'norton', 'mcafee', 'comodo', 'zonealarm', 'glasswire', 'wireguard', 'openvpn', 'protonvpn', 'cloudflare warp', '1password', 'bitwarden', 'keepass', 'veracrypt', 'nordvpn', 'expressvpn', 'adguard', 'ublock', 'spybot', 'superantispyware', 'tinywall', 'simplewall', 'netlimiter', 'sandboxie', 'tcpview', 'nmap', 'zenmap', 'metasploit', 'burp', 'nessus', 'acunetix', '电脑管家', '安全卫士', '腾讯管家', '安天', 'privacy erase', 'privazer'] },
  { name: '系统工具', icon: '\u{1F527}', keywords: ['7-zip', 'winrar', 'bandizip', 'peazip', 'everything', 'powertoys', 'autohotkey', 'sharex', 'snipaste', 'greenshot', 'lightshot', 'picpick', 'faststone', 'flameshot', 'cpu-z', 'gpu-z', 'hwmonitor', 'hwinfo', 'speccy', 'crystaldiskinfo', 'crystaldiskmark', 'aida64', 'furmark', 'msi afterburner', 'ccleaner', 'glary', 'wise care', 'defraggler', 'recuva', 'easeus', 'aomei', 'rufus', 'balenaetcher', 'ventoy', 'hxd', 'beyond compare', 'winmerge', 'meld', 'treesize', 'wiztree', 'spacesniffer', 'windirstat', 'lockhunter', 'process explorer', 'procexp', 'autoruns', 'sysinternals', 'conemu', 'alacritty', 'flow launcher', 'listary', 'wox', 'keypirinha', 'dism++', 'geek uninstaller', 'revo uninstaller', 'iobit', 'notepad3', 'teracopy', 'qbittorrent', 'idm', 'internet download manager', 'quicklook', 'seer', 'rainmeter', 'wallpaper engine', 'screentogif', 'utools', 'pixpin', 'desktopok', 'rocketdock', 'taskbarx', 'mactype', 'trafficmonitor', 'eartrumpet', 'translucenttb', 'startallback', 'start11', 'fences', 'displayfusion', 'synergy', 'barrier', 'kde connect', 'copyq', 'ditto', 'clipx', '图吧工具', '华硕管家', 'myasus', 'directx', 'glidex', '多屏中心', '截图工具', '搜狗输入', 'sogou', 'sakurafrp', '迅雷', 'thunder', 'pointofix', 'trafficmonitor'] },
  { name: '游戏', icon: '\u{1F3AE}', keywords: [
    'steam', 'epic', 'origin', 'ubisoft', 'blizzard', 'battle', 'xbox', 'gog',
    'league of legends', 'lol', 'valorant', 'counter-strike', 'cs2', 'csgo',
    'dota', 'pubg', 'apex legends', 'call of duty', 'cod', 'warzone',
    'fortnite', 'gta', 'grand theft auto', 'overwatch', 'world of warcraft', 'wow',
    'diablo', 'hearthstone', 'starcraft', 'destiny', 'warframe',
    'path of exile', 'final fantasy', 'ffxiv', 'ff14', 'genshin impact',
    'honkai', '星穹铁道', 'zzz', 'zenless', 'minecraft', 'terraria',
    'cyberpunk', 'elden ring', 'red dead redemption', 'rdr2',
    'baldur', 'bg3', 'black myth', '黑神话', '暗黑', 'warcraft',
    'rockstar', 'parsec', 'playnite', 'launchbox', 'retroarch',
    'dolphin', 'pcsx2', 'rpcs3', 'citra', 'cemu', 'yuzu', 'ryujinx', 'mame', 'ppsspp',
    'ds4windows', 'rewasd', 'joytokey', 'inputmapper',
    'monster hunter', 'mhw', 'mhr', 'resident evil', 'silent hill',
    'sekiro', '只狼', 'god of war', 'spider-man', 'horizon zero dawn',
    'ghost of tsushima', 'mass effect', 'witcher', 'stray', 'hades',
    'disco elysium', 'stardew valley', 'rimworld', 'factorio', 'satisfactory',
    'subnautica', 'cuphead', 'hollow knight', 'dead cells',
    'forza', 'halo', 'age of empires', 'flight simulator',
    'persona', 'nier', 'dark souls', 'starfield',
    'nvidia geforce now', 'steam china', '王者荣耀', 'honor of kings',
    '三角洲', '无畏契约', '5eclient', '5eplay', '完美世界',
    '英雄联盟', '为了吾王', '真实台球', 'slay the spire', '猛兽派对',
    '逃离鸭', '雷神加速器', '暴雪战网', 'watt toolkit', 'steam++',
    'wegame', 'counter strike', '反恐精英', 'ue4', 'unreal engine',
    'game ', 'launcher', 'gameinput', 'anti cheatexpert',
  ] },
  { name: '云盘存储', icon: '\u2601\uFE0F', keywords: ['google drive', 'dropbox', 'onedrive', '百度网盘', 'baidu netdisk', '阿里云盘', 'aliyundrive', '坚果云', 'owncloud', 'nextcloud', 'mega', 'icloud', 'pan.baidu'] },
  { name: '远程工具', icon: '\u{1F4E1}', keywords: ['teamviewer', 'anydesk', 'rustdesk', 'sunlogin', '向日葵', 'splashtop', 'vnc', 'rdp', 'mstsc', 'chrome remote', 'parsec', 'uu远程', 'uuremote', 'virtual serial', '串口'] },
  // system components - hidden by default toggle
  { name: '系统组件', icon: '\u2699\uFE0F', system: true, keywords: [
    'microsoft visual c++', 'redistributable',
    '.net runtime', '.net sdk', '.net targeting', '.net apphost', '.net host',
    '.net framework', 'dotnet', 'netstandard',
    'microsoft update health',
    'microsoft odbc', 'microsoft.command', 'microsoft.net.sdk',
    'universal crt',
    'windows driver', 'driver package',
    'application verifier', 'kits configuration',
    'iis ', 'iis express',
    'open xml sdk',
    'windows cleaner',
    'cpp_crt', 'vcpp_crt',
    'xbox identity', 'widgets platform', 'speech pack',
    'ink.handwriting',
    'ksystemsharehost', 'hrcontextmenu',
    'wpsappext',
    'av1 video', 'avc ', 'heif', 'mpeg-2', 'vp9 ', 'webp ', 'web media',
    'raw image',
    // .NET framework SDK packages
    'microsoft .net', 'microsoft.aspnet', 'microsoft.windowsdesktop',
    // Visual studio sub-components
    'visual studio vs', 'vs_wcf', 'msi development', 'workflow manager tools',
    'microsoft.visualstudio.vsto',
    // Python fragments
    'python 3.11', 'python 3.8', 'add to path', 'core interpreter', 'development libraries',
    'pip bootstrap', 'standard library', 'utility scripts', 'test suite',
    // Intel / ASUS / system
    'intel(r)', 'intel®', 'asus device', 'asus hotplug', 'atk ', 'cc switch', 'dove ',
    'rog message', 'cm-media', 'c-media',
    // Specific NVIDIA/CUDA sub-components
    'cuda ', 'cublas', 'cudart', 'cufft', 'curand', 'cusolver', 'cusparse',
    'nvjitlink', 'nvjpeg', 'nvrtc', 'nvtx', 'nvfatbin', 'nvml', 'nvcc',
    'cuobjdump', 'cupti', 'cuxxfilt', 'nvprune',
    'nsight', 'nvidia physx', 'nvidia hd', 'nvidia shadowplay',
    'nvidia app ', 'nvidia backend', 'nvidia container', 'nvidia localsystem',
    'nvidia session', 'nvidia telemetry', 'nvidia user', 'nvidia installer',
    'nvidia platform', 'nvidia watchdog', 'nvidia frameview',
    'nvidia ai user', 'nvidia messagebus', 'nvidia graphics driver',
    // VS sub-components
    'vs_blend', 'vs_coreeditor', 'vs_filetracker', 'vs_github', 'vs_web',
    'sptools_microsoft', 'intelltrace',
    // Windows store/extras
    'windowsappruntime', 'winappruntime', 'office 16 click-to-run',
    'microsoft.office.actionsserver', 'officepushnotifications',
    'microsoft.testplatform', 'entity framework',
    'windows app certification',
    'sdk debuggers', 'sdk arm', 'sdk arm64',
    'winrt intellisense', 'wpt redistributables',
    'windows mobile connectivity', 'windows ip over usb',
    'windows desktop extension', 'windows iot extension', 'windows team extension',
    'get help', 'feedback hub', '开始体验', '中文(简', '原始图像', '来自设备制造商',
    '手机连接', '快速助手', '跨设备体验', '邮件和日历', '电影和电视', '应用安装程序',
    'microsoft edge webview', 'microsoft edge update', 'edge update',
  ] },
];

// Known app icons from simple-icons CDN (fallback when exe extraction fails)
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
  // Games
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
  // Chinese apps
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
  ['直播伴侣', 'douyin'], ['抖音', 'douyin'], ['douyin', 'douyin'],
  ['钉钉', 'dingtalk'], ['飞书', 'lark'],
  ['百度网盘', 'baidu'], ['baidu', 'baidu'],
  ['搜狗', 'sogou'], ['卡巴', 'kaspersky'], ['kaspersky', 'kaspersky'],
  ['华为', 'huawei'],
  ['小米', 'xiaomi'], ['腾讯', 'tencent'],
  ['阿里', 'alibaba'], ['阿里巴巴', 'alibaba'],
  // Tools & more
  ['everything', 'everything'], ['7-zip', '7zip'],
  ['bandizip', 'bandizip'], ['winrar', 'winrar'],
  ['snipaste', 'snipaste'], ['sharex', 'sharex'],
  ['powertoys', 'powertoys'], ['autohotkey', 'autohotkey'],
  ['ccleaner', 'ccleaner'], ['revo uninstaller', 'revo'],
  ['geek uninstaller', 'geek'], ['rufus', 'rufus'],
  ['cpu-z', 'cpuz'], ['gpu-z', 'gpuz'],
  ['hwinfo', 'hwinfo64'], ['aida64', 'aida64'],
  ['msi afterburner', 'msi afterburner'],
  ['crystaldiskinfo', 'crystaldiskinfo'],
  ['crystaldiskmark', 'crystaldiskmark'],
  ['virtualbox', 'virtualbox'], ['vmware', 'vmware'],
  ['vagrant', 'vagrant'], ['putty', 'putty'],
  ['winscp', 'winscp'], ['filezilla', 'filezilla'],
  ['wireshark', 'wireshark'], ['postman', 'postman'],
  ['insomnia', 'insomnia'], ['cmder', 'cmder'],
  ['conemu', 'conemu'], ['alacritty', 'alacritty'],
  ['windows terminal', 'windowsterminal'],
  ['powershell', 'powershell'], ['sublime', 'sublimetext'],
  ['notepad++', 'notepadplusplus'], ['vim', 'vim'],
  ['neovim', 'neovim'], ['emacs', 'gnuemacs'],
  ['obsidian', 'obsidian'],
]);
export function getAppIconUrl(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [key, slug] of iconMap) {
    if (lower.includes(key)) {
      // Try jsDelivr first (accessible in China), fallback to simple-icons CDN
      return `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`;
    }
  }
  return null;
}

export function categorizeApp(name: string): { category: string; icon: string } {
  const lower = name.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return { category: cat.name, icon: cat.icon };
    }
  }
  return { category: '其他', icon: '\u{1F4E6}' };
}
