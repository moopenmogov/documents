# Fix the checkout logic to respect role-based modes

$content = Get-Content viewer.html -Raw

# Replace the hardcoded updateSuperdocMode calls
$oldPattern = @"
            // Update status messages and SuperDoc mode
            if \(!currentDocumentState\.isCheckedOut\) \{
                showStatus\('📄 Document available for checkout', 'info'\);
                updateSuperdocMode\('editing'\); // Allow editing when available
            \} else if \(currentDocumentState\.checkedOutBy === 'web'\) \{
                showStatus\('🔒 Document checked out by you', 'success'\);
                updateSuperdocMode\('editing'\); // Allow editing when I have it
            \} else \{
                showStatus\(`🔒 Document checked out by \$\{currentDocumentState\.checkedOutBy\} - Document is READ-ONLY`, 'error'\);
                updateSuperdocMode\('viewing'\); // Lock to read-only when someone else has it
            \}
"@

$newReplacement = @"
            // Update status messages and SuperDoc mode (respecting user roles)
            if (!currentDocumentState.isCheckedOut) {
                showStatus('📄 Document available for checkout', 'info');
                // Use role-based mode when document is available
                const userRole = getCurrentUserRole();
                const roleBased = getSuperdocMode(userRole);
                console.log('🔄 CHECKOUT: Document available, applying role-based mode:', roleBased, 'for role:', userRole);
                updateSuperdocMode(roleBased);
            } else if (currentDocumentState.checkedOutBy === 'web') {
                showStatus('🔒 Document checked out by you', 'success');
                // Use role-based mode when I have checkout
                const userRole = getCurrentUserRole();
                const roleBased = getSuperdocMode(userRole);
                console.log('🔄 CHECKOUT: Document checked out by me, applying role-based mode:', roleBased, 'for role:', userRole);
                updateSuperdocMode(roleBased);
            } else {
                showStatus(`🔒 Document checked out by ${currentDocumentState.checkedOutBy} - Document is READ-ONLY`, 'error');
                console.log('🔄 CHECKOUT: Document checked out by other, forcing viewing mode');
                updateSuperdocMode('viewing'); // Lock to read-only when someone else has it
            }
"@

$content = $content -replace $oldPattern, $newReplacement

Set-Content viewer.html $content
Write-Host "Fixed checkout logic to respect role-based modes"
