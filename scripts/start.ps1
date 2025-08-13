# scripts/start.ps1 - One-Click Startup Script for Document Project

# Helper: Log with timestamp
function Log-Message {
    param ([string]$Message, [string]$Level = "INFO")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$Level] $Message"
}

# Main Setup with Progress
try {
    Log-Message "Starting setup..." "INFO"
    
    # Step 1: Install Dependencies
    Log-Message "Step 1 of 4: Checking/installing dependencies..." "PROGRESS"
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Log-Message "Installing Node.js..." "INFO"
        winget install OpenJS.NodeJS --accept-package-agreements --accept-source-agreements --silent
    }
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Log-Message "Installing Git..." "INFO"
        winget install Git.Git --accept-package-agreements --accept-source-agreements --silent
    }
    # Refresh env after installs
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Log-Message "Dependencies ready." "SUCCESS"
    
    # Step 2: Detect Word
    Log-Message "Step 2 of 4: Detecting Microsoft Word..." "PROGRESS"
    $wordPath = Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Winword.exe" -Name "(Default)" -ErrorAction SilentlyContinue
    if ($wordPath) {
        Log-Message "Word found at $($wordPath.'(Default)')" "SUCCESS"
        if ($IsMacOS) {
            Log-Message "Oh wordle mc-durdle. We didn't design this for Mac, so it may not work." "WARNING"
        } else {
            Log-Message "Get ready to have fun!" "INFO"
        }
    } else {
        Log-Message "Word not found. Contracts Run Better on Word." "WARNING"
        $install = Read-Host "Install Word now? (Y/N)"
        if ($install -eq 'Y') { Start-Process "https://www.microsoft.com/en-us/microsoft-365/word" }
    }
    Log-Message "Word detection complete." "SUCCESS"

    # NEW: Disable Office debug modal
    Log-Message "Disabling debug modal..." "INFO"
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Office\16.0\Wef\Developer" -Name "TaskpaneDebuggingEnabled" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
    Log-Message "Debug modal disabled." "SUCCESS"

    # Step 3: Local Infra Setup
    Log-Message "Step 3 of 4: Setting up local infrastructure..." "PROGRESS"
    $projectDir = $PSScriptRoot -replace 'scripts', ''
    cd $projectDir
    
    # Check if repo already cloned (has .git)
    if (Test-Path ".git") {
        Log-Message "Repo exists - pulling latest updates..." "INFO"
        git pull origin main --quiet | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Log-Message "Git pull failed - check connection/repo" "ERROR"
        }
    } else {
        Log-Message "Cloning repo..." "INFO"
        git clone https://github.com/your-org/your-repo.git . --quiet | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Log-Message "Git clone failed" "ERROR"
        }
    }
    
    # Dynamic Ports with stop logic
    $basePort = 3000
    $port = $basePort
    $timeout = 10  # seconds
    $startTime = Get-Date

    while ((Get-Date) -lt $startTime.AddSeconds($timeout)) {
        $inUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if (-not $inUse) { break }
        
        Log-Message "Port $port in use. Checking if our server..." "WARNING"
        $processPid = $inUse.OwningProcess
        $proc = Get-Process -Id $processPid -ErrorAction SilentlyContinue
        if ($proc.ProcessName -eq 'node') {
            $kill = Read-Host "Stop existing server on port $port? (Y/N)"
            if ($kill -eq 'Y') {
                Stop-Process -Id $processPid -Force -Confirm:$false
                Start-Sleep -Seconds 2  # Wait for port release
                continue
            }
        }
        $port++
        Log-Message "Trying next port..." "INFO"  # Progress dot-like
    }

    if ($port -ne $basePort) {
        Log-Message "Updated to free port $port." "INFO"
        # Update configs with new port (e.g., api-server.js, manifests - simple string replace)
        (Get-Content api-server.js) -replace '3001', $port | Set-Content api-server.js
        # TODO: Similar for manifest.xml or other files if needed
    }

    # Install npm deps
    npm ci --yes

    # Start server in background
    Log-Message "Starting server on port $port..." "INFO"
    Start-Process node -ArgumentList "api-server.js" -NoNewWindow
    Log-Message "Local infra ready." "SUCCESS"
    
    # Step 4: Launch Apps
    Log-Message "Step 4 of 4: Launching applications..." "PROGRESS"
    Log-Message "Launching web viewer..." "INFO"
    Start-Process "http://localhost:$port/viewer.html"

    Log-Message "Launching Word with add-in..." "INFO"
    # Sideload add-in (simple regedit example; adjust for prod)
    # reg add HKCU\Software\Microsoft\Office\16.0\Wef\Developer /v TaskpaneDebuggingEnabled /t REG_DWORD /d 1 /f
    Start-Process $wordPath.'(Default)'

    # Pre-load latest doc from GitHub (fetch and insert via Office API - assumes Word is open)
    # TODO: Implement via JS interop or wait for Word ready
    Log-Message "Launch complete." "SUCCESS"
    
} catch {
    $logs = $_ | Out-String
    Log-Message "Setup failed at step! Copy this and email/slack us:`n$logs" "ERROR"
}

Log-Message "Setup complete! For updates, re-run this script." "SUCCESS"
