# Read the file
$content = Get-Content 'src/taskpane/taskpane.html' -Raw

# Find the end of checkinDocument function and add override function after it
$pattern = '(\s+}\s+// Cancel checkout \(unlock without saving\))'
$overrideFunction = @'

        // Override checkout (for editors to reclaim document)
        async function overrideCheckout() {
            console.log("🔓 Overriding checkout...");
            try {
                const response = await fetch("http://localhost:3001/api/vendor/override", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ source: "word" })
                });
                
                if (response.ok) {
                    showStatus('documentStatus', '✅ Document reclaimed successfully', 'success');
                    await fetchDocumentStatus();
                } else {
                    const error = await response.json();
                    showStatus('documentStatus', `❌ Failed to override checkout: ${error.error}`, 'error');
                }
            } catch (error) {
                console.error("Error overriding checkout:", error);
                showStatus('documentStatus', '❌ Error overriding checkout: ' + error.message, 'error');
            }
        }

        // Cancel checkout (unlock without saving)
'@

$replacement = "$overrideFunction`$1"
$newContent = $content -replace $pattern, $replacement

# Write back to file
$newContent | Set-Content 'src/taskpane/taskpane.html' -NoNewline

Write-Host "Override function added successfully"
