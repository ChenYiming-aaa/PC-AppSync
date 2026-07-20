import { useState, useEffect, useMemo } from 'react';
import type { ScanResult, DownloadLink } from '../types';
import { AppCard } from '../components/AppCard';
import { api } from '../api/client';
import { openUrl } from '../api/scanner';

interface Props {
  scanResult: ScanResult | null;
}

export function Downloads({ scanResult }: Props) {
  const [links, setLinks] = useState<Record<string, DownloadLink>>({});
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!scanResult) return;
    setLinks({});
    scanResult.applications.forEach(app => {
      api.searchDownloadLinks(app.name).then(results => {
        if (results.length > 0) {
          setLinks(prev => ({ ...prev, [app.name]: results[0] }));
        }
      });
    });
  }, [scanResult]);

  const matchCount = useMemo(
    () => scanResult?.applications.filter(a => !!links[a.name]).length ?? 0,
    [scanResult, links]
  );
  const total = scanResult?.applications.length ?? 0;

  const filtered = useMemo(() => {
    if (!scanResult) return [];
    return scanResult.applications
      .filter(app => app.name.toLowerCase().includes(search.toLowerCase()))
      .filter(app => {
        if (filter === 'matched') return !!links[app.name];
        if (filter === 'unmatched') return !links[app.name];
        return true;
      });
  }, [scanResult, links, filter, search]);

  const matched = filtered.filter(app => !!links[app.name]);
  const unmatched = filtered.filter(app => !links[app.name]);

  const handleSearch = async (appName: string) => {
    const results = await api.searchDownloadLinks(appName);
    if (results.length > 0) {
      setLinks(prev => ({ ...prev, [appName]: results[0] }));
    } else {
      openUrl('https://www.bing.com/search?q=' + encodeURIComponent(appName + ' 官方下载'));
    }
  };

  if (!scanResult) return <p>No scan data. Run a scan first.</p>;

  return (
    <div>
      <h2>Downloads</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input type="text" placeholder="Search software..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['all', 'matched', 'unmatched'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '4px 16px', cursor: 'pointer',
              fontWeight: filter === f ? 'bold' : 'normal',
              background: filter === f ? '#e0e0e0' : 'transparent',
              border: '1px solid #ccc', borderRadius: 16
            }}>
            {f === 'all' ? `All (${total})` : f === 'matched' ? `Matched (${matchCount})` : `Unmatched (${total - matchCount})`}
          </button>
        ))}
      </div>

      {matched.length > 0 && (
        <>
          <p style={{ color: '#2e7d32', fontSize: 13, margin: '8px 0' }}>--- Matched (Auto-link) ---</p>
          {matched.map((app, i) => (
            <AppCard key={i} name={app.name} version={app.version}
              downloadUrl={links[app.name]?.official_url} matched={true} />
          ))}
        </>
      )}

      {unmatched.length > 0 && (
        <>
          <p style={{ color: '#c62828', fontSize: 13, margin: '8px 0' }}>--- Unmatched (Search Required) ---</p>
          {unmatched.map((app, i) => (
            <AppCard key={i} name={app.name} version={app.version} matched={false}
              onSearch={() => handleSearch(app.name)} />
          ))}
        </>
      )}

      {filtered.length === 0 && <p style={{ color: '#999' }}>No apps found.</p>}
    </div>
  );
}
