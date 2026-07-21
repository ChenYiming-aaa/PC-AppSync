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

export function generateInstallScript(result: ScanResult): string {
  const lines: string[] = [];
  lines.push('# AppSync - Package Restore Script');
  lines.push('# Generated: ' + new Date().toLocaleString());
  lines.push('');

  for (const rt of result.runtimes) {
    if (rt.packages.length === 0) continue;

    if (rt.name.toLowerCase().includes('python')) {
      lines.push('# Python packages (' + rt.packages.length + ')');
      const names = rt.packages.map(p => p.name);
      // Split into batches to avoid command line length limits
      for (let i = 0; i < names.length; i += 30) {
        const batch = names.slice(i, i + 30).join(' ');
        lines.push('pip install ' + batch);
      }
      lines.push('');
    }

    if (rt.name.toLowerCase().includes('node')) {
      lines.push('# Node.js global packages (' + rt.packages.length + ')');
      const names = rt.packages.map(p => p.name);
      for (let i = 0; i < names.length; i += 30) {
        const batch = names.slice(i, i + 30).join(' ');
        lines.push('npm install -g ' + batch);
      }
      lines.push('');
    }
  }

  if (lines.length <= 2) {
    return '# No package manager data available.\n# Run a scan first to detect pip/npm packages.';
  }
  return lines.join('\n');
}
