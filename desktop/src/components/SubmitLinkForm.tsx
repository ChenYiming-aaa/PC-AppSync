import { useState } from 'react';
import { api } from '../api/client';
import { useLang } from '../utils/i18n';

interface Props {
  appName: string;
  hasLink: boolean;
}

export function SubmitLinkForm({ appName, hasLink }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [msg, setMsg] = useState('');

  if (hasLink) return null;

  const handleSubmit = async () => {
    if (!url) return;
    try {
      await api.submitDownloadLink({ software_name: appName, official_url: url, category: '' });
      setMsg(t('appcard.submitted'));
      setUrl('');
      setTimeout(() => { setMsg(''); setOpen(false); }, 3000);
    } catch (err: any) {
      setMsg(t('inventory.submitFailed') + ': ' + err.message);
    }
  };

  return (
    <div style={{ marginLeft: 44, marginBottom: 8 }}>
      {open ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="text" placeholder={t('appcard.submitPlaceholder')} value={url}
            onChange={e => setUrl(e.target.value)}
            style={{ flex: 1, padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid var(--md-outline-variant)' }} />
          <button className="md-btn-sm md-btn-filled" onClick={handleSubmit} style={{ fontSize: 11, padding: '6px 14px' }}>{t('appcard.submit')}</button>
          <button className="md-btn-sm md-btn-outlined" onClick={() => { setOpen(false); setUrl(''); }} style={{ fontSize: 11, padding: '6px 14px' }}>{t('appcard.cancel')}</button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}
          style={{ fontSize: 11, padding: '4px 12px', cursor: 'pointer', background: 'none', border: '1px dashed var(--md-outline)', borderRadius: 8, color: 'var(--md-on-surface-variant)' }}>
          {t('appcard.submitLink')}
        </button>
      )}
      {msg && open && <span style={{ fontSize: 11, color: 'var(--md-primary)', marginLeft: 8 }}>{msg}</span>}
    </div>
  );
}
