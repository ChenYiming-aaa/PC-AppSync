import { useState } from 'react';
import type { ScanResult } from '../types';
import { AppCard } from '../components/AppCard';

interface Props {
  scanResult: ScanResult | null;
  onSearchDownload: (name: string) => void;
}

export function Inventory({ scanResult, onSearchDownload }: Props) {
  const [tab, setTab] = useState<'apps' | 'runtimes' | 'deep'>('apps');

  if (!scanResult) {
    return <p>No scan data. Run a scan first.</p>;
  }

  return (
    <div>
      <h2>Software Inventory</h2>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setTab('apps')} style={{ fontWeight: tab === 'apps' ? 'bold' : 'normal' }}>
          Applications ({scanResult.applications.length})
        </button>
        <button onClick={() => setTab('runtimes')} style={{ fontWeight: tab === 'runtimes' ? 'bold' : 'normal', marginLeft: 8 }}>
          Runtimes ({scanResult.runtimes.length})
        </button>
        <button onClick={() => setTab('deep')} style={{ fontWeight: tab === 'deep' ? 'bold' : 'normal', marginLeft: 8 }}>
          Deep Scan
        </button>
      </div>

      {tab === 'apps' && (
        <div>
          {scanResult.applications.map((app, i) => (
            <AppCard key={i} name={app.name} version={app.version} source={app.source}
              onSearch={() => onSearchDownload(app.name)} />
          ))}
        </div>
      )}

      {tab === 'runtimes' && (
        <div>
          {scanResult.runtimes.map((rt, i) => (
            <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <strong>{rt.name}</strong> <span style={{ color: '#666' }}>v{rt.version}</span>
              {rt.packages.length > 0 && (
                <details>
                  <summary>Packages ({rt.packages.length})</summary>
                  <div style={{ maxHeight: 200, overflow: 'auto', marginTop: 8 }}>
                    {rt.packages.map((pkg, j) => (
                      <div key={j} style={{ fontSize: 12, padding: '2px 0' }}>
                        {pkg.name}@{pkg.version}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'deep' && (
        <div>
          <p>VS Code Extensions: {scanResult.deep_scan?.vscode_extensions.length ?? 0}</p>
          <p>WSL Distributions: {scanResult.deep_scan?.wsl_distributions.length ?? 0}</p>
          <p>PATH Entries: {scanResult.deep_scan?.path_entries.length ?? 0}</p>
        </div>
      )}
    </div>
  );
}
