$file = "viewer.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Update function name and API endpoint
$content = $content -replace "async function overrideVendorCheckout", "async function overrideCheckout"
$content = $content -replace "api/vendor/override", "api/override"
$content = $content -replace "Overriding vendor checkout", "Overriding checkout"
$content = $content -replace "Document reclaimed from vendor", "Document reclaimed"
$content = $content -replace "Failed to override vendor checkout", "Failed to override checkout"
$content = $content -replace "Error overriding vendor checkout", "Error overriding checkout"

$content | Set-Content $file -Encoding UTF8 -NoNewline
Write-Host "Updated web viewer override function"
