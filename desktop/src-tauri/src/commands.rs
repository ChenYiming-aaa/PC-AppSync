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
use std::collections::HashMap;

/// Extract icon for ONE app. Simple PowerShell per call, but fast enough (<1s each).
#[tauri::command]
pub fn extract_one_icon(display_icon: String, install_dir: String) -> Result<Option<String>, String> {
    let script = format!(
        r#"Add-Type -AssemblyName System.Drawing
$candidates = @()
$di = '{0}'
if ($di) {{ $candidates += ($di -replace ',.*$','') }}
$idir = '{1}'
if ($idir -and (Test-Path $idir)) {{ Get-ChildItem $idir -Filter *.exe -ErrorAction SilentlyContinue | ForEach-Object {{ $candidates += $_.FullName }} }}
$result = ''
foreach ($p in $candidates) {{
    if (-not (Test-Path $p)) {{ continue }}
    try {{
        $ico = [System.Drawing.Icon]::ExtractAssociatedIcon($p)
        if (-not $ico) {{ continue }}
        $b = New-Object System.Drawing.Bitmap 32,32
        $g = [System.Drawing.Graphics]::FromImage($b)
        $g.DrawIcon($ico,0,0); $g.Dispose()
        $m = New-Object System.IO.MemoryStream
        $b.Save($m, [System.Drawing.Imaging.ImageFormat]::Png)
        $result = [Convert]::ToBase64String($m.ToArray())
        $b.Dispose()
        break
    }} catch {{ }}
}}
Write-Host -NoNewline $result"#,
        display_icon.replace('\'', "''"), install_dir.replace('\'', "''")
    );
    let out = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output().map_err(|e| e.to_string())?;
    let b64 = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if b64.is_empty() { Ok(None) } else { Ok(Some(format!("data:image/png;base64,{}", b64))) }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct IconEntry {
    pub name: String,
    pub display_icon: String,
    pub install_dir: String,
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
