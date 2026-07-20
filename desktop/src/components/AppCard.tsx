interface Props {
  name: string;
  version: string;
  source?: string;
  downloadUrl?: string;
  onSearch?: () => void;
}

export function AppCard({ name, version, source, downloadUrl, onSearch }: Props) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <strong>{name}</strong>
        <span style={{ marginLeft: 8, color: '#666' }}>v{version}</span>
        {source && <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>({source})</span>}
      </div>
      <div>
        {downloadUrl ? (
          <a href={downloadUrl} target="_blank" rel="noreferrer">
            <button>Open Download</button>
          </a>
        ) : onSearch ? (
          <button onClick={onSearch}>Search Official Site</button>
        ) : (
          <span style={{ color: '#999', fontSize: 12 }}>No link</span>
        )}
      </div>
    </div>
  );
}
