const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
let PDFLib = null; // lazy-loaded for compile endpoint

const app = express();
const PORT = 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files for exhibits (repo-seeded and user uploads of PDFs)
app.use('/exhibits', express.static(path.join(__dirname, 'exhibits')));

// Create directories if they don't exist
const defaultDocDir = './default-document';
const exhibitsDir = './exhibits';
const exhibitsUploadsDir = path.join(exhibitsDir, 'uploads');
const exhibitsDefaultsDir = path.join(exhibitsDir, 'defaults');
if (!fs.existsSync(defaultDocDir)) { fs.mkdirSync(defaultDocDir); }
if (!fs.existsSync(exhibitsDir)) { fs.mkdirSync(exhibitsDir); }
if (!fs.existsSync(exhibitsUploadsDir)) { fs.mkdirSync(exhibitsUploadsDir, { recursive: true }); }
if (!fs.existsSync(exhibitsDefaultsDir)) { fs.mkdirSync(exhibitsDefaultsDir, { recursive: true }); }

// Configure multer for file uploads (DOCX updates go to default document dir)
const storage = multer.diskStorage({
    destination: defaultDocDir,
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Helpers
function writeFileAtomic(targetPath, buffer) {
    const dir = path.dirname(targetPath);
    const tmp = path.join(dir, `.${path.basename(targetPath)}.${Date.now()}.tmp`);
    fs.writeFileSync(tmp, buffer);
    if (fs.existsSync(targetPath)) {
        try { fs.unlinkSync(targetPath); } catch (_) {}
    }
    fs.renameSync(tmp, targetPath);
}

async function convertDocxToPdf(docxPath) {
    // If test stub enabled, return a minimal PDF built via pdf-lib
    if (process.env.DOCX_PDF_STUB === '1') {
        if (!PDFLib) PDFLib = require('pdf-lib');
        const { PDFDocument, StandardFonts } = PDFLib;
        const d = await PDFDocument.create();
        const p = d.addPage([600, 800]);
        const f = await d.embedFont(StandardFonts.Helvetica);
        p.drawText('Stubbed DOCX->PDF', { x: 50, y: 750, size: 16, font: f });
        p.drawText(`Source: ${path.basename(docxPath)}`, { x: 50, y: 720, size: 12, font: f });
        return await d.save();
    }
    // Try LibreOffice (soffice) headless conversion
    const outDir = path.dirname(docxPath);
    const args = ['--headless', '--convert-to', 'pdf', '--outdir', outDir, docxPath];
    const bin = process.env.SOFFICE_BIN || 'soffice';
    await new Promise((resolve, reject) => {
        const proc = spawn(bin, args, { stdio: 'ignore' });
        proc.on('error', reject);
        proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('soffice failed'))));
    });
    const pdfPath = docxPath.replace(/\.docx$/i, '.pdf');
    const bytes = fs.readFileSync(pdfPath);
    try { fs.unlinkSync(pdfPath); } catch (_) {}
    return bytes;
}

// Exhibits index for uploads (ids -> metadata)
const EXHIBITS_INDEX_FILE = path.join(exhibitsUploadsDir, 'index.json');
let exhibitsIndex = {};
try {
    if (fs.existsSync(EXHIBITS_INDEX_FILE)) {
        exhibitsIndex = JSON.parse(fs.readFileSync(EXHIBITS_INDEX_FILE, 'utf8')) || {};
    }
} catch (_) { exhibitsIndex = {}; }
function saveExhibitsIndex() {
    try { fs.writeFileSync(EXHIBITS_INDEX_FILE, JSON.stringify(exhibitsIndex, null, 2)); } catch (_) {}
}
function listDefaultExhibits() {
    try {
        const files = fs.readdirSync(exhibitsDefaultsDir).filter(f => f.toLowerCase().endsWith('.pdf'));
        return files.map(f => ({ filename: f, path: path.join(exhibitsDefaultsDir, f) }));
    } catch (_) { return []; }
}
function sweepOldUploads(ttlHours = 24) {
    const cutoff = Date.now() - ttlHours * 3600 * 1000;
    Object.entries(exhibitsIndex).forEach(([id, meta]) => {
        try {
            const t = new Date(meta.createdAt).getTime();
            if (isFinite(t) && t < cutoff) {
                if (fs.existsSync(meta.path)) { fs.unlinkSync(meta.path); }
                delete exhibitsIndex[id];
            }
        } catch (_) {}
    });
    saveExhibitsIndex();
}
// Run sweep on start and hourly
try { sweepOldUploads(Number(process.env.EXHIBITS_TTL_HOURS || 24)); } catch (_) {}
setInterval(() => { try { sweepOldUploads(Number(process.env.EXHIBITS_TTL_HOURS || 24)); } catch (_) {} }, 3600 * 1000);

// Store current document info and checkout state
let currentDocument = {
    id: null,
    filename: null,
    filePath: null,
    lastUpdated: null
};

// Document checkout state management - Enhanced for platform users
let documentState = {
    isCheckedOut: false,
    checkedOutBy: null,      // 'word' or 'web'
    checkedOutAt: null,
    checkedOutUser: null,    // user object who checked it out
    checkedOutUserId: null,  // user ID for reference
    webUser: null,           // current web user (for context)
    wordUser: null           // current word user (for context)
};

// Mock user system - Platform-specific users
let webUsers = {
    'user1': { id: 'user1', name: 'Warren Peace', email: 'warren@opengov.com', role: 'editor' },
    'user3': { id: 'user3', name: 'Fun E. Guy', email: 'funguy@opengov.com', role: 'editor' },
    'user2': { id: 'user2', name: 'Gettysburger King', email: 'gettysburger@opengov.com', role: 'viewer' },
    'user5': { id: 'user5', name: 'Yuri Lee Laffed', email: 'reese@opengov.com', role: 'suggester' },
    'vendor1': { id: 'vendor1', name: 'Hoo R. U', email: 'moti@real.builders', role: 'vendor', vendor: 'Moti\'s Builders' }
};

// Use the same canonical 4 users for Word as for Web (names and IDs match)
let wordUsers = { ...webUsers };

// Combined user pool for reference
let allUsers = { ...webUsers, ...wordUsers };

// Current active users per platform
let currentWebUser = webUsers['user1']; // Default to Warren Peace (editor)
let currentWordUser = wordUsers['user1']; // Default to Warren Peace (editor)

// DEBUG: Verify default users have editor role
console.log('🐛 USER SETUP DEBUG:', {
    webUser: currentWebUser,
    wordUser: currentWordUser,
    webUserRole: currentWebUser?.role,
    wordUserRole: currentWordUser?.role
});

// Legacy support - points to web user for backward compatibility
let currentUser = currentWebUser;

// Initialize document state with current users
documentState.webUser = currentWebUser;
documentState.wordUser = currentWordUser;

// Document permissions
let documentPermissions = {};

// Document approvals (per document per user)
// Shape: { [documentId]: { [userId]: { status: 'approved'|'unapproved', approvedBy, approvedAt } } }
let documentApprovals = {};

const APPROVALS_FILE = './approvals.json';

if (fs.existsSync(APPROVALS_FILE)) {
  const loaded = JSON.parse(fs.readFileSync(APPROVALS_FILE));
  // Validate: Reset approvals if they mismatch current state (e.g., checkout changed)
  Object.keys(loaded).forEach(docId => {
    const currentState = documentState[docId] || {}; // From existing documentState
    if (currentState.isCheckedOut) {
      console.log(`⚠️ Resetting approvals for checked-out doc ${docId}`);
      loaded[docId] = {}; // Clear to match state machine
    }
  });
  documentApprovals = loaded;
  console.log('✅ Loaded and validated approvals from file');
}

// Store SSE connections
let sseConnections = [];

// Feature flags (shared across platforms)
// Minimal example: ids should match those in new-feature-banner text JSON
let featureFlags = {
    'newFeatureBanner': { id: 'newFeatureBanner', enabled: false }
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SSE endpoint for real-time events
app.get('/api/events', (req, res) => {
    console.log('📡 New SSE connection established');
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Capture client metadata for scoped broadcasts
    const platform = (req.query.platform || 'unknown').toString();
    const clientId = (req.query.clientId || ('c-' + Math.random().toString(36).slice(2))).toString();
    sseConnections.push({ res, platform, clientId });
    
    // Send initial connection message
    res.write('data: {"type":"connected","message":"SSE connected successfully","timestamp":"' + new Date().toISOString() + '"}\n\n');
    
    // Handle client disconnect
    req.on('close', () => {
        console.log('📡 SSE connection closed');
        sseConnections = sseConnections.filter(c => c.res !== res);
    });
});

// Broadcast function for sending events to all connected clients
function broadcastSSE(event) {
    const eventData = JSON.stringify(event);
    console.log('📡 Broadcasting SSE event:', event.type);
    
    sseConnections.forEach((conn, index) => {
        try {
            // If event targets a specific platform, only send to those clients
            if (event.platform && conn.platform && event.platform !== conn.platform) return;
            conn.res.write(`data: ${eventData}\n\n`);
        } catch (error) {
            console.log('📡 Removing dead SSE connection');
            sseConnections.splice(index, 1);
        }
    });
}

// Test ping endpoint
app.post('/api/ping', (req, res) => {
    const { source } = req.body;
    
    broadcastSSE({
        type: 'ping',
        message: `Ping from ${source || 'unknown'}!`,
        timestamp: new Date().toISOString(),
        source: source
    });
        
        res.json({ 
            success: true, 
        message: 'Ping broadcast to all clients',
        connectedClients: sseConnections.length
    });
});

// Get current document status and checkout state (enhanced with platform users)
app.get('/api/status', (req, res) => {
    res.json({
        currentDocument: currentDocument,
        checkoutState: {
            ...documentState,
            // Ensure current users are always up to date in status
            webUser: currentWebUser,
            wordUser: currentWordUser
        },
        features: Object.values(featureFlags),
        platformUsers: {
            web: currentWebUser,
            word: currentWordUser
        },
        timestamp: new Date().toISOString()
    });
});

// Checkout document for editing
app.post('/api/checkout', (req, res) => {
    const { source } = req.body; // 'word' or 'web'
    
    // Check if already checked out
    if (documentState.isCheckedOut) {
        return res.status(409).json({
            success: false,
            error: 'Document is already checked out',
            checkedOutBy: documentState.checkedOutBy,
            checkedOutAt: documentState.checkedOutAt
        });
    }
    
    // Determine which user is checking out based on platform
    const checkoutUser = source === 'web' ? currentWebUser : currentWordUser;
    // Disallow viewer role from performing checkout
    if (checkoutUser?.role === 'viewer') {
        return res.status(403).json({
            success: false,
            error: 'Viewers cannot check out documents'
        });
    }
    
    // Check out the document with enhanced user tracking
    documentState.isCheckedOut = true;
    documentState.checkedOutBy = source;
    documentState.checkedOutAt = new Date().toISOString();
    documentState.checkedOutUser = checkoutUser;
    documentState.checkedOutUserId = checkoutUser.id;
    documentState.webUser = currentWebUser;   // Always track current platform users
    documentState.wordUser = currentWordUser;
    
    // Broadcast enhanced checkout event with user context
    broadcastSSE({
        type: 'document-checked-out',
        message: `Document checked out by ${checkoutUser.name} (${source})`,
        checkedOutBy: source,
        checkedOutUser: checkoutUser,
        checkedOutUserId: checkoutUser.id,
        checkedOutAt: documentState.checkedOutAt,
        webUser: currentWebUser,
        wordUser: currentWordUser,
        timestamp: new Date().toISOString()
    });
    
    console.log(`📋 Document checked out by: ${checkoutUser.name} (${source} platform)`);
    
    res.json({
        success: true,
        message: 'Document checked out successfully',
        checkoutState: documentState
    });
});

// Save document progress (while keeping checkout)
app.post('/api/save-progress', (req, res) => {
    const { source, docx, filename, userId: requestedUserId } = req.body;
    
    // Check if document is checked out
    if (!documentState.isCheckedOut) {
        return res.status(400).json({
            success: false,
            error: 'Document must be checked out to save progress'
        });
    }
    
    // Allow same user to act across platforms: verify by user id, not platform
    let actor = source === 'web' ? currentWebUser : currentWordUser;
    if (requestedUserId && (webUsers[requestedUserId] || wordUsers[requestedUserId])) {
        actor = webUsers[requestedUserId] || wordUsers[requestedUserId];
    }
    if (documentState.checkedOutUserId && actor?.id !== documentState.checkedOutUserId) {
        return res.status(403).json({
            success: false,
            error: 'Only the user who checked out the document can save progress',
            checkedOutBy: documentState.checkedOutBy
        });
    }
    
    try {
        // Save the document if docx data provided
        if (docx) {
            const timestamp = Date.now();
            const fileName = filename || `progress-save-${timestamp}.docx`;
            const filePath = path.join(defaultDocDir, fileName);
            
            // Write base64 data to file
            const buffer = Buffer.from(docx, 'base64');
            fs.writeFileSync(filePath, buffer);
            
            // Update current document info
            currentDocument.id = `doc-${timestamp}`;
            currentDocument.filename = fileName;
            currentDocument.filePath = filePath;
            currentDocument.lastUpdated = new Date().toISOString();
            
            console.log(`💾 Progress saved by ${source}: ${fileName}`);
        }
        
        // Broadcast save event (document stays checked out)
        broadcastSSE({
            type: 'document-saved',
            message: `Document progress saved by ${source}`,
            savedBy: source,
            filename: currentDocument.filename,
            timestamp: new Date().toISOString(),
            stillCheckedOut: true
        });
            
            res.json({
                success: true,
            message: 'Progress saved successfully',
            currentDocument: currentDocument,
            checkoutState: documentState
        });
        
    } catch (error) {
        console.error('Save progress error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save progress: ' + error.message
        });
    }
});

// Check-in document (save and unlock)
app.post('/api/checkin', (req, res) => {
    const { source, docx, filename, userId: requestedUserId } = req.body;
    
    // Check if document is checked out
    if (!documentState.isCheckedOut) {
        return res.status(400).json({
            success: false,
            error: 'Document is not checked out'
        });
    }
    
    // Allow same user to act across platforms: verify by user id, not platform
    let actor = source === 'web' ? currentWebUser : currentWordUser;
    console.log('🔐 CHECKIN attempt:', {
        requestedUserId,
        platformSource: source,
        platformUser: actor?.id,
        checkedOutUserId: documentState.checkedOutUserId
    });
    if (requestedUserId && (webUsers[requestedUserId] || wordUsers[requestedUserId])) {
        actor = webUsers[requestedUserId] || wordUsers[requestedUserId];
    }
    if (documentState.checkedOutUserId && actor?.id !== documentState.checkedOutUserId) {
        console.log('⛔ CHECKIN denied: actor mismatch', { actorId: actor?.id, expected: documentState.checkedOutUserId });
        return res.status(403).json({
            success: false,
            error: 'Only the user who checked out the document can check it in',
            checkedOutBy: documentState.checkedOutBy
        });
    }
    
    try {
        // Save the document if docx data provided
        if (docx) {
            const timestamp = Date.now();
            const fileName = filename || `checkin-${timestamp}.docx`;
            const filePath = path.join(defaultDocDir, fileName);
            
            // Write base64 data to file
            const buffer = Buffer.from(docx, 'base64');
            fs.writeFileSync(filePath, buffer);
            
            // Update current document info
            currentDocument.id = `doc-${timestamp}`;
            currentDocument.filename = fileName;
            currentDocument.filePath = filePath;
            currentDocument.lastUpdated = new Date().toISOString();
            
            console.log(`✅ Document checked in by ${source}: ${fileName}`);
        }
        
        // Clear checkout state (unlock document)
        const previouslyCheckedOutBy = documentState.checkedOutBy;
        documentState.isCheckedOut = false;
        documentState.checkedOutBy = null;
        documentState.checkedOutAt = null;
        documentState.checkedOutUser = null;
        documentState.checkedOutUserId = null;
        
        // Broadcast check-in event
        broadcastSSE({
            type: 'document-checked-in',
            message: `Document checked in by ${source}`,
            checkinBy: source,
            filename: currentDocument.filename,
            timestamp: new Date().toISOString(),
            previouslyCheckedOutBy: previouslyCheckedOutBy
        });
        
        res.json({
            success: true,
            message: 'Document checked in successfully',
            currentDocument: currentDocument,
            checkoutState: documentState
        });
        
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check in document: ' + error.message
        });
    }
});

// Cancel checkout (unlock without saving)
app.post('/api/cancel-checkout', (req, res) => {
    const { source, userId: requestedUserId } = req.body;
    
    // Check if document is checked out
    if (!documentState.isCheckedOut) {
        return res.status(400).json({
            success: false,
            error: 'Document is not checked out'
        });
    }
    
    // Check if the source is the one who checked it out
    let actor = source === 'web' ? currentWebUser : currentWordUser;
    console.log('🔐 CANCEL attempt:', {
        requestedUserId,
        platformSource: source,
        platformUser: actor?.id,
        checkedOutUserId: documentState.checkedOutUserId
    });
    if (requestedUserId && (webUsers[requestedUserId] || wordUsers[requestedUserId])) {
        actor = webUsers[requestedUserId] || wordUsers[requestedUserId];
    }
    if (documentState.checkedOutUserId && actor?.id !== documentState.checkedOutUserId) {
        console.log('⛔ CANCEL denied: actor mismatch', { actorId: actor?.id, expected: documentState.checkedOutUserId });
        return res.status(403).json({
            success: false,
            error: 'Only the user who checked out the document can cancel the checkout',
            checkedOutBy: documentState.checkedOutBy
        });
    }
    
    // Clear checkout state (unlock document) WITHOUT saving
    const previouslyCheckedOutBy = documentState.checkedOutBy;
    documentState.isCheckedOut = false;
    documentState.checkedOutBy = null;
    documentState.checkedOutAt = null;
    documentState.checkedOutUser = null;
    documentState.checkedOutUserId = null;
    
    console.log(`❌ Checkout cancelled by ${source} (no save)`);
    
    // Broadcast checkout cancelled event
    broadcastSSE({
        type: 'checkout-cancelled',
        message: `Checkout cancelled by ${source}`,
        cancelledBy: source,
        timestamp: new Date().toISOString(),
        previouslyCheckedOutBy: previouslyCheckedOutBy
    });
    
    res.json({
        success: true,
        message: 'Checkout cancelled successfully',
        checkoutState: documentState
    });
});

// Send document to vendor
app.post('/api/vendor/send', (req, res) => {
    const { vendor, name, email, notes, source } = req.body;
    
    // REMOVED: Auto-locking behavior - vendors are now just invited, document stays unlocked
    // Store vendor invitation info without locking the document
    const vendorInvitation = { 
        vendor, 
        name, 
        email, 
        notes: notes || '', 
        sentBy: source, 
        sentAt: new Date().toISOString() 
    };
    
    console.log(`📤 Vendor invitation sent: ${vendor} (${name})`);
    if (notes) {
        console.log(`📝 Notes: ${notes}`);
    }
    
    broadcastSSE({
        type: 'vendor-invited',
        message: `Vendor ${vendor} has been invited to redline`,
        vendorInvitation: vendorInvitation,
        timestamp: new Date().toISOString()
    });
    
    res.json({ success: true, vendorInvitation: vendorInvitation });
});

// Override any checkout (generic)
app.post('/api/override', (req, res) => {
    const { source } = req.body;
    
    if (!documentState.isCheckedOut) {
        return res.status(400).json({ success: false, error: 'Document not checked out' });
    }
    
    documentState.isCheckedOut = false;
    documentState.checkedOutBy = null;
    documentState.vendorInfo = null;
    
    console.log(`🔓 Editor override by ${source}`);
    
    broadcastSSE({
        type: 'vendor-checkout-overridden',
        message: 'Editor reclaimed document from vendor',
        timestamp: new Date().toISOString()
    });
    
    res.json({ success: true });
});

// Upload DOCX from Word add-in
app.post('/api/upload-docx', (req, res) => {
    try {
        const { docx, filename } = req.body;
        
        if (!docx) {
            return res.status(400).json({ error: 'No DOCX data provided' });
        }
        
        // Convert base64 to file
        const timestamp = Date.now();
        const fileName = filename || `word-document-${timestamp}.docx`;
        const filePath = path.join(defaultDocDir, fileName);
        
        // Write base64 data to file
        const buffer = Buffer.from(docx, 'base64');
        fs.writeFileSync(filePath, buffer);
        
        // Update current document
        currentDocument = {
            id: `doc-${timestamp}`,
            filename: fileName,
            filePath: filePath,
            lastUpdated: new Date().toISOString()
        };
        
        console.log(`✅ DOCX uploaded: ${fileName} (${buffer.length} bytes)`);
        
        // Broadcast SSE event to notify all clients
        broadcastSSE({
            type: 'document-uploaded',
            message: `Document uploaded: ${fileName}`,
            documentId: currentDocument.id,
            filename: fileName,
            timestamp: new Date().toISOString()
        });
        
        res.json({ 
            success: true, 
            documentId: currentDocument.id,
            filename: fileName,
            message: 'Document uploaded successfully'
        });
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Replace default document (DOCX) with atomic write
// POST /api/replace-default { base64Docx, originalFilename }
app.post('/api/replace-default', (req, res) => {
    try {
        const { base64Docx, originalFilename } = req.body || {};
        if (!base64Docx) {
            return res.status(400).json({ error: 'missing_body', message: 'base64Docx required' });
        }
        // Basic type validation by extension of provided filename
        if (originalFilename && !/\.docx$/i.test(originalFilename)) {
            return res.status(400).json({ error: 'unsupported_media_type', message: 'Upload a .docx file' });
        }

        const buffer = Buffer.from(base64Docx, 'base64');
        const targetPath = path.join(defaultDocDir, 'current.docx');
        writeFileAtomic(targetPath, buffer);

        // Update currentDocument metadata
        const ts = Date.now();
        currentDocument = {
            id: `doc-${ts}`,
            filename: originalFilename || 'current.docx',
            filePath: targetPath,
            lastUpdated: new Date().toISOString()
        };

        broadcastSSE({
            type: 'document-uploaded',
            message: `Default document replaced: ${currentDocument.filename}`,
            documentId: currentDocument.id,
            filename: currentDocument.filename,
            timestamp: new Date().toISOString()
        });

        res.json({ success: true, currentDocument });
    } catch (e) {
        console.error('replace-default error:', e);
        res.status(500).json({ error: 'replace_default_failed' });
    }
});

// Upload an exhibit (PDF only)
// POST /api/upload-exhibit { base64Pdf, originalFilename }
app.post('/api/upload-exhibit', (req, res) => {
    try {
        const { base64Pdf, originalFilename, userId } = req.body || {};
        if (!base64Pdf) return res.status(400).json({ error: 'missing_body', message: 'base64Pdf required' });
        if (originalFilename && !/\.pdf$/i.test(originalFilename)) return res.status(400).json({ error: 'unsupported_media_type', message: 'Upload a .pdf file' });
        const buffer = Buffer.from(base64Pdf, 'base64');
        // Per-file size cap: 20 MB
        if (buffer.length > 20 * 1024 * 1024) return res.status(400).json({ error: 'file_too_large', maxBytes: 20 * 1024 * 1024 });
        // Per-user quotas (defaults aligned to prototype limits)
        const maxFiles = Number(process.env.EXHIBITS_MAX_FILES_PER_USER || 2);
        const maxBytes = Number(process.env.EXHIBITS_MAX_BYTES_PER_USER || (100 * 1024 * 1024));
        const owner = (userId && String(userId)) || 'anonymous';
        let userFiles = 0; let userBytes = 0;
        Object.values(exhibitsIndex).forEach((m) => { if ((m.userId || 'anonymous') === owner) { userFiles += 1; userBytes += Number(m.size || 0); } });
        if (userFiles + 1 > maxFiles) return res.status(400).json({ error: 'quota_exceeded', reason: 'max_files', maxFiles });
        if (userBytes + buffer.length > maxBytes) return res.status(400).json({ error: 'quota_exceeded', reason: 'max_bytes', maxBytes });
        const id = `exh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const filename = originalFilename || `${id}.pdf`;
        const p = path.join(exhibitsUploadsDir, filename);
        writeFileAtomic(p, buffer);
        const meta = { id, path: p, filename, originalFilename: originalFilename || filename, size: buffer.length, createdAt: new Date().toISOString(), userId: owner };
        exhibitsIndex[id] = meta;
        saveExhibitsIndex();
        res.json({ success: true, exhibit: meta });
    } catch (e) {
        res.status(500).json({ error: 'upload_exhibit_failed' });
    }
});

// List exhibits
// GET /api/exhibits/list
app.get('/api/exhibits/list', (req, res) => {
    try {
        const defaults = listDefaultExhibits();
        const uploads = Object.values(exhibitsIndex).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ success: true, defaults, uploads });
    } catch (e) {
        res.status(500).json({ error: 'list_exhibits_failed' });
    }
});

// GET /api/exhibits/limits
app.get('/api/exhibits/limits', (req, res) => {
    try {
        const maxFiles = Number(process.env.EXHIBITS_MAX_FILES_PER_USER || 2);
        const maxBytes = Number(process.env.EXHIBITS_MAX_BYTES_PER_USER || (100 * 1024 * 1024));
        const perFileMax = 20 * 1024 * 1024;
        const ttlHours = Number(process.env.EXHIBITS_TTL_HOURS || 24);
        res.json({ success: true, limits: { maxFiles, maxBytes, perFileMax, ttlHours } });
    } catch (e) {
        res.status(500).json({ error: 'limits_failed' });
    }
});

// Delete an uploaded exhibit by id
// POST /api/exhibits/delete { id }
app.post('/api/exhibits/delete', (req, res) => {
    try {
        const { id } = req.body || {};
        if (!id || !exhibitsIndex[id]) return res.status(404).json({ error: 'exhibit_not_found' });
        const meta = exhibitsIndex[id];
        try { if (fs.existsSync(meta.path)) fs.unlinkSync(meta.path); } catch (_) {}
        delete exhibitsIndex[id];
        saveExhibitsIndex();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'delete_exhibit_failed' });
    }
});
// Serve DOCX file to SuperDoc viewer
app.get('/api/document/:documentId', (req, res) => {
    try {
        if (!currentDocument.filePath || !fs.existsSync(currentDocument.filePath)) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `inline; filename="${currentDocument.filename}"`);
        
        const fileStream = fs.createReadStream(currentDocument.filePath);
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('❌ Document serve error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get current document info
app.get('/api/current-document', (req, res) => {
    res.json(currentDocument);
});

// Get default document endpoint
app.get('/api/default-document', (req, res) => {
    const defaultFile = 'CONTRACT FOR CONTRACTS.docx';
    const defaultPath = path.join(defaultDocDir, defaultFile);

    if (!fs.existsSync(defaultPath)) {
        return res.status(404).json({ error: 'Default document not found' });
    }

    const hasCurrent = currentDocument.filePath && fs.existsSync(currentDocument.filePath);
    if (!hasCurrent) {
        // Only set the default as the current document if there is no current
        currentDocument = {
            id: 'default-doc',
            filename: defaultFile,
            filePath: defaultPath,
            lastUpdated: new Date().toISOString()
        };
        console.log('✅ Default document set (no prior current):', defaultFile);
        // Broadcast only when we actually set the default
        broadcastSSE({
            type: 'document-uploaded',
            message: `Default document available: ${defaultFile}`,
            documentId: currentDocument.id,
            filename: defaultFile,
            timestamp: new Date().toISOString()
        });
        return res.json(currentDocument);
    }

    // If there is already a current document, return it (web viewer should show current doc)
    console.log('✅ Returning current document to web viewer:', currentDocument.filename);
    return res.json(currentDocument);
});

// Direct .docx endpoint with stable extension for Word protocol (supports GET and HEAD)
app.get('/api/document/:documentId.docx', (req, res) => {
    try {
        if (!currentDocument.filePath || !fs.existsSync(currentDocument.filePath)) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const stat = fs.statSync(currentDocument.filePath);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `inline; filename="${currentDocument.filename || 'document.docx'}"`);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        if (req.method === 'HEAD') {
            return res.status(200).end();
        }

        const fileStream = fs.createReadStream(currentDocument.filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('❌ Document serve (.docx) error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Also respond to HEAD for the .docx endpoint (some clients probe before fetching)
app.head('/api/document/:documentId.docx', (req, res) => {
    try {
        if (!currentDocument.filePath || !fs.existsSync(currentDocument.filePath)) {
            return res.status(404).end();
        }
        const stat = fs.statSync(currentDocument.filePath);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `inline; filename="${currentDocument.filename || 'document.docx'}"`);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.status(200).end();
    } catch (_) {
        return res.status(500).end();
    }
});

// Update document from web viewer (placeholder for future bidirectional sync)
app.post('/api/update-document', upload.single('docx'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Update current document reference
        currentDocument.filePath = req.file.path;
        currentDocument.filename = req.file.originalname;
        currentDocument.lastUpdated = new Date().toISOString();
        
        console.log(`✅ Document updated: ${req.file.originalname}`);
        
        res.json({
            success: true,
            message: 'Document updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get updated document for Word add-in
app.get('/api/get-updated-docx', (req, res) => {
    try {
        if (!currentDocument.filePath || !fs.existsSync(currentDocument.filePath)) {
            // Fallback: attempt to load default document automatically
            const defaultFile = 'CONTRACT FOR CONTRACTS.docx';
            const defaultPath = path.join(defaultDocDir, defaultFile);
            if (fs.existsSync(defaultPath)) {
                currentDocument = {
                    id: 'default-doc',
                    filename: defaultFile,
                    filePath: defaultPath,
                    lastUpdated: new Date().toISOString()
                };
            } else {
                return res.status(404).json({ error: 'No document available' });
            }
        }
        
        // Read file and convert to base64
        const fileBuffer = fs.readFileSync(currentDocument.filePath);
        const base64 = fileBuffer.toString('base64');
        
        res.json({
            docx: base64,
            filename: currentDocument.filename,
            lastUpdated: currentDocument.lastUpdated
        });
        
    } catch (error) {
        console.error('❌ Get document error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===== COMPILE API =====
// Merge a primary PDF (client-provided or generated from current DOCX) with exhibit PDFs
// POST /api/compile { base64Pdf?, primary?, exhibitPath?, exhibits? }
app.post('/api/compile', async (req, res) => {
    try {
        const { base64Pdf, primary, exhibitPath, exhibits, exhibitsById } = req.body || {};
        if (!PDFLib) PDFLib = require('pdf-lib');
        const { PDFDocument } = PDFLib;

        // Determine primary bytes
        let primaryBytes = null;
        let includePrimary = true;
        if (primary && primary.type === 'current') {
            // generate from default-document/current.docx
            const currentPath = path.join(defaultDocDir, 'current.docx');
            if (!fs.existsSync(currentPath)) {
                return res.status(400).json({ error: 'default_document_missing', message: 'No default document found. Use “Replace default document” to upload a .docx, then try again.' });
            }
            includePrimary = primary.include !== false;
            primaryBytes = await convertDocxToPdf(currentPath);
        } else if (typeof base64Pdf === 'string' && base64Pdf.length > 0) {
            includePrimary = true;
            primaryBytes = Buffer.from(base64Pdf, 'base64');
        } else {
            return res.status(400).json({ error: 'base64Pdf_or_primary_required' });
        }

        const primaryDoc = await PDFDocument.load(primaryBytes);

        let merged = primary;
        const mergedDoc = await PDFDocument.create();
        const addDocPages = async (doc) => {
            const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
            pages.forEach(p => mergedDoc.addPage(p));
        };
        if (includePrimary) {
            await addDocPages(primaryDoc);
        }

        // helper: resolve exhibit path
        const resolveExhibitPath = (inputPath) => path.resolve(inputPath);

        // single exhibitPath for backward compatibility with earlier clients
        if (exhibitPath && !exhibits) {
            const abs = resolveExhibitPath(exhibitPath);
            if (!fs.existsSync(abs)) {
                return res.status(400).json({ error: 'exhibit_not_found', path: abs });
            }
            const exhibitBytes = await fs.promises.readFile(abs);
            const exhibitDoc = await PDFDocument.load(exhibitBytes);
            await addDocPages(exhibitDoc);
        }

        // If exhibitsById provided, resolve ids -> paths using uploads index and defaults directory
        let resolvedExhibits = Array.isArray(exhibits) ? exhibits.slice() : [];
        if (!Array.isArray(exhibits) && Array.isArray(exhibitsById)) {
            // Build from IDs only when explicit exhibits not provided
            resolvedExhibits = exhibitsById
                .filter(e => e && e.id)
                .map(e => {
                    const meta = exhibitsIndex[e.id];
                    if (meta && meta.path) return { path: meta.path, include: e.include !== false, order: e.order };
                    // attempt defaults lookup by filename id as fallback
                    const defPath = path.join(exhibitsDefaultsDir, `${e.id}.pdf`);
                    return { path: defPath, include: e.include !== false, order: e.order };
                });
        }

        // handle multiple exhibits
        if (Array.isArray(resolvedExhibits) && resolvedExhibits.length > 0) {
            // enforce server-side max 2 exhibits
            const includedCount = resolvedExhibits.filter(a => a && a.include !== false && a.path).length;
            if (includedCount > 2) {
                return res.status(400).json({ error: 'too_many_exhibits', max: 2, message: 'At most 2 exhibits allowed in this prototype.' });
            }
            const sorted = resolvedExhibits
                .filter(a => a && a.include !== false && a.path)
                .sort((a,b) => (Number(a.order)||0) - (Number(b.order)||0));

            // Validate that all included exhibits exist
            const missing = [];
            for (const a of sorted) {
                const abs = resolveExhibitPath(a.path);
                if (!fs.existsSync(abs)) {
                    missing.push(abs);
                }
            }
            if (missing.length > 0) {
                return res.status(400).json({ error: 'exhibits_missing', missing });
            }

            for (const a of sorted) {
                const abs = resolveExhibitPath(a.path);
                const bytes = await fs.promises.readFile(abs);
                const ed = await PDFDocument.load(bytes);
                await addDocPages(ed);
            }
        }

        // If primary excluded and no exhibits included → error
        const anyExhibitsIncluded = (Array.isArray(exhibits) && exhibits.some(a => a && a.include !== false && a.path))
            || (Array.isArray(exhibitsById) && exhibitsById.some(e => e && e.include !== false));
        if (!includePrimary && !exhibitPath && !anyExhibitsIncluded) {
            return res.status(400).json({ error: 'no_inputs_selected', message: 'Include the primary document or at least one exhibit.' });
        }

        merged = mergedDoc;

        const bytes = await merged.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(bytes));
    } catch (e) {
        console.error('Compile merge failed:', e);
        res.status(500).json({ error: 'compile_failed' });
    }
});

// Update document from web viewer (JSON version)
app.post('/api/update-document-json', (req, res) => {
    try {
        const { docx, filename, saveType } = req.body;
        
        if (!docx) {
            return res.status(400).json({ error: 'No DOCX data provided' });
        }
        
        // Update the current document file
        if (currentDocument.filePath) {
            // Write base64 data to existing file path
            const buffer = Buffer.from(docx, 'base64');
            fs.writeFileSync(currentDocument.filePath, buffer);
            
            // Update metadata
            currentDocument.lastUpdated = new Date().toISOString();
            currentDocument.filename = filename || currentDocument.filename;
            
            console.log(`📝 Document updated: ${currentDocument.filename} (${buffer.length} bytes)`);
            
            res.json({
                success: true,
                filename: currentDocument.filename,
                lastUpdated: currentDocument.lastUpdated,
                message: 'Document updated successfully'
            });
        } else {
            res.status(404).json({ error: 'No current document to update' });
        }
        
    } catch (error) {
        console.error('❌ Update document error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// USER MANAGEMENT ENDPOINTS (Platform-Specific Mock System)
// ============================================================

// Legacy endpoint - returns web user for backward compatibility
app.get('/api/user/current', (req, res) => {
    res.json({
        success: true,
        user: currentWebUser
    });
});

// Legacy endpoint - returns all users for backward compatibility
app.get('/api/users', (req, res) => {
    // Return the canonical 4 users from the web viewer across both platforms
    const users = Object.values(webUsers);
    res.json({ success: true, users });
});

// PLATFORM-SPECIFIC USER ENDPOINTS
// =================================

// Get current web user
app.get('/api/user/web/current', (req, res) => {
    res.json({
        success: true,
        user: currentWebUser,
        platform: 'web'
    });
});

// Get all web users
app.get('/api/user/web/users', (req, res) => {
    res.json({
        success: true,
        users: Object.values(webUsers),
        platform: 'web'
    });
});

// Switch web user
app.post('/api/user/web/switch', (req, res) => {
    const { userId } = req.body;
    
    if (!webUsers[userId]) {
        return res.status(404).json({ error: 'Web user not found' });
    }
    
    const previousUser = currentWebUser;
    currentWebUser = webUsers[userId];
    currentUser = currentWebUser; // Update legacy reference
    
    // Update document state context
    documentState.webUser = currentWebUser;
    
    console.log(`👤 WEB: User switched: ${previousUser.name} → ${currentWebUser.name} (${currentWebUser.role})`);
    
    // Broadcast platform-specific user switch event
    broadcastSSE({
        type: 'user-switched',
        platform: 'web',
        previousUser,
        currentUser: currentWebUser,
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        user: currentWebUser,
        platform: 'web',
        message: `Web user switched to ${currentWebUser.name}`
    });
});

// Get current word user
app.get('/api/user/word/current', (req, res) => {
    res.json({
        success: true,
        user: currentWordUser,
        platform: 'word'
    });
});

// Get all word users
app.get('/api/user/word/users', (req, res) => {
    res.json({
        success: true,
        users: Object.values(wordUsers),
        platform: 'word'
    });
});

// FEATURE FLAGS API
// Get all feature flags
app.get('/api/features', (req, res) => {
    res.json({ success: true, features: Object.values(featureFlags) });
});

// Toggle feature
app.post('/api/features/toggle', (req, res) => {
    const { id, enabled } = req.body || {};
    if (!id || typeof enabled !== 'boolean') {
        return res.status(400).json({ success: false, error: 'Missing id or enabled boolean' });
    }
    if (!featureFlags[id]) {
        // Create on the fly to match front-end ids
        featureFlags[id] = { id, enabled: !!enabled };
    } else {
        featureFlags[id].enabled = !!enabled;
    }
    // Broadcast SSE for sync
    broadcastSSE({
        type: 'feature-toggled',
        id,
        enabled: !!enabled,
        timestamp: new Date().toISOString()
    });
    // Also broadcast a user-facing notification event
    broadcastSSE({
        type: 'notification',
        message: `Feature ${id} ${enabled ? 'enabled' : 'disabled'}`,
        level: 'info',
        timestamp: new Date().toISOString()
    });
    res.json({ success: true, feature: featureFlags[id] });
});

// Switch word user
app.post('/api/user/word/switch', (req, res) => {
    const { userId } = req.body;
    
    if (!wordUsers[userId]) {
        return res.status(404).json({ error: 'Word user not found' });
    }
    
    const previousUser = currentWordUser;
    currentWordUser = wordUsers[userId];
    
    // Update document state context
    documentState.wordUser = currentWordUser;
    
    console.log(`👤 WORD: User switched: ${previousUser.name} → ${currentWordUser.name} (${currentWordUser.role})`);
    
    // Broadcast platform-specific user switch event
    broadcastSSE({
        type: 'user-switched',
        platform: 'word',
        previousUser,
        currentUser: currentWordUser,
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        user: currentWordUser,
        platform: 'word',
        message: `Word user switched to ${currentWordUser.name}`
    });
});

// Legacy user switch - updates web user for backward compatibility
app.post('/api/user/switch', (req, res) => {
    const { userId } = req.body;
    
    if (!allUsers[userId]) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Determine if this is a web or word user and route accordingly
    if (webUsers[userId]) {
        const previousUser = currentWebUser;
        currentWebUser = webUsers[userId];
        currentUser = currentWebUser;
        documentState.webUser = currentWebUser;
        
        console.log(`👤 LEGACY->WEB: User switched: ${previousUser.name} → ${currentWebUser.name}`);
        
        broadcastSSE({
            type: 'user-switched',
            platform: 'web',
            previousUser,
            currentUser: currentWebUser,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            user: currentWebUser,
            message: `Switched to ${currentWebUser.name} (web)`
        });
    } else if (wordUsers[userId]) {
        const previousUser = currentWordUser;
        currentWordUser = wordUsers[userId];
        documentState.wordUser = currentWordUser;
        
        console.log(`👤 LEGACY->WORD: User switched: ${previousUser.name} → ${currentWordUser.name}`);
        
        broadcastSSE({
            type: 'user-switched',
            platform: 'word',
            previousUser,
            currentUser: currentWordUser,
            timestamp: new Date().toISOString()
        });
        
        res.json({
            success: true,
            user: currentWordUser,
            message: `Switched to ${currentWordUser.name} (word)`
        });
    }
});

// Get document permissions
app.get('/api/document/:documentId/permissions', (req, res) => {
    const { documentId } = req.params;
    
    // Initialize permissions if they don't exist
    if (!documentPermissions[documentId]) {
        documentPermissions[documentId] = {
            users: Object.values(mockUsers), // Default: all users have access
            obfuscatedSections: []
        };
    }
    
    res.json({
        success: true,
        permissions: documentPermissions[documentId]
    });
});

// ===== APPROVALS API =====

// Get approvals for a document
app.get('/api/document/:documentId/approvals', (req, res) => {
    const { documentId } = req.params;
    const approvalsMap = documentApprovals[documentId] || {};
    const approvals = Object.entries(approvalsMap).map(([userId, a]) => ({ userId, ...a }));
    res.json({ success: true, approvals });
});

app.post('/api/document/:documentId/approvals', (req, res) => {
    try {
        const { documentId } = req.params;
        const { userId, action, actorId } = req.body;
        if (!userId || !action || !actorId) {
            return res.status(400).json({ success: false, error: 'Missing userId, action, or actorId' });
        }

        // Initialize structure
        if (!documentApprovals[documentId]) {
            documentApprovals[documentId] = {};
        }

        // Map action to status
        let status = 'no';
        if (action === 'approve') status = 'approved';
        if (action === 'unapprove' || action === 'reject') status = 'rejected';

        const actor = allUsers[actorId] || webUsers[actorId] || wordUsers[actorId] || { id: actorId, name: actorId };
        const target = allUsers[userId] || webUsers[userId] || wordUsers[userId] || { id: userId, name: userId };

        documentApprovals[documentId][userId] = {
            status,
            approvedBy: actor.id,
            approvedAt: new Date().toISOString()
        };

        // Broadcast SSE with counts for web pill updates
        try {
            const usersList = Object.values(webUsers || {});
            const approvalsMap = documentApprovals[documentId] || {};
            const approvalsArr = Object.entries(approvalsMap).map(([uid, a]) => ({ userId: uid, ...a }));
            const approvedCount = approvalsArr.filter(a => a.status === 'approved').length;
            const totalUsers = usersList.length;
            broadcastSSE({
                type: 'approvals-updated',
                documentId,
                userId,
                status,
                actorId,
                approved: approvedCount,
                total: totalUsers,
                message: `${actor.name} ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'set to no'} ${target.name}`,
                timestamp: new Date().toISOString()
            });
        } catch (_e) {
            broadcastSSE({
                type: 'approvals-updated',
                documentId,
                userId,
                status,
                actorId,
                message: `${actor.name} ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'set to no'} ${target.name}`,
                timestamp: new Date().toISOString()
            });
        }

        fs.writeFileSync(APPROVALS_FILE, JSON.stringify(documentApprovals, null, 2));

        res.json({ success: true, approval: { userId, ...documentApprovals[documentId][userId] } });
    } catch (err) {
        console.error('❌ Approvals POST error:', err);
        res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
});

// Approval matrix - computes per-user approval UI state for an actor
// GET /api/approval-matrix?actorPlatform=web|word&actorId=user1&documentId=default-doc
app.get('/api/approval-matrix', (req, res) => {
    const { actorPlatform, actorId, documentId } = req.query;

    // Resolve actor with platform preference (so Word uses Word roles, Web uses Web roles)
    let actor = null;
    try {
        if (actorPlatform === 'word') {
            actor = (wordUsers && wordUsers[actorId]) || (allUsers && allUsers[actorId]) || (webUsers && webUsers[actorId]);
        } else if (actorPlatform === 'web') {
            actor = (webUsers && webUsers[actorId]) || (allUsers && allUsers[actorId]) || (wordUsers && wordUsers[actorId]);
        }
        if (!actor) actor = (allUsers && allUsers[actorId]) || (webUsers && webUsers[actorId]) || (wordUsers && wordUsers[actorId]);
    } catch (_) {}
    if (!actor) {
        return res.status(404).json({ success: false, error: 'Actor not found' });
    }

    // Use canonical users list (aligned to web)
    const users = Object.values(webUsers);

    // Determine document id
    const docId = documentId || currentDocument.id || 'default-doc';
    const approvalsForDoc = documentApprovals[docId] || {};

    // Helper to compute per-target row config
    function computeRow(targetUser) {
        const targetId = targetUser.id;
        const approvalStatus = approvalsForDoc[targetId]?.status || 'no';
        const isSelf = actor.id === targetId;
        const actorIsApprover = (actor.role === 'viewer' || actor.role === 'editor' || actor.role === 'suggester' || actor.role === 'vendor');
        // Visibility: viewers/suggesters/vendors act on self; editors can act on anyone
        const showButtons = actorIsApprover && (isSelf || actor.role === 'editor');
        // Enablement: initial 'no' state has both enabled; otherwise alternate-only
        const approveEnabled = showButtons && (approvalStatus === 'no' || approvalStatus === 'rejected');
        const rejectEnabled  = showButtons && (approvalStatus === 'no' || approvalStatus === 'approved');

        return {
            userId: targetId,
            showButtons,
            approveEnabled,
            rejectEnabled,
            status: approvalStatus,
            needsConfirm: actor.role === 'editor' && !isSelf,
            confirmMessageKey: actor.role === 'editor' && !isSelf ? 'confirmActOnBehalf' : null,
            confirmMessageParams: actor.role === 'editor' && !isSelf ? { actorName: actor.name, targetName: targetUser.name } : null
        };
    }

    const matrix = {};
    users.forEach(u => { matrix[u.id] = computeRow(u); });

    // Summary
    const approvalsArray = Object.entries(approvalsForDoc).map(([userId, a]) => ({ userId, ...a }));
    const summary = {
        approvedCount: approvalsArray.filter(a => a.status === 'approved').length,
        totalUsers: users.length
    };

    // Strings bundle (can be localized later)
    const strings = {
        confirmActOnBehalf: 'You are about to {action} on behalf of {targetName}. Continue?'
    };
    res.json({ success: true, users, matrix, approvals: approvalsArray, summary, actor: { id: actor.id, role: actor.role }, strings });
});

// Update user permission for document
app.post('/api/document/:documentId/permissions', (req, res) => {
    const { documentId } = req.params;
    const { userId, role } = req.body;
    
    if (!mockUsers[userId]) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (!['editor', 'viewer', 'feedback'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "editor", "viewer", or "feedback"' });
    }
    
    // Initialize permissions if they don't exist
    if (!documentPermissions[documentId]) {
        documentPermissions[documentId] = {
            users: Object.values(mockUsers),
            obfuscatedSections: []
        };
    }
    
    // Update user role
    const userIndex = documentPermissions[documentId].users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        documentPermissions[documentId].users[userIndex].role = role;
    } else {
        // Add new user permission
        const user = { ...mockUsers[userId], role };
        documentPermissions[documentId].users.push(user);
    }
    
    console.log(`🔐 Permission updated: ${mockUsers[userId].name} → ${role} for document ${documentId}`);
    
    // Broadcast permission change
    broadcastSSE({
        type: 'permission-changed',
        documentId,
        userId,
        role,
        user: mockUsers[userId],
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        permissions: documentPermissions[documentId],
        message: `${mockUsers[userId].name} role updated to ${role}`
    });
});

// ===== THEME API =====
// Centralized theme so both web and add-in share muted grey/blue/purple palette
const serverTheme = {
  colors: {
    bgSurface: '#ffffff',
    bgMuted: '#f8fafc',
    textPrimary: '#0f172a',
    textMuted: '#475569',
    border: '#e2e8f0',
    accent: '#64748b',
    statusBg: '#eef2ff',
    statusText: '#3730a3',
    pillBg: '#eef2ff',
    pillText: '#3730a3',
    viewerBg: '#ede9fe',
    viewerText: '#3730a3',
    // keep new-features pink as-is on client; included for completeness
    nfbPink: '#ff6fa5',
    nfbPinkSoft: '#ffc1d9'
  }
};

app.get('/api/theme', (req, res) => {
  res.json({ success: true, theme: serverTheme });
});


// ===== STATE MATRIX API =====

/**
 * State Matrix API Endpoint
 * Implements the logic from USER_STATE_MATRIX.md as a shared service
 * GET /api/state-matrix?userRole=editor&platform=web&userId=user1
 * Returns { buttons: {...}, banner: { text, show } }
 */
app.get('/api/state-matrix', (req, res) => {
    const { userRole, platform, userId } = req.query;
    
    if (!userRole || !platform || !userId) {
        return res.status(400).json({ 
            error: 'Missing required parameters: userRole, platform, userId' 
        });
    }
    
    // Get current user info
    // Use canonical lookup across both pools so IDs are consistent across platforms
    const currentUser = webUsers[userId] || wordUsers[userId];
    
    if (!currentUser) {
        return res.status(404).json({ 
            error: `User ${userId} not found on platform ${platform}` 
        });
    }
    
    // Get document state
    const docState = {
        isCheckedOut: documentState.isCheckedOut || false,
        checkedOutBy: documentState.checkedOutBy || null,
        checkedOutUser: documentState.checkedOutUser || null,
        checkedOutUserId: documentState.checkedOutUserId || null
    };
    
    // Calculate state matrix configuration
    const config = getStateMatrixConfig(userRole, platform, docState, currentUser);
    
    // DEBUG: Log state matrix decisions
    console.log(`🐛 STATE MATRIX DEBUG - ${platform.toUpperCase()}:`, {
        userRole,
        userId,
        platform,
        docState,
        currentUser: currentUser?.name,
        resultButtons: config.buttons
    });
    
    res.json({
        success: true,
        config,
        meta: {
            userRole,
            platform,
            userId,
            documentState: docState
        }
    });
});

/**
 * Core state matrix logic - implements USER_STATE_MATRIX.md
 * @param {string} userRole - viewer, editor, suggester, vendor
 * @param {string} platform - web, word  
 * @param {object} docState - { isCheckedOut, checkedOutBy, checkedOutUser }
 * @param {object} currentUser - current user object
 * @returns {object} { buttons: {...}, banner: { text, show } }
 */
function getStateMatrixConfig(userRole, platform, docState, currentUser) {
    const { isCheckedOut, checkedOutBy, checkedOutUser, checkedOutUserId } = docState;
    
    // Determine if this is self-checkout (cross-platform by user id)
    const isSelfCheckout = isCheckedOut && ((checkedOutUser?.id || checkedOutUserId) === currentUser?.id);
    
    // Initialize result
    const result = {
        buttons: {
            checkoutBtn: false,
            overrideBtn: false, 
            sendVendorBtn: false,
            checkedInBtns: false, // saveProgressBtn, checkinBtn, cancelBtn
                viewOnlyBtn: true, // View Latest is always available
                replaceDefaultBtn: true, // Everyone can replace the default/current document
                compileBtn: true // Everyone sees COMPILE action
        },
        approvals: {
            canApproveSelf: userRole !== 'viewer',
            canApproveOthers: userRole === 'editor'
        },
        checkoutStatus: {
            show: !!(currentDocument.filename && currentDocument.id),
            text: isCheckedOut ? 
                `Checked out by ${checkedOutUser?.name || checkedOutBy}` : 
                'Available for check-out'
        },
        viewerMessage: {
            show: userRole === 'viewer' && !!(currentDocument.filename && currentDocument.id),
            text: 'You can look but don\'t touch'
        },
        flags: {
            isSelfCheckout,
            canCrossPlatformAct: isSelfCheckout,
            checkedOutUserId: checkedOutUserId || checkedOutUser?.id || null,
            actorUserId: currentUser?.id || null
        },
        actor: {
            id: currentUser?.id,
            name: currentUser?.name,
            platform
        }
    };
    
    // VIEWERS - Always read-only, role-specific banners
    if (userRole === 'viewer') {
        
        return result; // Viewers get no buttons
    }
    
    // EDITORS - Full privileges, can override others
    if (userRole === 'editor') {
        if (!isCheckedOut) {
            // Available: checkout + send vendor
            result.buttons.checkoutBtn = true;
            result.buttons.sendVendorBtn = true;
        } else if (isSelfCheckout) {
            // Self checkout: checked-in buttons only
            result.buttons.checkedInBtns = true;
        } else {
            // Someone else has checkout: override + appropriate banner
            result.buttons.overrideBtn = true;
        }
        return result;
    }
    
    // SUGGESTERS & VENDORS - Can checkout, no override privilege
    if (userRole === 'suggester' || userRole === 'vendor') {
        if (!isCheckedOut) {
            // Available: checkout only (no send vendor for non-editors)
            result.buttons.checkoutBtn = true;
        } else if (isSelfCheckout) {
            // Self checkout: checked-in buttons only
            result.buttons.checkedInBtns = true;
        } else {
            // Someone else has checkout: banner only, NO override
            
        }
        return result;
    }
    
    // Fallback for unknown roles
    console.warn(`⚠️ Unknown user role: ${userRole}`);
    return result;
}

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🔧 API Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;



