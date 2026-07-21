import { useState, useEffect } from 'react';
import { api } from '../api/client';

export function Admin() {
  const [pending, setPending] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    api.getProfile().then(user => {
      if (!user.is_admin) { setMsg('Admin access only'); return; }
      setIsAdmin(true);
      fetchPending();
    }).catch(() => setMsg('Not logged in'));
  }, []);

  const fetchPending = async () => {
    try {
      const links = await api.getPendingLinks();
      setPending(links);
    } catch { setMsg('Failed to load pending links'); }
  };

  const handleVerify = async (id: number, verified: boolean) => {
    try {
      await api.verifyLink(id, verified);
      setPending(prev => prev.filter((l: any) => l.id !== id));
    } catch (err: any) { setMsg('Error: ' + err.message); }
  };

  if (!isAdmin) {
    return <div><h2>Admin</h2>{msg && <p style={{ color: '#c62828' }}>{msg}</p>}</div>;
  }

  return (
    <div>
      <h2>Admin - Pending Download Links</h2>
      {msg && <p style={{ color: '#c62828' }}>{msg}</p>}
      {pending.length === 0 && <p style={{ color: '#999' }}>No pending submissions.</p>}
      {pending.map((link: any) => (
        <div key={link.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div><strong>{link.software_name}</strong></div>
          <div style={{ fontSize: 12, color: '#666' }}>
            URL: {link.official_url}
          </div>
          {link.contributor_email && <div style={{ fontSize: 12, color: '#999' }}>Submitted by: {link.contributor_email}</div>}
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button onClick={() => handleVerify(link.id, true)}
              style={{ cursor: 'pointer', padding: '4px 16px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4 }}>
              Approve
            </button>
            <button onClick={() => handleVerify(link.id, false)}
              style={{ cursor: 'pointer', padding: '4px 16px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 4 }}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
