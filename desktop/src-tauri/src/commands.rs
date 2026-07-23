use crate::scanner;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Emitter;

fn make_progress(app: &tauri::AppHandle) -> scanner::ProgressFn {
    let app = app.clone();
    Box::new(move |msg: &str, pct: u8| {
        let _ = app.emit("scan-progress", serde_json::json!({
            "percent": pct as f64,
            "stage": msg,
        }));
    })
}

#[tauri::command]
pub fn scan(app: tauri::AppHandle) -> Result<scanner::ScanResult, String> {
    let start = std::time::Instant::now();
    let machine_name = std::env::var("COMPUTERNAME").unwrap_or_else(|_| "UNKNOWN".to_string());
    let scan_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis().to_string())
        .unwrap_or_else(|_| String::new());

    let cb = make_progress(&app);
    cb("OS info", 3);
    let os = scanner::registry::get_os_info();

    cb("Installed apps", 8);
    let apps = scanner::registry::get_installed_apps(Some(&cb));

    cb("Runtimes", 60);
    let runtimes = scanner::runtimes::detect_runtimes(Some(&cb));

    let duration_ms = start.elapsed().as_millis() as u64;
    cb("Done", 100);

    Ok(scanner::ScanResult {
        version: "1.0".to_string(), machine_name, scan_time,
        scan_mode: "standard".to_string(), scan_duration_ms: duration_ms,
        os,
        applications: apps,
        runtimes,
    })
}

#[tauri::command]
pub fn export_scan(data: String, file_path: String) -> Result<(), String> {
    std::fs::write(&file_path, &data).map_err(|e| format!("Failed: {}", e))
}
