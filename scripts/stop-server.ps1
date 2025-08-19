$ErrorActionPreference = 'SilentlyContinue'

Write-Host '[stop-server] Attempting to stop server processes'

Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -like '*api-server.js*' -or $_.Name -match '^node(.exe)?$' } |
  ForEach-Object {
    try {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    } catch {}
  }

Write-Host '[stop-server] Done (best-effort)'


