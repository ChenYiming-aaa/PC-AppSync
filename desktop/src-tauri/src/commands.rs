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
pub fn get_app_icon(exe_path: String) -> Result<Option<String>, String> {
    // Strip icon index suffix like ",0" or ",1"
    let clean = exe_path.split(',').next().unwrap_or(&exe_path).trim().to_string();
    if !std::path::Path::new(&clean).exists() {
        return Ok(None);
    }
    // Use a simple .NET script that works even when ExtractAssociatedIcon fails
    let script = format!(
        "Add-Type -AssemblyName System.Drawing; \
         try {{ \
           $i = [System.Drawing.Icon]::ExtractAssociatedIcon('{}'); \
           $ms = New-Object System.IO.MemoryStream; \
           $i.ToBitmap().Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); \
           [Convert]::ToBase64String($ms.ToArray()) \
         }} catch {{ \
           try {{ \
             $bmp = [System.Drawing.Bitmap]::FromFile('{}'); \
             $ms = New-Object System.IO.MemoryStream; \
             $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); \
             [Convert]::ToBase64String($ms.ToArray()) \
           }} catch {{ '' }} \
         }}",
        clean.replace('\'', "''"), clean.replace('\'', "''")
    );
    let output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output()
        .map_err(|e| format!("Failed to run powershell: {}", e))?;
    if output.status.success() {
        let b64 = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if b64.is_empty() {
            Ok(None)
        } else {
            Ok(Some("data:image/png;base64,".to_string() + &b64))
        }
    } else {
        Ok(None)
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
