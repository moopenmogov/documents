$file = "src\taskpane\taskpane.html"
$lines = Get-Content $file -Encoding UTF8

# Find the line with viewReadOnly function and add override function before it
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "// View read-only.*load latest without checkout") {
        # Insert override function before this line
        $newLines = @()
        $newLines += $lines[0..($i-1)]
        $newLines += "        // Override any checkout"
        $newLines += "        async function overrideCheckout() {"
        $newLines += "            console.log('🔓 WORD: Calling override API...');"
        $newLines += "            try {"
        $newLines += "                const response = await fetch('http://localhost:3001/api/override', {"
        $newLines += "                    method: 'POST',"
        $newLines += "                    headers: { 'Content-Type': 'application/json' },"
        $newLines += "                    body: JSON.stringify({ source: 'word' })"
        $newLines += "                });"
        $newLines += "                "
        $newLines += "                if (response.ok) {"
        $newLines += "                    console.log('✅ WORD: Override successful');"
        $newLines += "                    await fetchDocumentStatus();"
        $newLines += "                } else {"
        $newLines += "                    console.error('❌ WORD: Override failed:', response.status);"
        $newLines += "                }"
        $newLines += "            } catch (error) {"
        $newLines += "                console.error('❌ WORD: Override error:', error);"
        $newLines += "            }"
        $newLines += "        }"
        $newLines += ""
        $newLines += $lines[$i..($lines.Count-1)]
        
        $newLines | Set-Content $file -Encoding UTF8
        Write-Host "Added overrideCheckout function"
        exit 0
    }
}
Write-Host "Could not find insertion point"
