# Run this in PowerShell as Administrator to fix icon extraction
Write-Host "Testing icon extraction for installed apps..." -ForegroundColor Green

$apps = @(
  @{Name="火绒"; Path="C:\Program Files (x86)\Huorong\Sysdiag\bin\HipsMain.exe"},
  @{Name="火绒"; Path="C:\Program Files\Huorong\Sysdiag\bin\HipsMain.exe"},
  @{Name="无畏契约"; Path="C:\Program Files\Riot Vanguard\vgc.exe"},
  @{Name="英雄联盟"; Path="C:\Program Files\Riot Games\League of Legends\LeagueClient.exe"}
)

Add-Type -AssemblyName System.Drawing
$outputPath = "$env:TEMP\app_icons"
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

foreach ($app in $apps) {
  $exe = $app.Path
  if (Test-Path $exe) {
    try {
      $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exe)
      $bmp = $icon.ToBitmap()
      $outFile = "$outputPath\$($app.Name).png"
      $bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
      Write-Host "✅ $($app.Name) -> $outFile" -ForegroundColor Green
    } catch {
      Write-Host "❌ $($app.Name) FAILED: $_" -ForegroundColor Red
    }
  } else {
    Write-Host "⚠️ Not found: $exe" -ForegroundColor Yellow
  }
}

Write-Host "`nTest your apps: tell me the names of apps still missing icons." -ForegroundColor Cyan