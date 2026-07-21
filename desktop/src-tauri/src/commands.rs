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

/// Extract icon from a DisplayIcon registry value using Windows Shell API
/// Handles: exe, exe,0, .ico, dll,-1, etc.
#[tauri::command]
pub fn get_app_icon(display_icon: String, install_dir: Option<String>) -> Result<Option<String>, String> {
    let script = format!(r#"
Add-Type -AssemblyName System.Drawing
$result = ''
$paths = @()

# Primary: DisplayIcon value
$di = '{0}'
if ($di) {{ $paths += $di }}

# Secondary: try install_dir + guessed exe
$installDir = '{1}'
if ($installDir -and (Test-Path $installDir)) {{
    Get-ChildItem $installDir -Filter *.exe -ErrorAction SilentlyContinue | ForEach-Object {{ $paths += $_.FullName }}
}}

foreach ($raw in $paths) {{
    $clean = $raw -replace ',.*$', '' -replace '%SystemRoot%', $env:SystemRoot -replace '%ProgramFiles%', $env:ProgramFiles
    if (-not (Test-Path $clean)) {{ continue }}
    try {{
        $ext = [System.IO.Path]::GetExtension($clean).ToLower()
        if ($ext -eq '.ico') {{
            $ico = [System.Drawing.Icon]::new($clean)
            $bmp = $ico.ToBitmap()
        }} else {{
            $ico = [System.Drawing.Icon]::ExtractAssociatedIcon($clean)
            if (-not $ico) {{ continue }}
            $bmp = New-Object System.Drawing.Bitmap 32,32
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.DrawIcon($ico, 0, 0)
            $g.Dispose()
        }}
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $result = [Convert]::ToBase64String($ms.ToArray())
        $bmp.Dispose()
        break
    }} catch {{ continue }}
}}
Write-Host -NoNewline $result
"#, display_icon.replace('\'', "''"), install_dir.unwrap_or_default().replace('\'', "''"));

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
