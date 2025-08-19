$file = "src\taskpane\taskpane.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Add override button after cancel button
$pattern = "(<button id=`"cancelBtn`".*?Cancel Check-out\s*</button>)"
$replacement = '$1

            <button id="overrideBtn" class="button button-warning" onclick="overrideCheckout()" style="display: none;">
                🔓 Override Check-out
            </button>'

$newContent = $content -replace $pattern, $replacement, 'Singleline'

if ($newContent -ne $content) {
    $newContent | Set-Content $file -Encoding UTF8 -NoNewline
    Write-Host "✅ Added override button HTML"
} else {
    Write-Host "❌ Pattern not found"
}
