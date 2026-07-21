import { useState, useEffect, useRef } from 'react';
import { openUrl, queueIconLoad } from '../api/scanner';
import { categorizeApp, getAppIconUrl } from '../utils/categorize';

interface Props {
  name: string;
  version: string;
  source?: string;
  downloadUrl?: string;
  matched?: boolean;
  onSearch?: () => void;
  icon_path?: string;
  install_path?: string;
}

export function AppCard({ name, version, source, downloadUrl, matched, onSearch, icon_path, install_path }: Props) {
  const { icon: fallbackIcon, category } = categorizeApp(name);
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    // Try CDN first
    const cdnUrl = getAppIconUrl(name);
    if (cdnUrl) { setIconSrc(cdnUrl); return; }
    // Only try extraction if we have a path
    if (!icon_path && !install_path) return;
    queueIconLoad({ name, icon_path, install_path }).then(b64 => {
      if (b64) setIconSrc(b64);
    });
  }, [name, icon_path, install_path]);

  const src = iconSrc;
  const showImg = src && !imgError;

  const handleDownload = () => {
    if (downloadUrl) openUrl(downloadUrl);
  };

  return (
    <div style={{
      border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', marginBottom: 6,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        {showImg ? (
          <img src={src!} alt="" style={{ width: 22, height: 22, borderRadius: 3 }}
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
          <button onClick={handleDownload} style={{ cursor: 'pointer', padding: '4px 14px' }}>
            ️ Open Download
          </button>
        ) : matched === true ? null : onSearch ? (
          <button onClick={onSearch} style={{ cursor: 'pointer', padding: '4px 14px' }}>
            Search Bing
          </button>
        ) : (
          <span style={{ color: '#ccc', fontSize: 12 }}>---</span>
        )}
      </div>
    </div>
  );
}
