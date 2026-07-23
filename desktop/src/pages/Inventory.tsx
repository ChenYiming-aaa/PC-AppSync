import { useState, useMemo, useEffect } from 'react';
import type { ScanResult, Application, DownloadLink } from '../types';
import { AppCard } from '../components/AppCard';
import { CategoryDropdown } from '../components/CategoryDropdown';
import { api } from '../api/client';
import { openUrl } from '../api/scanner';
import { categorizeApp, findAppGroup, isSystemApp } from '../utils/categorize';
import { catIconBg, catIconColor } from '../utils/icons';
import { useLang } from '../utils/i18n';
import { useDebounce } from '../utils/hooks';
import { Search, ChevronDown, ChevronRight, RefreshCw, Package } from 'lucide-react';

interface Props {
  scanResult: ScanResult | null;
}

export function Inventory({ scanResult: initialScan }: Props) {
  const [scanResult, setScanResult] = useState(initialScan);
  useEffect(() => setScanResult(initialScan), [initialScan]);
  const { t } = useLang();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [filterCategory, setFilterCategory] = useState('全部');
  const [showSystem, setShowSystem] = useState(false);
  const [links, setLinks] = useState<Record<string, DownloadLink>>({});
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [subCollapsed, setSubCollapsed] = useState<string[]>([]);
  const [submitApp, setSubmitApp] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    if (!scanResult) return;
    setLinks({});
    setLoadingLinks(true);
    const names = [...new Set(scanResult.applications.map(a => a.name))];
    if (names.length === 0) { setLoadingLinks(false); return; }
    let cancelled = false;
    api.batchMatchLinks(names).then(newLinks => { if (!cancelled) setLinks(prev => ({ ...prev, ...newLinks })); }).catch(err => console.warn('Match links failed:', err)).finally(() => { if (!cancelled) setLoadingLinks(false); });
    return () => { cancelled = true; };
  }, [scanResult]);

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
      setSubmitMsg(t('appcard.submitted'));
      setSubmitUrl('');
      setTimeout(() => setSubmitMsg(''), 3000);
    } catch (err: any) {
      setSubmitMsg(t('inventory.submitFailed') + ': ' + err.message);
    }
  };

  const renderSubmit = (appName: string) => {
    if (links[appName]) return null;
    return (
      <div style={{ marginLeft: 44, marginBottom: 8 }}>
        {submitApp === appName ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="text" placeholder={t('appcard.submitPlaceholder')} value={submitUrl}
              onChange={e => setSubmitUrl(e.target.value)}
              style={{ flex: 1, padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid var(--md-outline-variant)' }} />
            <button className="md-btn-sm md-btn-filled" onClick={() => handleSubmit(appName)} style={{ fontSize: 11, padding: '6px 14px' }}>{t('appcard.submit')}</button>
            <button className="md-btn-sm md-btn-outlined" onClick={() => { setSubmitApp(null); setSubmitUrl(''); }} style={{ fontSize: 11, padding: '6px 14px' }}>{t('appcard.cancel')}</button>
          </div>
        ) : (
          <button onClick={() => setSubmitApp(appName)}
            style={{ fontSize: 11, padding: '4px 12px', cursor: 'pointer', background: 'none', border: '1px dashed var(--md-outline)', borderRadius: 8, color: 'var(--md-on-surface-variant)' }}>
            {t('appcard.submitLink')}
          </button>
        )}
        {submitMsg && submitApp === appName && <span style={{ fontSize: 11, color: 'var(--md-primary)', marginLeft: 8 }}>{submitMsg}</span>}
      </div>
    );
  };

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
      .filter(app => app.name.toLowerCase().includes(debouncedSearch.toLowerCase()));

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

    return Array.from(catMap.entries())
      .map(([catName, data]) => ({
        category: catName,
        icon: categorizeApp(catName).icon,
        groups: Array.from(data.groups.entries())
          .map(([name, val]) => ({ name, icon: val.icon, apps: val.apps }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        standalone: data.standalone,
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [scanResult, debouncedSearch, filterCategory, showSystem]);

  if (!scanResult) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--md-on-surface-variant)' }}>
      <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
      <p style={{ fontSize: 16, margin: 0 }}>{t('inventory.noData')}</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: 'var(--md-on-surface)' }}>{t('inventory.title')}</h2>
        <button className="md-btn-text" onClick={async () => {
          if (!scanResult) return;
          setLinks({});
          setLoadingLinks(true);
          const names = [...new Set(scanResult.applications.map(a => a.name))];
          if (names.length === 0) { setLoadingLinks(false); return; }
          api.batchMatchLinks(names).then(newLinks => setLinks(prev => ({ ...prev, ...newLinks }))).catch(err => console.warn('Match links failed:', err)).finally(() => setLoadingLinks(false));
        }}>
          <RefreshCw size={16} /> {t('inventory.refresh')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--md-on-surface-variant)',
          }} />
          <input type="text" placeholder={t('inventory.search')} value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 100, border: '1px solid var(--md-outline-variant)', background: 'var(--md-surface)' }} />
        </div>
        <CategoryDropdown value={filterCategory} onChange={setFilterCategory} />
      </div>

      <label style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        marginBottom: 20, fontSize: 13, cursor: 'pointer',
        padding: '8px 16px', borderRadius: 100, background: 'var(--md-surface-container)',
        userSelect: 'none',
      }}>
        <input type="checkbox" checked={showSystem} onChange={e => setShowSystem(e.target.checked)}
          style={{ accentColor: 'var(--md-primary)' }} />
        {t('inventory.showSystem')}
      </label>

      {categoryData.map(({ category, icon, groups, standalone }) => {
        const catOpen = !collapsed.includes(category);
        const totalCount = groups.reduce((s, g) => s + g.apps.length, 0) + standalone.length;
        const cc = { bg: catIconBg(category), color: catIconColor(category) };

        return (
          <div key={category} style={{ marginBottom: 10 }}>
            <div
              onClick={() => toggle(category)}
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                background: catOpen ? cc.bg : 'var(--md-surface)',
                borderRadius: 14,
                border: `1px solid ${catOpen ? cc.color + '30' : 'var(--md-outline-variant)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                userSelect: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: catOpen ? cc.bg : 'var(--md-surface-container)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, transition: 'all 0.2s ease',
                }}>
                  {icon}
                </div>
                <span style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: catOpen ? cc.color : 'var(--md-on-surface)',
                  transition: 'color 0.2s ease',
                }}>
                  {category}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: catOpen ? cc.color : 'var(--md-on-surface-variant)',
                  background: catOpen ? 'rgba(255,255,255,0.5)' : 'var(--md-surface-container)',
                  padding: '1px 8px',
                  borderRadius: 100,
                  transition: 'all 0.2s ease',
                }}>
                  {totalCount}
                </span>
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: catOpen ? 'rgba(255,255,255,0.5)' : 'var(--md-surface-container)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}>
                {catOpen ? <ChevronDown size={16} color={cc.color} /> : <ChevronRight size={16} color="var(--md-on-surface-variant)" />}
              </div>
            </div>

            <div style={{
              overflow: 'hidden',
              maxHeight: catOpen ? 2000 : 0,
              opacity: catOpen ? 1 : 0,
              transition: 'max-height 0.3s ease, opacity 0.2s ease',
              padding: '8px 0 0 0',
            }}>
                {groups.map(grp => {
                  const subOpen = !subCollapsed.includes(grp.name);
                  return (
                    <div key={grp.name} style={{ marginBottom: 6 }}>
                      <div
                        onClick={() => toggleSub(grp.name)}
                        style={{
                          cursor: 'pointer',
                          padding: '8px 12px 8px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          userSelect: 'none',
                          borderRadius: 10,
                          background: subOpen ? 'var(--md-surface-container)' : 'transparent',
                          border: `1px solid ${subOpen ? 'var(--md-outline-variant)' : 'transparent'}`,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--md-on-surface)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 20, height: 20, borderRadius: 6,
                            background: 'var(--md-surface-container-high)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11,
                          }}>{grp.icon}</span>
                          {grp.name}
                          <span style={{ color: 'var(--md-on-surface-variant)', fontWeight: 400, fontSize: 11 }}>{grp.apps.length}</span>
                        </span>
                        {subOpen ? <ChevronDown size={13} color="var(--md-on-surface-variant)" /> : <ChevronRight size={13} color="var(--md-on-surface-variant)" />}
                      </div>
                      {subOpen && (
                        <div style={{ paddingLeft: 12, marginTop: 4 }}>
                           {grp.apps.map((app, idx) => (
                            <div key={idx}>
                              <AppCard name={app.name} version={app.version} source={app.source}
                                publisher={app.publisher} installPath={app.install_path} installDate={app.install_date}
                                downloadUrl={links[app.name]?.official_url} matched={!!links[app.name]}
                                isCommunity={!!links[app.name]?.contributor_id} loading={loadingLinks}
                                onSearch={() => handleSearch(app.name)} />
                              {renderSubmit(app.name)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {standalone.map((app, idx) => (
                  <div key={'s' + idx}>
                    <AppCard name={app.name} version={app.version} source={app.source}
                      publisher={app.publisher} installPath={app.install_path} installDate={app.install_date}
                      downloadUrl={links[app.name]?.official_url} matched={!!links[app.name]}
                      isCommunity={!!links[app.name]?.contributor_id} loading={loadingLinks}
                      onSearch={() => handleSearch(app.name)} />
                    {renderSubmit(app.name)}
                  </div>
                ))}
              </div>
            </div>
          );
      })}
      {categoryData.length === 0 && (
        <p style={{ color: 'var(--md-on-surface-variant)', textAlign: 'center', padding: 60 }}>
          {t('inventory.noMatch')}
        </p>
      )}
    </div>
  );
}
