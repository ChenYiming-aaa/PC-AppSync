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
pub fn get_app_icon(display_icon: String, install_dir: Option<String>) -> Result<Option<String>, String> {
    let idir = install_dir.clone().unwrap_or_default();
    let script = format!(r#"
Add-Type -AssemblyName System.Drawing
$targets = @()
$di = '{0}'
if ($di) {{ $targets += @($di) }}

$idir = '{1}'
if ($idir -and (Test-Path $idir)) {{
    Get-ChildItem $idir -Filter *.exe -ErrorAction SilentlyContinue | ForEach-Object {{ $targets += $_.FullName }}
    # Also check common subdirs
    foreach ($sub in @('bin','core','app','client','launcher')) {{
        $sd = Join-Path $idir $sub
        if (Test-Path $sd) {{ Get-ChildItem $sd -Filter *.exe -ErrorAction SilentlyContinue | ForEach-Object {{ $targets += $_.FullName }} }}
    }}
}}

$result = ''
foreach ($p in $targets) {{
    $clean = $p -replace ',.*$','' -replace '%SystemRoot%',[Environment]::GetFolderPath('System') -replace '%ProgramFiles%',$env:ProgramFiles -replace '%ProgramW6432%',$env:ProgramW6432 -replace '%ProgramFiles(x86)%',"${{env:ProgramFiles(x86)}}"
    if (-not (Test-Path $clean)) {{ continue }}
    try {{
        $ico = [System.Drawing.Icon]::ExtractAssociatedIcon($clean)
        if (-not $ico) {{ continue }}
        $bmp = New-Object Drawing.Bitmap 32,32
        $g = [Drawing.Graphics]::FromImage($bmp)
        $g.DrawIcon($ico,0,0); $g.Dispose()
        $ms = New-Object IO.MemoryStream
        $bmp.Save($ms, [Drawing.Imaging.ImageFormat]::Png)
        $result = [Convert]::ToBase64String($ms.ToArray())
        $bmp.Dispose(); break
    }} catch {{ }}
}}
Write-Host -NoNewline $result
"#, display_icon.replace('\'',"''"), idir.replace('\'',"''"));

    let o = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output().map_err(|e| e.to_string())?;
    if o.status.success() {
        let b64 = String::from_utf8_lossy(&o.stdout).trim().to_string();
        if !b64.is_empty() { return Ok(Some(format!("data:image/png;base64,{}", b64))); }
    }
    Ok(None)
}

#[tauri::command]
pub fn debug_icon(_app_name: String, display_icon: String, install_dir: Option<String>) -> Result<String, String> {
    let idir = install_dir.unwrap_or_default();
    let script = format!(r#"
$di = '{0}'
$idir = '{1}'
$out = @()
$out += "DisplayIcon: $di"
$out += "InstallDir: $idir"
$clean = $di -replace ',.*$',''
$out += "Cleaned: $clean"
$out += "Exists: $(Test-Path $clean)"
if ($idir) {{ $out += "DirExists: $(Test-Path $idir)" }}
if ($idir -and (Test-Path $idir)) {{
    Get-ChildItem $idir -Filter *.exe -ErrorAction SilentlyContinue | ForEach-Object {{ $out += "  Exe: $($_.FullName) ($($_.Length) bytes)" }}
}}
$out -join "`n"
"#, display_icon.replace('\'',"''"), idir.replace('\'',"''"));
    let o = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output().map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&o.stdout).trim().to_string())
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
