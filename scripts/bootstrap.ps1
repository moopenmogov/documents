param(
	[int]$Port = 3001
)

$ErrorActionPreference = 'Stop'

function Write-Info($m){ Write-Host "[bootstrap] $m" }

try {
	$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

	# If this script is shipped standalone (no repo around), fetch the app ZIP from GitHub
	if (-not (Test-Path (Join-Path $repoRoot 'api-server.js'))) {
		Write-Info 'Local repo not found. Downloading application package...'
		$installBase = Join-Path $env:LOCALAPPDATA 'OpenGovContractPrototype'
		if (-not (Test-Path $installBase)) { New-Item -ItemType Directory -Path $installBase -Force | Out-Null }
		$zipPath = Join-Path $env:TEMP ('ogc-app-' + [Guid]::NewGuid().ToString('N') + '.zip')
		$zipUrl  = 'https://github.com/moti-og/Contract-Document-System-V2/archive/refs/heads/main.zip'
		Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
		Write-Info 'Extracting application package...'
		Expand-Archive -Path $zipPath -DestinationPath $installBase -Force
		try { Remove-Item -Force $zipPath -ErrorAction SilentlyContinue } catch {}
		# GitHub zips into a single subfolder like Contract-Document-System-V2-main
		$extracted = Get-ChildItem -Directory $installBase | Where-Object { $_.Name -like 'Contract-Document-System-V2-*' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
		if (-not $extracted) { throw 'Failed to locate extracted application folder' }
		$repoRoot = $extracted.FullName
		Write-Info ("Using application folder: " + $repoRoot)
	}
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
	Start-Process -FilePath 'node' -ArgumentList 'api-server.js' -WorkingDirectory $repoRoot -WindowStyle Hidden

	# Wait for health
	Write-Info 'Waiting for server health...'
	$deadline = (Get-Date).AddSeconds(30)
	while((Get-Date) -lt $deadline){
		try { $h = Invoke-RestMethod -Uri ("http://localhost:{0}/api/health" -f $Port) -TimeoutSec 2 } catch {}
		if ($h) { break }
		Start-Sleep -Seconds 1
	}

	# Open viewer on the dedicated web server port (3002)
	$viewer = "http://localhost:3002/viewer.html"
	Write-Info ("Opening viewer: " + $viewer)
	Start-Process $viewer

	# Register and sideload the Word add-in (production-like path)
	Write-Info 'Registering Office add-in (trusted catalog + sideload)'
	& (Join-Path $repoRoot 'scripts\register-addin.ps1') -Port $Port

	# Visible end-user guidance
	try {
		Add-Type -AssemblyName PresentationFramework | Out-Null
		# Guide assets available if you ever want to re-enable them:
		$helpImage = "http://localhost:$Port/assets/addin-open-shared-folder.png"
		$helpImageLocal = Join-Path $repoRoot 'assets\addin-open-shared-folder.png'
		$body = @"
Congratulations, you made it!

Now you should have the web experience available in one of your tabs. The URL will say "localhost" and it will likely be 3002.

That's not the best part though. Open Word and look for something called "Add-Ins." You may need to enable that, but it's just a one-time setup. Find your favorite internet pathway to enabling Add-Ins.

Once that's done, click it and you'll see the OpenGov add-in. Click on it, and voila!

And that's it. Now, have fun! And share feedback please!!!

If you're stuck here frustrated, send Moti a note.
"@
		[System.Windows.MessageBox]::Show($body, "Enable the Word add-in", 'OK', 'Information') | Out-Null
	} catch {}

	Write-Host 'Bootstrap completed.'
} catch {
	try {
		Add-Type -AssemblyName PresentationFramework | Out-Null
		$err = ("Setup failed: {0}\n\nOpen http://localhost:{1}/api/troubleshoot and send the text to support." -f ($_.Exception.Message), $Port)
		[System.Windows.MessageBox]::Show($err, 'Setup failed', 'OK', 'Error') | Out-Null
	} catch {}
	Write-Error $_
	exit 1
}


