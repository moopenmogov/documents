$file = "viewer.html"
$lines = Get-Content $file -Encoding UTF8

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "Override Check-out") {
        $lines[$i] = "                        🔒 Override Check-out"
        break
    }
}

$lines | Set-Content $file -Encoding UTF8
Write-Host "Fixed emoji to lock icon"
