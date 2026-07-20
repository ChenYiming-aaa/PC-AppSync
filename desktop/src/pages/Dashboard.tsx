import type { ScanResult } from '../types';
import { ScanButton } from '../components/ScanButton';

interface Props {
  lastScan: ScanResult | null;
  onScanComplete: (result: ScanResult) => void;
}

export function Dashboard({ lastScan, onScanComplete }: Props) {
  const appCount = lastScan?.applications.length ?? 0;
  const runtimeCount = lastScan?.runtimes.length ?? 0;

  return (
    <div>
      <h2>Overview</h2>
      {lastScan ? (
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{appCount}</div>
            <div style={{ color: '#666' }}>Applications</div>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{runtimeCount}</div>
            <div style={{ color: '#666' }}>Runtimes</div>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{lastScan.machine_name}</div>
            <div style={{ color: '#666' }}>Machine</div>
          </div>
        </div>
      ) : (
        <p style={{ color: '#999' }}>No scan data yet. Run a scan to get started.</p>
      )}
      <ScanButton onScanComplete={onScanComplete} />
      {lastScan && (
        <p style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
          Last scanned: {new Date(lastScan.scan_time).toLocaleString()} | Mode: {lastScan.scan_mode}
        </p>
      )}
    </div>
  );
}
