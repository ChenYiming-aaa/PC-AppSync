export interface CategoryInfo {
  name: string;
  icon: string;
  keywords: string[];
  system?: boolean;
}

export function isSystemApp(name: string): boolean {
  const lower = name.toLowerCase();
  const sysCat = CATEGORIES.find(c => c.system);
  return sysCat ? sysCat.keywords.some(kw => lower.includes(kw)) : false;
}

// Order matters: first match wins (开发工具 before 通讯 to catch 微信开发者工具)
export const CATEGORIES: CategoryInfo[] = [
  { name: '浏览器', icon: '\u{1F310}', keywords: ['chrome', 'firefox', 'edge', 'opera', 'brave', 'safari', '浏览器', '360se', '百分', 'vivaldi', 'tor', 'yandex', 'arc', 'maxthon', 'palemoon', 'waterfox', 'cent', 'kiwi', 'slimjet', 'whale', 'iron', '夸克', 'quark'] },
  { name: '开发工具', icon: '\u{1F4BB}', keywords: ['code', 'intellij', 'pycharm', 'webstorm', 'goland', 'visual studio', 'vscode', 'git', 'docker', 'postman', 'notepad++', 'sublime', 'terminal', 'putty', 'winscp', 'cmder', 'sdk', 'msys2', 'dotnet', 'jetbrains', 'eclipse', 'netbeans', 'android studio', 'vim', 'neovim', 'emacs', 'github desktop', 'sourcetree', 'gitkraken', 'insomnia', 'jupyter', 'anaconda', 'cmake', 'gradle', 'maven', 'vagrant', 'virtualbox', 'vmware', 'wsl', 'yarn', 'pnpm', 'deno', 'kubernetes', 'minikube', 'helm', 'terraform', 'ansible', 'jenkins', 'teamcity', 'filezilla', 'winscp', 'putty', 'openssh', 'wireshark', 'fiddler', 'charles', 'curl', 'wget', 'tortoisegit', 'tortoisesvn', 'make', 'azure data studio', 'redis insight', 'xcode', 'clion', 'rider', 'rubymine', 'phpstorm', 'datagrip', 'unity', 'unreal', 'godot', 'cursor', 'copilot', 'cline', 'windurf', 'codeium', 'continue', 'editplus', 'nvm', 'node version', 'anaconda3', 'anylogic', 'gurobi', 'matlab', 'stlink', 'stm32', 'keil', 'iar', 'arduino', 'esp32', 'vivado', 'qt ', 'mingw', 'cmder', '开发', '编程', '编译器', 'ide', 'switchhosts', 'trae', '微信开发者', 'wsl', 'iis ', 'xampp', 'prolog', 'stm32cube', 'cubemx', 'entity framework', 'wechat devtools'] },
  { name: '运行时', icon: '\u2699\uFE0F', keywords: ['java', 'jdk', 'jre', 'python', 'node', 'golang', 'rust', 'ruby', 'php', 'runtime', 'openjdk', 'perl', 'lua', 'julia', 'erlang', 'elixir', 'haskell', 'scala', 'kotlin', 'dart', 'flutter', 'cuda', 'powershell', 'mingw', 'llvm', 'clang', 'tensorflow', 'pytorch', 'onnx', 'opencv', 'paddlepaddle', 'launcher', 'nvidia cuda'] },
  { name: '数据库', icon: '\u{1F5C4}\uFE0F', keywords: ['mysql', 'postgres', 'postgresql', 'sql', 'oracle', 'mongodb', 'redis', 'dbeaver', 'navicat', 'pgadmin', 'heidisql', 'workbench', 'ssms', 'cassandra', 'neo4j', 'couchdb', 'mariadb', 'firebird', 'supabase', 'dbvisualizer', 'tableplus', 'sqlite', 'sqlitestudio', 'memurai', 'azure cosmos', 'sql server'] },
  { name: '设计工具', icon: '\u{1F3A8}', keywords: ['photoshop', 'ps', 'figma', 'blender', 'gimp', 'inkscape', 'cad', 'illustrator', 'premiere', 'after effects', 'ae', 'design', 'indesign', 'lightroom', 'sketch', 'krita', 'paint.net', 'affinity', 'coreldraw', 'autocad', 'fusion 360', 'solidworks', 'freecad', 'davinci resolve', 'canva', 'aseprite', 'maya', '3ds max', 'cinema 4d', 'zbrush', 'procreate', 'eagle', 'billfish'] },
  { name: '办公软件', icon: '\u{1F4C4}', keywords: ['office', 'wps', 'word', 'excel', 'powerpoint', 'outlook', 'notion', 'obsidian', 'libreoffice', 'foxit', 'pdf', 'acrobat', 'markdown', 'onenote', 'evernote', 'joplin', 'todoist', 'ticktick', 'xmind', 'zotero', 'calibre', 'draw.io', 'monday', 'clickup', 'openoffice', 'sumatra', 'nitro', 'pdf24', 'drawio', 'draw', '有道翻译', '有道词典', 'youdao'] },
  { name: '通讯工具', icon: '\u{1F4AC}', keywords: ['wechat', 'discord', 'slack', 'telegram', 'zoom', 'teamview', '钉钉', 'dingtalk', '飞书', 'feishu', 'lark', 'qq', 'skype', 'whatsapp', 'tim', 'teams', 'signal', 'viber', 'line', 'kakaotalk', 'messenger', 'element', 'hexchat', 'trello', 'asana', 'twist', 'webex', 'zoho', 'tencent meeting', 'voov', 'ooopz', 'oopz'] },
  { name: '媒体工具', icon: '\u{1F3B5}', keywords: ['vlc', 'potplayer', 'spotify', 'obs', 'foobar', 'netease music', '酷狗', 'kugou', '暴风', 'kmplayer', 'gom', 'media player', 'music', 'player', 'mpc', 'aimp', 'musicbee', 'xsplit', 'streamlabs', 'bandicam', 'audacity', 'audition', 'cubase', 'fl studio', 'ableton', 'handbrake', 'ffmpeg', 'losslesscut', 'shotcut', 'kdenlive', 'openshot', 'mpv', 'smplayer', 'vsdc', 'ocenaudio', 'reaper', 'lmms', 'bilibili', 'b站', '哔哩哔哩', 'iqiyi', '爱奇艺', 'tencent video', '腾讯视频', 'youku', '优酷', 'mango tv', '芒果', 'douyin', '抖音', 'twitch', 'netflix', 'disney', 'hbo', 'crunchyroll', '剪映', 'capcut', '必剪', 'vegas', 'camtasia', 'filmora', 'lightworks', 'hitfilm', 'q音乐', 'kuwo', '酷我', 'plex', 'jellyfin', 'emby', 'kodi', 'mixxx', 'serato', 'traktor', 'nvidia broadcast', 'geforce experience', '直播伴侣', '直播', '网易云'] },
  { name: '安全软件', icon: '\u{1F512}', keywords: ['360', '火绒', 'huorong', 'bitdefender', 'malwarebytes', 'nod32', '杀毒', 'defender', 'antivirus', 'avg', 'avast', '卡巴', 'kaspersky', 'norton', 'mcafee', 'comodo', 'zonealarm', 'glasswire', 'wireguard', 'openvpn', 'protonvpn', 'cloudflare warp', '1password', 'bitwarden', 'keepass', 'veracrypt', 'nordvpn', 'expressvpn', 'adguard', 'ublock', 'spybot', 'superantispyware', 'tinywall', 'simplewall', 'netlimiter', 'sandboxie', 'tcpview', 'nmap', 'zenmap', 'metasploit', 'burp', 'nessus', 'acunetix', '电脑管家', '安全卫士', '腾讯管家', '安天', '抖音安全', 'edragent', 'privacy erase', 'privazer'] },
  { name: '系统工具', icon: '\u{1F527}', keywords: ['7-zip', 'winrar', 'bandizip', 'peazip', 'everything', 'powertoys', 'autohotkey', 'sharex', 'snipaste', 'greenshot', 'lightshot', 'picpick', 'faststone', 'flameshot', 'cpu-z', 'gpu-z', 'hwmonitor', 'hwinfo', 'speccy', 'crystaldiskinfo', 'crystaldiskmark', 'aida64', 'furmark', 'msi afterburner', 'ccleaner', 'glary', 'wise care', 'defraggler', 'recuva', 'easeus', 'aomei', 'rufus', 'balenaetcher', 'ventoy', 'hxd', 'beyond compare', 'winmerge', 'meld', 'treesize', 'wiztree', 'spacesniffer', 'windirstat', 'lockhunter', 'process explorer', 'procexp', 'autoruns', 'sysinternals', 'conemu', 'alacritty', 'flow launcher', 'listary', 'wox', 'keypirinha', 'dism++', 'geek uninstaller', 'revo uninstaller', 'iobit', 'notepad3', 'teracopy', 'qbittorrent', 'idm', 'internet download manager', 'quicklook', 'seer', 'rainmeter', 'wallpaper engine', 'screentogif', 'utools', 'pixpin', 'desktopok', 'rocketdock', 'taskbarx', 'mactype', 'trafficmonitor', 'eartrumpet', 'translucenttb', 'startallback', 'start11', 'fences', 'displayfusion', 'synergy', 'barrier', 'kde connect', 'copyq', 'ditto', 'clipx', 'startallback', '图吧工具', '华硕管家', 'myasus', 'asus', 'directx', 'intel', 'nvidia', 'amd', 'glidex', '多屏中心', '截图工具', '搜狗输入', 'sogou', 'sakurafrp', 'framework', 'visual c++', 'windows sdk', 'windows software development', 'winrar', '迅雷', 'thunder', '点ofix', 'pointofix'] },
  { name: '游戏', icon: '\u{1F3AE}', keywords: [
    'steam', 'epic', 'origin', 'ubisoft', 'blizzard', 'battle', 'xbox', 'gog', 'wegame',
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
    'persona', 'nier', 'dark souls', 'elden ring', 'starfield',
    'nvidia geforce now', 'steam china', '王者荣耀', 'honor of kings',
    'league', 'launcher', 'game', 'playstation', 'itch.io', 'riot', 'netease games',
    '三角洲', '无畏契约', 'valorant', '5eclient', '5eplay', '完美世界',
    '英雄联盟', 'lol', '为了吾王', '真实台球', 'slay the spire', '猛兽派对',
    '逃离鸭', '雷神加速器', '暴雪战网', 'watt toolkit', 'steam++',
    'pubg', 'battlegrounds', 'counter strike', '反恐精英', 'wegame',
    'gameinput', 'anti cheatexpert', 'anticheat', 'ue4', 'unreal engine'
  ] },
  { name: '云盘存储', icon: '\u2601\uFE0F', keywords: ['google drive', 'dropbox', 'onedrive', '百度网盘', 'baidu netdisk', '阿里云盘', 'aliyundrive', '坚果云', 'owncloud', 'nextcloud', 'mega', 'icloud', 'pan.baidu', '迅雷'] },
  { name: '远程工具', icon: '\u{1F4E1}', keywords: ['teamviewer', 'anydesk', 'rustdesk', 'sunlogin', '向日葵', 'splashtop', 'vnc', 'rdp', 'mstsc', 'chrome remote', ' parsec', 'uu远程', 'uuremote', 'virtual serial', '串口'] },
  // 系统组件 - 默认折叠不显示，用户可手动展开
  { name: '系统组件', icon: '\u2699\uFE0F', system: true, keywords: [
    'microsoft visual c++', 'redistributable',
    'windows sdk', 'windows software development kit', 'windows app certification',
    '.net runtime', '.net sdk', '.net targeting', '.net apphost', '.net host',
    '.net framework', 'dotnet', 'netstandard',
    'windowsappruntime', 'winappruntime',
    'nvidia ', 'intel(r)', 'intel®', 'amd ', '驱动程序',
    'cuda ', 'cublas', 'cudart', 'cufft', 'curand', 'cusolver', 'cusparse', 'nvjitlink', 'nvjpeg', 'nvrtc', 'nvtx', 'nvfatbin', 'nvml', 'npp ',
    'nsight', 'nvidia physx', 'nvidia hd', 'nvidia shadowplay',
    'microsoft update health', 'microsoft gameinput',
    'microsoft odbc', 'microsoft.command', 'microsoft.net.sdk',
    'universal crt', 'universal general midi',
    'winrt intellisense', 'wpt redistributables',
    'windows mobile connectivity', 'windows ip over usb',
    'windows desktop extension', 'windows iot extension',
    'windows team extension', 'windows driver',
    'sdk debuggers', 'sdk arm', 'sdk arm64',
    'compute sanitizer', 'occupancy calculator', 'visual profiler',
    'vs_wcf', 'vs_blend', 'vs_coreeditor', 'vs_filetracker', 'vs_github', 'vs_web',
    'sptools_microsoft', 'intelltrace', 'workflow manager',
    'application verifier', 'kits configuration',
    'microsoft.office.actionsserver', 'officepushnotifications',
    'office 16 click-to-run', 'office.actionserver',
    'microsoft.testplatform', 'entity framework',
    'iis ', 'iis express',
    'msi development tools',
    'open xml sdk',
    'windows cleaner',
    'cpp_crt', 'vcpp_crt',
    'xbox identity', 'widgets platform', 'speech pack',
    'ink.handwriting',
    'ksystemsharehost', 'hrcontextmenu',
    'wpsappext',
    'av1 video', 'avc ', 'heif', 'mpeg-2', 'vp9 ', 'webp ', 'web media',
    'raw image',
  ] },
];

export function categorizeApp(name: string): { category: string; icon: string } {
  const lower = name.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(kw => lower.includes(kw))) {
      return { category: cat.name, icon: cat.icon };
    }
  }
  return { category: '其他', icon: '\u{1F4E6}' };
}
