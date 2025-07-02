const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Document store (in-memory for now)
const documents = new Map();
const variables = new Map();
const locks = new Map();

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle document operations
  socket.on('join-document', (docId) => {
    socket.join(docId);
    console.log(`User ${socket.id} joined document ${docId}`);
  });

  // Handle variable updates
  socket.on('update-variable', (data) => {
    variables.set(data.name, data.value);
    socket.broadcast.emit('variable-updated', data);
  });

  // Handle document changes
  socket.on('document-change', (data) => {
    socket.to(data.docId).emit('document-changed', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// REST API routes
app.get('/api/documents/:id', (req, res) => {
  const doc = documents.get(req.params.id) || { id: req.params.id, content: '' };
  res.json(doc);
});

app.get('/api/variables', (req, res) => {
  const vars = Object.fromEntries(variables);
  res.json(vars);
});

app.put('/api/variables/:name', (req, res) => {
  const { name } = req.params;
  const { value } = req.body;
  variables.set(name, value);
  
  // Broadcast to all connected clients
  io.emit('variable-updated', { name, value });
  
  res.json({ name, value });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 