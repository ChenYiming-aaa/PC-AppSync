import { useState, useEffect } from 'react';
import { onIconProgress } from '../api/scanner';

export function IconLoadProgress() {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = onIconProgress(p => {
      setProgress(p);
      setVisible(p.done < p.total);
    });
    return unsub;
  }, []);

  if (!visible || !progress || progress.total === 0) return null;

  const pct = progress.total > 0 ? Math.round(progress.done / progress.total * 100) : 0;

  return (
    <div style={{
      background: '#f0f7ff', border: '1px solid #b3d4fc', borderRadius: 8,
      padding: '6px 12px', marginBottom: 12, fontSize: 13
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>Loading icons...</span>
        <span>{progress.done}/{progress.total} ({pct}%)</span>
      </div>
      <div style={{ height: 4, background: '#d0e3f7', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: '#1976d2', borderRadius: 2,
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
}
