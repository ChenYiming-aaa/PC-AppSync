import { useState, useEffect, useCallback } from 'react';
import { useLang } from '../utils/i18n';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmState { message: string; confirmLabel: string; resolve: (value: boolean) => void }

let confirmFn: ((msg: string, label?: string) => Promise<boolean>) | null = null;
let pendingResolver: ((value: boolean) => void) | null = null;

export function confirmDialog(message: string, confirmLabel?: string): Promise<boolean> {
  if (confirmFn) return confirmFn(message, confirmLabel);
  return Promise.resolve(false);
}

export function ConfirmDialogContainer() {
  const { t } = useLang();
  const [state, setState] = useState<ConfirmState | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    confirmFn = (msg: string, label?: string) => new Promise<boolean>(resolve => {
      pendingResolver = resolve;
      setState({ message: msg, confirmLabel: label || t('confirm.delete'), resolve });
      setVisible(true);
    });
    return () => {
      confirmFn = null;
      if (pendingResolver) { pendingResolver(false); pendingResolver = null; }
    };
  }, []);

  const handleResult = useCallback((result: boolean) => {
    setVisible(false);
    setTimeout(() => {
      if (state) { state.resolve(result); pendingResolver = null; setState(null); }
    }, 200);
  }, [state]);

  if (!state) return null;

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.4)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }} onClick={() => handleResult(false)} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', zIndex: 9999,
        transform: visible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.95)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
        background: 'var(--md-surface)',
        borderRadius: 20,
        padding: 28,
        minWidth: 340,
        maxWidth: 400,
        boxShadow: 'var(--md-elevation-4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#FEEFD6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={20} color="#B38F00" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--md-on-surface)' }}>{t('confirm.title')}</h3>
          <button onClick={() => handleResult(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--md-on-surface-variant)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ color: 'var(--md-on-surface-variant)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          {state.message}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => handleResult(false)}
            className="md-btn-outlined" style={{ fontSize: 14, padding: '8px 20px' }}>{t('confirm.cancel')}</button>
          <button onClick={() => handleResult(true)}
            className="md-btn-filled" style={{ fontSize: 14, padding: '8px 20px', background: state.confirmLabel === 'Delete' ? '#B3261E' : 'var(--md-primary)' }}>{state.confirmLabel}</button>
        </div>
      </div>
    </>
  );
}
