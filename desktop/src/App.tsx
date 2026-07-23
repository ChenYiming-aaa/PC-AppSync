import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Downloads } from './pages/Downloads';
import { History } from './pages/History';
import { api } from './api/client';
import { ToastContainer, toast } from './components/Toast';
import { ConfirmDialogContainer } from './components/ConfirmDialog';
import type { ScanResult, User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState('dashboard');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('appsync_token');
    if (token) {
      api.getProfile().then(user => {
        setUser(user);
        return api.getLatestInventory().catch(() => null);
      }).then(r => {
        if (r) setScanResult(r.scan_data);
      }).catch(() => {
        localStorage.removeItem('appsync_token');
      });
    }
  }, []);

  const handleLogin = () => {
    const token = localStorage.getItem('appsync_token');
    if (token) {
      api.getProfile().then(setUser).catch(() => localStorage.removeItem('appsync_token'));
      api.getLatestInventory().then(r => setScanResult(r.scan_data)).catch(err => console.warn('Load latest inventory failed:', err));
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  const handleScanComplete = async (result: ScanResult) => {
    setScanResult(result);
    try {
      await api.uploadInventory(result);
      localStorage.setItem('appsync_last_sync', Date.now().toString());
      toast('Scan result uploaded to cloud!', 'success');
    } catch (err: any) {
      localStorage.removeItem('appsync_last_sync');
      toast('Upload failed: ' + (err?.message || 'Unknown error'), 'error');
    }
  };

  return (
    <>
      <style>{`@keyframes pageIn { from { opacity: 0.3; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <ToastContainer />
      <ConfirmDialogContainer />
      {!user ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <Layout currentPage={page} onNavigate={setPage} userEmail={user.email} onLogout={handleLogout}>
          <div key={page} style={{ animation: 'pageIn 0.2s cubic-bezier(0.2, 0, 0, 1)' }}>
            {page === 'dashboard' && (
              <Dashboard lastScan={scanResult} onScanComplete={handleScanComplete} />
            )}
            {page === 'inventory' && (
              <Inventory scanResult={scanResult} />
            )}
            {page === 'downloads' && <Downloads scanResult={scanResult} />}
            {page === 'history' && <History onScanDeleted={() => {
              api.getLatestInventory().then(r => setScanResult(r.scan_data)).catch(() => setScanResult(null));
            }} />}
          </div>
        </Layout>
      )}
    </>
  );
}
