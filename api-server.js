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

// Store current document info
let currentDocument = {
    id: null,
    filename: null,
    filePath: null,
    lastUpdated: null
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

app.listen(PORT, () => {
    console.log(`🔧 API Server running on http://localhost:${PORT}`);
}); 