$file = "src\taskpane\taskpane.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Replace the incorrect closing structure
$content = $content -replace "(\s+fetchDocumentStatus\(\); // Refresh UI after override\s+)(\s+}\s+)", '$1                    }
                };
'

$content | Set-Content $file -Encoding UTF8 -NoNewline
Write-Host "Fixed SSE handler structure"
