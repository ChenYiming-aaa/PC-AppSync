import { useState, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { openUrl } from '../api/scanner';
import { useLang } from '../utils/i18n';
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: Props) {
  const { t } = useLang();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [jelly, setJelly] = useState(false);
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIconClick = useCallback(() => {
    clickCount.current += 1;
    setJelly(true);
    setTimeout(() => setJelly(false), 600);
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 2000);
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      openUrl('http://localhost:3000/admin');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await api.register(email, password, nickname || undefined);
      } else {
        await api.login(email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--md-surface-dim)',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--md-surface)',
        borderRadius: 24,
        padding: 48,
        width: '100%',
        maxWidth: 400,
        boxShadow: 'var(--md-elevation-3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            onClick={handleIconClick}
            className={jelly ? 'jelly' : ''}
            style={{
              width: 56, height: 56, margin: '0 auto 16px', cursor: 'pointer',
              borderRadius: 14, display: 'inline-block',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 128 128" fill="none" style={{ borderRadius: 14, display: 'block' }}>
              <rect width="128" height="128" rx="28" fill="#6750A4"/>
              <path d="M42 48L64 30L86 48" stroke="#EADDFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M42 80L64 98L86 80" stroke="#EADDFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
              <line x1="64" y1="34" x2="64" y2="94" stroke="#EADDFF" strokeWidth="5" strokeLinecap="round"/>
              <polyline points="56,66 48,74 56,82" stroke="#D0BCFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="72,62 80,54 72,46" stroke="#D0BCFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--md-on-surface)', marginBottom: 4 }}>{t('login.title')}</h1>
          <p style={{ color: 'var(--md-on-surface-variant)', fontSize: 14, margin: 0 }}>
            {isRegister ? t('login.subtitleRegister') : t('login.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--md-on-surface-variant)', marginBottom: 6 }}>{t('login.email')}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--md-on-surface-variant)' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder={t('login.emailPlaceholder')}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: '1px solid var(--md-outline)', background: 'var(--md-surface-dim)' }} />
            </div>
          </div>

          {isRegister && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--md-on-surface-variant)', marginBottom: 6 }}>{t('login.nickname')}</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--md-on-surface-variant)' }} />
                <input value={nickname} onChange={e => setNickname(e.target.value)}
                  placeholder={t('login.nicknamePlaceholder')}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: '1px solid var(--md-outline)', background: 'var(--md-surface-dim)' }} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--md-on-surface-variant)', marginBottom: 6 }}>{t('login.password')}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--md-on-surface-variant)' }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder={isRegister ? t('login.passwordPlaceholderRegister') : t('login.passwordPlaceholder')}
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: '1px solid var(--md-outline)', background: 'var(--md-surface-dim)' }} />
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 12, marginBottom: 16,
              background: 'var(--md-error-container)', color: 'var(--md-error)',
              fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', fontSize: 15, fontWeight: 600,
              borderRadius: 100, border: 'none',
              background: loading ? 'var(--md-primary-container)' : 'var(--md-primary)',
              color: loading ? 'var(--md-primary)' : 'var(--md-on-primary)',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : 'var(--md-elevation-1)',
            }}
          >
            {loading ? (
              <span>{t('login.pleaseWait')}</span>
            ) : isRegister ? (
              <><UserPlus size={18} /> {t('login.createAccount')}</>
            ) : (
              <><LogIn size={18} /> {t('login.signIn')}</>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="md-btn-text" style={{ fontSize: 14, padding: '4px 8px' }}>
            {isRegister ? t('login.switchToLogin') : t('login.switchToRegister')}
          </button>
        </div>
      </div>
      <style>{`
@keyframes jelly {
  0%   { transform: scale(1, 1); }
  15%  { transform: scale(1.3, 0.85); }
  30%  { transform: scale(0.85, 1.3); }
  45%  { transform: scale(1.15, 0.9); }
  60%  { transform: scale(0.95, 1.05); }
  75%  { transform: scale(1.05, 0.97); }
  100% { transform: scale(1, 1); }
}
.jelly { animation: jelly 0.6s cubic-bezier(0.2, 0, 0, 1); }
      `}</style>
    </div>
  );
}
