param(
	[int]$Port = 3001,
	[int]$WebPort = 3002,
	[int]$AddinPort = 3000
)

$ErrorActionPreference = 'Stop'

function Get-Json($url) {
	try { return Invoke-RestMethod -Uri $url -TimeoutSec 5 } catch { return $null }
}

function Write-Result($name, $ok, $details) {
	$status = if ($ok) { 'OK' } else { 'FAIL' }
	Write-Host ("[{0}] {1} {2}" -f $status, $name, $details)
}

$base = "http://localhost:$Port"

$h = Get-Json "$base/api/health"
# Accept either shape: { ok: true, uptimeSec } or { status: 'ok', timestamp }
$healthOk = $false
$healthDetails = ''
if ($h) {
	if ($h.ok) {
		$healthOk = $true
		$healthDetails = "uptimeSec=" + (($h.uptimeSec | Out-String).Trim())
	} elseif (($h.status -as [string]) -eq 'ok') {
		$healthOk = $true
		$healthDetails = "status=ok ts=" + (($h.timestamp | Out-String).Trim())
	}
}
Write-Result 'api-health(3001)' $healthOk $healthDetails

$v = Get-Json "$base/api/version"
Write-Result 'api-version' ($v -and $v.version) ("version=" + ($v.version | Out-String).Trim())

$st = Invoke-WebRequest -UseBasicParsing -Uri "$base/api/troubleshoot" -TimeoutSec 5 -ErrorAction SilentlyContinue
Write-Result 'api-troubleshoot' ($st -and $st.StatusCode -eq 200) ("len=" + ($st.Content.Length))

# Web viewer (3002)
$webOk = $false
$webResp = Invoke-WebRequest -UseBasicParsing -Uri ("http://localhost:{0}/viewer.html" -f $WebPort) -TimeoutSec 5 -ErrorAction SilentlyContinue
if ($webResp -and $webResp.StatusCode -eq 200) { $webOk = $true }
Write-Result 'web-viewer(3002)' $webOk ("status=" + ($webResp.StatusCode))

# Add-in taskpane (3000) – HTTPS
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
$addinOk = $false
try {
	$addinResp = Invoke-WebRequest -UseBasicParsing -Uri ("https://localhost:{0}/src/taskpane/taskpane.html" -f $AddinPort) -TimeoutSec 5 -ErrorAction Stop
	$addinOk = ($addinResp.StatusCode -eq 200)
} catch { $addinResp = $null }
Write-Result 'addin-taskpane(3000)' $addinOk ("status=" + ($addinResp.StatusCode))

$overallOk = $healthOk -and ($v -and $v.version) -and $webOk -and $addinOk
if (-not $overallOk) {
    Write-Host "Smoke test FAILED. Check: http://localhost:$Port/api/health, http://localhost:$WebPort/viewer.html, https://localhost:$AddinPort/src/taskpane/taskpane.html"
    exit 1
}

Write-Host 'Smoke test PASSED.'


