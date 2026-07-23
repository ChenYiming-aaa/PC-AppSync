param(
  [switch]$SkipRust
)

$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$passed = 0
$failed = 0

function Run-Tests($name, $dir) {
  Write-Host "--- $name ---" -ForegroundColor Cyan
  Push-Location $dir
  try {
    if (Test-Path "node_modules\.bin\vitest") {
      & "node_modules\.bin\vitest" run
    } else {
      npm test
    }
    if ($LASTEXITCODE -ne 0) {
      Write-Host "x $name FAILED" -ForegroundColor Red
      $script:failed++
    } else {
      Write-Host "OK $name PASSED" -ForegroundColor Green
      $script:passed++
    }
  } catch {
    Write-Host "x $name ERROR: $_" -ForegroundColor Red
    $script:failed++
  } finally {
    Pop-Location
  }
}

$elapsed = Measure-Command {
  Run-Tests "Frontend" "$root\desktop"
  Run-Tests "Backend" "$root\backend"
  if (-not $SkipRust) {
    Write-Host "--- Rust ---" -ForegroundColor Cyan
    Push-Location "$root\desktop\src-tauri"
    cargo test
    if ($LASTEXITCODE -ne 0) {
      Write-Host "x Rust FAILED" -ForegroundColor Red
      $script:failed++
    } else {
      Write-Host "OK Rust PASSED" -ForegroundColor Green
      $script:passed++
    }
    Pop-Location
  }
}

Write-Host "`n================================" -ForegroundColor Cyan
if ($failed -eq 0) {
  Write-Host "  All $($passed + $failed) tests passed ($($elapsed.TotalSeconds.ToString('0.0'))s)" -ForegroundColor Green
} else {
  Write-Host "  $passed passed, $failed failed ($($elapsed.TotalSeconds.ToString('0.0'))s)" -ForegroundColor Red
}
Write-Host "================================" -ForegroundColor Cyan

if ($failed -gt 0) { exit 1 }
