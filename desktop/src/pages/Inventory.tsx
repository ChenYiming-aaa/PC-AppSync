import { useState, useMemo, useEffect } from 'react';
import type { ScanResult, Application, DownloadLink } from '../types';
import { AppCard } from '../components/AppCard';
import { api } from '../api/client';
import { categorizeApp, CATEGORIES, findAppGroup, isSystemApp } from '../utils/categorize';

interface Props {
  scanResult: ScanResult | null;
  onSearchDownload: (name: string) => void;
}

export function Inventory({ scanResult: initialScan, onSearchDownload }: Props) {
  const [scanResult, setScanResult] = useState(initialScan);
  useEffect(() => setScanResult(initialScan), [initialScan]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('全部');
  const [showSystem, setShowSystem] = useState(false);
  const [links, setLinks] = useState<Record<string, DownloadLink>>({});
  const [refreshTick, setRefreshTick] = useState(0);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [subCollapsed, setSubCollapsed] = useState<string[]>([]);

  // Fetch download link status for visible apps
  useEffect(() => {
    if (!scanResult) return;
    setLinks({});
    const names = [...new Set(scanResult.applications.map(a => a.name))];
    let i = 0;
    const t = setInterval(() => {
      if (i >= names.length) { clearInterval(t); return; }
      api.searchDownloadLinks(names[i]).then(r => {
        if (r.length > 0) setLinks(p => ({ ...p, [names[i]]: r[0] }));
      }).catch(() => {});
      i++;
    }, 80);
    return () => clearInterval(t);
  }, [scanResult, refreshTick]);

  const toggle = (key: string) => setCollapsed(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);
  const toggleSub = (key: string) => setSubCollapsed(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);

  const categoryData = useMemo(() => {
    if (!scanResult) return [];
    const catMap = new Map<string, {
      groups: Map<string, { apps: Application[]; icon: string }>;
      standalone: Application[];
    }>();

    const eligible = scanResult.applications
      .filter(app => showSystem || !isSystemApp(app.name))
      .filter(app => app.name.toLowerCase().includes(search.toLowerCase()));

    for (const app of eligible) {
      const cat = categorizeApp(app.name);
      if (cat.category === '系统组件') continue;
      if (filterCategory !== '全部' && cat.category !== filterCategory) continue;

      if (!catMap.has(cat.category)) {
        catMap.set(cat.category, { groups: new Map(), standalone: [] });
      }
      const bucket = catMap.get(cat.category)!;

      const g = findAppGroup(app.name);
      if (g && g.category === cat.category) {
        if (!bucket.groups.has(g.parentName)) {
          bucket.groups.set(g.parentName, { apps: [], icon: g.icon });
        }
        bucket.groups.get(g.parentName)!.apps.push(app);
      } else {
        bucket.standalone.push(app);
      }
    }

    const result: { category: string; icon: string; groups: { name: string; icon: string; apps: Application[] }[]; standalone: Application[] }[] = [];
    for (const [catName, data] of catMap) {
      const ci = categorizeApp(catName);
      const groups = Array.from(data.groups.entries()).map(([name, val]) => ({ name, icon: val.icon, apps: val.apps }));
      groups.sort((a, b) => a.name.localeCompare(b.name));
      result.push({ category: catName, icon: ci.icon, groups, standalone: data.standalone });
    }
    result.sort((a, b) => a.category.localeCompare(b.category));
    return result;
  }, [scanResult, search, filterCategory, showSystem]);

  if (!scanResult) return <p>No scan data. Run a scan first.</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Software Inventory</h2>
        <button onClick={() => setRefreshTick(t => t + 1)}
          style={{ fontSize: 12, padding: '4px 12px', cursor: 'pointer' }}>Refresh</button>
      </div>
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
        Show system components
      </label>
      {categoryData.map(({ category, icon, groups, standalone }) => {
        const catOpen = !collapsed.includes(category);
        const totalCount = groups.reduce((s, g) => s + g.apps.length, 0) + standalone.length;
        return (
          <div key={category} style={{ marginBottom: 10 }}>
            <div onClick={() => toggle(category)} style={{
              cursor: 'pointer', padding: '8px 12px', background: '#f0f0f0', borderRadius: 6,
              display: 'flex', justifyContent: 'space-between', userSelect: 'none'
            }}>
              <span><strong>{icon} {category}</strong> ({totalCount})</span>
              <span>{catOpen ? '▲' : '▼'}</span>
            </div>
            {catOpen && (
              <div style={{ paddingLeft: 12, marginTop: 6 }}>
                {groups.map(grp => {
                  const subOpen = !subCollapsed.includes(grp.name);
                  return (
                    <div key={grp.name} style={{ marginBottom: 6, border: '1px solid #eee', borderRadius: 6, padding: '4px 0' }}>
                      <div onClick={() => toggleSub(grp.name)} style={{
                        cursor: 'pointer', padding: '4px 10px', display: 'flex', justifyContent: 'space-between', userSelect: 'none'
                      }}>
                        <span><strong>{grp.icon} {grp.name}</strong> <span style={{ color: '#888', fontWeight: 'normal' }}>({grp.apps.length})</span></span>
                        <span>{subOpen ? '▲' : '▼'}</span>
                      </div>
                      {subOpen && grp.apps.map((app, idx) => (
                        <div key={idx} style={{ paddingLeft: 12 }}>
                          <AppCard name={app.name} version={app.version} source={app.source}
                            publisher={app.publisher} installPath={app.install_path} installDate={app.install_date}
                            downloadUrl={links[app.name]?.official_url} matched={!!links[app.name]}
                            isCommunity={!!links[app.name]?.contributor_id}
                            onSearch={() => onSearchDownload(app.name)} />
                        </div>
                      ))}
                    </div>
                  );
                })}
                {standalone.map((app, idx) => (
                  <AppCard key={'s' + idx} name={app.name} version={app.version} source={app.source}
                    publisher={app.publisher} installPath={app.install_path} installDate={app.install_date}
                    downloadUrl={links[app.name]?.official_url} matched={!!links[app.name]}
                    isCommunity={!!links[app.name]?.contributor_id}
                    onSearch={() => onSearchDownload(app.name)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
      {categoryData.length === 0 && <p style={{ color: '#999' }}>No matching apps.</p>}
    </div>
  );
}
