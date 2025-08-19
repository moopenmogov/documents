param(
	[int]$Port = 3001
)

$ErrorActionPreference = 'Stop'

function Write-Info($m){ Write-Host "[startup-shortcut] $m" }

try {
	$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
	$startupDir = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
	if (-not (Test-Path $startupDir)) { throw "Startup folder not found: $startupDir" }

	$psExe = (Get-Command powershell).Source
	$startScript = Join-Path $repoRoot 'scripts\start-server.ps1'
	if (-not (Test-Path $startScript)) { throw "start-server.ps1 not found at $startScript" }

	$shortcutPath = Join-Path $startupDir 'OpenGovContractPrototype-Server.lnk'
	$wsh = New-Object -ComObject WScript.Shell
	$sc = $wsh.CreateShortcut($shortcutPath)
	$sc.TargetPath = $psExe
	$sc.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`" -Port $Port"
	$sc.WorkingDirectory = $repoRoot
	$sc.WindowStyle = 7
	$sc.Description = 'Start OpenGov Contract Prototype server on logon'
	$sc.Save()

	Write-Info "Installed Startup shortcut: $shortcutPath"
} catch {
	Write-Error $_
	exit 1
}


