$file = "src\taskpane\taskpane.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Add getCurrentUser function after line containing getCurrentUserRole
$lines = Get-Content $file -Encoding UTF8
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "function getCurrentUserRole") {
        # Find the closing brace of this function
        for ($j = $i + 1; $j -lt $lines.Count; $j++) {
            if ($lines[$j] -match "^\s*}\s*$") {
                # Insert after this closing brace
                $newLines = @()
                $newLines += $lines[0..$j]
                $newLines += ""
                $newLines += "        function getCurrentUser() {"
                $newLines += "            return currentUser;"
                $newLines += "        }"
                $newLines += $lines[($j+1)..($lines.Count-1)]
                
                $newLines | Set-Content $file -Encoding UTF8
                Write-Host "Added getCurrentUser function"
                exit 0
            }
        }
    }
}
Write-Host "Could not find insertion point"
