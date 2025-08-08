$file = "src\taskpane\taskpane.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Simple find and replace approach - look for the permission-changed handler end
$pattern = "(addNotification\(\`Your access level changed to \$\{data\.role\}\`, 'info'\);\s+}\s+)(})"
$replacement = '$1} else if (data.type === ''vendor-checkout-overridden'') {
                        console.log(''WORD: Vendor checkout overridden'');
                        showStatus(''sseStatus'', `${data.message}`, ''success'');
                        fetchDocumentStatus();
                    $2'

$newContent = $content -replace $pattern, $replacement

if ($newContent -ne $content) {
    $newContent | Set-Content $file -Encoding UTF8 -NoNewline
    Write-Host "Added vendor-checkout-overridden handler"
} else {
    Write-Host "Pattern not found"
}
