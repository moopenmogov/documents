# 🤔 What Am I Running? - Technical Overview

## **🎯 Quick Answer**
You're running a **local document collaboration system** that connects Microsoft Word with a web-based editor. Everything runs on your computer - no data goes to external servers.

---

## **🏗️ The Three Components**

When you run `start.bat`, three separate programs start:

### **1. 📡 API Server (Port 3001)**
**What it does:** Acts as the "traffic controller" between Word and the web editor
**Technical details:**
- Node.js Express server
- Handles document storage and state management
- Manages checkout/checkin workflow
- Provides real-time communication via Server-Sent Events (SSE)

**Files:** `api-server.js`
**URL:** `http://localhost:3001`

### **2. 🌐 Web Document Editor (Port 3002)**
**What it does:** Browser-based Word document editor
**Technical details:**
- Static file server (http-server)
- SuperDoc library for document editing
- Real-time collaboration features
- Converts between web formats and Word DOCX

**Files:** `web-viewer.html`, `viewer.html`, assets folder
**URL:** `http://localhost:3002/web-viewer.html`

### **3. 📄 Word Add-in Development Server (Port 3000)**
**What it does:** Serves the Word add-in to Microsoft Office
**Technical details:**
- Webpack development server
- Office.js integration
- Task pane interface for Word
- Handles Word document manipulation

**Files:** `src/taskpane/` folder, `manifest.xml`
**URL:** `http://localhost:3000`

---

## **🔄 How They Work Together**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Microsoft     │    │   API Server    │    │   Web Editor    │
│     Word        │◄──►│  (Port 3001)    │◄──►│  (Port 3002)    │
│   + Add-in      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                        ▲                        ▲
        │                        │                        │
   Office.js API          Express.js + SSE        SuperDoc Library
```

### **Data Flow Example:**
1. **User edits in web editor** → SuperDoc converts to DOCX → Sent to API server
2. **API server** → Stores document → Notifies Word add-in via SSE
3. **Word add-in** → Receives notification → Downloads updated DOCX → Updates Word document

---

## **🔒 Security & Privacy**

### **✅ What's Safe:**
- **Everything runs locally** - no external servers
- **No data leaves your computer** - all processing is local
- **Standard web technologies** - same as any local development server
- **Open source** - you can inspect all the code

### **⚠️ What to Know:**
- **Firewall may ask permission** - it's safe to allow (localhost only)
- **Three server processes** - normal for development environments
- **Browser security warnings** - expected for localhost development
- **Word add-in permissions** - only accesses the current document

---

## **📁 File Structure Explained**

```
Document project/
├── start.bat                 # ← The script you run
├── api-server.js             # ← Main API server code
├── package.json              # ← Dependencies and scripts
├── manifest.xml              # ← Word add-in configuration
├── web-viewer.html           # ← Web editor entry point
├── viewer.html               # ← Main web editor interface
├── src/taskpane/             # ← Word add-in source code
├── assets/                   # ← Images and static files
├── exhibits/                 # ← Where pre-seeded and uploaded exhibit PDFs are stored
└── docs/                     # ← Documentation (this file!)
```

---

## **🔧 Technical Requirements**

### **Node.js (Required)**
- **What:** JavaScript runtime environment
- **Why:** Runs the API server and development tools
- **Version:** LTS (Long Term Support) recommended
- **Download:** https://nodejs.org/

### **NPM Packages (Auto-installed)**
The system uses these key libraries:
- **Express.js** - Web server framework
- **http-server** - Static file serving
- **webpack** - Development server for add-in
- **SuperDoc** - Document editing engine
- **Office.js** - Microsoft Office integration

---

## **🌐 Network Ports Explained**

### **Port 3001 - API Server**
- Handles document storage and state
- Provides REST API endpoints
- Manages real-time notifications

### **Port 3002 - Web Editor**
- Serves the web-based document editor
- Static file hosting
- No server-side processing

### **Port 3000 - Add-in Development**
- Hot-reloading development server
- Serves add-in files to Word
- Webpack dev server with debugging

**Note:** These ports are only accessible from your computer (localhost)

---

## **🔄 Development vs Production**

### **What You're Running (Development Mode):**
- ✅ Hot reloading for code changes
- ✅ Detailed error messages
- ✅ Debug console output
- ✅ Unminified code for troubleshooting

### **Production Mode Would Include:**
- 🏗️ Compiled/minified code
- 🏗️ Error logging to files
- 🏗️ Performance optimizations
- 🏗️ Security hardening

**For testing and evaluation, development mode is perfect and actually easier to troubleshoot.**

---

## **❓ Common Questions**

### **"Is this safe to run on my work computer?"**
Yes - everything is local, no external connections. Similar to running any Office add-in development.

### **"Will this affect my other Word documents?"**
No - the add-in only affects documents when you explicitly use it.

### **"Can I run this on multiple computers?"**
Each computer needs its own copy. Documents don't sync between different installations.

### **"What happens to my documents?"**
The current DOCX is stored in `default-document/`. Exhibits (PDFs) live under `exhibits/`.

### **"Do I need internet?"**
No - after initial setup (downloading Node.js), everything works offline.

---

**🎉 You're running a sophisticated local development environment - pretty cool!**