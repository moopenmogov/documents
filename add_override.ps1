# Read the entire file as raw text
$content = Get-Content 'src/taskpane/taskpane.html' -Raw

# Find the sendVendorBtn and add override button after it
$sendVendorPattern = '(\s+<button id="sendVendorBtn"[^>]*>[\s\S]*?</button>)'
$overrideButton = @'
            <button id="overrideBtn" class="button button-warning" onclick="overrideCheckout()" style="display: none;">
                🔓 Override Checkout
            </button>
'@

$replacement = "`$1`r`n$overrideButton"
$newContent = $content -replace $sendVendorPattern, $replacement

# Write back to file
$newContent | Set-Content 'src/taskpane/taskpane.html' -NoNewline

Write-Host "Override button added successfully"
