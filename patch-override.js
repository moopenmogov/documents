const fs = require('fs');
let s = fs.readFileSync('api-server.js','utf8');
const pattern = /app\.post\('\/api\/vendor\/override',[\s\S]*?\}\);/;
const replacement = pp.post('/api/vendor/override', (req, res) => {
    const { source } = req.body; // 'web' or 'word'
    const actingUser = source === 'web' ? currentWebUser : currentWordUser;
    if (!actingUser || actingUser.role !== 'editor') {
        return res.status(403).json({ success: false, error: 'Only editors can override checkouts' });
    }
    if (!documentState.isCheckedOut) {
        return res.status(400).json({ success: false, error: 'Not checked out' });
    }
    const previouslyCheckedOutBy = documentState.checkedOutBy;
    const previouslyCheckedOutUser = documentState.checkedOutUser;
    documentState.isCheckedOut = false;
    documentState.checkedOutBy = null;
    documentState.checkedOutAt = null;
    documentState.checkedOutUser = null;
    documentState.checkedOutUserId = null;
    documentState.vendorInfo = null;
    console.log( Editor override by  (). Previous lock: );
    broadcastSSE({
        type: 'vendor-checkout-overridden',
        message: 'Editor reclaimed document (override)',
        overriddenBy: { id: actingUser.id, name: actingUser.name, role: actingUser.role, source },
        previouslyCheckedOutBy,
        previouslyCheckedOutUser,
        timestamp: new Date().toISOString()
    });
    res.json({ success: true });
});;
if (!pattern.test(s)) { console.error('Override endpoint pattern not found'); process.exit(1); }
s = s.replace(pattern, replacement);
fs.writeFileSync('api-server.js', s);
console.log(' Override endpoint updated for editor-only universal override.');
