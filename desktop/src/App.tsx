import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Downloads } from './pages/Downloads';
import { api } from './api/client';
import type { ScanResult, User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState('dashboard');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('appsync_token');
    if (token) {
      api.getProfile().then(setUser).catch(() => {
        localStorage.removeItem('appsync_token');
      });
    }
  }, []);

  const handleLogin = () => {
    const token = localStorage.getItem('appsync_token');
    if (token) {
      api.getProfile().then(setUser);
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
      alert('Scan result uploaded to cloud!');
    } catch {
      alert('Scan complete but upload failed. Check your connection.');
    }
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <Layout currentPage={page} onNavigate={setPage} userEmail={user.email} onLogout={handleLogout}>
      {page === 'dashboard' && (
        <Dashboard lastScan={scanResult} onScanComplete={handleScanComplete} />
      )}
      {page === 'inventory' && (
        <Inventory scanResult={scanResult} onSearchDownload={(name) => {
          window.open('https://www.google.com/search?q=' + encodeURIComponent(name + ' official download'), '_blank');
        }} />
      )}
      {page === 'downloads' && <Downloads scanResult={scanResult} />}
    </Layout>
  );
}
