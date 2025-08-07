# Enhance testModeToggle function for better debugging

$content = Get-Content viewer.html -Raw

# Find and replace the testModeToggle function
$oldPattern = @"
        window\.testModeToggle = function\(\) \{
            console\.log\('Testing mode toggle\.\.\.'\);
            const role = getCurrentUserRole\(\);
            const toolbar = document\.querySelector\('#superdoc-toolbar'\);
            console\.log\('Role:', role, 'Toolbar:', toolbar\);
            if \(toolbar\) console\.log\('Toolbar content:', toolbar\.innerHTML\);
            return \{ role, toolbar: !!toolbar \};
        \};
"@

$newReplacement = @"
        window.testModeToggle = function() {
            console.log('🧪 TESTING MODE TOGGLE...');
            console.log('='.repeat(50));
            
            const role = getCurrentUserRole();
            const superdoc = window.currentSuperdoc;
            const toolbar = document.querySelector('#superdoc-toolbar');
            
            console.log('📋 ROLE INFO:');
            console.log('  Current Role:', role);
            console.log('  Can Edit:', canCurrentUserEdit());
            console.log('  Expected Mode:', getSuperdocMode(role));
            
            console.log('📋 SUPERDOC INFO:');
            console.log('  SuperDoc Instance:', !!superdoc);
            if (superdoc) {
                console.log('  Current Mode:', superdoc.getDocumentMode ? superdoc.getDocumentMode() : 'unknown');
            }
            
            console.log('📋 TOOLBAR INFO:');
            console.log('  Toolbar Element:', !!toolbar);
            if (toolbar) {
                const editingDropdown = toolbar.querySelector('[aria-label*="dit"], select, [class*="mode"]');
                console.log('  Mode Dropdown Found:', !!editingDropdown);
                if (editingDropdown) {
                    console.log('  Dropdown Content:', editingDropdown.outerHTML.substring(0, 200));
                }
            }
            
            console.log('='.repeat(50));
            
            return {
                role: role,
                canEdit: canCurrentUserEdit(),
                expectedMode: getSuperdocMode(role),
                superdocExists: !!superdoc,
                toolbarExists: !!toolbar,
                currentMode: superdoc && superdoc.getDocumentMode ? superdoc.getDocumentMode() : 'unknown'
            };
        };
"@

$content = $content -replace $oldPattern, $newReplacement

Set-Content viewer.html $content
Write-Host "Enhanced testModeToggle function"
