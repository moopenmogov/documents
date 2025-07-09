// Global variables
let socket;
let variables = new Map();
let isConnected = false;
let documentId = 'default-doc'; // For MVP, using single document

// Initialize Office.js
Office.onReady((info) => {
    if (info.host === Office.HostType.Word) {
        console.log('Word add-in loaded');
        initializeConnection();
        loadVariables();
    }
});

// Initialize WebSocket connection
function initializeConnection() {
    const serverUrl = 'http://localhost:3001';
    
    try {
        socket = io(serverUrl);
        
        socket.on('connect', () => {
            console.log('Connected to server');
            isConnected = true;
            updateConnectionStatus('Connected', true);
            socket.emit('join-document', documentId);
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            isConnected = false;
            updateConnectionStatus('Disconnected', false);
        });
        
        socket.on('variable-updated', (data) => {
            console.log('Variable updated:', data);
            variables.set(data.name, data.value);
            updateVariablesList();
            updateDocumentVariables();
        });
        
        socket.on('document-changed', (data) => {
            console.log('Document changed:', data);
            // Handle document changes from other clients
        });
        
    } catch (error) {
        console.error('Connection error:', error);
        updateConnectionStatus('Connection Error', false);
    }
}

// Update connection status UI
function updateConnectionStatus(message, connected) {
    const statusText = document.getElementById('connectionText');
    const statusDot = document.getElementById('connectionDot');
    
    statusText.textContent = message;
    
    if (connected) {
        statusDot.classList.add('connected');
    } else {
        statusDot.classList.remove('connected');
    }
}

// Load variables from server
async function loadVariables() {
    try {
        const response = await fetch('http://localhost:3001/api/variables');
        const vars = await response.json();
        
        variables.clear();
        Object.entries(vars).forEach(([name, value]) => {
            variables.set(name, value);
        });
        
        updateVariablesList();
    } catch (error) {
        console.error('Error loading variables:', error);
        showStatus('Error loading variables', 'error');
    }
}

// Update variables list in UI
function updateVariablesList() {
    const container = document.getElementById('variablesList');
    container.innerHTML = '';
    
    variables.forEach((value, name) => {
        const varDiv = document.createElement('div');
        varDiv.style.marginBottom = '10px';
        varDiv.style.padding = '8px';
        varDiv.style.background = '#e9ecef';
        varDiv.style.borderRadius = '4px';
        
        varDiv.innerHTML = `
            <strong>${name}</strong>: ${value}
            <button onclick="deleteVariable('${name}')" style="float: right; background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Delete</button>
        `;
        
        container.appendChild(varDiv);
    });
}

// Add new variable
function addVariable() {
    const nameInput = document.getElementById('newVarName');
    const valueInput = document.getElementById('newVarValue');
    
    const name = nameInput.value.trim();
    const value = valueInput.value.trim();
    
    if (!name || !value) {
        showStatus('Please enter both name and value', 'error');
        return;
    }
    
    // Update local state
    variables.set(name, value);
    
    // Send to server
    if (isConnected) {
        socket.emit('update-variable', { name, value });
    }
    
    // Update server via REST API
    fetch(`http://localhost:3001/api/variables/${name}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Variable updated:', data);
        showStatus(`Variable "${name}" updated`, 'success');
    })
    .catch(error => {
        console.error('Error updating variable:', error);
        showStatus('Error updating variable', 'error');
    });
    
    // Clear inputs
    nameInput.value = '';
    valueInput.value = '';
    
    updateVariablesList();
}

// Delete variable
function deleteVariable(name) {
    variables.delete(name);
    updateVariablesList();
    
    // TODO: Implement server-side deletion
    showStatus(`Variable "${name}" deleted locally`, 'success');
}

// Insert variable placeholder into document
function insertVariable() {
    Word.run(async (context) => {
        const selection = context.document.getSelection();
        
        // Get variable name from user
        const varName = prompt('Enter variable name:');
        if (!varName) return;
        
        // Insert variable placeholder
        const placeholder = `{{${varName}}}`;
        selection.insertText(placeholder, Word.InsertLocation.replace);
        
        await context.sync();
        
        showStatus(`Variable placeholder "${placeholder}" inserted`, 'success');
    }).catch(error => {
        console.error('Error inserting variable:', error);
        showStatus('Error inserting variable', 'error');
    });
}

// Update document variables with current values
function updateDocumentVariables() {
    Word.run(async (context) => {
        const body = context.document.body;
        
        // Search for all variable placeholders
        variables.forEach((value, name) => {
            const placeholder = `{{${name}}}`;
            const searchResults = body.search(placeholder);
            
            context.load(searchResults, 'items');
            
            context.sync().then(() => {
                searchResults.items.forEach(item => {
                    item.insertText(value, Word.InsertLocation.replace);
                });
                
                return context.sync();
            });
        });
        
        await context.sync();
        
    }).catch(error => {
        console.error('Error updating document variables:', error);
    });
}

// Sync document with server
function syncDocument() {
    Word.run(async (context) => {
        const body = context.document.body;
        context.load(body, 'text');
        
        await context.sync();
        
        const documentText = body.text;
        
        // TODO: Send document content to server
        console.log('Document content:', documentText);
        
        showStatus('Document synced', 'success');
        
    }).catch(error => {
        console.error('Error syncing document:', error);
        showStatus('Error syncing document', 'error');
    });
}

// Check out document
function checkoutDocument() {
    if (!isConnected) {
        showStatus('Not connected to server', 'error');
        return;
    }
    
    // TODO: Implement document checkout
    socket.emit('request-lock', {
        documentId: documentId,
        userId: 'current-user', // TODO: Get actual user ID
        type: 'document'
    });
    
    showStatus('Document checkout requested', 'success');
}

// Show status message
function showStatus(message, type = 'success') {
    const container = document.getElementById('statusMessages');
    
    const statusDiv = document.createElement('div');
    statusDiv.className = `status ${type === 'error' ? 'error' : ''}`;
    statusDiv.textContent = message;
    
    container.appendChild(statusDiv);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        container.removeChild(statusDiv);
    }, 3000);
}

// Include Socket.IO client
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
document.head.appendChild(script); 