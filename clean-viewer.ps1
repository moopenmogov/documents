# Clean up viewer.html - remove duplicates and fix properly

$content = Get-Content viewer.html -Raw

# Remove ALL instances of getSuperdocMode and testModeToggle
$content = $content -replace '        // SuperDoc mode mapping - moved here to ensure it''s available early\s+window\.getSuperdocMode = function\(userRole\) \{[^}]+\};\s+', ''
$content = $content -replace '        // Test function for mode toggle visibility\s+window\.testModeToggle = function\(\) \{[^}]+\};\s+', ''
$content = $content -replace '        // Test the current mode toggle visibility\s+window\.testModeToggle = function\(\) \{[^}]+\};\s+', ''
$content = $content -replace 'window\.getSuperdocMode = function\(userRole\) \{[^}]+\};', ''

# Now add just ONE instance in the right place (after getEditMode)
$insertPoint = '(        function getEditMode\(\) \{\s+const role = getCurrentUserRole\(\);\s+return role === ''editor'' \? ''direct'' : ''suggesting'';\s+\})'

$newFunctions = @"

        // SuperDoc mode mapping - available early to prevent function not found errors
        window.getSuperdocMode = function(userRole) {
            switch(userRole) {
                case 'feedback': return 'suggesting';
                case 'editor': return 'editing'; 
                case 'viewer': return 'viewing';
                default: return 'viewing';
            }
        };

        // Test function for mode toggle visibility
        window.testModeToggle = function() {
            console.log('🧪 Testing mode toggle visibility...');
            const role = getCurrentUserRole();
            const superdoc = window.currentSuperdoc;
            const toolbar = document.querySelector('#superdoc-toolbar');
            
            console.log('Current role:', role);
            console.log('SuperDoc instance:', superdoc);
            console.log('Toolbar element:', toolbar);
            
            if (toolbar) {
                console.log('Toolbar HTML snippet:', toolbar.innerHTML.substring(0, 200));
                const modeElements = toolbar.querySelectorAll('[class*="mode"], [class*="toggle"], select, button');
                console.log('Potential mode elements:', modeElements);
            }
            
            return {
                role: role,
                superdocExists: !!superdoc,
                toolbarExists: !!toolbar,
                currentMode: superdoc && typeof superdoc.getDocumentMode === 'function' ? superdoc.getDocumentMode() : 'unknown'
            };
        };
"@

$content = $content -replace $insertPoint, "`$1$newFunctions"

Set-Content viewer.html $content

Write-Host "Cleaned up viewer.html - removed duplicates and added functions properly"
