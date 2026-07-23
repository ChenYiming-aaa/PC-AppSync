import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { toast } from '../components/Toast';
import { confirmDialog } from '../components/ConfirmDialog';
import { useLang } from '../utils/i18n';
import { parseScanTime, fmtFull } from '../utils/hooks';
import { Clock, Monitor, Trash2, RefreshCw, ChevronRight, Package, Cpu, Calendar } from 'lucide-react';
import type { Application, Runtime } from '../types';

interface InventorySummary {
  id: number;
  machine_name: string;
  scan_mode: string;
  scan_time: string;
  created_at?: string;
}

interface HistoryProps {
  onScanDeleted?: () => void;
}

export function History({ onScanDeleted }: HistoryProps) {
  const { t } = useLang();
  const [inventories, setInventories] = useState<InventorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<{ machine_name: string; scan_time: string; scan_mode: string; applications: Application[]; runtimes: Runtime[] } | null>(null);

  const load = () => {
    setLoading(true);
    api.listInventories().then(list => {
      setInventories(list.sort((a, b) => parseScanTime(b.scan_time).getTime() - parseScanTime(a.scan_time).getTime()));
    }).catch(() => toast(t('history.loadFailed'), 'error'))
    .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const viewDetail = async (id: number) => {
    try {
      const data = await api.getInventory(id);
      setSelectedId(id);
      setDetail({
        machine_name: data.machine_name,
        scan_time: data.scan_time,
        scan_mode: data.scan_mode,
        applications: data.scan_data.applications || [],
        runtimes: data.scan_data.runtimes || [],
      });
    } catch {
      toast(t('history.detailLoadFailed'), 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirmDialog(t('history.deleteConfirm'));
    if (!ok) return;
    try {
      await api.deleteInventory(id);
      toast(t('history.deleted'), 'success');
      if (selectedId === id) { setSelectedId(null); setDetail(null); }
      load();
      onScanDeleted?.();
    } catch {
      toast(t('toast.deleteFailed'), 'error');
    }
  };

  return (
    <div className="history-split" style={{ display: 'flex', gap: 24 }}>
      <div style={{ flex: detail ? 1 : 'none', minWidth: detail ? 0 : '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ color: 'var(--md-on-surface)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={24} color="var(--md-primary)" /> {t('history.title')}
            </h2>
            <p style={{ color: 'var(--md-on-surface-variant)', fontSize: 14, margin: 0 }}>
              {inventories.length > 0 ? `${inventories.length} ${t('history.records')}` : ''}
            </p>
          </div>
          <button className="md-btn-text" onClick={load}><RefreshCw size={16} /> {t('history.refresh')}</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--md-on-surface-variant)', textAlign: 'center', padding: 40 }}>{t('history.loading')}</p>
        ) : inventories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--md-on-surface-variant)' }}>
            <Clock size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: 16, margin: 0 }}>{t('history.noData')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {inventories.map(inv => (
              <div
                key={inv.id}
                style={{
                  background: 'var(--md-surface)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: `1px solid ${selectedId === inv.id ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onClick={() => viewDetail(inv.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--md-primary-container)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Monitor size={18} color="var(--md-primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--md-on-surface)' }}>
                      {inv.machine_name}
                      <span style={{
                        fontSize: 10, fontWeight: 600, marginLeft: 8,
                        color: 'var(--md-primary)', background: 'var(--md-primary-container)',
                        padding: '1px 7px', borderRadius: 100,
                      }}>{inv.scan_mode}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--md-on-surface-variant)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} />
                      {(() => { const f = fmtFull(inv.scan_time); return f.date + ' · ' + f.time; })()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div
                    onClick={(e) => { e.stopPropagation(); handleDelete(inv.id); }}
          className="history-detail" style={{
                      width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--md-on-surface-variant)',
                    }}
                  ><Trash2 size={15} /></div>
                  <ChevronRight size={16} color="var(--md-on-surface-variant)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detail && (
        <div className="history-detail" style={{
          width: 360, flexShrink: 0,
          background: 'var(--md-surface)',
          borderRadius: 16,
          border: '1px solid var(--md-outline-variant)',
          padding: 20, height: 'fit-content', position: 'sticky', top: 96,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--md-on-surface)' }}>{t('history.detail')}</h3>
            <div onClick={() => { setSelectedId(null); setDetail(null); }}
              style={{ cursor: 'pointer', color: 'var(--md-on-surface-variant)', fontSize: 18, lineHeight: 1 }}>×</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--md-on-surface)', marginBottom: 12 }}>
            <div style={{ color: 'var(--md-on-surface-variant)', marginBottom: 2 }}>{t('history.machine')}</div>
            <div style={{ fontWeight: 500 }}>{detail.machine_name}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--md-on-surface)', marginBottom: 12 }}>
            <div style={{ color: 'var(--md-on-surface-variant)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} /> {t('history.scannedAt')}
            </div>
            {(() => { const f = fmtFull(detail.scan_time); return (
              <><div style={{ fontWeight: 500 }}>{f.full}</div><div style={{ color: 'var(--md-on-surface-variant)', fontSize: 12, marginTop: 1 }}>{f.fullTime}</div></>
            ); })()}
          </div>
          <div style={{ fontSize: 13, color: 'var(--md-on-surface)', marginBottom: 16 }}>
            <div style={{ color: 'var(--md-on-surface-variant)', marginBottom: 2 }}>{t('history.mode')}</div>
            <span style={{
              fontWeight: 600, fontSize: 11,
              color: 'var(--md-primary)', background: 'var(--md-primary-container)',
              padding: '2px 10px', borderRadius: 100,
            }}>{detail.scan_mode}</span>
          </div>

          <div style={{ height: 1, background: 'var(--md-outline-variant)', marginBottom: 16 }} />

          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'var(--md-surface-container)', borderRadius: 10 }}>
              <Package size={16} style={{ margin: '0 auto 4px', color: 'var(--md-primary)' }} />
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--md-on-surface)' }}>{detail.applications.length}</div>
              <div style={{ fontSize: 11, color: 'var(--md-on-surface-variant)' }}>{t('history.apps')}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'var(--md-surface-container)', borderRadius: 10 }}>
              <Cpu size={16} style={{ margin: '0 auto 4px', color: 'var(--md-tertiary)' }} />
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--md-on-surface)' }}>{detail.runtimes.length}</div>
              <div style={{ fontSize: 11, color: 'var(--md-on-surface-variant)' }}>{t('history.runtimes')}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-on-surface)', marginBottom: 8 }}>{t('history.applications')}</div>
          <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {detail.applications.slice(0, 50).map((app, i) => (
              <div key={i} style={{
                fontSize: 12, padding: '6px 8px', borderRadius: 6,
                background: 'var(--md-surface-container)', color: 'var(--md-on-surface)',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</span>
                <span style={{ color: 'var(--md-on-surface-variant)', flexShrink: 0, marginLeft: 8 }}>v{app.version}</span>
              </div>
            ))}
            {detail.applications.length > 50 && (
              <div style={{ fontSize: 11, color: 'var(--md-on-surface-variant)', textAlign: 'center', padding: 4 }}>
                {t('history.more', { n: detail.applications.length - 50 })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
