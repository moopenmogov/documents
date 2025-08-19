param(
    [int]$Port = 3001,
    [string]$DataDir,
    [string]$LogDir
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[start-server] $msg" }

try {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

    if (-not $DataDir -or $DataDir.Trim() -eq '') {
        $DataDir = Join-Path $env:LOCALAPPDATA 'OpenGovContractPrototype\data'
    }
    if (-not (Test-Path $DataDir)) { New-Item -ItemType Directory -Path $DataDir -Force | Out-Null }

    if (-not $LogDir -or $LogDir.Trim() -eq '') {
        $LogDir = Join-Path $repoRoot 'logs'
    }
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

    $envPath = Join-Path $repoRoot '.env'
    $envText = "PORT=$Port`nDATA_DIR=$DataDir`nLOG_DIR=$LogDir"
    Set-Content -Path $envPath -Value $envText -Encoding ASCII
    Write-Info "Wrote .env (PORT=$Port, DATA_DIR=$DataDir, LOG_DIR=$LogDir)"

    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Error "Node.js not found in PATH. Install Node 18+ or run a bundled server binary."
        exit 1
    }

    Push-Location $repoRoot
    try {
        Write-Info "Starting server: node api-server.js"
        # Server writes its own logs under LOG_DIR; keep console live for task history
        & node api-server.js
    } finally {
        Pop-Location
    }
} catch {
    Write-Error $_
    exit 1
}


