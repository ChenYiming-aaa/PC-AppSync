import { useState, useEffect } from 'react';
import { openUrl, getAppIcon } from '../api/scanner';
import { categorizeApp, getAppIconUrl } from '../utils/categorize';
import type { Application } from '../types';

interface Props {
  name: string;
  version: string;
  source?: string;
  downloadUrl?: string;
  matched?: boolean;
  onSearch?: () => void;
  app?: Application;
}

export function AppCard({ name, version, source, downloadUrl, matched, onSearch, app }: Props) {
  const { icon: fallbackIcon, category } = categorizeApp(name);
  const [iconSrc, setIconSrc] = useState<string | null>(getAppIconUrl(name));
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (app?.icon_path) {
      getAppIcon({ icon_path: app.icon_path, name: app.name }).then(b64 => {
        if (b64) { setIconSrc(b64); setLoadFailed(false); }
      });
    }
  }, [app?.icon_path, app?.name]);

  const showEmoji = !iconSrc || loadFailed;

  const handleDownload = () => {
    if (downloadUrl) openUrl(downloadUrl);
  };

  return (
    <div style={{
      border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', marginBottom: 6,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        {showEmoji ? (
          <span style={{ fontSize: 18 }}>{fallbackIcon}</span>
        ) : (
          <img src={iconSrc!} alt="" style={{ width: 22, height: 22, borderRadius: 3 }}
            onError={() => setLoadFailed(true)} />
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
          <button onClick={handleDownload} style={{ cursor: 'pointer', padding: '4px 14px' }}>
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
}
