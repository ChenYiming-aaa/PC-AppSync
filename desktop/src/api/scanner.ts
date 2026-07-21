import type { ScanResult } from '../types';
import { getAppIconUrl } from '../utils/categorize';

export async function scanStandard(): Promise<ScanResult> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke('scan_standard');
}

export async function scanDeep(): Promise<ScanResult> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke('scan_deep');
}

export async function openUrl(url: string): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke('open_url', { url });
}

export async function exportScan(data: string, filePath: string): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core');
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

export function fetchAppIcon(_app: { name: string }): string | null {
  return getAppIconUrl(_app.name);
}
