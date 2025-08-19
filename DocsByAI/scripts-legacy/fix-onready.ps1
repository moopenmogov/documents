# Fix the onReady callback to use role-based mode

$content = Get-Content viewer.html -Raw

# Replace the hardcoded onReady logic
$oldPattern = @"
                        // Ensure the correct mode is applied after SuperDoc is ready
                        const currentMode = \(currentDocumentState\.isCheckedOut && currentDocumentState\.checkedOutBy !== 'web'\) \? 'viewing' : 'editing';
                        updateSuperdocMode\(currentMode\);
"@

$newReplacement = @"
                        // Ensure the correct role-based mode is applied after SuperDoc is ready
                        const userRole = getCurrentUserRole();
                        let currentMode = getSuperdocMode(userRole);
                        
                        // Override to viewing if checked out by someone else
                        if (currentDocumentState.isCheckedOut && currentDocumentState.checkedOutBy !== 'web') {
                            currentMode = 'viewing';
                        }
                        
                        console.log('🔄 ONREADY: Applying final mode:', currentMode, 'for role:', userRole);
                        updateSuperdocMode(currentMode);
"@

$content = $content -replace $oldPattern, $newReplacement

Set-Content viewer.html $content
Write-Host "Fixed onReady callback to use role-based mode"
