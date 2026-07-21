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

/// Batch extract icons - uses one PowerShell call, returns JSON with stderr on error
#[tauri::command]
pub fn batch_get_icons(entries: Vec<IconEntry>) -> Result<String, String> {
    let json = serde_json::to_string(&entries).unwrap_or_default();

    // Write JSON and PS script to temp files to avoid escaping issues
    let json_path = std::env::temp_dir().join("appsync_icon_entries.json");
    std::fs::write(&json_path, &json).ok();
    let script_path = std::env::temp_dir().join("appsync_icon_extract.ps1");
    let ps_code = format!(
        r#"$ErrorActionPreference='Stop'
$json = Get-Content '{}' -Raw
Add-Type -AssemblyName System.Drawing
$list = $json | ConvertFrom-Json
$result = @{{}}
foreach ($e in $list) {{
    $name=$e.name
    $cand=@()
    if($e.display_icon){{$cand+=($e.display_icon -replace ',.*$','')}}
    if($e.install_dir -and (Test-Path $e.install_dir)){{Get-ChildItem $e.install_dir -Filter *.exe|%%{{$cand+=$_.FullName}}}}
    foreach($p in $cand){{
        if(-not (Test-Path $p)){{continue}}
        try{{$ico=[Drawing.Icon]::ExtractAssociatedIcon($p);if(-not$ico){{continue}};$b=New-Object Drawing.Bitmap 32,32;$g=[Drawing.Graphics]::FromImage($b);$g.DrawIcon($ico,0,0);$g.Dispose();$m=New-Object IO.MemoryStream;$b.Save($m,[Drawing.Imaging.ImageFormat]::Png);$result[$name]=[Convert]::ToBase64String($m.ToArray());$b.Dispose();break}}catch{{}}
    }}
    if(-not$result.ContainsKey($name)){{$result[$name]=''}}
}}
Write-Output (ConvertTo-Json $result -Compress -Depth 10)"#,
        json_path.to_string_lossy().replace('\'', "''")
    );

    std::fs::write(&script_path, &ps_code).ok();

    let out = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", &script_path.to_string_lossy()])
        .output().map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();

    // Clean up temp files
    std::fs::remove_file(&json_path).ok();
    std::fs::remove_file(&script_path).ok();

    if !out.status.success() {
        return Err(format!("PowerShell failed: {}", stderr));
    }

    Ok(stdout)
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
