$file = "src\taskpane\taskpane.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Replace the old scenario-based logic with shared state matrix call
$oldPattern = "// Apply scenario-based button visibility \(independent of edit permissions\)\s+const currentScenario = detectCollaborationScenario\(\);\s+updateButtonVisibilityForScenario\(currentScenario\);"
$newLogic = "// Apply shared state matrix (replaces scenario logic)`n            await updateUIFromStateMatrix('word', getCurrentUser, getCurrentUserRole, currentDocumentState);"

$newContent = $content -replace $oldPattern, $newLogic

if ($newContent -ne $content) {
    $newContent | Set-Content $file -Encoding UTF8 -NoNewline
    Write-Host "Replaced old state logic with shared API call"
} else {
    Write-Host "Pattern not found - checking for different format"
}
