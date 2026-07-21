import type { DownloadLink, ScanResult, User, CompareResult } from '../types';

const API_BASE = 'http://localhost:3000/api/v1';

function getToken(): string | null {
  return localStorage.getItem('appsync_token');
}

function setToken(token: string) {
  localStorage.setItem('appsync_token', token);
}

function clearToken() {
  localStorage.removeItem('appsync_token');
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(API_BASE + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    });
    if (!res.ok) { clearToken(); return false; }
    const data = await res.json();
    setToken(data.token);
    return true;
  } catch { clearToken(); return false; }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let res = await fetch(API_BASE + path, { ...options, headers });
  
  // Auto-refresh token on 401 (all concurrent callers share the same refresh)
  if (res.status === 401) {
    if (!refreshPromise) refreshPromise = tryRefresh();
    const refreshed = await refreshPromise;
    refreshPromise = null;
    if (refreshed) {
      headers['Authorization'] = 'Bearer ' + getToken();
      res = await fetch(API_BASE + path, { ...options, headers });
    }
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  register: (email: string, password: string, nickname?: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname }),
    }).then(r => { setToken(r.token); return r; }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(r => { setToken(r.token); return r; }),

  logout: () => clearToken(),

  getProfile: () => request<User>('/auth/profile'),

  uploadInventory: (scanResult: ScanResult) =>
    request<{ id: number }>('/inventories', {
      method: 'POST',
      body: JSON.stringify({
        scan_data: scanResult,
        machine_name: scanResult.machine_name,
        scan_mode: scanResult.scan_mode,
        scan_time: scanResult.scan_time,
      }),
    }),

  getLatestInventory: () => request<{ id: number; scan_data: ScanResult }>('/inventories/latest'),

  listInventories: () => request<Array<{ id: number; machine_name: string; scan_time: string }>>('/inventories'),

  compareInventories: (otherId: number) =>
    request<CompareResult>('/inventories/compare?other_id=' + otherId),

  searchDownloadLinks: (q: string) =>
    request<DownloadLink[]>('/downloads/search?q=' + encodeURIComponent(q)),

  submitDownloadLink: (data: { software_name: string; official_url: string; aliases?: string[]; category?: string }) =>
    request<{ id: number }>('/downloads/links', { method: 'POST', body: JSON.stringify(data) }),

  getPendingLinks: () => request<(DownloadLink & { contributor_email?: string })[]>('/downloads/links/pending'),

  verifyLink: (id: number, verified: boolean) =>
    request<{ updated: boolean }>('/downloads/links/' + id + '/verify', { method: 'PUT', body: JSON.stringify({ verified }) }),
};
