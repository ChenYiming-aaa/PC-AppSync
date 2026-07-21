mod commands;
mod scanner;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::scan_standard,
            commands::scan_deep,
            commands::open_url,
            commands::export_scan,
            commands::get_app_icon,
            commands::debug_icon,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
