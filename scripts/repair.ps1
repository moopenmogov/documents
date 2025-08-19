param(
    [int]$Port = 3001
)

$ErrorActionPreference = 'Stop'

function Write-Info($m) { Write-Host "[repair] $m" }

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$dataDir = Join-Path $env:LOCALAPPDATA 'OpenGovContractPrototype\data'
if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }

# Non-destructive re-seed: only copy if missing
$seeds = @(
    @{ src = Join-Path $repoRoot 'approvals.json'; dst = Join-Path $dataDir 'approvals.json' },
    @{ src = Join-Path $repoRoot 'approvals-state.json'; dst = Join-Path $dataDir 'approvals-state.json' }
)
foreach ($s in $seeds) {
    if ((Test-Path $s.src) -and -not (Test-Path $s.dst)) {
        Copy-Item $s.src $s.dst -Force
        Write-Info "Seeded $(Split-Path $s.dst -Leaf)"
    }
}

# Write/refresh .env
$envPath = Join-Path $repoRoot '.env'
$logDir = Join-Path $repoRoot 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$envText = "PORT=$Port`nDATA_DIR=$dataDir`nLOG_DIR=$logDir"
Set-Content -Path $envPath -Value $envText -Encoding ASCII
Write-Info 'Refreshed .env'

Write-Host 'Repair complete.'


