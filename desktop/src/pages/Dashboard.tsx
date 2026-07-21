import { useState, useEffect } from 'react';
import type { ScanResult } from '../types';
import { ScanButton } from '../components/ScanButton';
import { api } from '../api/client';
import { exportScan, getScanExportData, generateInstallScript } from '../api/scanner';
import { isSystemApp, findAppGroup } from '../utils/categorize';

function isRealApp(name: string): boolean {
  if (isSystemApp(name)) return false;
  const group = findAppGroup(name);
  if (group && group.category === '系统组件') return false;
  return true;
}

interface Props {
  lastScan: ScanResult | null;
  onScanComplete: (result: ScanResult) => void;
}

export function Dashboard({ lastScan, onScanComplete }: Props) {
  const [showSystem, setShowSystem] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local' | 'none'>(
    (localStorage.getItem('appsync_last_sync') ? 'synced' : 'none')
  );
  const allApps = lastScan?.applications ?? [];
  const realApps = allApps.filter(a => isRealApp(a.name));
  const systemCount = allApps.length - realApps.length;
  const visibleApps = showSystem ? allApps : realApps;
  const appCount = visibleApps.length;
  const runtimeCount = lastScan?.runtimes.length ?? 0;
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!lastScan) { setMatchCount(0); return; }
    let cancelled = false;
    Promise.allSettled(
      visibleApps.map(app => api.searchDownloadLinks(app.name))
    ).then(results => {
      if (!cancelled) {
        setMatchCount(results.filter(r => r.status === 'fulfilled' && r.value.length > 0).length);
      }
    });
    return () => { cancelled = true; };
  }, [lastScan, showSystem]);

  useEffect(() => {
    if (!lastScan) { setSyncStatus('none'); return; }
    setSyncStatus(localStorage.getItem('appsync_last_sync') ? 'synced' : 'local');
  }, [lastScan]);

  const handleExport = async () => {
    if (!lastScan) return;
    const { json } = getScanExportData(lastScan);
    const filePath = prompt('Save to (full path, e.g. C:\\scan.json):');
    if (!filePath) return;
    try {
      await exportScan(json, filePath);
      alert('Exported to ' + filePath);
    } catch (err: any) {
      alert('Export failed: ' + (err?.message || ''));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Overview</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {lastScan && <button onClick={() => {
            const script = generateInstallScript(lastScan);
            const blob = new Blob([script], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'restore-packages.ps1'; a.click();
            URL.revokeObjectURL(url);
          }} style={{ fontSize: 12 }}>Script</button>}
          {lastScan && <button onClick={handleExport} style={{ fontSize: 12 }}>Export</button>}
        </div>
      </div>
      {lastScan ? (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={showSystem} onChange={e => setShowSystem(e.target.checked)} />
            Show system components ({systemCount} hidden)
          </label>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <StatCard value={appCount} label="Applications" />
            <StatCard value={runtimeCount} label="Runtimes" />
            <StatCard value={matchCount} label="Matched" color="#2e7d32" />
            <StatCard value={appCount - matchCount} label="Unmatched" color="#c62828" />
          </div>
          <p style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: -12 }}>
            Machine: {lastScan.machine_name} | Scanned: {new Date(lastScan.scan_time).toLocaleString()} | Mode: {lastScan.scan_mode}
          </p>
        </>
      ) : (
        <p style={{ color: '#999' }}>No scan data yet. Run a scan to get started.</p>
      )}
        <ScanButton onScanComplete={onScanComplete} />
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12 }}>
          {syncStatus === 'synced' ? (
            <span style={{ color: '#2e7d32' }}>☁️ Synced to cloud</span>
          ) : syncStatus === 'local' ? (
            <span style={{ color: '#f57c00' }}> Local only</span>
          ) : (
            <span style={{ color: '#999' }}> Not uploaded</span>
          )}
        </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div style={{
      border: '1px solid #ddd', borderRadius: 8, padding: '14px 20px', flex: 1, textAlign: 'center'
    }}>
      <div style={{ fontSize: 28, fontWeight: 'bold', color: color || '#333' }}>{value}</div>
      <div style={{ color: '#666', fontSize: 13 }}>{label}</div>
    </div>
  );
}
