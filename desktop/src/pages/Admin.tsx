import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { DownloadLink } from '../types';

export function Admin() {
  const [pending, setPending] = useState<(DownloadLink & { contributor_email?: string })[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getProfile().then(user => {
      if (!user.is_admin) { setMsg('Admin access only'); return; }
      fetchPending();
    }).catch(() => setMsg('Not logged in'));
  }, []);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('appsync_token');
      const res = await fetch('http://localhost:3000/api/v1/downloads/links/pending', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) setPending(await res.json());
    } catch { setMsg('Failed to load'); }
  };

  const handleVerify = async (id: number, verified: boolean) => {
    try {
      const token = localStorage.getItem('appsync_token');
      await fetch('http://localhost:3000/api/v1/downloads/links/' + id + '/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ verified }),
      });
      setPending(prev => prev.filter(l => l.id !== id));
    } catch (err: any) { setMsg('Error: ' + err.message); }
  };

  return (
    <div>
      <h2>Admin - Pending Download Links</h2>
      {msg && <p style={{ color: '#c62828' }}>{msg}</p>}
      {pending.length === 0 && <p style={{ color: '#999' }}>No pending submissions.</p>}
      {pending.map(link => (
        <div key={link.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div><strong>{link.software_name}</strong></div>
          <div style={{ fontSize: 12, color: '#666' }}>URL: <a href={link.official_url} target="_blank" rel="noreferrer">{link.official_url}</a></div>
          {link.contributor_email && <div style={{ fontSize: 12, color: '#999' }}>Submitted by: {link.contributor_email}</div>}
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button onClick={() => handleVerify(link.id, true)} style={{ cursor: 'pointer', padding: '4px 16px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4 }}>Approve</button>
            <button onClick={() => handleVerify(link.id, false)} style={{ cursor: 'pointer', padding: '4px 16px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 4 }}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
