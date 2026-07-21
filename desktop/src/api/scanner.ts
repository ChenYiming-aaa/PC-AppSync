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

// ---- Batch icon extraction ----

export async function batchLoadIcons(apps: { name: string; icon_path?: string; install_path?: string }[]): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};

  // Apps with CDN icons
  for (const a of apps) {
    const cdn = getAppIconUrl(a.name);
    if (cdn) { result[a.name] = cdn; }
  }

  // Apps needing extraction
  const toExtract = apps.filter(a => {
    if (result[a.name] !== undefined) return false;
    if (!a.icon_path && !a.install_path) { result[a.name] = null; return false; }
    return true;
  });

  if (toExtract.length > 0) {
    try {
      const entries = toExtract.map(a => ({
        name: a.name,
        display_icon: a.icon_path || '',
        install_dir: a.install_path || '',
      }));
      const raw = await invoke<string>('batch_get_icons', { entries });
      const parsed = JSON.parse(raw);
      for (const name of Object.keys(parsed)) {
        result[name] = parsed[name] || null;
      }
      for (const a of toExtract) {
        if (result[a.name] === undefined) result[a.name] = null;
      }
    } catch (err) {
      console.error('icon extraction error:', err);
      toExtract.forEach(a => { result[a.name] = null; });
    }
  }

  return result;
}
