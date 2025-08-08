$file = "src\taskpane\taskpane.html"
$lines = Get-Content $file -Encoding UTF8

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "function getCurrentUserRole") {
        # Find the closing brace
        for ($j = $i + 1; $j -lt $lines.Count; $j++) {
            if ($lines[$j] -match "^\s*}\s*$") {
                # Insert after this closing brace
                $lines = $lines[0..$j] + "" + "        function getCurrentUser() {" + "            return currentUser;" + "        }" + $lines[($j+1)..($lines.Count-1)]
                Write-Host "Added getCurrentUser function"
                $lines | Set-Content $file -Encoding UTF8
                exit 0
            }
        }
    }
}
Write-Host "Could not find insertion point"
