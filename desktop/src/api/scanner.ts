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

let iconCache = new Map<string, string>();

export async function getAppIcon(app: { icon_path?: string; name: string }): Promise<string | null> {
  const name = app.name;
  if (iconCache.has(name)) return iconCache.get(name) || null;
  if (!app.icon_path) { iconCache.set(name, ''); return null; }
  try {
    const b64 = await invoke<string | null>('get_app_icon', { exePath: app.icon_path });
    iconCache.set(name, b64 || '');
    return b64;
  } catch { iconCache.set(name, ''); return null; }
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
