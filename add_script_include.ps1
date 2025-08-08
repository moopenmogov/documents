$file = "src\taskpane\taskpane.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Add state-matrix-client.js include after office.js
$pattern = "(<script type=`"text/javascript`" src=`"https://appsforoffice\.microsoft\.com/lib/1/hosted/office\.js`"></script>)"
$replacement = '$1' + "`n    <script src=`"../../state-matrix-client.js`"></script>"

$newContent = $content -replace $pattern, $replacement

if ($newContent -ne $content) {
    $newContent | Set-Content $file -Encoding UTF8 -NoNewline
    Write-Host "Added state-matrix-client.js include"
} else {
    Write-Host "Pattern not found - include may already exist"
}
