$file = "src\taskpane\taskpane.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Add getCurrentUser function after getCurrentUserRole
$pattern = "(function getCurrentUserRole\(\) \{\s+return currentUser \? currentUser\.role : 'editor';\s+\})"
$replacement = '$1' + "`n`n        function getCurrentUser() {`n            return currentUser;`n        }"

$newContent = $content -replace $pattern, $replacement

if ($newContent -ne $content) {
    $newContent | Set-Content $file -Encoding UTF8 -NoNewline
    Write-Host "Added getCurrentUser helper function"
} else {
    Write-Host "Pattern not found or function may already exist"
}
