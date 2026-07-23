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

pub fn get_installed_apps(progress: Option<&super::ProgressFn>) -> Vec<Application> {
    let mut apps = Vec::new();
    let paths = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
    ];

    if let Some(f) = progress { f("Scanning registry", 15); }
    for path in &paths {
        if let Ok(hklm) = RegKey::predef(HKEY_LOCAL_MACHINE).open_subkey_with_flags(*path, KEY_READ) {
            let keys: Vec<_> = hklm.enum_keys().filter_map(|k| k.ok()).collect();
            let total = keys.len();
            for (i, name) in keys.into_iter().enumerate() {
                if let Ok(key) = hklm.open_subkey_with_flags(&name, KEY_READ) {
                    let display_name: Option<String> = key.get_value("DisplayName").ok();
                    if let Some(name) = display_name {
                        if name.trim().is_empty() { continue; }
                        apps.push(Application {
                            name: name.clone(),
                            version: key.get_value("DisplayVersion").ok().unwrap_or_default(),
                            publisher: key.get_value("Publisher").ok(),
                            source: "registry".to_string(),
                            install_path: key.get_value("InstallLocation").ok(),
                            install_date: key.get_value("InstallDate").ok(),
                            icon_path: key.get_value("DisplayIcon").ok(),
                        });
                    }
                }
                if i % 20 == 0 {
                    if let Some(f) = progress {
                        let pct = 15 + ((i as f64 / total as f64) * 20.0) as u8;
                        f("Scanning registry", pct.min(35));
                    }
                }
            }
        }
    }

    if let Some(f) = progress { f("Package managers", 38); }
    use std::thread;
    let h1 = thread::spawn(super::package_managers::get_winget_apps);
    if let Some(f) = progress { f("Package managers (winget)", 42); }
    let h2 = thread::spawn(super::package_managers::get_choco_apps);
    if let Some(f) = progress { f("Package managers (choco)", 46); }
    let h3 = thread::spawn(super::package_managers::get_scoop_apps);

    let mut all_apps = apps;
    if let Some(f) = progress { f("Merging results", 50); }
    all_apps.extend(h1.join().unwrap_or_else(|e| { eprintln!("winget thread panic: {:?}", e); Vec::new() }));
    if let Some(f) = progress { f("Merging results", 55); }
    all_apps.extend(h2.join().unwrap_or_else(|e| { eprintln!("choco thread panic: {:?}", e); Vec::new() }));
    if let Some(f) = progress { f("Merging results", 58); }
    all_apps.extend(h3.join().unwrap_or_else(|e| { eprintln!("scoop thread panic: {:?}", e); Vec::new() }));
    dedup_apps(all_apps)
}

fn dedup_apps(apps: Vec<Application>) -> Vec<Application> {
    let mut seen = std::collections::HashSet::new();
    apps.into_iter().filter(|a| seen.insert(a.name.clone())).collect()
}
