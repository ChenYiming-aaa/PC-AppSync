import { useState, useEffect, useMemo } from 'react';
import type { ScanResult, DownloadLink } from '../types';
import { AppCard } from '../components/AppCard';
import { api } from '../api/client';
import { openUrl } from '../api/scanner';
import { categorizeApp, CATEGORIES } from '../utils/categorize';

interface Props {
  scanResult: ScanResult | null;
}

export function Downloads({ scanResult }: Props) {
  const [links, setLinks] = useState<Record<string, DownloadLink>>({});
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [inventories, setInventories] = useState<{ id: number; machine_name: string; scan_time: string }[]>([]);
  const [submitApp, setSubmitApp] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');
  const [selectedOtherId, setSelectedOtherId] = useState<number | null>(null);
  const [missingApps, setMissingApps] = useState<any[] | null>(null);
  const [diffMachine, setDiffMachine] = useState<string | null>(null);

  // Fetch available inventories for comparison
  useEffect(() => {
    api.listInventories().then(list => {
      const sorted = list.sort((a, b) => new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime());
      setInventories(sorted);
      if (sorted.length > 1 && !selectedOtherId) {
        // Select the most recent different machine
        const currentMachine = scanResult?.machine_name;
        const other = sorted.find(i => i.machine_name !== currentMachine) || sorted[1];
        if (other) setSelectedOtherId(other.id);
      }
    }).catch(() => {});
  }, [scanResult]);

  // Fetch comparison when selected other inventory changes
  useEffect(() => {
    if (!selectedOtherId) { setMissingApps(null); return; }
    api.compareInventories(selectedOtherId).then(data => {
      setMissingApps(data.missing_apps);
      setDiffMachine(data.other_machine);
      // Also fetch download links for the missing apps
      data.missing_apps.forEach(app => {
        api.searchDownloadLinks(app.name).then(results => {
          if (results.length > 0) {
            setLinks(prev => ({ ...prev, [app.name]: results[0] }));
          }
        });
      });
    }).catch(() => setMissingApps(null));
  }, [selectedOtherId]);

  // Fetch download links for current machine's apps
  useEffect(() => {
    if (!scanResult) return;
    scanResult.applications.forEach(app => {
      api.searchDownloadLinks(app.name).then(results => {
        if (results.length > 0) {
          setLinks(prev => ({ ...prev, [app.name]: results[0] }));
        }
      });
    });
  }, [scanResult]);

  const displayApps = missingApps || scanResult?.applications || [];

  const matchCount = useMemo(
    () => displayApps.filter(a => !!links[a.name]).length ?? 0,
    [displayApps, links]
  );
  const total = displayApps.length;

  const filtered = useMemo(() => {
    return displayApps
      .filter(app => app.name.toLowerCase().includes(search.toLowerCase()))
      .filter(app => {
        if (categoryFilter !== '全部') {
          const cat = categorizeApp(app.name);
          if (cat.category !== categoryFilter) return false;
        }
        return true;
      })
      .filter(app => {
        if (filter === 'matched') return !!links[app.name];
        if (filter === 'unmatched') return !links[app.name];
        return true;
      });
  }, [displayApps, links, filter, search, categoryFilter]);

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

  const handleSubmit = async (appName: string) => {
    if (!submitUrl) return;
    try {
      await api.submitDownloadLink({ software_name: appName, official_url: submitUrl, category: '' });
      setSubmitMsg('Submitted! Admin will review it.');
      setSubmitUrl('');
      setTimeout(() => setSubmitMsg(''), 3000);
    } catch (err: any) {
      setSubmitMsg('Failed: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Downloads</h2>
        <button onClick={() => window.location.reload()} style={{ fontSize: 12, padding: '4px 12px', cursor: 'pointer' }}>Refresh</button>
      </div>

      {/* Cross-device comparison selector */}
      {inventories.length > 1 && (
        <div style={{ marginBottom: 14, padding: 10, background: '#f8f9ff', borderRadius: 8, border: '1px solid #d0d7ff' }}>
          <label style={{ fontSize: 13, fontWeight: 'bold' }}>Compare with old machine:</label>
          <select value={selectedOtherId || ''} onChange={e => {
            const val = parseInt(e.target.value, 10);
            setSelectedOtherId(isNaN(val) ? null : val);
          }}
            style={{ marginLeft: 8, padding: '4px 8px' }}>
            {inventories.filter(i => i.id !== inventories[0]?.id).map(i => (
              <option key={i.id} value={i.id}>{i.machine_name} ({new Date(i.scan_time).toLocaleDateString()})</option>
            ))}
          </select>
          {missingApps !== null && (
            <span style={{ marginLeft: 12, fontSize: 13, color: '#c62828' }}>
              {missingApps.length} apps missing on this machine
              {diffMachine && <span style={{ color: '#666' }}> from {diffMachine}</span>}
            </span>
          )}
          {missingApps === null && selectedOtherId && (
            <span style={{ marginLeft: 12, fontSize: 13, color: '#999' }}>Loading comparison...</span>
          )}
        </div>
      )}

      {missingApps && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button onClick={() => { setMissingApps(null); setSelectedOtherId(null); }}
            style={{ padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>
            Show all current apps
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input type="text" placeholder="Search by name..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }} />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}>
          <option value="全部">All Types</option>
          {CATEGORIES.filter(c => !c.system).map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
          <option value="其他">📦 Other</option>
        </select>
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

      {missingApps && <p style={{ color: '#c62828', fontSize: 13 }}>These apps are on your old machine but not on this one:</p>}

      {matched.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
            <p style={{ color: '#2e7d32', fontSize: 13, margin: 0 }}>--- Matched (Auto-link) ---</p>
            <button onClick={() => {
              const urls = matched.map(a => `${a.name}: ${links[a.name]?.official_url || ''}`).join('\n');
              navigator.clipboard.writeText(urls)
                .then(() => alert('Copied ' + matched.length + ' URLs!'))
                .catch(() => alert('Failed to copy to clipboard'));
            }} style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
              Copy All Links
            </button>
          </div>
          {matched.map((app, i) => (
            <AppCard key={i} name={app.name} version={app.version}
              downloadUrl={links[app.name]?.official_url} matched={true}
              isCommunity={!!(links[app.name] as any)?.contributor_id}
              publisher={app.publisher} installPath={app.install_path} installDate={app.install_date} />
          ))}
        </>
      )}

      {unmatched.length > 0 && (
        <>
          <p style={{ color: '#c62828', fontSize: 13, margin: '8px 0' }}>--- Unmatched (Search Required) ---</p>
          {unmatched.map((app, i) => (
            <div key={i}>
              <AppCard name={app.name} version={app.version} matched={false}
                publisher={app.publisher} installPath={app.install_path} installDate={app.install_date}
                onSearch={() => handleSearch(app.name)} />
              <div style={{ marginLeft: 36, marginBottom: 6 }}>
                {submitApp === app.name ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input type="text" placeholder="Paste official download URL..." value={submitUrl}
                      onChange={e => setSubmitUrl(e.target.value)}
                      style={{ flex: 1, padding: '4px 8px', fontSize: 12, border: '1px solid #ccc', borderRadius: 4 }} />
                    <button onClick={() => handleSubmit(app.name)} style={{ fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}>Submit</button>
                    <button onClick={() => { setSubmitApp(null); setSubmitUrl(''); }} style={{ fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setSubmitApp(app.name)} style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer', color: '#666' }}>
                    + Submit official link
                  </button>
                )}
                {submitMsg && submitApp === app.name && (
                  <span style={{ fontSize: 11, color: '#2e7d32', marginLeft: 8 }}>{submitMsg}</span>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {filtered.length === 0 && <p style={{ color: '#999' }}>No apps found.</p>}
    </div>
  );
}
