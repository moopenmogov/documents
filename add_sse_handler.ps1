$file = "src\taskpane\taskpane.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Find the permission-changed handler and add vendor-checkout-overridden after it
$pattern = "(\s+}\s+else if \(data\.type === 'permission-changed'\)\s*{\s*.*?addNotification.*?}\s*)(})"
$replacement = '$1} else if (data.type === ''vendor-checkout-overridden'') {
                        console.log(''📡 WORD: Vendor checkout overridden'');
                        showStatus(''sseStatus'', `📡 ${data.message}`, ''success'');
                        fetchDocumentStatus(); // Refresh UI after override
                    $2'

$newContent = $content -replace $pattern, $replacement, "Singleline"

if ($newContent -ne $content) {
    $newContent | Set-Content $file -Encoding UTF8 -NoNewline
    Write-Host "✅ Added vendor-checkout-overridden SSE handler"
} else {
    Write-Host "❌ Pattern not found or already exists"
}
