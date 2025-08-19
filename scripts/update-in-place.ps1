param(
    [string]$SourceDir,   # path to new build (unzipped)
    [string]$TargetDir,   # install dir (defaults to repo root)
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Info($m){ Write-Host "[update] $m" }
function Copy-Safe($src,$dst){ if ($DryRun) { Info "DRY: copy $src -> $dst" } else { Copy-Item $src $dst -Force -Recurse } }

try {
    if (-not $SourceDir -or -not (Test-Path $SourceDir)) { throw "SourceDir missing or not found" }
    if (-not $TargetDir -or $TargetDir.Trim() -eq '') { $TargetDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path }

    $stop = Join-Path $PSScriptRoot 'stop-server.ps1'
    if (Test-Path $stop) { & $stop }

    $backup = Join-Path $TargetDir ("backup-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    Info "Backing up binaries to $backup"
    if (-not $DryRun) { New-Item -ItemType Directory -Path $backup -Force | Out-Null }

    $preserve = @('.env','logs','data')
    $items = Get-ChildItem -Path $TargetDir -Force | Where-Object { $preserve -notcontains $_.Name }
    foreach($i in $items){ Copy-Safe $i.FullName (Join-Path $backup $i.Name) }

    Info "Copying new build from $SourceDir"
    foreach($i in Get-ChildItem -Path $SourceDir -Force){ Copy-Safe $i.FullName (Join-Path $TargetDir $i.Name) }

    Info 'Restarting server'
    $start = Join-Path $PSScriptRoot 'start-server.ps1'
    if (Test-Path $start) { & $start } else { Info 'start-server.ps1 not found; please start manually' }

    Info 'Update complete'
} catch {
    Write-Error $_
    Write-Host "If files were modified, restore from backup folder: $backup"
    exit 1
}


