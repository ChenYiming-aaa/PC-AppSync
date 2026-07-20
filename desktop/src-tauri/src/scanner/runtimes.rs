use super::{Runtime, Package};
use std::process::Command;

fn run_cmd(program: &str, args: &[&str]) -> Option<String> {
    Command::new(program).args(args).output().ok()
        .filter(|o| o.status.success())
        .and_then(|o| String::from_utf8(o.stdout).ok())
}

fn run_cmd_err(program: &str, args: &[&str]) -> Option<String> {
    Command::new(program).args(args).output().ok()
        .filter(|o| o.status.success())
        .and_then(|o| {
            let s = String::from_utf8_lossy(&o.stdout).to_string();
            if s.trim().is_empty() {
                String::from_utf8(o.stderr).ok()
            } else { Some(s) }
        })
}

fn parse_version(output: &str) -> String {
    output.lines().next().unwrap_or("").trim().to_string()
}

pub fn detect_runtimes() -> Vec<Runtime> {
    let mut runtimes = Vec::new();

    // Python
    if let Some(ver) = run_cmd("python", &["--version"]) {
        let packages = run_cmd("pip", &["list", "--format=json"])
            .and_then(|s| serde_json::from_str::<Vec<Package>>(&s).ok())
            .unwrap_or_default();
        runtimes.push(Runtime {
            name: "Python".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages,
        });
    }

    // Node.js
    if let Some(ver) = run_cmd("node", &["--version"]) {
        let packages = run_cmd("npm", &["list", "-g", "--depth=0", "--json"])
            .and_then(|s| {
                let v: serde_json::Value = serde_json::from_str(&s).ok()?;
                v["dependencies"].as_object().map(|deps| {
                    deps.iter().map(|(name, info)| Package {
                        name: name.clone(),
                        version: info["version"].as_str().unwrap_or("").to_string(),
                    }).collect()
                })
            })
            .unwrap_or_default();
        runtimes.push(Runtime {
            name: "Node.js".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages,
        });
    }

    // Java
    if let Some(ver) = run_cmd_err("java", &["-version"]) {
        runtimes.push(Runtime {
            name: "Java".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    // Go
    if let Some(ver) = run_cmd("go", &["version"]) {
        runtimes.push(Runtime {
            name: "Go".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    // .NET SDKs
    if let Some(sdks) = run_cmd("dotnet", &["--list-sdks"]) {
        runtimes.push(Runtime {
            name: ".NET SDK".to_string(),
            version: sdks.lines().last().unwrap_or("").trim().to_string(),
            install_path: None,
            packages: sdks.lines().map(|l| Package {
                name: l.to_string(),
                version: String::new(),
            }).collect(),
        });
    }

    // .NET Runtimes
    if let Some(rts) = run_cmd("dotnet", &["--list-runtimes"]) {
        runtimes.push(Runtime {
            name: ".NET Runtime".to_string(),
            version: String::new(),
            install_path: None,
            packages: rts.lines().map(|l| Package {
                name: l.to_string(),
                version: String::new(),
            }).collect(),
        });
    }

    // Rust
    if let Some(ver) = run_cmd("rustc", &["--version"]) {
        runtimes.push(Runtime {
            name: "Rust".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    // Git
    if let Some(ver) = run_cmd("git", &["--version"]) {
        runtimes.push(Runtime {
            name: "Git".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    // Docker
    if let Some(ver) = run_cmd("docker", &["version", "--format", "{{.Server.Version}}"]) {
        runtimes.push(Runtime {
            name: "Docker".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    runtimes
}
