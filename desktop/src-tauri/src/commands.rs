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
        version: "1.0".to_string(), machine_name, scan_time,
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

/// Find real exe path by reading Start Menu shortcut targets
fn find_exe_via_shortcuts(app_name: &str) -> Vec<String> {
    let mut results = Vec::new();
    let lower = app_name.to_lowercase();
    let keywords: Vec<&str> = lower.split(|c: char| !c.is_alphanumeric() && c != '\u{4e00}' && c != '\u{9fff}')
        .filter(|s| s.len() > 1).collect();

    let start_dirs = [
        std::env::var("PROGRAMDATA").unwrap_or_default() + "\\Microsoft\\Windows\\Start Menu\\Programs",
        std::env::var("APPDATA").unwrap_or_default() + "\\Microsoft\\Windows\\Start Menu\\Programs",
        "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs".to_string(),
    ];

    for dir in start_dirs.iter().filter(|d| !d.is_empty() && std::path::Path::new(d).exists()) {
        if let Ok(entries) = walk_dir(dir, 3) {
            for path in entries {
                if path.extension().and_then(|e| e.to_str()) != Some("lnk") { continue; }
                let fname = path.file_stem().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
                if !keywords.iter().any(|k| fname.contains(k)) { continue; }
                // Read shortcut target via PowerShell
                let script = format!(
                    "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('{}'); Write-Host -NoNewline $s.TargetPath",
                    path.to_string_lossy().replace('\'', "''")
                );
                if let Ok(out) = std::process::Command::new("powershell")
                    .args(["-NoProfile", "-NonInteractive", "-Command", &script]).output()
                {
                    let target = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if !target.is_empty() && std::path::Path::new(&target).exists() {
                        results.push(target);
                    }
                }
            }
        }
    }
    results
}

fn walk_dir(dir: &str, max_depth: u32) -> Result<Vec<std::path::PathBuf>, std::io::Error> {
    let mut files = Vec::new();
    let mut stack = vec![(std::path::PathBuf::from(dir), 0u32)];
    while let Some((path, depth)) = stack.pop() {
        if depth > max_depth { continue; }
        for entry in std::fs::read_dir(&path)? {
            let entry = entry?;
            let p = entry.path();
            if p.is_dir() { stack.push((p, depth + 1)); }
            else { files.push(p); }
        }
    }
    Ok(files)
}

fn extract_via_powershell(paths: &[String]) -> Option<String> {
    let json = serde_json::to_string(paths).unwrap_or_default();
    let script = format!(r#"
Add-Type -AssemblyName System.Drawing
$paths = '{0}' | ConvertFrom-Json
$result = ''
foreach ($p in $paths) {{
    if (-not (Test-Path $p)) {{ continue }}
    try {{
        $ico = [System.Drawing.Icon]::ExtractAssociatedIcon($p)
        if (-not $ico) {{ continue }}
        $bmp = New-Object System.Drawing.Bitmap 32,32
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.DrawIcon($ico,0,0); $g.Dispose()
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $result = [Convert]::ToBase64String($ms.ToArray())
        $bmp.Dispose()
        if ($result) {{ break }}
    }} catch {{ }}
}}
Write-Host -NoNewline $result
"#, json.replace('\'', "''"));

    if let Ok(out) = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script]).output()
    {
        if out.status.success() {
            let b64 = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !b64.is_empty() { return Some(format!("data:image/png;base64,{}", b64)); }
        }
    }
    None
}

#[tauri::command]
pub fn get_app_icon(app_name: String, display_icon: String, install_dir: Option<String>) -> Result<Option<String>, String> {
    let mut paths = Vec::new();
    // 1. Try DisplayIcon path
    if !display_icon.is_empty() {
        let clean = display_icon.split(',').next().unwrap_or(&display_icon).trim().to_string();
        paths.push(clean);
    }
    // 2. Try InstallLocation exes
    if let Some(dir) = &install_dir {
        if std::path::Path::new(dir).exists() {
            if let Ok(entries) = std::fs::read_dir(dir) {
                for e in entries.flatten() {
                    let fp = e.path();
                    if fp.extension().and_then(|x| x.to_str()) == Some("exe") {
                        paths.push(fp.to_string_lossy().to_string());
                    }
                }
            }
        }
    }
    // 3. Try Start Menu shortcuts (read target exe)
    let shortcut_exes = find_exe_via_shortcuts(&app_name);
    paths.extend(shortcut_exes);

    Ok(extract_via_powershell(&paths))
}

#[tauri::command]
pub fn export_scan(data: String, file_path: String) -> Result<(), String> {
    std::fs::write(&file_path, &data).map_err(|e| format!("Failed: {}", e))
}

#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    std::process::Command::new("cmd").args(["/c", "start", "", &url]).spawn()
        .map_err(|e| format!("Failed: {}", e))?;
    Ok(())
}
