@echo off
rem Hermes Wallpaper Studio - one-click installer wrapper
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
echo.
pause
