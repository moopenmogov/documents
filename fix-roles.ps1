# Fix role functions in viewer.html

$content = Get-Content viewer.html -Raw

# Replace the getCurrentUserRole and canCurrentUserEdit functions
$oldPattern = @"
        // Get current user role for permission checks
        function getCurrentUserRole\(\) \{
            return window\.currentUser \? window\.currentUser\.role : 'editor'; // Default to editor if no user
        \}
        
        // Check if current user can edit
        function canCurrentUserEdit\(\) \{
            return getCurrentUserRole\(\) === 'editor';
        \}
"@

$newReplacement = @"
        // Role validation
        const VALID_ROLES = ['editor', 'viewer', 'feedback'];
        function validateRole(role) {
            return VALID_ROLES.includes(role);
        }

        // Get current user role for permission checks
        function getCurrentUserRole() {
            const role = window.currentUser?.role || 'viewer'; // Default to viewer
            return validateRole(role) ? role : 'viewer'; // Ensure role is valid
        }

        // SuperDoc mode mapping - maps user roles to SuperDoc document modes
        function getSuperdocMode(userRole) {
            switch(userRole) {
                case 'feedback': return 'suggesting';
                case 'editor': return 'editing';
                case 'viewer': return 'viewing';
                default: return 'viewing'; // Safe default
            }
        }
        
        // Check if current user can edit
        function canCurrentUserEdit() {
            const role = getCurrentUserRole();
            return role === 'editor' || role === 'feedback';
        }
"@

$content = $content -replace $oldPattern, $newReplacement

Set-Content viewer.html $content
Write-Host "Updated role functions successfully"
