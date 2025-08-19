# Fix SuperDoc initialization in viewer.html

$content = Get-Content viewer.html -Raw

# Replace the hardcoded documentMode logic
$oldPattern = @"
                // Determine document mode based on checkout state
                const documentMode = \(currentDocumentState\.isCheckedOut && currentDocumentState\.checkedOutBy !== 'web'\) \? 'viewing' : 'editing';
"@

$newReplacement = @"
                // Determine document mode based on user role (with checkout override)
                const userRole = getCurrentUserRole();
                let documentMode = getSuperdocMode(userRole);
                
                // Override to viewing mode if document is checked out by someone else
                if (currentDocumentState.isCheckedOut && currentDocumentState.checkedOutBy !== 'web') {
                    documentMode = 'viewing';
                }
"@

$content = $content -replace $oldPattern, $newReplacement

Set-Content viewer.html $content
Write-Host "Updated SuperDoc initialization successfully"
