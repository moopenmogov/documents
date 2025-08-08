$file = "src\taskpane\taskpane.html"
$lines = Get-Content $file -Encoding UTF8

$startIndex = -1
$endIndex = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "MILESTONE 1: STATE DETECTION LOGIC") {
        $startIndex = $i
    }
    if ($lines[$i] -match "END MILESTONE 1 STATE DETECTION") {
        $endIndex = $i
        break
    }
}

if ($startIndex -ge 0 -and $endIndex -ge 0) {
    $newLines = @()
    $newLines += $lines[0..($startIndex-1)]
    $newLines += "        // ===== OLD STATE MANAGEMENT REMOVED ====="
    $newLines += "        // (Replaced with shared state matrix API)"
    $newLines += ""
    $newLines += $lines[($endIndex+1)..($lines.Count-1)]
    
    $newLines | Set-Content $file -Encoding UTF8
    Write-Host "Removed old state management functions"
} else {
    Write-Host "Could not find section boundaries"
}
