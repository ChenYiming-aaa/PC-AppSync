import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let addToastFn: ((t: ToastItem) => void) | null = null;

export function toast(message: string, type: ToastType = 'info') {
  if (addToastFn) {
    addToastFn({ id: ++toastId, message, type });
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToastFn = (t: ToastItem) => setToasts(prev => [...prev, t]);
    return () => { addToastFn = null; };
  }, []);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', zIndex: 9999,
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column-reverse', gap: 8,
      maxWidth: 420, width: '90%',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDone={remove} />
      ))}
    </div>
  );
}

const icons = {
  success: CheckCircle, error: AlertCircle, info: Info, warning: AlertTriangle,
};
const colors = {
  success: { bg: '#D6F0E0', icon: '#1D6F42', border: '#1D6F42' },
  error: { bg: '#F9DEDC', icon: '#B3261E', border: '#B3261E' },
  info: { bg: '#EADDFF', icon: '#6750A4', border: '#6750A4' },
  warning: { bg: '#FEEFD6', icon: '#B38F00', border: '#B38F00' },
};

function ToastItem({ toast: t, onDone }: { toast: ToastItem; onDone: (id: number) => void }) {
  const [exiting, setExiting] = useState(false);
  const Icon = icons[t.type];
  const c = colors[t.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDone(t.id), 200);
    }, 3500);
    return () => clearTimeout(timer);
  }, [t.id, onDone]);

  return (
    <div style={{
      background: 'var(--md-surface)',
      border: `1px solid ${c.border}`,
      borderLeft: `4px solid ${c.border}`,
      borderRadius: 12,
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: 'var(--md-elevation-3)',
      opacity: exiting ? 0 : 1,
      transform: exiting ? 'translateY(8px) scale(0.95)' : 'translateY(0) scale(1)',
      transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
      fontSize: 14,
      pointerEvents: 'auto',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: c.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={14} color={c.icon} />
      </div>
      <span style={{ color: 'var(--md-on-surface)', flex: 1 }}>{t.message}</span>
      <button onClick={() => onDone(t.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
          color: 'var(--md-on-surface-variant)', display: 'flex', alignItems: 'center',
        }}>
        <X size={16} />
      </button>
    </div>
  );
}
