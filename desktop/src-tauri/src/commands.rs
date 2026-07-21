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

/// Batch extract icons for multiple apps in ONE PowerShell call, returns JSON map
#[tauri::command]
pub fn batch_get_icons(entries: Vec<IconEntry>) -> Result<String, String> {
    // Build PowerShell script that processes all icons at once
    let json = serde_json::to_string(&entries).unwrap_or_default();
    let script = format!(r#"
Add-Type -AssemblyName System.Drawing
$list = '{0}' | ConvertFrom-Json
$result = @{{}}
$ErrorActionPreference = 'SilentlyContinue'
foreach ($e in $list) {{
    $name = $e.name
    $candidates = @()
    if ($e.display_icon) {{ $candidates += ($e.display_icon -replace ',.*$','') }}
    if ($e.install_dir -and (Test-Path $e.install_dir)) {{
        Get-ChildItem $e.install_dir -Filter *.exe -ErrorAction SilentlyContinue | ForEach-Object {{ $candidates += $_.FullName }}
    }}
    $found = $false
    foreach ($p in $candidates) {{
        if (-not (Test-Path $p)) {{ continue }}
        try {{
            $ico = [System.Drawing.Icon]::ExtractAssociatedIcon($p)
            if (-not $ico) {{ continue }}
            $bmp = New-Object System.Drawing.Bitmap 32,32
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.DrawIcon($ico,0,0); $g.Dispose()
            $ms = New-Object System.IO.MemoryStream
            $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
            $result[$name] = [Convert]::ToBase64String($ms.ToArray())
            $bmp.Dispose()
            $found = $true
            break
        }} catch {{ }}
    }}
    if (-not $found) {{ $result[$name] = '' }}
}}
ConvertTo-Json $result -Compress -Depth 10
"#, json.replace('\'', "''"));

    let out = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output().map_err(|e| e.to_string())?;

    Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
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
