import { useState, useEffect } from 'react';
import { api } from '../api/client';

export function Admin() {
  const [tab, setTab] = useState<'review' | 'users'>('review');
  const [pending, setPending] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getProfile().then(user => {
      if (!user.is_admin) { setMsg('Admin access only'); return; }
      loadPending();
    }).catch(() => setMsg('Not logged in'));
  }, []);

  const loadPending = async () => {
    try { setPending(await api.getPendingLinks()); }
    catch { setMsg('Failed to load'); }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('appsync_token');
      const res = await fetch('http://localhost:3000/api/v1/auth/users', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) setUsers(await res.json());
    } catch { setMsg('Failed to load'); }
  };

  const verify = async (id: number, ok: boolean) => {
    try { await api.verifyLink(id, ok); setPending(p => p.filter((x: any) => x.id !== id)); }
    catch (e: any) { setMsg(e.message); }
  };

  const toggleAdmin = async (id: number, make: boolean) => {
    try {
      const token = localStorage.getItem('appsync_token');
      const r = await fetch('http://localhost:3000/api/v1/auth/users/' + id + '/admin', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ is_admin: make })
      });
      if (r.ok) setUsers((u: any[]) => u.map(x => x.id === id ? { ...x, is_admin: make } : x));
      else setMsg((await r.json()).error);
    } catch (e: any) { setMsg(e.message); }
  };

  const delUser = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    try {
      const token = localStorage.getItem('appsync_token');
      const r = await fetch('http://localhost:3000/api/v1/auth/users/' + id, {
        method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token }
      });
      if (r.ok) setUsers((u: any[]) => u.filter(x => x.id !== id));
      else setMsg((await r.json()).error);
    } catch (e: any) { setMsg(e.message); }
  };

  return (
    <div>
      <h2>Admin</h2>
      {msg && <p style={{ color: '#c62828', fontSize: 13 }}>{msg}</p>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button onClick={() => setTab('review')}
          style={{ fontWeight: tab === 'review' ? 'bold' : 'normal', padding: '4px 16px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc' }}>
          Pending ({pending.length})
        </button>
        <button onClick={() => { setTab('users'); loadUsers(); }}
          style={{ fontWeight: tab === 'users' ? 'bold' : 'normal', padding: '4px 16px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc' }}>
          Users
        </button>
      </div>

      {tab === 'review' && (
        <div>
          {pending.length === 0 && <p style={{ color: '#999' }}>No pending submissions.</p>}
          {pending.map((link: any) => (
            <div key={link.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10, marginBottom: 6 }}>
              <div><strong>{link.software_name}</strong></div>
              <div style={{ fontSize: 12, color: '#666', wordBreak: 'break-all' }}>{link.official_url}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{link.category} | by {link.contributor_email || 'anonymous'}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                <button onClick={() => verify(link.id, true)} style={{ padding: '2px 12px', cursor: 'pointer', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 3 }}>Approve</button>
                <button onClick={() => verify(link.id, false)} style={{ padding: '2px 12px', cursor: 'pointer', background: '#c62828', color: '#fff', border: 'none', borderRadius: 3 }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div>
          {users.length === 0 && <p style={{ color: '#999' }}>No users.</p>}
          {users.map((u: any) => (
            <div key={u.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '8px 12px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{u.nickname || u.email}</strong>
                <span style={{ marginLeft: 6, color: '#666', fontSize: 13 }}>{u.email}</span>
                {u.is_admin && <span style={{ marginLeft: 4, fontSize: 11, background: '#1976d2', color: '#fff', padding: '1px 6px', borderRadius: 3 }}>Admin</span>}
                <div style={{ fontSize: 11, color: '#999' }}>ID: {u.id} | Inventories: {u.inventory_count || 0}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => toggleAdmin(u.id, !u.is_admin)} style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
                  {u.is_admin ? 'Demote' : 'Make Admin'}
                </button>
                <button onClick={() => delUser(u.id)} style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer', color: '#c62828' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
