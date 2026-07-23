import { useState, useEffect, useMemo } from 'react';
import type { ScanResult, DownloadLink } from '../types';
import { AppCard } from '../components/AppCard';
import { SubmitLinkForm } from '../components/SubmitLinkForm';
import { CategoryDropdown } from '../components/CategoryDropdown';
import { LinkLibrary } from '../components/LinkLibrary';
import { api } from '../api/client';
import { openUrl } from '../api/scanner';
import { toast } from '../components/Toast';
import { categorizeApp } from '../utils/categorize';
import { useLang } from '../utils/i18n';
import { useDebounce, fmtDate } from '../utils/hooks';
import { Search, RefreshCw, Download, CheckCircle, HelpCircle, Copy, BookOpen } from 'lucide-react';
import { Pagination } from '../components/Pagination';

interface Props { scanResult: ScanResult | null; }

const PAGE_SIZE = 10;

export function Downloads({ scanResult: initialScan }: Props) {
  const [scanResult, setScanResult] = useState(initialScan);
  useEffect(() => setScanResult(initialScan), [initialScan]);
  const { t } = useLang();
  const [links, setLinks] = useState<Record<string, DownloadLink>>({});
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [matchedPage, setMatchedPage] = useState(1);
  const [unmatchedPage, setUnmatchedPage] = useState(1);
  const [inventories, setInventories] = useState<{ id: number; machine_name: string; scan_time: string }[]>([]);

  const [selectedOtherId, setSelectedOtherId] = useState<number | null>(null);
  const [missingApps, setMissingApps] = useState<any[] | null>(null);
  const [diffMachine, setDiffMachine] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'current' | 'diff'>('current');
  const [showLibrary, setShowLibrary] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { setMatchedPage(1); setUnmatchedPage(1); }, [search, categoryFilter, filter, missingApps]);

  const loadInventories = () => {
    api.listInventories().then(list => {
      setInventories(list);
      if (list.length > 1 && !selectedOtherId) {
        const cur = scanResult?.machine_name;
        const other = list.find(i => i.machine_name !== cur) || list[1];
        if (other) setSelectedOtherId(other.id);
      }
    }).catch(err => { console.warn('Load inventories failed:', err); toast(t('downloads.loadFailed'), 'error'); });
  };

  useEffect(() => { loadInventories(); }, [scanResult, refreshKey]);

  useEffect(() => {
    if (!selectedOtherId) { setMissingApps(null); return; }
    api.compareInventories(selectedOtherId).then(data => {
      setMissingApps(data.missing_apps);
      setDiffMachine(data.other_machine);
      const names = [...new Set(data.missing_apps.map(a => a.name))];
      if (names.length > 0) api.batchMatchLinks(names).then(r => setLinks(p => ({ ...p, ...r }))).catch(err => console.warn('Match links failed:', err));
    }).catch(() => setMissingApps(null));
  }, [selectedOtherId]);

  useEffect(() => {
    if (!scanResult) return;
    const names = [...new Set(scanResult.applications.map(a => a.name))];
    if (names.length > 0) api.batchMatchLinks(names).then(r => setLinks(p => ({ ...p, ...r }))).catch(err => console.warn('Match links failed:', err));
  }, [scanResult]);

  const currentApps = scanResult?.applications || [];
  const displayApps = (viewMode === 'diff' && missingApps) ? missingApps : currentApps;
  const matchCount = useMemo(() => displayApps.filter(a => !!links[a.name]).length ?? 0, [displayApps, links]);
  const total = displayApps.length;

  const filtered = useMemo(() => displayApps
    .filter(a => a.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    .filter(a => categoryFilter === '全部' || categorizeApp(a.name).category === categoryFilter)
    .filter(a => filter === 'all' || (filter === 'matched' ? !!links[a.name] : !links[a.name]))
  , [displayApps, links, filter, debouncedSearch, categoryFilter]);

  const matched = filtered.filter(a => !!links[a.name]);
  const unmatched = filtered.filter(a => !links[a.name]);

  const handleSearch = async (appName: string) => {
    const results = await api.searchDownloadLinks(appName);
    if (results.length > 0) {
      setLinks(p => ({ ...p, [appName]: results[0] }));
    } else {
      openUrl('https://www.bing.com/search?q=' + encodeURIComponent(appName + ' 官方下载'));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: 'var(--md-on-surface)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={24} color="var(--md-primary)" /> {t('downloads.title')}
          </h2>
          <p style={{ color: 'var(--md-on-surface-variant)', fontSize: 14, margin: '4px 0 0' }}>
            {viewMode === 'diff' && missingApps ? `${missingApps.length} ${t('downloads.appsMissing')} ${diffMachine}` : `${total} ${t('downloads.appsOnMachine')}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="md-btn-sm md-btn-tonal" onClick={() => setShowLibrary(true)}>
            <BookOpen size={16} /> {t('downloads.linkLibrary')}
          </button>
          <button className="md-btn-text" onClick={async () => {
            try { const r = await api.getLatestInventory(); if (r?.scan_data) { setLinks({}); setScanResult(r.scan_data); } }
            catch (err) { console.warn('Refresh failed:', err); toast(t('downloads.refreshFailed'), 'error'); }
            setRefreshKey(k => k + 1);
          }}><RefreshCw size={16} /> {t('downloads.refresh')}</button>
        </div>
      </div>

      {inventories.length > 1 && (
        <div style={{ marginBottom: 20, padding: 16, background: 'var(--md-surface-container)', borderRadius: 16, border: '1px solid var(--md-outline-variant)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-on-surface)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={16} /> {t('downloads.compare')}
            </span>
            <select value={selectedOtherId || ''} onChange={e => {
              const val = parseInt(e.target.value, 10);
              setSelectedOtherId(isNaN(val) ? null : val);
            }} style={{ padding: '6px 12px', borderRadius: 100, border: '1px solid var(--md-outline-variant)', fontSize: 13, background: 'var(--md-surface)', maxWidth: 300 }}>
              {inventories.map(i => (
                <option key={i.id} value={i.id}>{i.machine_name} ({fmtDate(i.scan_time)})</option>
              ))}
            </select>
            {missingApps !== null && (
              <div style={{ display: 'flex', gap: 4, background: 'var(--md-surface)', borderRadius: 100, padding: 3 }}>
                <button onClick={() => setViewMode('current')}
                  style={{
                    padding: '4px 14px', borderRadius: 100, border: 'none', fontSize: 12,
                    background: viewMode === 'current' ? 'var(--md-primary)' : 'transparent',
                    color: viewMode === 'current' ? '#fff' : 'var(--md-on-surface)',
                    cursor: 'pointer', fontWeight: 500,
                  }}>{t('downloads.current')} ({currentApps.length})</button>
                <button onClick={() => setViewMode('diff')}
                  style={{
                    padding: '4px 14px', borderRadius: 100, border: 'none', fontSize: 12,
                    background: viewMode === 'diff' ? 'var(--md-error)' : 'transparent',
                    color: viewMode === 'diff' ? '#fff' : 'var(--md-on-surface)',
                    cursor: 'pointer', fontWeight: 500,
                  }}>{t('downloads.missing')} ({missingApps.length})</button>
              </div>
            )}
            {missingApps === null && selectedOtherId && <span style={{ fontSize: 13, color: 'var(--md-on-surface-variant)' }}>{t('downloads.loading')}</span>}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--md-on-surface-variant)' }} />
          <input type="text" placeholder={t('downloads.search')} value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 100, border: '1px solid var(--md-outline-variant)', background: 'var(--md-surface)' }} />
        </div>
        <CategoryDropdown value={categoryFilter} onChange={setCategoryFilter} allLabel={t('downloads.allTypes')} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'matched', 'unmatched'] as const).map(f => {
          const active = filter === f;
          return (
            <div
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 20px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                background: active ? 'var(--md-primary)' : 'var(--md-surface)',
                color: active ? '#fff' : 'var(--md-on-surface)',
                border: '1px solid ' + (active ? 'var(--md-primary)' : 'var(--md-outline-variant)'),
                cursor: 'pointer', transition: 'all 0.15s ease',
                display: 'inline-flex', alignItems: 'center', gap: 6, userSelect: 'none',
                position: 'relative',
                transform: active ? 'scale(1.02)' : 'scale(1)',
                boxShadow: active ? 'var(--md-elevation-1)' : 'none',
              }}
            >
              {f === 'all' ? <Download size={14} /> : f === 'matched' ? <CheckCircle size={14} /> : <HelpCircle size={14} />}
              {f === 'all' ? t('downloads.all') + ' (' + total + ')' : f === 'matched' ? t('downloads.matched') + ' (' + matchCount + ')' : t('downloads.unmatched') + ' (' + (total - matchCount) + ')'}
              {active && <div style={{ position: 'absolute', bottom: -4, left: '20%', right: '20%', height: 2, borderRadius: 1, background: 'var(--md-primary)' }} />}
            </div>
          );
        })}
      </div>

      {viewMode === 'diff' && missingApps && <p style={{ color: 'var(--md-error)', fontSize: 13, marginBottom: 12 }}>{t('downloads.diffHint')}</p>}

      {matched.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ color: 'var(--md-primary)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={18} /> {t('downloads.matchedCount', { count: matched.length })}
            </h3>
            <button className="md-btn-sm md-btn-tonal" onClick={() => {
              const urls = matched.map(a => `${a.name}: ${links[a.name]?.official_url || ''}`).join('\n');
              navigator.clipboard.writeText(urls).then(() => toast(t('downloads.copiedUrls', { n: matched.length }), 'success')).catch(() => toast(t('downloads.copyFailed'), 'error'));
            }}><Copy size={14} /> {t('downloads.copyAll')}</button>
          </div>
          {matched.slice((matchedPage - 1) * PAGE_SIZE, matchedPage * PAGE_SIZE).map((app, i) => (
            <AppCard key={i} name={app.name} version={app.version}
              downloadUrl={links[app.name]?.official_url} matched={true}
              isCommunity={!!links[app.name]?.contributor_id}
              publisher={app.publisher} installPath={app.install_path} installDate={app.install_date} />
          ))}
          <Pagination page={matchedPage} pages={Math.ceil(matched.length / PAGE_SIZE)} onPage={setMatchedPage} />
        </div>
      )}

      {unmatched.length > 0 && (
        <div>
            <h3 style={{ color: 'var(--md-on-surface-variant)', fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <HelpCircle size={18} /> {t('downloads.unmatchedCount', { count: unmatched.length })}
          </h3>
          {unmatched.slice((unmatchedPage - 1) * PAGE_SIZE, unmatchedPage * PAGE_SIZE).map((app, i) => (
            <div key={i}>
              <AppCard name={app.name} version={app.version} matched={false}
                publisher={app.publisher} installPath={app.install_path} installDate={app.install_date}
                onSearch={() => handleSearch(app.name)} />
              <SubmitLinkForm appName={app.name} hasLink={!!links[app.name]} />
            </div>
          ))}
          <Pagination page={unmatchedPage} pages={Math.ceil(unmatched.length / PAGE_SIZE)} onPage={setUnmatchedPage} />
        </div>
      )}

      {filtered.length === 0 && <p style={{ color: 'var(--md-on-surface-variant)', textAlign: 'center', padding: 60 }}>{t('downloads.noAppsFound')}</p>}
      {showLibrary && <LinkLibrary onClose={() => setShowLibrary(false)} />}
    </div>
  );
}
