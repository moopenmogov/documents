# Document Collaboration Platform

Real-time document collaboration with Word add-in and web viewer using ProseMirror backend.

## Features

- **Real-time sync** between Word add-in and web editor
- **Variable synchronization** - update variables in one place, sync everywhere
- **Hierarchical locking** - document and section-level check-out system
- **Permission management** - admin/user roles with section-level access control
- **Suggestion mode** - collaborative feedback without check-out
- **ProseMirror-based** - leveraging superdoc's node-based architecture

## Architecture

```
├── backend/           # Node.js + ProseMirror + WebSockets
├── word-addin/        # Office.js Word add-in
├── web-viewer/        # React/Vue web editor
├── shared/            # Shared types and utilities
└── docs/              # Documentation
```

## Tech Stack

- **Backend**: Node.js, ProseMirror, WebSockets, PostgreSQL
- **Word Add-in**: Office.js, TypeScript
- **Web Viewer**: React, ProseMirror, TypeScript
- **Real-time**: Socket.io or native WebSockets
- **Database**: PostgreSQL for document storage

## Document Structure

ProseMirror node-based hierarchy:
- Document → Sections → Subsections → Paragraphs
- Custom node types: `variable_node`, `locked_section`, `suggestion`
- Each node has UUID for precise targeting

## Getting Started

```bash
# Install dependencies
npm install

# Start backend
cd backend && npm run dev

# Start web viewer
cd web-viewer && npm run dev

# Sideload Word add-in
cd word-addin && npm run start
```

## Development Phases

### Phase 1: MVP
- [ ] Basic ProseMirror backend
- [ ] Simple web viewer
- [ ] Variable sync system
- [ ] Basic Word add-in

### Phase 2: Collaboration
- [ ] Real-time sync
- [ ] Section locking
- [ ] User permissions
- [ ] Suggestion mode

### Phase 3: Advanced
- [ ] Document structure manipulation
- [ ] Advanced permissions
- [ ] Embedding capabilities
- [ ] Production deployment

## API Design

### Variables
```javascript
// Sync variable across all instances
PUT /api/variables/{name}
{ "value": "new value" }

// Get all variables
GET /api/variables
```

### Document Operations
```javascript
// Check out document/section
POST /api/documents/{id}/checkout
{ "section_id": "optional", "user_id": "required" }

// Apply changes
POST /api/documents/{id}/changes
{ "operations": [...], "section_id": "optional" }
```

## Contributing

This is a prototype for learning document collaboration patterns. Focus on:
1. Understanding ProseMirror's node system
2. Real-time synchronization challenges
3. Permission system design
4. Word add-in integration patterns

## License

MIT 