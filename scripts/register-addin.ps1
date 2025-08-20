param(
	[int]$Port = 3001,
	[switch]$ForceCacheClear
)

$ErrorActionPreference = 'Stop'

function Write-Info($m){ Write-Host "[addin] $m" }

try {
	$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
	$catalog = Join-Path $env:LOCALAPPDATA 'OpenGovContractPrototype\\addin-catalog'
	if (-not (Test-Path $catalog)) { New-Item -ItemType Directory -Path $catalog -Force | Out-Null }

	# Build a local manifest that ALWAYS points to the dev add-in server on https://localhost:3000
	$src = Join-Path $repoRoot 'manifest.xml'
	if (-not (Test-Path $src)) { throw "manifest.xml not found at $src" }
	$xml = Get-Content -Raw -Path $src
	# Normalize any lingering alternate bases back to 3000
	$xml = $xml -replace 'https://localhost:3003', 'https://localhost:3000'
	$xml = $xml -replace 'http://localhost:[0-9]+', 'https://localhost:3000'
	$xml = $xml -replace 'https://localhost:3000/taskpane.html', 'https://localhost:3000/src/taskpane/taskpane.html'
	$xml = $xml -replace 'https://localhost:3000/commands.html', 'https://localhost:3000/src/commands/commands.html'
	$dest = Join-Path $catalog 'OpenGovContractPrototype.manifest.xml'
	Set-Content -Path $dest -Value $xml -Encoding UTF8
	Write-Info ("Wrote local manifest: " + $dest)

	# Optional: clear Word's WEF cache if requested
	if ($ForceCacheClear) {
		try {
			$wef = Join-Path $env:LOCALAPPDATA 'Microsoft\\Office\\16.0\\Wef'
			if (Test-Path $wef) { Write-Info 'Clearing Word WEF cache...'; Remove-Item $wef -Recurse -Force }
		} catch { Write-Info 'WEF cache clear failed or not needed.' }
	}

	# Register Trusted Catalog (HKCU)
	$regBase = 'HKCU:Software\\Microsoft\\Office\\16.0\\WEF\\TrustedCatalogs'
	if (-not (Test-Path $regBase)) { New-Item -Path $regBase -Force | Out-Null }
	$catKey = Join-Path $regBase 'OpenGovLocalCatalog'
	if (-not (Test-Path $catKey)) { New-Item -Path $catKey -Force | Out-Null }
	New-ItemProperty -Path $catKey -Name 'CatalogType' -PropertyType DWord -Value 2 -Force | Out-Null  # 2 = file system
	New-ItemProperty -Path $catKey -Name 'Enabled' -PropertyType DWord -Value 1 -Force | Out-Null
	New-ItemProperty -Path $catKey -Name 'Url' -PropertyType String -Value $catalog -Force | Out-Null
	New-ItemProperty -Path $catKey -Name 'ProviderName' -PropertyType String -Value 'OpenGov' -Force | Out-Null
	New-ItemProperty -Path $catKey -Name 'CatalogName' -PropertyType String -Value 'OpenGov Local Catalog' -Force | Out-Null
	Write-Info 'Trusted catalog registered.'

	# Try automated sideload of manifest (opens Word with add-in loaded)
	$devTool = 'office-addin-debugging'
	try {
		Write-Info 'Attempting automated sideload (may take a moment)...'
		npx --yes $devTool start "$dest" --app word --packager false --verbose | Out-Null
		Write-Info 'Sideload requested.'
	} catch {
		Write-Info 'Automated sideload not available; opening Word. Use Insert → My Add-ins → Shared Folder.'
		Start-Process winword.exe | Out-Null
	}
} catch {
	Write-Error $_
	exit 1
}


