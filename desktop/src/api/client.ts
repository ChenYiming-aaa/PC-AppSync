import type { DownloadLink, ScanResult, User, CompareResult } from '../types';

export const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://pc-appsync-production.up.railway.app/api/v1';

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

  let res;
  try {
    res = await fetch(API_BASE + path, { ...options, headers });
  } catch (err: any) {
    throw new Error('无法连接到服务器，请检查网络或防火墙设置 (' + (err.message || 'unknown') + ')');
  }
  
  // Auto-refresh token on 401 (all concurrent callers share the same refresh)
  if (res.status === 401) {
    if (!refreshPromise) refreshPromise = tryRefresh();
    const refreshed = await refreshPromise;
    refreshPromise = null;
    if (refreshed) {
      headers['Authorization'] = 'Bearer ' + getToken();
      try {
        res = await fetch(API_BASE + path, { ...options, headers });
      } catch (err: any) {
        throw new Error('无法连接到服务器，请检查网络或防火墙设置 (' + (err.message || 'unknown') + ')');
      }
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

  getInventory: (id: number) => request<{ id: number; machine_name: string; scan_mode: string; scan_time: string; scan_data: ScanResult }>('/inventories/' + id),

  getLatestInventory: () => request<{ id: number; scan_data: ScanResult }>('/inventories/latest'),

  deleteInventory: (id: number) =>
    request<{ deleted: boolean }>('/inventories/' + id, { method: 'DELETE' }),

  listInventories: () => request<Array<{ id: number; machine_name: string; scan_mode: string; scan_time: string; created_at: string }>>('/inventories'),

  compareInventories: (otherId: number) =>
    request<CompareResult>('/inventories/compare?other_id=' + otherId),

  searchDownloadLinks: (q: string) =>
    request<DownloadLink[]>('/downloads/search?q=' + encodeURIComponent(q)),

  submitDownloadLink: (data: { software_name: string; official_url: string; aliases?: string[]; category?: string }) =>
    request<{ id: number }>('/downloads/links', { method: 'POST', body: JSON.stringify(data) }),

  batchMatchLinks: (names: string[]) =>
    request<Record<string, DownloadLink>>('/downloads/match', { method: 'POST', body: JSON.stringify({ names }) }),

  getPendingLinks: () => request<(DownloadLink & { contributor_email?: string })[]>('/downloads/links/pending'),

  verifyLink: (id: number, verified: boolean) =>
    request<{ updated: boolean }>('/downloads/links/' + id + '/verify', { method: 'PUT', body: JSON.stringify({ verified }) }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ updated: boolean; token?: string; user?: User }>('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }).then(r => { if (r.token) setToken(r.token); return r; }),

  listDownloadLinks: (page: number, limit: number, q?: string) =>
    request<{ links: DownloadLink[]; total: number; page: number; limit: number; pages: number }>(
      '/downloads/links?page=' + page + '&limit=' + limit + (q ? '&q=' + encodeURIComponent(q) : '')
    ),
};
