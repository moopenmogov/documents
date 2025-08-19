$file = "src\taskpane\taskpane.html"
$lines = Get-Content $file -Encoding UTF8

# Find the line with permission-changed handler closing brace
$insertIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "addNotification.*access level changed.*info") {
        # Look for the closing } of this handler
        for ($j = $i + 1; $j -lt $lines.Count; $j++) {
            if ($lines[$j] -match "^\s*}\s*$" -and $lines[$j+1] -match "^\s*}\s*else") {
                $insertIndex = $j
                break
            }
        }
        break
    }
}

if ($insertIndex -gt 0) {
    # Insert the new handler before the closing }
    $newHandler = @(
        "                    } else if (data.type === 'vendor-checkout-overridden') {",
        "                        console.log('📡 WORD: Vendor checkout overridden');",
        "                        showStatus('sseStatus', `📡 `${data.message}`, 'success');",
        "                        fetchDocumentStatus(); // Refresh UI after override"
    )
    
    $newLines = @()
    $newLines += $lines[0..($insertIndex-1)]
    $newLines += $newHandler
    $newLines += $lines[$insertIndex..($lines.Count-1)]
    
    $newLines | Set-Content $file -Encoding UTF8
    Write-Host "✅ Added vendor-checkout-overridden handler at line $insertIndex"
} else {
    Write-Host "❌ Could not find insertion point"
}
