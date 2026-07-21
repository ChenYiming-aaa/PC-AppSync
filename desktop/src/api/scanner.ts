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

// ---- Batch icon loader with concurrency limit ----

const iconCache = new Map<string, string | null>();
const iconQueue: Array<{
  app: { icon_path?: string; name: string; install_path?: string };
  resolve: (v: string | null) => void;
}> = [];
let activeWorkers = 0;
const MAX_WORKERS = 2;

async function processQueue() {
  while (iconQueue.length > 0 && activeWorkers < MAX_WORKERS) {
    const item = iconQueue.shift()!;
    activeWorkers++;
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
    } finally {
      activeWorkers--;
      processQueue();
    }
  }
}

export function queueIconLoad(app: { icon_path?: string; name: string; install_path?: string }): Promise<string | null> {
  const cached = iconCache.get(app.name);
  if (cached !== undefined) return Promise.resolve(cached);
  return new Promise(resolve => {
    iconQueue.push({ app, resolve });
    processQueue();
  });
}
