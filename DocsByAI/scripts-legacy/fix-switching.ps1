# Add SuperDoc reinitialization to role switching

$content = Get-Content viewer.html -Raw

# Find the switchUser function and add SuperDoc reinitialization
$oldPattern = @"
                    // Update button states based on new user role
                    updateButtonStates\(\);
                    
                    // Add notification
"@

$newReplacement = @"
                    // Update button states based on new user role
                    updateButtonStates();
                    
                    // Reinitialize SuperDoc with new role-based mode
                    if (currentDocumentId && currentSuperdoc) {
                        console.log('🔄 Reinitializing SuperDoc for new role:', currentUser.role);
                        loadSuperdoc(currentDocumentId, getCurrentUserRole());
                    }
                    
                    // Add notification
"@

$content = $content -replace $oldPattern, $newReplacement

Set-Content viewer.html $content
Write-Host "Added SuperDoc reinitialization to role switching"
