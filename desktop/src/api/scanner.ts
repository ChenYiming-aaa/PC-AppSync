import { invoke } from '@tauri-apps/api/core';
import type { ScanResult } from '../types';

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

// ---- Icon loader with throttling ----

const iconCache = new Map<string, string | null>();
const queue: Array<{ app: { icon_path?: string; name: string; install_path?: string }; resolve: (v: string | null) => void }> = [];
let busy = false;

export function queueIconLoad(app: { icon_path?: string; name: string; install_path?: string }): Promise<string | null> {
  // Skip apps with NO paths at all
  if (!app.icon_path && !app.install_path) {
    iconCache.set(app.name, null);
    return Promise.resolve(null);
  }
  const cached = iconCache.get(app.name);
  if (cached !== undefined) return Promise.resolve(cached);
  return new Promise(resolve => {
    queue.push({ app, resolve });
    if (!busy) processNext();
  });
}

async function processNext() {
  if (queue.length === 0) { busy = false; return; }
  busy = true;
  const item = queue.shift()!;

  // 50ms delay between each to avoid overwhelming
  await new Promise(r => setTimeout(r, 50));

  try {
    const b64 = await invoke<string | null>('get_app_icon', {
      appName: item.app.name,
      displayIcon: item.app.icon_path || '',
      installDir: item.app.install_path || null,
    });
    iconCache.set(item.app.name, b64);
    item.resolve(b64);
  } catch {
    iconCache.set(item.app.name, null);
    item.resolve(null);
  }
  processNext();
}
