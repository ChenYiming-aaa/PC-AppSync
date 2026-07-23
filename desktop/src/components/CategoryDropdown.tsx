import { useState } from 'react';
import { CATEGORIES } from '../utils/categorize';
import { catIconBg, catIconColor } from '../utils/icons';
import { useLang } from '../utils/i18n';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  allLabel?: string;
}

export function CategoryDropdown({ value, onChange, allLabel: _allLabel }: Props) {
  const { t } = useLang();
  const allLabel = _allLabel || t('category.all');
  const [open, setOpen] = useState(false);
  const selectedCat = CATEGORIES.find(c => c.name === value) || null;

  return (
    <div style={{ position: 'relative', minWidth: 180 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '10px 14px',
          borderRadius: 100,
          border: `1px solid ${open ? 'var(--md-outline)' : 'var(--md-outline-variant)'}`,
          background: 'var(--md-surface)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          userSelect: 'none',
          transition: 'all 0.15s ease',
          height: 40,
          boxShadow: selectedCat ? `inset 0 0 0 1px ${catIconColor(selectedCat.name)}` : 'none',
        }}
      >
        {selectedCat ? (
          <>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: value && value !== '全部' && value !== '其他' ? catIconBg(value) : 'var(--md-surface-container)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
            }}>{selectedCat.icon}</div>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--md-on-surface)' }}>{selectedCat.name}</span>
          </>
        ) : value === '其他' ? (
          <>
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              background: 'var(--md-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
            }}>📦</span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--md-on-surface)' }}>{t('category.other')}</span>
          </>
        ) : (
          <>
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              background: 'var(--md-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--md-primary)',
            }}>☆</span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--md-on-surface)' }}>{allLabel}</span>
          </>
        )}
        {open ? <ChevronUp size={16} color="var(--md-on-surface-variant)" /> : <ChevronDown size={16} color="var(--md-on-surface-variant)" />}
      </div>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
            background: 'var(--md-surface)', borderRadius: 14,
            border: '1px solid var(--md-outline-variant)',
            boxShadow: 'var(--md-elevation-3)', overflow: 'hidden', padding: 4,
          }}>
            <OptionItem
              icon="☆" label={allLabel} active={value === '全部'} {...{ bg: 'var(--md-surface-container)' }}
              onClick={() => { onChange('全部'); setOpen(false); }}
            />
            <div style={{ height: 1, background: 'var(--md-outline-variant)', margin: '0 12px' }} />
            {CATEGORIES.filter(c => !c.system).map(c => {
              const cc = { bg: catIconBg(c.name), color: catIconColor(c.name) };
              return (
                <OptionItem
                  key={c.name}
                  icon={c.icon} label={c.name} active={value === c.name}
                  bg={cc.bg} textColor={cc.color}
                  onClick={() => { onChange(c.name); setOpen(false); }}
                />
              );
            })}
            <div style={{ height: 1, background: 'var(--md-outline-variant)', margin: '0 12px' }} />
            <OptionItem
              icon="📦" label={t('category.other')} active={value === '其他'}
              bg="var(--md-surface-container)"
              onClick={() => { onChange('其他'); setOpen(false); }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function OptionItem({ icon, label, active, bg, textColor, onClick }: {
  icon: string; label: string; active: boolean; bg: string; textColor?: string; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        borderRadius: 10,
        background: active ? bg : 'transparent',
        fontWeight: active ? 600 : 400,
        color: active && textColor ? textColor : 'var(--md-on-surface)',
        fontSize: 13, transition: 'background 0.1s',
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
      }}>{icon}</div>
      <span style={{ flex: 1 }}>{label}</span>
      {active && <span style={{ fontSize: 13, color: textColor || 'var(--md-primary)' }}>{'\u2713'}</span>}
    </div>
  );
}
