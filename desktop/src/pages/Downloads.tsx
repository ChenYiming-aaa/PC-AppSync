import { useState } from 'react';
import type { ScanResult, DownloadLink } from '../types';
import { AppCard } from '../components/AppCard';
import { api } from '../api/client';

interface Props {
  scanResult: ScanResult | null;
}

export function Downloads({ scanResult }: Props) {
  const [links, setLinks] = useState<Record<string, DownloadLink>>({});
  const [searching, setSearching] = useState<string | null>(null);

  const handleSearch = async (appName: string) => {
    setSearching(appName);
    try {
      const results = await api.searchDownloadLinks(appName);
      if (results.length > 0) {
        setLinks(prev => ({ ...prev, [appName]: results[0] }));
      } else {
        window.open('https://www.google.com/search?q=' + encodeURIComponent(appName + ' official download'), '_blank');
      }
    } finally {
      setSearching(null);
    }
  };

  if (!scanResult) return <p>No scan data. Run a scan first.</p>;

  return (
    <div>
      <h2>Downloads</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Applications from your old machine. Click to download on your new machine.
      </p>
      {scanResult.applications.map((app, i) => {
        const link = links[app.name];
        return (
          <AppCard key={i} name={app.name} version={app.version}
            downloadUrl={link?.official_url}
            onSearch={searching === app.name ? undefined : () => handleSearch(app.name)} />
        );
      })}
    </div>
  );
}
