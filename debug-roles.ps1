# Add debugging to SuperDoc initialization

$content = Get-Content viewer.html -Raw

# Add debugging around SuperDoc initialization
$oldPattern = @"
                // Determine document mode based on user role \(with checkout override\)
                const userRole = getCurrentUserRole\(\);
                let documentMode = getSuperdocMode\(userRole\);
                
                // Override to viewing mode if document is checked out by someone else
                if \(currentDocumentState\.isCheckedOut && currentDocumentState\.checkedOutBy !== 'web'\) \{
                    documentMode = 'viewing';
                \}
"@

$newReplacement = @"
                // Determine document mode based on user role (with checkout override)
                const userRole = getCurrentUserRole();
                let documentMode = getSuperdocMode(userRole);
                
                console.log('🔍 SUPERDOC INIT DEBUG:');
                console.log('  User Role:', userRole);
                console.log('  Mapped Mode:', documentMode);
                console.log('  Checkout State:', currentDocumentState.isCheckedOut);
                console.log('  Checked Out By:', currentDocumentState.checkedOutBy);
                
                // Override to viewing mode if document is checked out by someone else
                if (currentDocumentState.isCheckedOut && currentDocumentState.checkedOutBy !== 'web') {
                    console.log('  🔒 OVERRIDE: Document checked out, forcing viewing mode');
                    documentMode = 'viewing';
                }
                
                console.log('  📋 FINAL MODE:', documentMode);
"@

$content = $content -replace $oldPattern, $newReplacement

Set-Content viewer.html $content
Write-Host "Added SuperDoc initialization debugging"
