import { useState, useRef, useEffect } from 'react';
import { scanSystem } from '../api/scanner';
import { toast } from './Toast';
import { useLang } from '../utils/i18n';
import type { ScanResult } from '../types';
import { Scan } from 'lucide-react';

interface Props {
  onScanComplete: (result: ScanResult) => void;
}

export function ScanButton({ onScanComplete }: Props) {
  const { t } = useLang();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const pulseRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!scanning) return;
    pulseRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p;
        return p + Math.max(0.3, (90 - p) * 0.04);
      });
    }, 400);
    return () => { if (pulseRef.current) clearInterval(pulseRef.current); };
  }, [scanning]);

  const handleScan = async () => {
    setScanning(true);
    setProgress(0);
    try {
      const { listen } = await import('@tauri-apps/api/event');
      const unlisten = await listen<{ percent: number; stage: string }>('scan-progress', (e) => {
        setProgress(prev => Math.max(prev, e.payload.percent));
      });
      unlistenRef.current = unlisten;
      const result = await scanSystem();
      setProgress(100);
      setTimeout(() => onScanComplete(result), 300);
    } catch (err) {
      toast(t('scan.failed') + ': ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
    } finally {
      if (pulseRef.current) clearInterval(pulseRef.current);
      pulseRef.current = null;
      unlistenRef.current?.();
      unlistenRef.current = null;
      setScanning(false);
    }
  };

  return (
    <div style={{
      background: 'var(--md-surface)',
      borderRadius: 20,
      padding: 40,
      textAlign: 'center',
      border: '1px solid var(--md-outline-variant)',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--md-primary-container)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Scan size={28} color="var(--md-primary)" />
      </div>
      <h3 style={{ color: 'var(--md-on-surface)', marginBottom: 4 }}>{t('scan.title')}</h3>
      <p style={{ color: 'var(--md-on-surface-variant)', fontSize: 13, margin: '0 0 24px 0' }}>
        {t('scan.desc')}
      </p>

      {scanning && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            height: 6, borderRadius: 3, overflow: 'hidden',
            background: 'var(--md-surface-container)',
            maxWidth: 300, margin: '0 auto 8px',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: 'var(--md-primary)',
              width: progress + '%',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--md-on-surface-variant)' }}>
            {t('scan.progress', { p: progress.toFixed(1) })}
          </span>
        </div>
      )}

      <br />
      <button
        onClick={handleScan}
        disabled={scanning}
        className="md-btn-filled"
        style={{
          padding: '14px 56px', fontSize: 15, fontWeight: 600,
          borderRadius: 100, opacity: scanning ? 0.7 : 1,
          cursor: scanning ? 'wait' : 'pointer',
        }}
      >
        {scanning ? (
          <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> {t('scan.scanning')}</>
        ) : (
          <><Scan size={20} /> {t('scan.now')}</>
        )}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
