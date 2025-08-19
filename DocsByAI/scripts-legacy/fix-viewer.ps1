# Fix viewer.html - move getSuperdocMode function and add test function

$content = Get-Content viewer.html -Raw

# First, remove the existing getSuperdocMode function from its current location
$content = $content -replace 'window\.getSuperdocMode = function\(userRole\) \{[^}]+\};', ''

# Add the getSuperdocMode function right after the getEditMode function
$insertAfter = '        function getEditMode\(\) \{[^}]+\}'
$newFunction = @"

        // SuperDoc mode mapping - moved here to ensure it's available early
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
            console.log('Testing mode toggle visibility...');
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
                currentMode: superdoc ? superdoc.getDocumentMode() : 'unknown'
            };
        };
"@

$content = $content -replace $insertAfter, "`$0$newFunction"

# Save the file
Set-Content viewer.html $content

Write-Host "Fixed viewer.html - moved getSuperdocMode function and added testModeToggle function"
