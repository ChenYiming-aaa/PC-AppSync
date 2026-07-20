use super::{Application, OsInfo};

pub fn get_os_info() -> OsInfo {
    OsInfo {
        family: "Windows".to_string(),
        edition: "Windows 11".to_string(),
        version: "Unknown".to_string(),
        build: "Unknown".to_string(),
        architecture: std::env::consts::ARCH.to_string(),
    }
}

pub fn get_installed_apps() -> Vec<Application> {
    Vec::new()
}
