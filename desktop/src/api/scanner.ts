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

// ---- Icon extraction: one at a time, no concurrent PowerShell ----
let extracting = false;
const queue: Array<{ a: { name: string; icon_path?: string; install_path?: string }; res: (v: string | null) => void }> = [];

export async function fetchAppIcon(app: { name: string; icon_path?: string; install_path?: string }): Promise<string | null> {
  const cdn = getAppIconUrl(app.name);
  if (cdn) return cdn;
  if (!app.icon_path && !app.install_path) return null;

  return new Promise(resolve => {
    queue.push({ a: app, res: resolve });
    if (!extracting) processQueue();
  });
}

async function processQueue() {
  if (queue.length === 0) { extracting = false; return; }
  extracting = true;
  const item = queue.shift()!;

  // Stagger: 150ms between each to avoid PowerShell startup spike
  await new Promise(r => setTimeout(r, 150));

  try {
    const b64 = await invoke<string | null>('extract_one_icon', {
      displayIcon: item.a.icon_path || '',
      installDir: item.a.install_path || '',
    });
    item.res(b64);
  } catch {
    item.res(null);
  }
  processQueue();
}
