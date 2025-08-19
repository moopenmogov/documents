param(
	[int]$Port = 3001
)

$ErrorActionPreference = 'Stop'

function Write-Info($m){ Write-Host "[bootstrap] $m" }

try {
	$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
	$node = (Get-Command node -ErrorAction SilentlyContinue)
	if (-not $node) {
		Write-Info 'Node.js not found – downloading portable runtime...'
		$dlDir = Join-Path $env:TEMP ('node-portable-' + [Guid]::NewGuid().ToString('N'))
		New-Item -ItemType Directory -Path $dlDir -Force | Out-Null
		$zip = Join-Path $dlDir 'node-win-x64.zip'
		# LTS v18 portable build mirror (replace with official or bundled in production)
		$uri = 'https://nodejs.org/dist/v18.20.4/node-v18.20.4-win-x64.zip'
		Invoke-WebRequest -Uri $uri -OutFile $zip -UseBasicParsing
		Write-Info 'Extracting Node runtime...'
		Expand-Archive -Path $zip -DestinationPath $dlDir -Force
		$nodeDir = Get-ChildItem $dlDir | Where-Object { $_.PSIsContainer -and $_.Name -like 'node-v18.*-win-x64' } | Select-Object -First 1
		if (-not $nodeDir) { throw 'Portable Node extraction failed' }
		$env:PATH = $nodeDir.FullName + ';' + $env:PATH
		Write-Info ("Using portable Node at " + $nodeDir.FullName)
	}

	# Write .env and start server
	$envPath = Join-Path $repoRoot '.env'
	$logDir = Join-Path $repoRoot 'logs'
	if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
	$dataDir = Join-Path $env:LOCALAPPDATA 'OpenGovContractPrototype\data'
	if (-not (Test-Path $dataDir)) { New-Item -ItemType Directory -Path $dataDir -Force | Out-Null }
	Set-Content -Path $envPath -Value ("PORT={0}`nDATA_DIR={1}`nLOG_DIR={2}" -f $Port, $dataDir, $logDir) -Encoding ASCII

	Write-Info 'Starting API server...'
	Start-Process -FilePath 'node' -ArgumentList 'api-server.js' -WindowStyle Hidden

	# Wait for health
	Write-Info 'Waiting for server health...'
	$deadline = (Get-Date).AddSeconds(30)
	while((Get-Date) -lt $deadline){
		try { $h = Invoke-RestMethod -Uri ("http://localhost:{0}/api/health" -f $Port) -TimeoutSec 2 } catch {}
		if ($h) { break }
		Start-Sleep -Seconds 1
	}

	# Open viewer from the same server (no extra dev server needed)
	$viewer = "http://localhost:{0}/viewer.html" -f $Port
	Write-Info ("Opening viewer: " + $viewer)
	Start-Process $viewer

	# Register and sideload the Word add-in (production-like path)
	Write-Info 'Registering Office add-in (trusted catalog + sideload)'
	& (Join-Path $repoRoot 'scripts\register-addin.ps1') -Port $Port

	Write-Host 'Bootstrap completed.'
} catch {
	Write-Error $_
	exit 1
}


