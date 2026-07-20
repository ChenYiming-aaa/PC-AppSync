use super::DeepScan;

pub fn run_deep_scan() -> DeepScan {
    DeepScan {
        vscode_extensions: Vec::new(),
        path_entries: Vec::new(),
        wsl_distributions: Vec::new(),
        windows_features: Vec::new(),
    }
}
