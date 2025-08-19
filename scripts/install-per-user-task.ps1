param(
    [int]$Port = 3001
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$startScript = Join-Path $repoRoot 'scripts\start-server.ps1'

if (-not (Test-Path $startScript)) { Write-Error "start-server.ps1 not found"; exit 1 }

$taskName = 'OpenGovContractPrototype-Server'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`" -Port $Port"
$trigger = New-ScheduledTaskTrigger -AtLogOn

try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
} catch {}

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Description 'Start OpenGov Contract Prototype server on logon' | Out-Null
Write-Host "Installed per-user Scheduled Task: $taskName"


