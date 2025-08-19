param(
    [int]$Port = 3001
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
Write-Result 'health' $healthOk $healthDetails

$v = Get-Json "$base/api/version"
Write-Result 'version' ($v -and $v.version) ("version=" + ($v.version | Out-String).Trim())

$st = Invoke-WebRequest -UseBasicParsing -Uri "$base/api/troubleshoot" -TimeoutSec 5 -ErrorAction SilentlyContinue
Write-Result 'troubleshoot' ($st -and $st.StatusCode -eq 200) ("len=" + ($st.Content.Length))

$overallOk = $healthOk -and ($v -and $v.version)
if (-not $overallOk) {
    Write-Host "Smoke test FAILED. Open $base/api/troubleshoot and email contents to msorkin@opengov.com"
    exit 1
}

Write-Host 'Smoke test PASSED.'


