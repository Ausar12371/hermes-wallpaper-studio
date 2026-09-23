# 壁纸工作室 · Hermes Wallpaper Studio — 安装脚本 (Windows)
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot

# 依次探测可能的 HERMES_HOME（桌面端 Windows 版 = %LOCALAPPDATA%\hermes）
$candidates = @()
if ($env:LOCALAPPDATA) { $candidates += (Join-Path $env:LOCALAPPDATA 'hermes') }
$candidates += (Join-Path $HOME '.hermes')

$hermesHome = $null
foreach ($c in $candidates) { if (Test-Path $c) { $hermesHome = $c; break } }
if (-not $hermesHome) { $hermesHome = $candidates[0] }

$dst = Join-Path $hermesHome 'desktop-plugins\wallpaper'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item (Join-Path $src 'plugin.js') -Destination $dst -Force

Write-Host ''
Write-Host ' [OK] 已安装到:' $dst -ForegroundColor Green
Write-Host ' Hermes 桌面端会在几秒内自动加载（无需重启）。'
Write-Host ' 若未出现：Ctrl+K -> 输入 "Reload desktop plugins"'
Write-Host ''
