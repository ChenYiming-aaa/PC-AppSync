use super::{DeepScan, Package};
use std::process::Command;

fn run_cmd(program: &str, args: &[&str]) -> Option<String> {
    Command::new(program).args(args).output().ok()
        .filter(|o| o.status.success())
        .and_then(|o| String::from_utf8(o.stdout).ok())
}

pub fn run_deep_scan() -> DeepScan {
    DeepScan {
        vscode_extensions: get_vscode_extensions(),
        path_entries: get_path_entries(),
        wsl_distributions: get_wsl_distros(),
        windows_features: get_windows_features(),
    }
}

fn get_vscode_extensions() -> Vec<Package> {
    run_cmd("code", &["--list-extensions", "--show-versions"])
        .map(|output| {
            output.lines().filter_map(|line| {
                let mut parts = line.splitn(2, '@');
                Some(Package {
                    name: parts.next()?.to_string(),
                    version: parts.next().unwrap_or("").to_string(),
                })
            }).collect()
        })
        .unwrap_or_default()
}

fn get_path_entries() -> Vec<String> {
    std::env::var("PATH").unwrap_or_default()
        .split(';')
        .map(|s| s.to_string())
        .collect()
}

fn get_wsl_distros() -> Vec<Package> {
    run_cmd("wsl", &["--list", "-v"])
        .map(|output| {
            output.lines().skip(1).filter_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    Some(Package {
                        name: parts[0].to_string(),
                        version: parts.get(2).unwrap_or(&"").to_string(),
                    })
                } else { None }
            }).collect()
        })
        .unwrap_or_default()
}

fn get_windows_features() -> Vec<Package> {
    run_cmd("dism", &["/Online", "/Get-Features", "/Format:Table"])
        .map(|output| {
            output.lines().skip(2).filter_map(|line| {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 2 {
                    Some(Package {
                        name: parts[0].trim().to_string(),
                        version: parts[1].trim().to_string(),
                    })
                } else { None }
            }).collect()
        })
        .unwrap_or_default()
}
