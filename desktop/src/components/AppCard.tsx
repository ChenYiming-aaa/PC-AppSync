import { useState, memo } from 'react';
import { openUrl } from '../api/scanner';
import { categorizeApp } from '../utils/categorize';

interface Props {
  name: string;
  version: string;
  source?: string;
  downloadUrl?: string;
  matched?: boolean;
  onSearch?: () => void;
  /** Whether this link was community-submitted */
  isCommunity?: boolean;
  /** Expandable details */
  publisher?: string;
  installPath?: string;
  installDate?: string;
}

export const AppCard = memo(function AppCard({
  name, version, source, downloadUrl, matched, onSearch,
  isCommunity, publisher, installPath, installDate
}: Props) {
  const { icon: fallbackIcon, category } = categorizeApp(name);
  const [expanded, setExpanded] = useState(false);
  const hasDetails = publisher || installPath || installDate;

  return (
    <div style={{
      border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', marginBottom: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ fontSize: 18 }}>{fallbackIcon}</span>
          <div style={{ flex: 1 }}>
            <strong>{name}</strong>
            <span style={{ marginLeft: 8, color: '#666', fontSize: 13 }}>v{version}</span>
            {source && (
              <span style={{ marginLeft: 6, fontSize: 11, color: '#999', background: '#f0f0f0', padding: '1px 6px', borderRadius: 3 }}>
                {source}
              </span>
            )}
            {isCommunity && (
              <span style={{ marginLeft: 4, fontSize: 11, color: '#e65100', background: '#fff3e0', padding: '1px 6px', borderRadius: 3 }}>
                Community
              </span>
            )}
            {isCommunity === false && downloadUrl && (
              <span style={{ marginLeft: 4, fontSize: 11, color: '#2e7d32', background: '#e8f5e9', padding: '1px 6px', borderRadius: 3 }}>
                Official
              </span>
            )}
            <span style={{ marginLeft: 6, fontSize: 11, color: '#aaa' }}>{category}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {downloadUrl ? (
            <button onClick={() => openUrl(downloadUrl)} style={{ cursor: 'pointer', padding: '4px 14px' }}>
              Open Download
            </button>
          ) : matched === true ? null : onSearch ? (
            <button onClick={onSearch} style={{ cursor: 'pointer', padding: '4px 14px' }}>
              Search Bing
            </button>
          ) : (
            <span style={{ color: '#ccc', fontSize: 12 }}>---</span>
          )}
          {hasDetails && (
            <button onClick={() => setExpanded(!expanded)} style={{ fontSize: 11, padding: '2px 6px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: 3, background: '#fafafa' }}>
              {expanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>
      {expanded && hasDetails && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee', fontSize: 12, color: '#666', display: 'flex', gap: 16 }}>
          {publisher && <span>Publisher: {publisher}</span>}
          {installPath && <span>Path: {installPath}</span>}
          {installDate && <span>Installed: {installDate}</span>}
        </div>
      )}
    </div>
  );
});
