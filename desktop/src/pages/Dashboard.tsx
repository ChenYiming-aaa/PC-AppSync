import { useState, useEffect, useMemo, type ComponentType } from 'react';
import type { ScanResult } from '../types';
import { ScanButton } from '../components/ScanButton';
import { api } from '../api/client';
import { exportScan, getScanExportData, generateInstallScript } from '../api/scanner';
import { toast } from '../components/Toast';
import { isSystemApp } from '../utils/categorize';
import { useLang } from '../utils/i18n';
import { UserGuide } from '../components/UserGuide';
import { Package, Cpu, CheckCircle, HelpCircle, FileDown, FileCode } from 'lucide-react';

interface Props {
  lastScan: ScanResult | null;
  onScanComplete: (result: ScanResult) => void;
}

export function Dashboard({ lastScan, onScanComplete }: Props) {
  const { t } = useLang();
  const [showGuide, setShowGuide] = useState(false);
  const [showSystem, setShowSystem] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local' | 'none'>(
    localStorage.getItem('appsync_last_sync') ? 'synced' : 'none'
  );
  const allApps = lastScan?.applications ?? [];
  const realApps = allApps.filter(a => !isSystemApp(a.name));
  const systemCount = allApps.length - realApps.length;
  const visibleApps = showSystem ? allApps : realApps;
  const appCount = visibleApps.length;
  const [matchedNames, setMatchedNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!lastScan || allApps.length === 0) { setMatchedNames(new Set()); return; }
    let cancelled = false;
    const names = [...new Set(allApps.map(a => a.name))];
    api.batchMatchLinks(names).then(result => {
      if (!cancelled) setMatchedNames(new Set(Object.keys(result)));
    }).catch(err => console.warn('Match links failed:', err));
    return () => { cancelled = true; };
  }, [lastScan]);

  const matchCount = useMemo(() =>
    visibleApps.filter(a => matchedNames.has(a.name)).length,
    [visibleApps, matchedNames]
  );

  useEffect(() => {
    if (!lastScan) { setSyncStatus('none'); return; }
    setSyncStatus(localStorage.getItem('appsync_last_sync') ? 'synced' : 'local');
  }, [lastScan]);

  const saveFile = async (content: string, defaultName: string) => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const filePath = await save({ defaultPath: defaultName, filters: [{ name: 'All Files', extensions: ['*'] }] });
      if (!filePath) return;
      await exportScan(content, filePath);
      toast(t('toast.saved') + ' ' + filePath, 'success');
    } catch (err: any) {
      toast(t('dashboard.dialogError') + ': ' + (err?.message || ''), 'error');
    }
  };

  const handleExport = () => {
    if (!lastScan) return;
    const { json } = getScanExportData(lastScan);
    saveFile(json, 'scan.json');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 style={{ color: 'var(--md-on-surface)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            {t('dashboard.overview')}
            <div onClick={() => setShowGuide(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '3px 10px', borderRadius: 100, border: '1px solid var(--md-outline-variant)', color: 'var(--md-on-surface-variant)', fontSize: 12, transition: 'all 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--md-surface-container)'; e.currentTarget.style.borderColor = 'var(--md-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--md-outline-variant)'; }}>
              <span style={{ fontWeight: 600 }}>?</span>
              <span>使用说明</span>
            </div>
          </h2>
          <p style={{ color: 'var(--md-on-surface-variant)', fontSize: 14, margin: 0 }}>
            {lastScan
              ? `${lastScan.machine_name} · ${(lastScan.scan_duration_ms ?? 0) > 0 ? (lastScan.scan_duration_ms! / 1000).toFixed(1) + 's · ' : ''}${lastScan.scan_mode} ${t('dashboard.mode')}`
              : t('dashboard.runScan')}
          </p>
        </div>
        {lastScan && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="md-btn-sm md-btn-tonal" onClick={() => {
              const script = generateInstallScript(lastScan);
              if (script.includes('No package manager data')) { toast(t('dashboard.noPackages'), 'warning'); return; }
              saveFile(script, 'restore-packages.ps1');
            }}>
              <FileCode size={16} /> {t('dashboard.script')}
            </button>
            <button className="md-btn-sm md-btn-tonal" onClick={handleExport}>
              <FileDown size={16} /> {t('dashboard.export')}
            </button>
          </div>
        )}
      </div>

      {lastScan && (
        <>
          <div className="stat-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16, marginBottom: 28,
          }}>
            <StatCard icon={Package} value={appCount} label={t('dashboard.applications')} color="var(--md-primary)" />
            <StatCard icon={Cpu} value={lastScan?.scan_duration_ms ? (lastScan.scan_duration_ms / 1000).toFixed(1) + 's' : '-'} label={t('dashboard.scanTime')} color="var(--md-tertiary)" />
            <StatCard icon={CheckCircle} value={matchCount} label={t('dashboard.matched')} color="var(--md-primary)" />
            <StatCard icon={HelpCircle} value={appCount - matchCount} label={t('dashboard.unmatched')} color="var(--md-error)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              fontSize: 13, cursor: 'pointer', userSelect: 'none',
              padding: '8px 16px', borderRadius: 100,
              background: 'var(--md-surface-container)',
            }}>
              <input type="checkbox" checked={showSystem} onChange={e => setShowSystem(e.target.checked)}
                style={{ accentColor: 'var(--md-primary)' }} />
              {t('dashboard.showSystem')}
              <span style={{ color: 'var(--md-on-surface-variant)', fontSize: 12 }}>({systemCount} {t('dashboard.hidden')})</span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: syncStatus === 'synced' ? 'var(--md-primary)' : syncStatus === 'local' ? '#B38F00' : 'var(--md-on-surface-variant)',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 12, color: 'var(--md-on-surface-variant)' }}>
                {syncStatus === 'synced' ? t('dashboard.synced') : syncStatus === 'local' ? t('dashboard.local') : t('dashboard.notUploaded')}
              </span>
            </div>
          </div>
        </>
      )}

      <ScanButton onScanComplete={onScanComplete} />
      {showGuide && <UserGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }: { icon: ComponentType<{ size: number; color?: string }>; value: number | string; label: string; color: string }) {
  return (
    <div style={{
      background: 'var(--md-surface)',
      borderRadius: 16,
      padding: '20px',
      border: '1px solid var(--md-outline-variant)',
      boxShadow: 'var(--md-elevation-1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'var(--md-primary-container)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 600, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ color: 'var(--md-on-surface-variant)', fontSize: 13, marginTop: 4 }}>{label}</div>
    </div>
  );
}
