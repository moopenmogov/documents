$file = "src\taskpane\taskpane.html"
$lines = Get-Content $file -Encoding UTF8

# Fix lines 814-818
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "fetchDocumentStatus.*after override") {
        $lines[$i+1] = "                    }"
        $lines[$i+2] = "                };"
        $lines[$i+3] = "                "
        $lines[$i+4] = "                eventSource.onerror = function(event) {"
        break
    }
}

$lines | Set-Content $file -Encoding UTF8
Write-Host "Final cleanup completed"
