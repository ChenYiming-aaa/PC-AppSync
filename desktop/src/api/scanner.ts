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

// Extract icon for a single app. Returns base64 or null.
export async function fetchAppIcon(app: { name: string; icon_path?: string; install_path?: string }): Promise<string | null> {
  const cdn = getAppIconUrl(app.name);
  if (cdn) return cdn; // CDN is instant, no PowerShell needed
  if (!app.icon_path && !app.install_path) return null;
  return invoke<string | null>('extract_one_icon', {
    displayIcon: app.icon_path || '',
    installDir: app.install_path || '',
  });
}
