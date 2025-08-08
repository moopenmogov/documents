$file = "src\taskpane\taskpane.html"
$lines = Get-Content $file -Encoding UTF8

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "Apply scenario-based button visibility") {
        # Replace the next 2 lines with shared API call
        $lines[$i] = "            // Apply shared state matrix (replaces scenario logic)"
        $lines[$i+1] = "            await updateUIFromStateMatrix('word', getCurrentUser, getCurrentUserRole, currentDocumentState);"
        $lines[$i+2] = ""
        Write-Host "Replaced old state logic with shared API call"
        $lines | Set-Content $file -Encoding UTF8
        exit 0
    }
}
Write-Host "Could not find updateButtonStates logic to replace"
