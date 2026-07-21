import { useState, memo } from 'react';
import { openUrl } from '../api/scanner';
import { categorizeApp } from '../utils/categorize';
import { fetchAppIcon } from '../api/scanner';

interface Props {
  name: string;
  version: string;
  source?: string;
  downloadUrl?: string;
  matched?: boolean;
  onSearch?: () => void;
}

export const AppCard = memo(function AppCard({ name, version, source, downloadUrl, matched, onSearch }: Props) {
  const { icon: fallbackIcon, category } = categorizeApp(name);
  const cdnUrl = fetchAppIcon({ name });
  const [imgError, setImgError] = useState(false);
  const showImg = cdnUrl && !imgError;

  return (
    <div style={{
      border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', marginBottom: 6,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        {showImg ? (
          <img src={cdnUrl!} alt="" style={{ width: 22, height: 22, borderRadius: 3 }}
            onError={() => setImgError(true)} />
        ) : (
          <span style={{ fontSize: 18 }}>{fallbackIcon}</span>
        )}
        <div style={{ flex: 1 }}>
          <strong>{name}</strong>
          <span style={{ marginLeft: 8, color: '#666', fontSize: 13 }}>v{version}</span>
          {source && (
            <span style={{ marginLeft: 6, fontSize: 11, color: '#999', background: '#f0f0f0', padding: '1px 6px', borderRadius: 3 }}>
              {source}
            </span>
          )}
          <span style={{ marginLeft: 6, fontSize: 11, color: '#aaa' }}>{category}</span>
        </div>
      </div>
      <div>
        {downloadUrl ? (
          <button onClick={() => openUrl(downloadUrl)} style={{ cursor: 'pointer', padding: '4px 14px' }}>
            🟢 Open Download
          </button>
        ) : matched === true ? null : onSearch ? (
          <button onClick={onSearch} style={{ cursor: 'pointer', padding: '4px 14px' }}>
            🔍 Search Bing
          </button>
        ) : (
          <span style={{ color: '#ccc', fontSize: 12 }}>---</span>
        )}
      </div>
    </div>
  );
});
