export interface OsInfo {
  family: string;
  edition: string;
  version: string;
  build: string;
  architecture: string;
}

export interface Application {
  name: string;
  version: string;
  publisher?: string;
  source: string;
  install_path?: string;
  install_date?: string;
  icon_path?: string;
}

export interface Package {
  name: string;
  version: string;
}

export interface Runtime {
  name: string;
  version: string;
  install_path?: string;
  packages: Package[];
}

export interface CompareResult {
  current_machine: string | null;
  other_machine: string;
  other_inventory_id: number;
  missing_apps: Application[];
  missing_runtimes: Runtime[];
  common_count: number;
  missing_count: number;
}

export interface DeepScan {
  vscode_extensions: Package[];
  path_entries: string[];
  wsl_distributions: Package[];
  windows_features: Package[];
}

export interface ScanResult {
  version: string;
  machine_name: string;
  scan_time: string;
  scan_mode: string;
  os: OsInfo;
  applications: Application[];
  runtimes: Runtime[];
  deep_scan?: DeepScan;
}

export interface DownloadLink {
  id: number;
  software_name: string;
  aliases: string[];
  official_url: string;
  direct_download_url?: string;
  category?: string;
  verified: boolean;
}

export interface User {
  id: number;
  email: string;
  nickname: string;
  is_admin: boolean;
}
