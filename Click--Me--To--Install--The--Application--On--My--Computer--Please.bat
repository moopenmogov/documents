@echo off
setlocal
cd /d "%~dp0"

rem If the repo is present (scripts\bootstrap.ps1 exists), run it.
if exist "scripts\bootstrap.ps1" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\bootstrap.ps1" %*
) else (
  rem No repo here. Fetch the bootstrap script from GitHub and run it from %TEMP%.
  set "BOOT_TMP=%TEMP%\ogc-bootstrap-%RANDOM%%RANDOM%.ps1"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/moti-og/Contract-Document-System-V2/main/scripts/bootstrap.ps1' -OutFile '%BOOT_TMP%' } catch { Write-Error 'Download failed'; exit 1 }"
  if not exist "%BOOT_TMP%" (
    echo Failed to download bootstrap. Check your internet connection and try again.
    exit /b 1
  )
  powershell -NoProfile -ExecutionPolicy Bypass -File "%BOOT_TMP%" %*
)
endlocal

