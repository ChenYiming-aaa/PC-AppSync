import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { openUrl } from '../api/scanner';
import { toast } from './Toast';
import type { DownloadLink } from '../types';
import { useLang } from '../utils/i18n';
import { useDebounce } from '../utils/hooks';
import { Search } from 'lucide-react';
import { Pagination } from './Pagination';

const catColors: Record<string, string> = {
  browser: '#1A73E8', communication: '#006064', database: '#00695C', design: '#C62828',
  development: '#6750A4', game: '#1B5E20', media: '#F57F17', security: '#B71C1C',
  tool: '#6A1B9A', office: '#283593',
};

interface Props {
  onClose: () => void;
}

export function LinkLibrary({ onClose }: Props) {
  const { t } = useLang();
  const [links, setLinks] = useState<DownloadLink[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 250);
  const [loading, setLoading] = useState(false);

  const load = (p: number, q: string) => {
    setLoading(true);
    api.listDownloadLinks(p, 10, q || undefined).then(r => {
      setLinks(r.links);
      setTotal(r.total);
      setPages(r.pages);
      setPage(r.page);
    }).catch(() => toast(t('library.loadFailed'), 'error'))
    .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, debounced); }, [debounced]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)',
      animation: 'fadeIn 0.15s ease',
    }} onClick={onClose}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div style={{
        background: 'var(--md-surface)',
        borderRadius: 24,
        width: '92%', maxWidth: 740,
        maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.2s cubic-bezier(0.2, 0, 0, 1)',
      }} onClick={e => e.stopPropagation()}>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '24px 28px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--md-primary-container)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>{'\u2B07'}</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--md-on-surface)', lineHeight: 1.3 }}>{t('library.title')}</h2>
              <span style={{ fontSize: 13, color: 'var(--md-on-surface-variant)' }}>{total} {t('library.links')}</span>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--md-outline-variant)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--md-on-surface-variant)' }}>
            {'\u2715'}
          </button>
        </div>

        <div style={{ padding: '16px 28px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 44, top: '50%', transform: 'translateY(-50%)', color: 'var(--md-on-surface-variant)' }} />
          <input type="text" placeholder={t('library.search')} value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 12, border: '1px solid var(--md-outline-variant)', background: 'var(--md-surface-dim)', fontSize: 14, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--md-primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--md-outline-variant)'} />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 28px', minHeight: 280 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--md-on-surface-variant)' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--md-outline-variant)', borderTopColor: 'var(--md-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <span style={{ fontSize: 14 }}>{t('library.loading')}</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : links.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--md-on-surface-variant)' }}>
              <Search size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
              <p style={{ fontSize: 15, margin: 0 }}>{t('library.noResults')}</p>
              <p style={{ fontSize: 13, margin: '4px 0 0' }}>{t('library.tryAgain')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {links.map(link => {
                const catColor = catColors[link.category || ''] || 'var(--md-on-surface-variant)';
                return (
                  <div key={link.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px', borderRadius: 14,
                    border: '1px solid var(--md-outline-variant)',
                    background: 'var(--md-surface)',
                    transition: 'all 0.15s ease',
                    cursor: 'default',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--md-outline)'; e.currentTarget.style.boxShadow = 'var(--md-elevation-1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--md-outline-variant)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{
                      width: 6, height: 40, borderRadius: 3, flexShrink: 0,
                      background: catColor,
                      opacity: 0.5,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--md-on-surface)' }}>{link.software_name}</span>
                        {link.verified ? (
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#1D6F42', background: '#D6F0E0', padding: '2px 8px', borderRadius: 100 }}>
                            {t('library.verified')}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#7D5260', background: 'var(--md-tertiary-container)', padding: '2px 8px', borderRadius: 100 }}>
                            {t('library.community')}
                          </span>
                        )}
                        {link.category && (
                          <span style={{ fontSize: 10, fontWeight: 500, color: catColor, background: catColor + '18', padding: '2px 8px', borderRadius: 100 }}>{link.category}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--md-on-surface-variant)', marginTop: 3, wordBreak: 'break-all', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link.official_url}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => { navigator.clipboard.writeText(link.official_url).then(() => toast(t('toast.copied'), 'success')); }}
                        title={t('library.copyTitle')}
                        style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--md-outline-variant)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'all 0.15s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--md-surface-container)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        {'\u{1F4CB}'}
                      </button>
                      <button onClick={() => openUrl(link.official_url)}
                        title={t('library.openTitle')}
                        style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'var(--md-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'all 0.15s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#5F4096'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--md-primary)'; }}>
                        {'\u{1F517}'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {pages > 1 && (
          <div style={{ borderTop: '1px solid var(--md-outline-variant)', padding: '8px 28px 20px', marginTop: 4 }}>
            <Pagination page={page} pages={pages} onPage={(p) => load(p, search)} />
          </div>
        )}
      </div>
    </div>
  );
}
