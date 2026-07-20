import { invoke } from '@tauri-apps/api/core';
import type { ScanResult } from '../types';

export async function scanStandard(): Promise<ScanResult> {
  return invoke('scan_standard');
}

export async function scanDeep(): Promise<ScanResult> {
  return invoke('scan_deep');
}
