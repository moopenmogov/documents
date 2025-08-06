const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

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
    'user2': { id: 'user2', name: 'Gettysburger King', email: 'gettysburger@opengov.com', role: 'viewer' }
};

let wordUsers = {
    'user3': { id: 'user3', name: 'Phil A Minyon', email: 'phil@opengov.com', role: 'editor' },
    'user4': { id: 'user4', name: 'Dee Nial', email: 'dee@opengov.com', role: 'viewer' }
};

// Combined user pool for reference
let allUsers = { ...webUsers, ...wordUsers };

// Current active users per platform
let currentWebUser = webUsers['user1']; // Default to Warren Peace
let currentWordUser = wordUsers['user3']; // Default to Phil A Minyon

// Legacy support - points to web user for backward compatibility
let currentUser = currentWebUser;

// Initialize document state with current users
documentState.webUser = currentWebUser;
documentState.wordUser = currentWordUser;

// Document permissions
let documentPermissions = {};

// Store SSE connections
let sseConnections = [];

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
    
    // Store connection for broadcasting
    sseConnections.push(res);
    
    // Send initial connection message
    res.write('data: {"type":"connected","message":"SSE connected successfully","timestamp":"' + new Date().toISOString() + '"}\n\n');
    
    // Handle client disconnect
    req.on('close', () => {
        console.log('📡 SSE connection closed');
        const index = sseConnections.indexOf(res);
        if (index !== -1) {
            sseConnections.splice(index, 1);
        }
    });
});

// Broadcast function for sending events to all connected clients
function broadcastSSE(event) {
    const eventData = JSON.stringify(event);
    console.log('📡 Broadcasting SSE event:', event.type);
    
    sseConnections.forEach((res, index) => {
        try {
            res.write(`data: ${eventData}\n\n`);
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
    const { source, docx, filename } = req.body;
    
    // Check if document is checked out
    if (!documentState.isCheckedOut) {
        return res.status(400).json({
            success: false,
            error: 'Document must be checked out to save progress'
        });
    }
    
    // Check if the source is the one who checked it out
    if (documentState.checkedOutBy !== source) {
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
            const filePath = path.join(uploadsDir, fileName);
            
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
    const { source, docx, filename } = req.body;
    
    // Check if document is checked out
    if (!documentState.isCheckedOut) {
        return res.status(400).json({
            success: false,
            error: 'Document is not checked out'
        });
    }
    
    // Check if the source is the one who checked it out
    if (documentState.checkedOutBy !== source) {
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
            const filePath = path.join(uploadsDir, fileName);
            
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
    const { source } = req.body;
    
    // Check if document is checked out
    if (!documentState.isCheckedOut) {
        return res.status(400).json({
            success: false,
            error: 'Document is not checked out'
        });
    }
    
    // Check if the source is the one who checked it out
    if (documentState.checkedOutBy !== source) {
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
        const filePath = path.join(uploadsDir, fileName);
        
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
            return res.status(404).json({ error: 'No document available' });
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
    res.json({
        success: true,
        users: Object.values(allUsers)
    });
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

// Update user permission for document
app.post('/api/document/:documentId/permissions', (req, res) => {
    const { documentId } = req.params;
    const { userId, role } = req.body;
    
    if (!mockUsers[userId]) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (!['editor', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "editor" or "viewer"' });
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

app.listen(PORT, () => {
    console.log(`🔧 API Server running on http://localhost:${PORT}`);
});