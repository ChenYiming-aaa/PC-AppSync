use super::{Application, OsInfo};
use winreg::enums::*;
use winreg::RegKey;

pub fn get_os_info() -> OsInfo {
    OsInfo {
        family: "Windows".to_string(),
        edition: get_registry_string(r"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "ProductName")
            .unwrap_or_else(|| "Windows".to_string()),
        version: get_registry_string(r"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "DisplayVersion")
            .unwrap_or_else(|| "Unknown".to_string()),
        build: get_registry_string(r"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuild")
            .unwrap_or_else(|| "Unknown".to_string()),
        architecture: if std::env::consts::ARCH == "x86_64" { "x86_64".to_string() } else { "x86".to_string() },
    }
}

fn get_registry_string(path: &str, key: &str) -> Option<String> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    hklm.open_subkey_with_flags(path, KEY_READ).ok()
        .and_then(|k| k.get_value(key).ok())
}

pub fn get_installed_apps() -> Vec<Application> {
    let mut apps = Vec::new();
    let paths = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
    ];
    for path in &paths {
        if let Ok(hklm) = RegKey::predef(HKEY_LOCAL_MACHINE).open_subkey_with_flags(*path, KEY_READ) {
            for name in hklm.enum_keys().filter_map(|k| k.ok()) {
                if let Ok(key) = hklm.open_subkey_with_flags(&name, KEY_READ) {
                    let display_name: Option<String> = key.get_value("DisplayName").ok();
                    if let Some(name) = display_name {
                        if name.trim().is_empty() { continue; }
                        let icon_path: Option<String> = key.get_value("DisplayIcon").ok();
                        let install_path: Option<String> = key.get_value("InstallLocation").ok();
                        let guessed_exe = install_path.as_ref().and_then(|p| {
                            let dir = std::path::Path::new(p);
                            std::fs::read_dir(dir).ok().and_then(|mut entries| {
                                entries.find_map(|e| {
                                    let p = e.ok()?.path();
                                    let ext = p.extension()?.to_str()?;
                                    if ext.eq_ignore_ascii_case("exe") { Some(p.to_string_lossy().to_string()) } else { None }
                                })
                            })
                        });
                        apps.push(Application {
                            name: name.clone(),
                            version: key.get_value("DisplayVersion").ok().unwrap_or_default(),
                            publisher: key.get_value("Publisher").ok(),
                            source: "registry".to_string(),
                            install_path: install_path.clone(),
                            install_date: key.get_value("InstallDate").ok(),
                            icon_path: icon_path.or(guessed_exe),
                        });
                    }
                }
            }
        }
    }
    // Merge package manager results
    let mut all_apps = apps;
    let more = super::package_managers::get_winget_apps();
    let more2 = super::package_managers::get_choco_apps();
    let more3 = super::package_managers::get_scoop_apps();
    all_apps.extend(more);
    all_apps.extend(more2);
    all_apps.extend(more3);
    dedup_apps(all_apps)
}

fn dedup_apps(apps: Vec<Application>) -> Vec<Application> {
    let mut seen = std::collections::HashSet::new();
    apps.into_iter().filter(|a| seen.insert(a.name.clone())).collect()
}
