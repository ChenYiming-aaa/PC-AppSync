import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  userEmail?: string;
  onLogout: () => void;
}

export function Layout({ children, currentPage, onNavigate, userEmail, onLogout }: Props) {
  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'inventory', label: 'Software List' },
    { key: 'downloads', label: 'Downloads' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '12px 24px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>AppSync</h1>
        <div>
          {userEmail && <span style={{ marginRight: 12 }}>{userEmail}</span>}
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>
      <nav style={{ display: 'flex', gap: 4, padding: '8px 24px', borderBottom: '1px solid #eee' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => onNavigate(tab.key)}
            style={{ fontWeight: currentPage === tab.key ? 'bold' : 'normal' }}>
            {tab.label}
          </button>
        ))}
      </nav>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
