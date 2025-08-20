@echo off
setlocal
cd /d "%~dp0"
REM Launch the startup script with execution policy bypass
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\bootstrap.ps1"
endlocal

