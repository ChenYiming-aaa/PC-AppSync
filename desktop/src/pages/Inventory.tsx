import { useState, useMemo } from 'react';
import type { ScanResult, Application } from '../types';
import { AppCard } from '../components/AppCard';
import { categorizeApp, CATEGORIES, findAppGroup, isSystemApp } from '../utils/categorize';

interface Props {
  scanResult: ScanResult | null;
  onSearchDownload: (name: string) => void;
}

interface GroupEntry {
  name: string;
  apps: Application[];
  category: string;
  icon: string;
  isGroup: boolean;
}

export function Inventory({ scanResult, onSearchDownload }: Props) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('全部');
  const [showSystem, setShowSystem] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [groupCollapsed, setGroupCollapsed] = useState<string[]>([]);
  const toggle = (key: string) => setCollapsed(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);
  const toggleGroup = (key: string) => setGroupCollapsed(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);

  const entries = useMemo(() => {
    if (!scanResult) return [];
  const appGroups = new Map<string, { apps: Application[]; parent: string; category: string; icon: string }>();
  const standalone: Application[] = [];

    // Phase 1: Sort apps into groups or standalone
    scanResult.applications
      .filter(app => showSystem || !isSystemApp(app.name))
      .filter(app => app.name.toLowerCase().includes(search.toLowerCase()))
      .forEach(app => {
        const g = findAppGroup(app.name);
        if (g && g.category !== '系统组件') {
          const key = g.parentName;
          if (!appGroups.has(key)) {
            appGroups.set(key, { apps: [], parent: g.parentName, category: g.category, icon: g.icon });
          }
          appGroups.get(key)!.apps.push(app);
        } else {
          const cat = categorizeApp(app.name);
          if (cat.category !== '系统组件') {
            standalone.push(app);
          }
        }
      });

    // Phase 2: Build display entries
    const result: GroupEntry[] = [];

    // Add app groups
    for (const [, grp] of appGroups) {
      if (filterCategory === '全部' || grp.category === filterCategory) {
        result.push({
          name: grp.parent,
          apps: grp.apps,
          category: grp.category,
          icon: grp.icon,
          isGroup: true,
        });
      }
    }

    // Add standalone apps grouped by category
    const catMap = new Map<string, Application[]>();
    standalone.forEach((app: Application) => {
      const cat = categorizeApp(app.name);
      if (filterCategory === '全部' || cat.category === filterCategory) {
        if (!catMap.has(cat.category)) catMap.set(cat.category, []);
        catMap.get(cat.category)!.push(app);
      }
    });
    for (const [catName, catApps] of catMap) {
      const ci = categorizeApp(catName);
      result.push({ name: catName, apps: catApps, category: catName, icon: ci.icon, isGroup: false });
    }

    // Sort: groups first, then by category name
    result.sort((a, b) => {
      if (a.isGroup !== b.isGroup) return a.isGroup ? -1 : 1;
      return a.category.localeCompare(b.category);
    });
    return result;
  }, [scanResult, search, filterCategory, showSystem]);

  if (!scanResult) return <p>No scan data. Run a scan first.</p>;

  return (
    <div>
      <h2>Software Inventory</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input type="text" placeholder="Search software..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }} />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}>
          <option value="全部">All Categories</option>
          {CATEGORIES.filter(c => !c.system).map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
          <option value="其他">📦 Other</option>
        </select>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 13, cursor: 'pointer' }}>
        <input type="checkbox" checked={showSystem} onChange={e => setShowSystem(e.target.checked)} />
        Show system components (VC++ Redist, Windows SDK, .NET Runtimes, Drivers...)
      </label>
      {entries.map(entry => {
        if (entry.isGroup) {
          const open = !groupCollapsed.includes(entry.name);
          return (
            <div key={entry.name} style={{ marginBottom: 8, border: '1px solid #e8e8e8', borderRadius: 8, padding: '6px 0' }}>
              <div onClick={() => toggleGroup(entry.name)} style={{
                cursor: 'pointer', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', userSelect: 'none'
              }}>
                <span><strong>{entry.icon} {entry.name}</strong> <span style={{ color: '#888', fontWeight: 'normal' }}>({entry.apps.length} items)</span></span>
                <span>{open ? '▲' : '▼'}</span>
              </div>
              {open && entry.apps.map((app: Application, idx: number) => (
                <div key={idx} style={{ paddingLeft: 12 }}>
                  <AppCard name={app.name} version={app.version} source={app.source}
                    onSearch={() => onSearchDownload(app.name)} />
                </div>
              ))}
            </div>
          );
        }
        const open = !collapsed.includes(entry.name);
        const catInfo = categorizeApp(entry.name);
        return (
          <div key={entry.name} style={{ marginBottom: 8 }}>
            <div onClick={() => toggle(entry.name)} style={{
              cursor: 'pointer', padding: '8px 12px', background: '#f5f5f5', borderRadius: 6,
              display: 'flex', justifyContent: 'space-between', userSelect: 'none'
            }}>
              <span><strong>{catInfo.icon} {entry.name}</strong> ({entry.apps.length})</span>
              <span>{open ? '▲' : '▼'}</span>
            </div>
            {open && entry.apps.map((app: Application, idx: number) => (
              <div key={idx} style={{ paddingLeft: 8 }}>
                <AppCard name={app.name} version={app.version} source={app.source}
                  onSearch={() => onSearchDownload(app.name)} />
              </div>
            ))}
          </div>
        );
      })}
      {entries.length === 0 && <p style={{ color: '#999' }}>No matching apps.</p>}
    </div>
  );
}
