pub mod registry;
pub mod package_managers;
pub mod runtimes;
pub mod deep_scan;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct OsInfo {
    pub family: String,
    pub edition: String,
    pub version: String,
    pub build: String,
    pub architecture: String,
}

#[derive(Debug, Serialize)]
pub struct Application {
    pub name: String,
    pub version: String,
    pub publisher: Option<String>,
    pub source: String,
    pub install_path: Option<String>,
    pub install_date: Option<String>,
    pub icon_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Package {
    pub name: String,
    pub version: String,
}

#[derive(Debug, Serialize)]
pub struct Runtime {
    pub name: String,
    pub version: String,
    pub install_path: Option<String>,
    pub packages: Vec<Package>,
}

#[derive(Debug, Serialize)]
pub struct DeepScan {
    pub vscode_extensions: Vec<Package>,
    pub path_entries: Vec<String>,
    pub wsl_distributions: Vec<Package>,
    pub windows_features: Vec<Package>,
}

#[derive(Debug, Serialize)]
pub struct ScanResult {
    pub version: String,
    pub machine_name: String,
    pub scan_time: String,
    pub scan_mode: String,
    pub os: OsInfo,
    pub applications: Vec<Application>,
    pub runtimes: Vec<Runtime>,
    pub deep_scan: Option<DeepScan>,
}
