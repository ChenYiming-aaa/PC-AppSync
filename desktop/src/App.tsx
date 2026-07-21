import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Downloads } from './pages/Downloads';
import { Admin } from './pages/Admin';
import { api } from './api/client';
import { openUrl } from './api/scanner';
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
        return api.getLatestInventory();
      }).then(r => setScanResult(r.scan_data)).catch(() => {
        localStorage.removeItem('appsync_token');
      });
    }
  }, []);

  const handleLogin = () => {
    const token = localStorage.getItem('appsync_token');
    if (token) {
      api.getProfile().then(setUser);
      api.getLatestInventory().then(r => setScanResult(r.scan_data)).catch(() => {});
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
      alert('Scan result uploaded to cloud!');
    } catch (err: any) {
      localStorage.removeItem('appsync_last_sync');
      alert('Upload failed: ' + (err?.message || 'Unknown error'));
    }
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <Layout currentPage={page} onNavigate={setPage} userEmail={user.email} onLogout={handleLogout}
      extraNav={user.is_admin ? [{ key: 'admin', label: 'Admin' }] : undefined}>
      {page === 'dashboard' && (
        <Dashboard lastScan={scanResult} onScanComplete={handleScanComplete} />
      )}
      {page === 'inventory' && (
        <Inventory scanResult={scanResult} onSearchDownload={(name) => {
          openUrl('https://www.bing.com/search?q=' + encodeURIComponent(name + ' 官方下载'));
        }} />
      )}
      {page === 'downloads' && <Downloads scanResult={scanResult} />}
      {page === 'admin' && user.is_admin && <Admin />}
    </Layout>
  );
}
