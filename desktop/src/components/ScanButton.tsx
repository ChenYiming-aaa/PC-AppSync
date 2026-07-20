import { useState } from 'react';
import { scanStandard, scanDeep } from '../api/scanner';
import type { ScanResult } from '../types';

interface Props {
  onScanComplete: (result: ScanResult) => void;
}

export function ScanButton({ onScanComplete }: Props) {
  const [scanning, setScanning] = useState(false);
  const [mode, setMode] = useState<'standard' | 'deep'>('standard');

  const handleScan = async () => {
    setScanning(true);
    try {
      const result = mode === 'standard' ? await scanStandard() : await scanDeep();
      onScanComplete(result);
    } catch (err) {
      console.error('Scan failed:', err);
      alert('Scan failed. Check console for details.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ marginBottom: 12 }}>
        <label>
          <input type="radio" checked={mode === 'standard'} onChange={() => setMode('standard')} /> Standard Scan
        </label>
        <label style={{ marginLeft: 12 }}>
          <input type="radio" checked={mode === 'deep'} onChange={() => setMode('deep')} /> Deep Scan
        </label>
      </div>
      <button onClick={handleScan} disabled={scanning}
        style={{ padding: '12px 48px', fontSize: 18, cursor: scanning ? 'wait' : 'pointer' }}>
        {scanning ? 'Scanning...' : 'Scan Now'}
      </button>
    </div>
  );
}
