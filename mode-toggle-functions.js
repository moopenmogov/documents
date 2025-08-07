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
                const modeElements = toolbar.querySelectorAll('select, button, [class*="mode"], [class*="toggle"]');
                console.log('Potential mode elements:', modeElements);
            }
            
            return {
                role: role,
                superdocExists: !!superdoc,
                toolbarExists: !!toolbar
            };
        };

        // Control mode toggle visibility based on user role
        function controlModeToggleVisibility() {
            const role = getCurrentUserRole();
            const toolbar = document.querySelector('#superdoc-toolbar');
            
            console.log('Controlling mode toggle visibility for role:', role);
            
            if (!toolbar) {
                console.log('No toolbar found for mode toggle control');
                return;
            }
            
            // Wait a moment for SuperDoc to fully render the toolbar
            setTimeout(() => {
                // Find all potential mode toggle elements
                const modeSelectors = toolbar.querySelectorAll('select, button, [class*="mode"], [class*="toggle"]');
                console.log('Found potential mode elements:', modeSelectors);
                
                // Hide mode toggle for non-editor roles
                if (role !== 'editor') {
                    modeSelectors.forEach(element => {
                        const text = element.textContent.toLowerCase();
                        const hasMode = text.includes('mode') || text.includes('edit') || text.includes('suggest');
                        
                        if (hasMode) {
                            element.style.display = 'none';
                            console.log('Hid mode toggle element for role:', role, element);
                        }
                    });
                    console.log('Mode toggle control applied for non-editor role:', role);
                } else {
                    console.log('Editor role - mode toggle remains visible');
                }
            }, 500); // Give SuperDoc time to render
        }
