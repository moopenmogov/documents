# Autosave docs in productus-maximus/ with debounced local commits
# Usage: Right-click this file → Run with PowerShell, or run:
#   powershell -ExecutionPolicy Bypass -File scripts/autosave-docs.ps1

param(
    [string]$Path = "productus-maximus",
    [int]$DebounceMs = 2000
)

function Write-Info($msg) { Write-Host "[autosave-docs] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[autosave-docs] $msg" -ForegroundColor Yellow }

if (-not (Test-Path $Path)) {
    Write-Warn "Folder '$Path' not found. Exiting."; exit 1
}

# Ensure folder is a subpath
$FullPath = Resolve-Path $Path
Set-Location (Split-Path $PSScriptRoot -Parent) | Out-Null

Write-Info "Watching '$FullPath' for changes (debounce ${DebounceMs}ms)"

$script:pending = $false
$fsw = New-Object System.IO.FileSystemWatcher $FullPath, '*.*'
$fsw.IncludeSubdirectories = $true
$fsw.EnableRaisingEvents = $true

Register-ObjectEvent $fsw Changed -Action { $script:pending = $true } | Out-Null
Register-ObjectEvent $fsw Created -Action { $script:pending = $true } | Out-Null
Register-ObjectEvent $fsw Deleted -Action { $script:pending = $true } | Out-Null
Register-ObjectEvent $fsw Renamed -Action { $script:pending = $true } | Out-Null

while ($true) {
    Start-Sleep -Milliseconds $DebounceMs
    if ($script:pending) {
        $script:pending = $false
        try {
            git -C $FullPath add -A | Out-Null
            $status = git -C $FullPath status --porcelain
            if ($status -and $status.Trim().Length -gt 0) {
                git -C $FullPath commit -m "docs: autosave" | Out-Null
                Write-Info "Committed autosave in '$Path'"
            }
        } catch {
            Write-Warn "Autosave failed: $($_.Exception.Message)"
        }
    }
}


