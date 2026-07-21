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

// ---- Icon loader with throttling + progress ----

const iconCache = new Map<string, string | null>();
const queue: Array<{ app: { icon_path?: string; name: string; install_path?: string }; resolve: (v: string | null) => void }> = [];
let busy = false;
let totalQueued = 0;
let completedCount = 0;
const progressListeners: Array<(p: { done: number; total: number }) => void> = [];

export function onIconProgress(cb: (p: { done: number; total: number }) => void) {
  progressListeners.push(cb);
  return () => { const i = progressListeners.indexOf(cb); if (i >= 0) progressListeners.splice(i, 1); };
}

function notifyProgress() {
  const p = { done: completedCount, total: totalQueued };
  progressListeners.forEach(cb => cb(p));
}

export function queueIconLoad(app: { icon_path?: string; name: string; install_path?: string }): Promise<string | null> {
  if (!app.icon_path && !app.install_path) {
    iconCache.set(app.name, null);
    return Promise.resolve(null);
  }
  const cached = iconCache.get(app.name);
  if (cached !== undefined) return Promise.resolve(cached);

  totalQueued++;
  notifyProgress();

  return new Promise(resolve => {
    queue.push({ app, resolve });
    if (!busy) processNext();
  });
}

let activeWorkers = 0;
const MAX_WORKERS = 3;

async function processNext() {
  while (queue.length > 0 && activeWorkers < MAX_WORKERS) {
    activeWorkers++;
    const item = queue.shift()!;
    processItem(item);
  }
  if (queue.length === 0 && activeWorkers === 0) busy = false;
}

async function processItem(item: typeof queue[0]) {
  await new Promise(r => setTimeout(r, 30));

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
  completedCount++;
  activeWorkers--;
  notifyProgress();
  processNext();
}
