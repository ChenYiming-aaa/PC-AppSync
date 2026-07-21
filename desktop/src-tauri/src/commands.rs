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

#[tauri::command]
pub fn get_app_icon(app_name: String, known_paths: Vec<String>) -> Result<Option<String>, String> {
    // Collect all candidate paths from known_paths
    let mut candidates: Vec<String> = Vec::new();
    for p in &known_paths {
        // If it's a directory, look for exe files inside
        let p_clean = p.split(',').next().unwrap_or(p).trim().to_string();
        if std::path::Path::new(&p_clean).is_dir() {
            if let Ok(entries) = std::fs::read_dir(&p_clean) {
                for entry in entries.flatten() {
                    let fp = entry.path();
                    if fp.extension().and_then(|e| e.to_str()) == Some("exe") {
                        candidates.push(fp.to_string_lossy().to_string());
                    }
                }
            }
        } else {
            candidates.push(p_clean);
        }
    }

    // Use PowerShell with Windows Shell COM (same approach as Geek Uninstaller)
    // This handles all DisplayIcon formats: exe, exe,N, dll,N, cpl,N
    let paths_json = serde_json::to_string(&candidates).unwrap_or_else(|_| "[]".to_string());
    let script = format!(
        "Add-Type -AssemblyName System.Drawing; \
         $paths = '{}' | ConvertFrom-Json; \
         $result = ''; \
         foreach ($p in $paths) {{ \
           if (-not (Test-Path $p)) {{ continue }}; \
           try {{ \
             $shell = New-Object -ComObject Shell.Application; \
             $f = $shell.Namespace([System.IO.Path]::GetDirectoryName($p)); \
             if (-not $f) {{ continue }}; \
             $fi = $f.ParseName([System.IO.Path]::GetFileName($p)); \
             if (-not $fi) {{ continue }}; \
             $icon = $fi.ExtractIcon(32); \
             if (-not $icon) {{ continue }}; \
             $bmp32 = New-Object System.Drawing.Bitmap 32,32; \
             $g = [System.Drawing.Graphics]::FromImage($bmp32); \
             $g.DrawIcon($icon, 0, 0); \
             $g.Dispose(); \
             $ms = New-Object System.IO.MemoryStream; \
             $bmp32.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); \
             $bmp32.Dispose(); \
             $result = [Convert]::ToBase64String($ms.ToArray()); \
             break; \
           }} catch {{ continue }}; \
         }}; \
         echo $result",
        paths_json.replace('\'', "''")
    );

    let output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output()
        .map_err(|e| format!("Failed to run powershell: {}", e))?;

    if output.status.success() {
        let b64 = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !b64.is_empty() {
            return Ok(Some("data:image/png;base64,".to_string() + &b64));
        }
    }
    Ok(None)
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
