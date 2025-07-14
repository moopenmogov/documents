const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Store document data (in a real app, this would be in a database)
let documentData = {
    sections: [],
    lastUpdated: new Date().toISOString(),
    title: 'Document Title'
};

// Store data to be sent to Word
let wordInboundData = null;

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get document sections
app.get('/api/document-sections', (req, res) => {
    res.json({
        sections: documentData.sections,
        lastUpdated: documentData.lastUpdated,
        title: documentData.title
    });
});

// Update document sections (called by the add-in)
app.post('/api/document-sections', (req, res) => {
    try {
        const { sections, title } = req.body;
        
        documentData.sections = sections || [];
        documentData.title = title || 'Document Title';
        documentData.lastUpdated = new Date().toISOString();
        
        console.log(`Updated document data: ${documentData.sections.length} sections`);
        
        res.json({ 
            success: true, 
            sectionsCount: documentData.sections.length,
            lastUpdated: documentData.lastUpdated
        });
    } catch (error) {
        console.error('Error updating document data:', error);
        res.status(500).json({ error: 'Failed to update document data' });
    }
});

// Get document content as HTML
app.get('/api/document-html', (req, res) => {
    try {
        let html = '';
        
        documentData.sections.forEach(section => {
            html += generateSectionHTML(section);
        });
        
        res.json({ 
            html: html,
            lastUpdated: documentData.lastUpdated 
        });
    } catch (error) {
        console.error('Error generating HTML:', error);
        res.status(500).json({ error: 'Failed to generate HTML' });
    }
});

// Export document as various formats
app.get('/api/export/:format', (req, res) => {
    const format = req.params.format;
    
    try {
        switch (format) {
            case 'json':
                res.json(documentData);
                break;
            case 'html':
                const html = generateFullHTML();
                res.send(html);
                break;
            case 'markdown':
                const markdown = generateMarkdown();
                res.send(markdown);
                break;
            default:
                res.status(400).json({ error: 'Unsupported format' });
        }
    } catch (error) {
        console.error('Error exporting document:', error);
        res.status(500).json({ error: 'Failed to export document' });
    }
});

// Send document content to Word
app.post('/api/send-to-word', (req, res) => {
    try {
        const { sections, action } = req.body;
        
        // Store the sections to be sent to Word
        wordInboundData = {
            sections: sections || [],
            action: action || 'replace',
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        console.log(`Prepared ${sections?.length || 0} sections to send to Word`);
        
        res.json({ 
            success: true, 
            message: 'Document queued for Word',
            sectionsCount: sections?.length || 0
        });
    } catch (error) {
        console.error('Error preparing document for Word:', error);
        res.status(500).json({ error: 'Failed to prepare document for Word' });
    }
});

// Get document content to be sent to Word (for Word add-in to poll)
app.get('/api/word-inbound', (req, res) => {
    try {
        if (wordInboundData && wordInboundData.status === 'pending') {
            // Mark as sent
            wordInboundData.status = 'sent';
            wordInboundData.sentAt = new Date().toISOString();
            
            res.json({
                success: true,
                data: wordInboundData
            });
        } else {
            res.json({
                success: false,
                message: 'No pending data for Word'
            });
        }
    } catch (error) {
        console.error('Error getting Word inbound data:', error);
        res.status(500).json({ error: 'Failed to get Word inbound data' });
    }
});

// WebSocket-like endpoint for real-time updates (using Server-Sent Events)
app.get('/api/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    
    // Send initial data
    res.write(`data: ${JSON.stringify(documentData)}\n\n`);
    
    // Keep connection alive
    const keepAlive = setInterval(() => {
        res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);
    
    // Handle client disconnect
    req.on('close', () => {
        clearInterval(keepAlive);
    });
});

// Helper function to generate HTML for a section
function generateSectionHTML(section) {
    const headingTag = `h${section.level}`;
    let html = `<${headingTag} id="${section.id}">${escapeHtml(section.title)}</${headingTag}>\n`;
    
    if (section.content && section.content.length > 0) {
        section.content.forEach(paragraph => {
            html += `<p>${escapeHtml(paragraph)}</p>\n`;
        });
    }
    
    if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach(subsection => {
            html += generateSectionHTML(subsection);
        });
    }
    
    return html;
}

// Helper function to generate full HTML document
function generateFullHTML() {
    let bodyHTML = '';
    
    documentData.sections.forEach(section => {
        bodyHTML += generateSectionHTML(section);
    });
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(documentData.title)}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px; 
            line-height: 1.6;
        }
        h1 { color: #0078d4; border-bottom: 2px solid #0078d4; padding-bottom: 8px; }
        h2 { color: #106ebe; margin-top: 32px; }
        h3 { color: #005a9e; margin-top: 24px; }
        p { margin-bottom: 12px; }
    </style>
</head>
<body>
    <h1>${escapeHtml(documentData.title)}</h1>
    ${bodyHTML}
    <hr>
    <p><small>Generated on ${new Date().toLocaleString()}</small></p>
</body>
</html>
    `;
}

// Helper function to generate Markdown
function generateMarkdown() {
    let markdown = `# ${documentData.title}\n\n`;
    
    documentData.sections.forEach(section => {
        markdown += generateSectionMarkdown(section);
    });
    
    markdown += `\n---\n*Generated on ${new Date().toLocaleString()}*\n`;
    
    return markdown;
}

function generateSectionMarkdown(section) {
    const headingPrefix = '#'.repeat(section.level);
    let markdown = `${headingPrefix} ${section.title}\n\n`;
    
    if (section.content && section.content.length > 0) {
        section.content.forEach(paragraph => {
            markdown += `${paragraph}\n\n`;
        });
    }
    
    if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach(subsection => {
            markdown += generateSectionMarkdown(subsection);
        });
    }
    
    return markdown;
}

// Helper function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Start server
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET  /api/health - Health check');
    console.log('  GET  /api/document-sections - Get document sections');
    console.log('  POST /api/document-sections - Update document sections');
    console.log('  POST /api/send-to-word - Send content to Word');
    console.log('  GET  /api/word-inbound - Get content for Word');
    console.log('  GET  /api/document-html - Get document as HTML');
    console.log('  GET  /api/export/json - Export as JSON');
    console.log('  GET  /api/export/html - Export as HTML');
    console.log('  GET  /api/export/markdown - Export as Markdown');
    console.log('  GET  /api/stream - Real-time updates stream');
});

module.exports = app; 