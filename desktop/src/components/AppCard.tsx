import { useState, useEffect, memo } from 'react';
import { openUrl } from '../api/scanner';
import { categorizeApp, getAppIconUrl, getFallbackIcon } from '../utils/categorize';
import { isDarkBg, cacheIconSvg, getIconSlug } from '../utils/icons';
import { useLang } from '../utils/i18n';
import { ExternalLink, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  name: string;
  version: string;
  source?: string;
  downloadUrl?: string;
  matched?: boolean;
  onSearch?: () => void;
  isCommunity?: boolean;
  loading?: boolean;
  publisher?: string;
  installPath?: string;
  installDate?: string;
}

const AppIcon = memo(function AppIcon({ name }: { name: string }) {
  const urls = getAppIconUrl(name);
  const [src, setSrc] = useState<string | null>(urls[0] || null);
  const [tried, setTried] = useState<Set<number>>(new Set());
  const fb = getFallbackIcon(name);
  const dark = isDarkBg();

  useEffect(() => {
    setSrc(urls[0] || null);
    setTried(new Set());
  }, [name]);

  useEffect(() => {
    if (!src || !src.startsWith('http')) return;
    const slug = getIconSlug(name);
    if (!slug) return;
    fetch(src).then(r => {
      if (!r.ok) throw new Error('fetch failed');
      return r.text();
    }).then(svg => {
      cacheIconSvg(slug, svg);
      setSrc('data:image/svg+xml;base64,' + btoa(svg));
    }).catch(() => {
      const nextIdx = tried.size;
      if (nextIdx < urls.length - 1) {
        setTried(prev => new Set([...prev, nextIdx]));
        setSrc(urls[nextIdx + 1]);
      } else {
        setSrc(null);
      }
    });
  }, [src, tried]);

  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{
          width: 24, height: 24, objectFit: 'contain', flexShrink: 0, borderRadius: 4,
          filter: dark ? 'invert(1) brightness(1.5)' : 'none',
        }}
      />
    );
  }

  return (
    <div style={{
      width: 24, height: 24, borderRadius: 6,
      background: fb.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontSize: 13,
    }}>
      {fb.icon}
    </div>
  );
});

export const AppCard = memo(function AppCard({
  name, version, source, downloadUrl, matched, onSearch,
  isCommunity, loading, publisher, installPath, installDate
}: Props) {
  const { t } = useLang();
  const { category } = categorizeApp(name);
  const [expanded, setExpanded] = useState(false);
  const hasDetails = publisher || installPath || installDate;

  return (
    <div style={{
      background: 'var(--md-surface)',
      borderRadius: 12,
      padding: '12px 16px',
      marginBottom: 6,
      border: '1px solid var(--md-outline-variant)',
      transition: 'all 0.15s ease',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <AppIcon name={name} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--md-on-surface)' }}>{name}</span>
              <span style={{ color: 'var(--md-on-surface-variant)', fontSize: 12 }}>v{version}</span>
              {source && (
                <span style={{
                  fontSize: 11, color: 'var(--md-on-surface-variant)',
                  background: 'var(--md-surface-container)', padding: '1px 8px',
                  borderRadius: 100,
                }}>
                  {source}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--md-on-surface-variant)' }}>{category}</span>
              {isCommunity !== undefined && (
                isCommunity ? (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--md-tertiary)',
                    background: 'var(--md-tertiary-container)',
                    padding: '1px 8px', borderRadius: 100,
                  }}>{t('appcard.community')}</span>
                ) : downloadUrl ? (
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: 'var(--md-on-primary-container)',
                    background: 'var(--md-primary-container)',
                    padding: '1px 8px', borderRadius: 100,
                  }}>{t('appcard.official')}</span>
                ) : null
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {loading ? (
            <span style={{
              width: 70, height: 28, borderRadius: 100,
              background: 'var(--md-surface-container)',
              display: 'inline-block',
              animation: 'pulse 1.2s ease-in-out infinite',
            }} />
          ) : downloadUrl ? (
            <button className="md-btn-sm md-btn-filled" onClick={() => openUrl(downloadUrl)}>
              <ExternalLink size={14} />
              {t('appcard.open')}
            </button>
          ) : matched === true ? null : onSearch ? (
            <button className="md-btn-sm md-btn-outlined" onClick={onSearch}>
              <Search size={14} />
              {t('appcard.search')}
            </button>
          ) : (
            <span style={{ width: 80 }} />
          )}
          {hasDetails ? (
            <button onClick={() => setExpanded(!expanded)} className="md-btn-icon" style={{ border: '1px solid var(--md-outline-variant)', borderRadius: 8, width: 32, height: 32 }}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          ) : (
            <span style={{ width: 32 }} />
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
      {expanded && hasDetails && (
        <div style={{
          marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--md-outline-variant)',
          fontSize: 12, color: 'var(--md-on-surface-variant)',
          display: 'flex', flexWrap: 'wrap', gap: 16,
        }}>
          {publisher && <span>{t('appcard.publisher')}: {publisher}</span>}
          {installPath && <span style={{ wordBreak: 'break-all' }}>{t('appcard.path')}: {installPath}</span>}
          {installDate && <span>{t('appcard.installed')}: {installDate}</span>}
        </div>
      )}
    </div>
  );
});
