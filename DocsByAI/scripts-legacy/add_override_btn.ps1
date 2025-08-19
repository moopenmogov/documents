$file = "src\taskpane\taskpane.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Add override button after cancel button (copy exact from web viewer)
$pattern = "(<button id=`"cancelBtn`".*?Cancel Check-out.*?</button>)"
$replacement = '$1' + "`n`n            <button id=`"overrideBtn`" class=`"button button-warning`" onclick=`"overrideVendorCheckout()`" style=`"display: none;`">`n                🔓 Override Check-out`n            </button>"

$newContent = $content -replace $pattern, $replacement, 'Singleline'

if ($newContent -ne $content) {
    $newContent | Set-Content $file -Encoding UTF8 -NoNewline
    Write-Host "Added override button HTML (copied from web viewer)"
} else {
    Write-Host "Pattern not found or button already exists"
}
