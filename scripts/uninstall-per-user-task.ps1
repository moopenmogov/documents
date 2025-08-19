param(
    [switch]$KillServer = $true
)

$ErrorActionPreference = 'Stop'

$taskName = 'OpenGovContractPrototype-Server'

try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
    Write-Host "Unregistered per-user Scheduled Task: $taskName"
} catch {
    Write-Warning "Could not unregister task $taskName: $_"
}

if ($KillServer) {
    try {
        Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*api-server.js*' -or $_.Name -match '^node(.exe)?$' } | ForEach-Object {
            try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
        }
        Write-Host 'Stopped any running server processes (best-effort).'
    } catch {
        Write-Warning "Could not enumerate/stop server processes: $_"
    }
}

Write-Host 'Uninstall (per-user task) complete.'


