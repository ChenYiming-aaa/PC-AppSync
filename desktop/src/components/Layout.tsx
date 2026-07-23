import { ReactNode } from 'react';
import { LayoutDashboard, Package, Download, LogOut, Clock, Sun, Moon, Lock, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { confirmDialog } from './ConfirmDialog';
import { api } from '../api/client';
import { toast } from './Toast';
import { useLang } from '../utils/i18n';

function LogoIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 128 128" fill="none" style={{ borderRadius: 12 }}>
      <rect width="128" height="128" rx="28" fill="#6750A4"/>
      <path d="M42 48L64 30L86 48" stroke="#EADDFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M42 80L64 98L86 80" stroke="#EADDFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
      <line x1="64" y1="34" x2="64" y2="94" stroke="#EADDFF" strokeWidth="5" strokeLinecap="round"/>
      <polyline points="56,66 48,74 56,82" stroke="#D0BCFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="72,62 80,54 72,46" stroke="#D0BCFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
    </svg>
  );
}

interface Props {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  userEmail?: string;
  onLogout: () => void;
}

export function Layout({ children, currentPage, onNavigate, userEmail, onLogout }: Props) {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwdCur, setPwdCur] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('appsync_theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
      setDark(saved === 'dark');
    }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('appsync_theme', next);
    setDark(!dark);
  };
  const tabs = [
    { key: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { key: 'inventory', label: t('nav.inventory'), icon: Package },
    { key: 'downloads', label: t('nav.downloads'), icon: Download },
    { key: 'history', label: t('nav.history'), icon: Clock },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--md-surface-dim)' }}>
      <header style={{
        background: 'var(--md-surface)',
        borderBottom: '1px solid var(--md-outline-variant)',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LogoIcon />
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--md-on-surface)', letterSpacing: '-0.02em' }}>AppSync</span>
          </div>
          <nav style={{ display: 'flex', gap: 4, overflowX: 'auto', flexShrink: 1, minWidth: 0, scrollbarWidth: 'none' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = currentPage === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onNavigate(tab.key)}
                  className="nav-btn"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--md-radius-full)',
                    fontWeight: 500,
                    fontSize: 14,
                    color: active ? 'var(--md-on-primary)' : 'var(--md-on-surface-variant)',
                    background: active ? 'var(--md-primary)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    lineHeight: '20px',
                  }}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  <span className="nav-label">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div ref={menuRef} style={{ position: 'relative' }}>
            <div onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px 6px 10px', borderRadius: 100,
                border: `1px solid ${menuOpen ? 'var(--md-outline)' : 'var(--md-outline-variant)'}`,
                background: menuOpen ? 'var(--md-surface-container)' : 'transparent',
                cursor: 'pointer', userSelect: 'none',
                transition: 'all 0.15s ease',
              }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--md-primary-container)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--md-primary)', fontSize: 13, fontWeight: 600,
              }}>
                {userEmail?.charAt(0).toUpperCase() || '?'}
              </div>
              <span style={{ fontSize: 13, color: 'var(--md-on-surface)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</span>
              <ChevronDown size={14} color="var(--md-on-surface-variant)" style={{ transition: 'transform 0.2s ease', transform: menuOpen ? 'rotate(180deg)' : 'none' }} />
            </div>

            {menuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
                background: 'var(--md-surface)',
                borderRadius: 16,
                border: '1px solid var(--md-outline-variant)',
                boxShadow: 'var(--md-elevation-3)',
                minWidth: 220, padding: 6,
              }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--md-outline-variant)', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--md-on-surface)' }}>{userEmail}</div>
                </div>

                <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--md-on-surface)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      {dark ? <Moon size={15} /> : <Sun size={15} />}
                      {t('nav.darkMode')}
                    </span>
                    <div onClick={toggleTheme}
                      style={{
                        width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', flexShrink: 0,
                        background: dark ? 'var(--md-primary)' : 'var(--md-outline-variant)',
                        transition: 'background 0.2s ease',
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', position: 'absolute', top: 3,
                        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'left 0.2s ease',
                        left: dark ? 23 : 3,
                      }} />
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--md-on-surface)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      {t('nav.language')}
                    </span>
                    <div onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
                      style={{
                        display: 'flex', gap: 2, padding: 2, borderRadius: 100, cursor: 'pointer',
                        background: 'var(--md-surface-container)',
                      }}>
                      <div style={{
                        padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600, transition: 'all 0.15s ease',
                        background: lang === 'zh' ? 'var(--md-primary)' : 'transparent',
                        color: lang === 'zh' ? '#fff' : 'var(--md-on-surface-variant)',
                      }}>中</div>
                      <div style={{
                        padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600, transition: 'all 0.15s ease',
                        background: lang === 'en' ? 'var(--md-primary)' : 'transparent',
                        color: lang === 'en' ? '#fff' : 'var(--md-on-surface-variant)',
                      }}>EN</div>
                    </div>
                  </div>
                </div>

                <div onClick={() => { setShowPwd(true); setMenuOpen(false); }}
                  style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--md-on-surface)', transition: 'background 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--md-surface-container)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <Lock size={15} color="var(--md-on-surface-variant)" />
                  {t('password.title')}
                </div>

                <div style={{ height: 1, background: 'var(--md-outline-variant)', margin: '4px 8px' }} />

                <div onClick={async () => {
                  const ok = await confirmDialog(t('confirm.signOut'), t('confirm.signOutBtn'));
                  if (ok) onLogout();
                }}
                  style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--md-error)', transition: 'background 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--md-error-container)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <LogOut size={15} />
                  {t('nav.signOut')}
                </div>
              </div>
            )}
          </div>
          {showPwd && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)',
            }} onClick={() => setShowPwd(false)}>
              <div style={{
                background: 'var(--md-surface)', borderRadius: 20, padding: 28,
                minWidth: 340, maxWidth: 400, boxShadow: 'var(--md-elevation-4)',
              }} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginBottom: 16, color: 'var(--md-on-surface)' }}>{t('password.title')}</h3>
                <input type="password" placeholder={t('password.current')} value={pwdCur}
                  onChange={e => setPwdCur(e.target.value)}
                  style={{ width: '100%', marginBottom: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--md-outline)', background: 'var(--md-surface-dim)', fontSize: 14 }} />
                <input type="password" placeholder={t('password.new')} value={pwdNew}
                  onChange={e => setPwdNew(e.target.value)}
                  style={{ width: '100%', marginBottom: 20, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--md-outline)', background: 'var(--md-surface-dim)', fontSize: 14 }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="md-btn-outlined" onClick={() => setShowPwd(false)}
                    style={{ fontSize: 13, padding: '8px 20px' }}>{t('password.cancel')}</button>
                  <button className="md-btn-filled" disabled={pwdLoading || !pwdCur || !pwdNew}
                    onClick={async () => {
                      setPwdLoading(true);
                      try {
                        await api.changePassword(pwdCur, pwdNew);
                        toast(t('password.success'), 'success');
                        setShowPwd(false); setPwdCur(''); setPwdNew('');
                      } catch (err: any) {
                        toast(err.message || t('password.failed'), 'error');
                      } finally { setPwdLoading(false); }
                    }}
                    style={{ fontSize: 13, padding: '8px 20px' }}>{pwdLoading ? t('password.saving') : t('password.save')}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      <main style={{ flex: 1, padding: 32, maxWidth: 1120, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
