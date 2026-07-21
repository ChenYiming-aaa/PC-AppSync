import { useState, useEffect } from 'react';
import { api } from '../api/client';

export function Admin() {
  const [tab, setTab] = useState<'review' | 'users'>('review');
  const [pending, setPending] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
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
    try { setPending(await api.getPendingLinks()); }
    catch { setMsg('Failed to load pending links'); }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('appsync_token');
      const res = await fetch('http://localhost:3000/api/v1/auth/users', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) setUsers(await res.json());
    } catch { setMsg('Failed to load users'); }
  };

  const handleVerify = async (id: number, verified: boolean) => {
    try {
      await api.verifyLink(id, verified);
      setPending(prev => prev.filter((l: any) => l.id !== id));
    } catch (err: any) { setMsg('Error: ' + err.message); }
  };

  const handleToggleAdmin = async (userId: number, makeAdmin: boolean) => {
    try {
      const token = localStorage.getItem('appsync_token');
      const res = await fetch('http://localhost:3000/api/v1/auth/users/' + userId + '/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ is_admin: makeAdmin }),
      });
      if (res.ok) {
        setUsers(prev => prev.map((u: any) => u.id === userId ? { ...u, is_admin: makeAdmin } : u));
      } else {
        const err = await res.json();
        setMsg(err.error || 'Failed');
      }
    } catch (err: any) { setMsg('Error: ' + err.message); }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Delete this user and all their data? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('appsync_token');
      const res = await fetch('http://localhost:3000/api/v1/auth/users/' + userId, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });
      if (res.ok) {
        setUsers(prev => prev.filter((u: any) => u.id !== userId));
      } else {
        const err = await res.json();
        setMsg(err.error || 'Failed');
      }
    } catch (err: any) { setMsg('Error: ' + err.message); }
  };

  if (!isAdmin) {
    return <div><h2>Admin</h2>{msg && <p style={{ color: '#c62828' }}>{msg}</p>}</div>;
  }

  return (
    <div>
      <h2>Admin Panel</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('review')}
          style={{ padding: '6px 20px', cursor: 'pointer', fontWeight: tab === 'review' ? 'bold' : 'normal',
            background: tab === 'review' ? '#e0e0e0' : 'transparent', border: '1px solid #ccc', borderRadius: 6 }}>
          Link Review {pending.length > 0 && `(${pending.length})`}
        </button>
        <button onClick={() => { setTab('users'); fetchUsers(); }}
          style={{ padding: '6px 20px', cursor: 'pointer', fontWeight: tab === 'users' ? 'bold' : 'normal',
            background: tab === 'users' ? '#e0e0e0' : 'transparent', border: '1px solid #ccc', borderRadius: 6 }}>
          User Management
        </button>
      </div>

      {msg && <p style={{ color: '#c62828', fontSize: 13 }}>{msg}</p>}

      {tab === 'review' && (
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Pending Download Links</h3>
          {pending.length === 0 && <p style={{ color: '#999' }}>No pending submissions.</p>}
          {pending.map((link: any) => (
            <div key={link.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{link.software_name}</strong>
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#999', background: '#f0f0f0', padding: '1px 6px', borderRadius: 3 }}>
                    {link.category || 'uncategorized'}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: '#999' }}>
                  {link.contributor_email ? 'by ' + link.contributor_email : 'anonymous'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4, wordBreak: 'break-all' }}>
                {link.official_url}
              </div>
              {link.aliases && link.aliases.length > 0 && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Aliases: {link.aliases.join(', ')}</div>
              )}
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
      )}

      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, margin: 0 }}>Users</h3>
            <button onClick={fetchUsers} style={{ fontSize: 12, padding: '3px 10px', cursor: 'pointer' }}>Refresh</button>
          </div>
          {users.length === 0 && <p style={{ color: '#999' }}>No users found.</p>}
          {users.map((user: any) => (
            <div key={user.id} style={{
              border: '1px solid #eee', borderRadius: 8, padding: '10px 14px', marginBottom: 6,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <strong>{user.nickname || user.email}</strong>
                <span style={{ marginLeft: 8, color: '#666', fontSize: 13 }}>{user.email}</span>
                {user.is_admin && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: '#fff', background: '#1976d2', padding: '1px 8px', borderRadius: 3 }}>
                    Admin
                  </span>
                )}
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                  Registered: {new Date(user.created_at).toLocaleDateString()} | Inventories: {user.inventory_count || 0}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {user.is_admin ? (
                  <button onClick={() => handleToggleAdmin(user.id, false)}
                    style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
                    Demote
                  </button>
                ) : (
                  <button onClick={() => handleToggleAdmin(user.id, true)}
                    style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
                    Make Admin
                  </button>
                )}
                <button onClick={() => handleDeleteUser(user.id)}
                  style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer', color: '#c62828' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
