$file = "src\taskpane\taskpane.html"
$lines = Get-Content $file -Encoding UTF8

# Add override button HTML after cancel button
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "Cancel Check-out") {
        # Find the closing </button> tag
        for ($j = $i + 1; $j -lt $lines.Count; $j++) {
            if ($lines[$j] -match "</button>") {
                # Insert override button after this
                $lines = $lines[0..$j] + "" + "            <button id=`"overrideBtn`" class=`"button button-warning`" onclick=`"overrideVendorCheckout()`" style=`"display: none;`">" + "                🔓 Override Check-out" + "            </button>" + $lines[($j+1)..($lines.Count-1)]
                break
            }
        }
        break
    }
}

# Add override function (exact copy from web viewer)
for ($i = $lines.Count - 1; $i -ge 0; $i--) {
    if ($lines[$i] -match "function cancelCheckout") {
        # Find the end of cancelCheckout function
        $braceCount = 0
        $foundStart = $false
        for ($j = $i; $j -lt $lines.Count; $j++) {
            if ($lines[$j] -match "{") { $braceCount++; $foundStart = $true }
            if ($lines[$j] -match "}") { $braceCount-- }
            if ($foundStart -and $braceCount -eq 0) {
                # Insert override function after this
                $lines = $lines[0..$j] + "" + "        // Override checkout (exact copy from web viewer)" + "        async function overrideVendorCheckout() {" + "            console.log(`"🔓 WORD: Calling override API...`");" + "            try {" + "                const response = await fetch(`"http://localhost:3001/api/vendor/override`", {" + "                    method: `"POST`"," + "                    headers: { `"Content-Type`": `"application/json`" }" + "                });" + "                " + "                if (response.ok) {" + "                    console.log(`"✅ WORD: Override successful`");" + "                    await fetchDocumentStatus();" + "                } else {" + "                    console.error(`"❌ WORD: Override failed:`", response.status);" + "                }" + "            } catch (error) {" + "                console.error(`"❌ WORD: Override error:`", error);" + "            }" + "        }" + $lines[($j+1)..($lines.Count-1)]
                break
            }
        }
        break
    }
}

$lines | Set-Content $file -Encoding UTF8
Write-Host "Added override button HTML and function (copied from web viewer)"
