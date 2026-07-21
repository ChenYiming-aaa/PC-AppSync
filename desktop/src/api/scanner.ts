import { invoke } from '@tauri-apps/api/core';
import type { ScanResult } from '../types';
import { getAppIconUrl } from '../utils/categorize';

export async function scanStandard(): Promise<ScanResult> {
  return invoke('scan_standard');
}

export async function scanDeep(): Promise<ScanResult> {
  return invoke('scan_deep');
}

export async function openUrl(url: string): Promise<void> {
  return invoke('open_url', { url });
}

export async function exportScan(data: string, filePath: string): Promise<void> {
  return invoke('export_scan', { data, filePath });
}

export function getScanExportData(result: ScanResult): { json: string; csv: string } {
  const json = JSON.stringify(result, null, 2);
  const header = 'Name,Version,Source,Publisher,InstallPath';
  const rows = result.applications.map(a =>
    `"${a.name}","${a.version}","${a.source || ''}","${a.publisher || ''}","${a.install_path || ''}"`
  ).join('\n');
  const csv = header + '\n' + rows;
  return { json, csv };
}

// ---- Batch icon extraction: ONE PowerShell call for ALL apps ----

const iconCache = new Map<string, string | null>();
const progressListeners: Array<(p: { done: number; total: number }) => void> = [];

export function onIconProgress(cb: (p: { done: number; total: number }) => void) {
  progressListeners.push(cb);
  return () => { const i = progressListeners.indexOf(cb); if (i >= 0) progressListeners.splice(i, 1); };
}

export async function batchLoadIcons(apps: { name: string; icon_path?: string; install_path?: string }[]): Promise<void> {
  // Collect apps that need extraction (no CDN, no cache)
  const toExtract = apps.filter(a => {
    if (iconCache.has(a.name)) return false;
    if (getAppIconUrl(a.name)) { iconCache.set(a.name, ''); return false; } // CDN available
    if (!a.icon_path && !a.install_path) { iconCache.set(a.name, ''); return false; }
    return true;
  });
  if (toExtract.length === 0) return;

  const total = toExtract.length;
  progressListeners.forEach(cb => cb({ done: 0, total }));

  try {
    const entries = toExtract.map(a => ({
      name: a.name,
      display_icon: a.icon_path || '',
      install_dir: a.install_path || '',
    }));
    const raw = await invoke<string>('batch_get_icons', { entries });
    // Clean BOM and any non-JSON prefix
    let json = raw.trim();
    if (json.charCodeAt(0) === 0xFEFF) json = json.slice(1); // UTF-8 BOM
    const braceIdx = json.indexOf('{');
    if (braceIdx > 0) json = json.slice(braceIdx);
    const results = JSON.parse(json);
    for (const name of Object.keys(results)) {
      iconCache.set(name, results[name] || null);
    }
  } catch (err) {
    console.error('batch icon extraction failed:', err);
    toExtract.forEach(a => iconCache.set(a.name, null));
  }
  progressListeners.forEach(cb => cb({ done: total, total }));
}

export function getCachedIcon(name: string): string | null | undefined {
  return iconCache.get(name);
}
