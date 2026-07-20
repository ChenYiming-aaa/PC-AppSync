import { useState, useEffect } from 'react';
import type { ScanResult } from '../types';
import { ScanButton } from '../components/ScanButton';
import { api } from '../api/client';

interface Props {
  lastScan: ScanResult | null;
  onScanComplete: (result: ScanResult) => void;
}

export function Dashboard({ lastScan, onScanComplete }: Props) {
  const appCount = lastScan?.applications.length ?? 0;
  const runtimeCount = lastScan?.runtimes.length ?? 0;
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!lastScan) { setMatchCount(0); return; }
    let count = 0;
    lastScan.applications.forEach(app => {
      api.searchDownloadLinks(app.name).then(results => {
        if (results.length > 0) count++;
        setMatchCount(count);
      });
    });
  }, [lastScan]);

  const unmatched = appCount - matchCount;

  return (
    <div>
      <h2>Overview</h2>
      {lastScan ? (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <StatCard value={appCount} label="Applications" />
            <StatCard value={runtimeCount} label="Runtimes" />
            <StatCard value={matchCount} label="Matched" color="#2e7d32" />
            <StatCard value={unmatched} label="Unmatched" color="#c62828" />
          </div>
          <p style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: -12 }}>
            Machine: {lastScan.machine_name} | Scanned: {new Date(lastScan.scan_time).toLocaleString()} | Mode: {lastScan.scan_mode}
          </p>
        </>
      ) : (
        <p style={{ color: '#999' }}>No scan data yet. Run a scan to get started.</p>
      )}
      <ScanButton onScanComplete={onScanComplete} />
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
