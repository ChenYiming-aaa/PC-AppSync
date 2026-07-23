import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, pages, onPage }: Props) {
  if (pages <= 1) return null;

  const tp = pages;

  const btn = (p: number) => (
    <div
      key={p}
      onClick={() => onPage(p)}
      style={{
        width: 32, height: 32, borderRadius: 8, fontSize: 13, lineHeight: '32px',
        textAlign: 'center', cursor: 'pointer', userSelect: 'none',
        fontWeight: p === page ? 600 : 400,
        background: p === page ? 'var(--md-primary)' : 'transparent',
        color: p === page ? '#fff' : 'var(--md-on-surface)',
        border: p === page ? 'none' : '1px solid var(--md-outline-variant)',
        transition: 'all 0.15s ease',
      }}
    >{p}</div>
  );

  const pageBtns: React.ReactNode[] = [];
  if (tp <= 7) { for (let i = 1; i <= tp; i++) pageBtns.push(btn(i)); }
  else {
    pageBtns.push(btn(1));
    const ws = Math.max(2, page - 1);
    const we = Math.min(tp - 1, page + 1);
    if (ws > 2) pageBtns.push(<span key="l" style={{ padding: '0 4px', color: 'var(--md-on-surface-variant)', fontSize: 12, lineHeight: '32px' }}>...</span>);
    for (let i = ws; i <= we; i++) pageBtns.push(btn(i));
    if (we < tp - 1) pageBtns.push(<span key="r" style={{ padding: '0 4px', color: 'var(--md-on-surface-variant)', fontSize: 12, lineHeight: '32px' }}>...</span>);
    pageBtns.push(btn(tp));
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 12 }}>
      <div
        onClick={() => { if (page > 1) onPage(page - 1); }}
        style={{
          width: 32, height: 32, borderRadius: 8, border: '1px solid var(--md-outline-variant)',
          background: 'transparent', cursor: page > 1 ? 'pointer' : 'default', opacity: page > 1 ? 1 : 0.3,
          display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none',
        }}
      ><ChevronLeft size={16} color="var(--md-on-surface-variant)" /></div>
      {pageBtns}
      <div
        onClick={() => { if (page < tp) onPage(page + 1); }}
        style={{
          width: 32, height: 32, borderRadius: 8, border: '1px solid var(--md-outline-variant)',
          background: 'transparent', cursor: page < tp ? 'pointer' : 'default', opacity: page < tp ? 1 : 0.3,
          display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none',
        }}
      ><ChevronRight size={16} color="var(--md-on-surface-variant)" /></div>
    </div>
  );
}
