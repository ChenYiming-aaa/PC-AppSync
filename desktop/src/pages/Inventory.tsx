import { useState, useMemo } from 'react';
import type { ScanResult } from '../types';
import { AppCard } from '../components/AppCard';
import { categorizeApp, CATEGORIES, isSystemApp } from '../utils/categorize';

interface Props {
  scanResult: ScanResult | null;
  onSearchDownload: (name: string) => void;
}

export function Inventory({ scanResult, onSearchDownload }: Props) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('全部');
  const [showSystem, setShowSystem] = useState(false);

  const [collapsed, setCollapsed] = useState<string[]>([]);
  const toggle = (cat: string) => {
    setCollapsed(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const grouped = useMemo(() => {
    if (!scanResult) return [];
    const groups: Record<string, typeof scanResult.applications> = {};
    scanResult.applications
      .filter(app => showSystem || !isSystemApp(app.name))
      .filter(app => app.name.toLowerCase().includes(search.toLowerCase()))
      .forEach(app => {
        const cat = categorizeApp(app.name);
        if ((filterCategory === '全部' || cat.category === filterCategory) && cat.category !== '系统组件') {
          (groups[cat.category] ||= []).push(app);
        }
      });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
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
          {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
          <option value="其他">📦 Other</option>
        </select>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 13, cursor: 'pointer' }}>
        <input type="checkbox" checked={showSystem} onChange={e => setShowSystem(e.target.checked)} />
        Show system components (VC++ Redist, Windows SDK, .NET Runtimes, Drives...)
      </label>
      {grouped.map(([category, apps]) => {
        const isOpen = !collapsed.includes(category);
        const { icon } = categorizeApp(category);
        return (
          <div key={category} style={{ marginBottom: 8 }}>
            <div onClick={() => toggle(category)} style={{
              cursor: 'pointer', padding: '8px 12px', background: '#f5f5f5', borderRadius: 6,
              display: 'flex', justifyContent: 'space-between', userSelect: 'none'
            }}>
              <span><strong>{icon} {category}</strong> ({apps.length})</span>
              <span>{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && apps.map((app, i) => (
              <div key={i} style={{ paddingLeft: 8 }}>
                <AppCard name={app.name} version={app.version} source={app.source}
                  onSearch={() => onSearchDownload(app.name)} />
              </div>
            ))}
          </div>
        );
      })}
      {grouped.length === 0 && <p style={{ color: '#999' }}>No matching apps.</p>}
    </div>
  );
}
