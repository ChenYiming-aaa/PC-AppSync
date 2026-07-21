use crate::scanner;
use std::time::{SystemTime, UNIX_EPOCH};

#[tauri::command]
pub fn scan_standard() -> Result<scanner::ScanResult, String> {
    let machine_name = std::env::var("COMPUTERNAME").unwrap_or_else(|_| "UNKNOWN".to_string());
    let scan_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| String::new());

    Ok(scanner::ScanResult {
        version: "1.0".to_string(),
        machine_name,
        scan_time,
        scan_mode: "standard".to_string(),
        os: scanner::registry::get_os_info(),
        applications: scanner::registry::get_installed_apps(),
        runtimes: scanner::runtimes::detect_runtimes(),
        deep_scan: None,
    })
}

#[tauri::command]
pub fn scan_deep() -> Result<scanner::ScanResult, String> {
    let mut result = scan_standard()?;
    result.scan_mode = "deep".to_string();
    result.deep_scan = Some(scanner::deep_scan::run_deep_scan());
    Ok(result)
}

/// Find the best exe path for an app by searching Start Menu and common locations
fn find_app_exe(app_name: &str, known_paths: &[String]) -> Option<String> {
    // 1. Try known paths first
    for p in known_paths {
        let clean = p.split(',').next().unwrap_or(p).trim();
        if std::path::Path::new(clean).exists() {
            return Some(clean.to_string());
        }
    }
    let lower = app_name.to_lowercase();
    // 2. Search Start Menu shortcuts
    let start_menu_dirs = [
        std::env::var("PROGRAMDATA").ok().map(|d| d + "\\Microsoft\\Windows\\Start Menu\\Programs"),
        std::env::var("APPDATA").ok().map(|d| d + "\\Microsoft\\Windows\\Start Menu\\Programs"),
        Some("C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs".to_string()),
    ];
    for dir in start_menu_dirs.iter().flatten() {
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("lnk") {
                    let fname = path.file_stem().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
                    if fname.contains(&lower) || lower.contains(&fname) {
                        // Read shortcut target via PowerShell
                        let script = format!(
                            "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('{}'); echo $s.TargetPath",
                            path.to_string_lossy().replace('\'', "''")
                        );
                        if let Ok(out) = std::process::Command::new("powershell")
                            .args(["-NoProfile", "-NonInteractive", "-Command", &script]).output()
                        {
                            let target = String::from_utf8_lossy(&out.stdout).trim().to_string();
                            if !target.is_empty() && std::path::Path::new(&target).exists() {
                                return Some(target);
                            }
                        }
                    }
                }
            }
        }
    }
    // 3. Search all drives for matching install dirs
    let search_terms = lower.split(|c: char| !c.is_alphanumeric()).filter(|s| s.len() > 2).collect::<Vec<_>>();
    let mut common_roots = vec!["C:\\Program Files".to_string(), "C:\\Program Files (x86)".to_string()];
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        if !local.is_empty() { common_roots.push(local); }
    }
    // Add all available drives (D:, E:, etc.)
    for drive_letter in 'D'..='Z' {
        let drive = format!("{}:\\", drive_letter);
        if std::path::Path::new(&drive).exists() {
            common_roots.push(format!("{}\\Program Files", drive));
            common_roots.push(format!("{}\\Program Files (x86)", drive));
        }
    }
    for root in &common_roots {
        if let Ok(entries) = std::fs::read_dir(root) {
            for entry in entries.flatten() {
                let dir_name = entry.file_name().to_string_lossy().to_lowercase();
                if search_terms.iter().any(|t| dir_name.contains(t)) {
                    // Found matching directory - look for exe
                    if let Ok(files) = std::fs::read_dir(entry.path()) {
                        for file in files.flatten() {
                            let fp = file.path();
                            if fp.extension().and_then(|e| e.to_str()) == Some("exe") {
                                return Some(fp.to_string_lossy().to_string());
                            }
                        }
                    }
                }
            }
        }
    }
    None
}

fn extract_icon_via_powershell(exe: &str) -> Option<String> {
    let script = format!(
        "Add-Type -AssemblyName System.Drawing; \
         try {{ \
           $i = [System.Drawing.Icon]::ExtractAssociatedIcon('{}'); \
           $bmp32 = New-Object System.Drawing.Bitmap 32,32; \
           $g = [System.Drawing.Graphics]::FromImage($bmp32); \
           $g.DrawIcon($i, 0, 0); \
           $g.Dispose(); \
           $ms = New-Object System.IO.MemoryStream; \
           $bmp32.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); \
           $bmp32.Dispose(); \
           [Convert]::ToBase64String($ms.ToArray()) \
         }} catch {{ '' }}",
        exe.replace('\'', "''")
    );
    if let Ok(output) = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script]).output()
    {
        if output.status.success() {
            let b64 = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !b64.is_empty() {
                return Some("data:image/png;base64,".to_string() + &b64);
            }
        }
    }
    None
}

#[tauri::command]
pub fn get_app_icon(app_name: String, known_paths: Vec<String>) -> Result<Option<String>, String> {
    let exe = find_app_exe(&app_name, &known_paths);
    match exe {
        Some(path) => Ok(extract_icon_via_powershell(&path)),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn export_scan(data: String, file_path: String) -> Result<(), String> {
    std::fs::write(&file_path, &data)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    std::process::Command::new("cmd")
        .args(["/c", "start", "", &url])
        .spawn()
        .map_err(|e| format!("Failed to open URL: {}", e))?;
    Ok(())
}
