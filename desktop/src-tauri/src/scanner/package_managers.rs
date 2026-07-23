use super::Application;
use std::process::Command;

pub fn get_winget_apps() -> Vec<Application> {
    let output = Command::new("winget").args(["list", "--accept-source-agreements"]).output();
    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);
            parse_winget_output(&text)
        }
        _ => Vec::new(),
    }
}

fn parse_winget_output(text: &str) -> Vec<Application> {
    let mut apps = Vec::new();
    for line in text.lines().skip(2) {
        if line.trim().is_empty() || line.contains("---") { continue; }
        // Columns are separated by 2+ spaces; names may contain single spaces
        let parts: Vec<&str> = line.split("  ").map(|s| s.trim()).filter(|s| !s.is_empty()).collect();
        if parts.len() >= 2 {
            apps.push(Application {
                name: parts[0].to_string(),
                version: parts.get(2).or(parts.get(1)).unwrap_or(&"").to_string(),
                publisher: None,
                source: "winget".to_string(),
                install_path: None,
                install_date: None,
                icon_path: None,
            });
        }
    }
    apps
}

pub fn get_choco_apps() -> Vec<Application> {
    let output = Command::new("choco").args(["list", "--local-only"]).output();
    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);
            text.lines().filter_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 && !parts[0].starts_with("Chocolatey") {
                    Some(Application {
                        name: parts[0].to_string(),
                        version: parts[1].to_string(),
                        publisher: None,
                        source: "choco".to_string(),
                        install_path: None,
                        install_date: None,
                        icon_path: None,
                    })
                } else { None }
            }).collect()
        }
        _ => Vec::new(),
    }
}

pub fn get_scoop_apps() -> Vec<Application> {
    let output = Command::new("scoop").args(["list"]).output();
    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);
            text.lines().skip(2).filter_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    Some(Application {
                        name: parts[0].to_string(),
                        version: parts[1].to_string(),
                        publisher: None,
                        source: "scoop".to_string(),
                        install_path: None,
                        install_date: None,
                        icon_path: None,
                    })
                } else { None }
            }).collect()
        }
        _ => Vec::new(),
    }
}
