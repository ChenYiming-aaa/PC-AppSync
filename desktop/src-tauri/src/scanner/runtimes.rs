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

fn parse_java_version(output: &str) -> String {
    let first = output.lines().next().unwrap_or("").trim();
    let cleaned = first.trim_matches('"');
    if let Some(pos) = cleaned.rfind("version ") {
        let after = cleaned[pos + 8..].trim();
        let v = after.split('"').nth(1).unwrap_or(after).trim();
        if !v.is_empty() { return v.to_string(); }
    }
    let v = cleaned.split_whitespace().find(|s| s.chars().next().is_some_and(|c| c.is_ascii_digit()));
    v.unwrap_or(cleaned).to_string()
}

fn step(progress: Option<&super::ProgressFn>, pct: u8, msg: &str) {
    if let Some(f) = progress { f(msg, pct); }
}

pub fn detect_runtimes(progress: Option<&super::ProgressFn>) -> Vec<Runtime> {
    let mut runtimes = Vec::new();

    step(progress, 62, "Python");
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

    step(progress, 66, "Node.js");
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

    step(progress, 69, "Java");
    if let Some(ver) = run_cmd_err("java", &["-version"]) {
        runtimes.push(Runtime {
            name: "Java".to_string(),
            version: parse_java_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    step(progress, 72, "Go");
    if let Some(ver) = run_cmd("go", &["version"]) {
        runtimes.push(Runtime {
            name: "Go".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    step(progress, 75, ".NET SDK");
    if let Some(sdks) = run_cmd("dotnet", &["--list-sdks"]) {
        let lines: Vec<&str> = sdks.lines().collect();
        let latest = lines.iter()
            .filter_map(|l| l.split_whitespace().next())
            .max_by(|a, b| semver_compare(a, b))
            .unwrap_or("")
            .to_string();
        runtimes.push(Runtime {
            name: ".NET SDK".to_string(),
            version: latest,
            install_path: None,
            packages: lines.iter().filter_map(|l| {
                let parts: Vec<&str> = l.splitn(2, ' ').collect();
                let ver = parts.first()?.trim();
                if ver.is_empty() { return None; }
                Some(Package { name: ver.to_string(), version: String::new() })
            }).collect(),
        });
    }

    step(progress, 78, ".NET Runtime");
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

    step(progress, 81, "Rust");
    if let Some(ver) = run_cmd("rustc", &["--version"]) {
        runtimes.push(Runtime {
            name: "Rust".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    step(progress, 85, "Git");
    if let Some(ver) = run_cmd("git", &["--version"]) {
        runtimes.push(Runtime {
            name: "Git".to_string(),
            version: parse_version(&ver),
            install_path: None,
            packages: vec![],
        });
    }

    step(progress, 88, "Docker");
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

fn semver_compare(a: &str, b: &str) -> std::cmp::Ordering {
    let a_parts: Vec<u32> = a.split('.').filter_map(|s| s.parse().ok()).collect();
    let b_parts: Vec<u32> = b.split('.').filter_map(|s| s.parse().ok()).collect();
    for i in 0..a_parts.len().max(b_parts.len()) {
        let av = a_parts.get(i).copied().unwrap_or(0);
        let bv = b_parts.get(i).copied().unwrap_or(0);
        if av != bv { return av.cmp(&bv); }
    }
    std::cmp::Ordering::Equal
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── semver_compare ──

    #[test]
    fn test_semver_compare_equal() {
        assert_eq!(semver_compare("8.0.403", "8.0.403"), std::cmp::Ordering::Equal);
    }

    #[test]
    fn test_semver_compare_greater_major() {
        assert_eq!(semver_compare("9.0.0", "8.0.403"), std::cmp::Ordering::Greater);
    }

    #[test]
    fn test_semver_compare_greater_minor() {
        assert_eq!(semver_compare("8.1.0", "8.0.403"), std::cmp::Ordering::Greater);
    }

    #[test]
    fn test_semver_compare_greater_patch() {
        assert_eq!(semver_compare("8.0.500", "8.0.403"), std::cmp::Ordering::Greater);
    }

    #[test]
    fn test_semver_compare_less_major() {
        assert_eq!(semver_compare("7.9.999", "8.0.0"), std::cmp::Ordering::Less);
    }

    #[test]
    fn test_semver_compare_less_minor() {
        assert_eq!(semver_compare("8.0.0", "8.1.0"), std::cmp::Ordering::Less);
    }

    #[test]
    fn test_semver_compare_less_patch() {
        assert_eq!(semver_compare("6.0.425", "8.0.403"), std::cmp::Ordering::Less);
    }

    #[test]
    fn test_semver_compare_different_length_shorter_first() {
        assert_eq!(semver_compare("1.0", "1.0.0"), std::cmp::Ordering::Equal);
    }

    #[test]
    fn test_semver_compare_different_length_longer_first() {
        assert_eq!(semver_compare("1.0.0", "1.0"), std::cmp::Ordering::Equal);
    }

    #[test]
    fn test_semver_compare_different_length_greater() {
        assert_eq!(semver_compare("1.0.1", "1.0"), std::cmp::Ordering::Greater);
    }

    #[test]
    fn test_semver_compare_different_length_less() {
        assert_eq!(semver_compare("1.0", "1.0.1"), std::cmp::Ordering::Less);
    }

    #[test]
    fn test_semver_compare_single_part() {
        assert_eq!(semver_compare("5", "5"), std::cmp::Ordering::Equal);
        assert_eq!(semver_compare("5", "4"), std::cmp::Ordering::Greater);
        assert_eq!(semver_compare("3", "10"), std::cmp::Ordering::Less);
    }

    #[test]
    fn test_semver_compare_non_numeric_skipped() {
        // "403-alpha" fails to parse as u32, so it's treated as missing (0)
        // so ["8","0","403-alpha"] → [8,0] vs ["8","0","403"] → [8,0,403] → Less
        assert_eq!(semver_compare("8.0.403-alpha", "8.0.403"), std::cmp::Ordering::Less);
    }

    #[test]
    fn test_semver_compare_all_non_numeric() {
        assert_eq!(semver_compare("foo", "bar"), std::cmp::Ordering::Equal);
    }

    #[test]
    fn test_semver_compare_empty_strings() {
        assert_eq!(semver_compare("", ""), std::cmp::Ordering::Equal);
        assert_eq!(semver_compare("1.0", ""), std::cmp::Ordering::Greater);
        assert_eq!(semver_compare("", "1.0"), std::cmp::Ordering::Less);
    }

    // ── parse_version ──

    #[test]
    fn test_parse_version_normal() {
        assert_eq!(parse_version("Python 3.10.4\n"), "Python 3.10.4");
    }

    #[test]
    fn test_parse_version_multi_line() {
        assert_eq!(parse_version("v18.12.1\nsome other info\n"), "v18.12.1");
    }

    #[test]
    fn test_parse_version_trimmed() {
        assert_eq!(parse_version("  go1.19.3  "), "go1.19.3");
    }

    #[test]
    fn test_parse_version_empty() {
        assert_eq!(parse_version(""), "");
    }

    #[test]
    fn test_parse_version_only_whitespace() {
        assert_eq!(parse_version("   \n  \n"), "");
    }

    #[test]
    fn test_parse_version_preserves_internal_spaces() {
        assert_eq!(parse_version("git version 2.39.0"), "git version 2.39.0");
    }

    // ── parse_java_version ──

    #[test]
    fn test_parse_java_version_modern() {
        let out = "openjdk version \"11.0.1\" 2018-10-16\nOpenJDK Runtime Environment ...";
        assert_eq!(parse_java_version(out), "11.0.1");
    }

    #[test]
    fn test_parse_java_version_java8() {
        let out = "java version \"1.8.0_201\"\nJava(TM) SE Runtime Environment ...";
        assert_eq!(parse_java_version(out), "1.8.0_201");
    }

    #[test]
    fn test_parse_java_version_openjdk() {
        let out = "openjdk version \"17.0.5\" 2022-10-18\nOpenJDK Runtime Environment ...";
        assert_eq!(parse_java_version(out), "17.0.5");
    }

    #[test]
    fn test_parse_java_version_graalvm() {
        let out = "openjdk version \"17.0.7\" 2023-04-18\nOpenJDK Runtime Environment GraalVM CE 22.3.1 ...";
        assert_eq!(parse_java_version(out), "17.0.7");
    }

    #[test]
    fn test_parse_java_version_no_version_keyword() {
        let out = "17.0.1\nsome extra line";
        assert_eq!(parse_java_version(out), "17.0.1");
    }

    #[test]
    fn test_parse_java_version_empty() {
        assert_eq!(parse_java_version(""), "");
    }

    #[test]
    fn test_parse_java_version_only_whitespace() {
        assert_eq!(parse_java_version("   \n  \n"), "");
    }

    #[test]
    fn test_parse_java_version_leading_trailing_noise() {
        let out = "  java version \"1.8.0_331\"  \n";
        assert_eq!(parse_java_version(out), "1.8.0_331");
    }

    #[test]
    fn test_parse_java_version_multi_line_stderr() {
        let out = "java version \"1.8.0_201\"\nJava(TM) SE Runtime Environment (build 1.8.0_201-b09)\nJava HotSpot(TM) 64-Bit Server VM (build 25.201-b09, mixed mode)";
        assert_eq!(parse_java_version(out), "1.8.0_201");
    }
}
