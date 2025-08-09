This is a BRIEF.

Purpose of the brief is to:

- Provide absolute clarity about the purpose of the application
- Create an embeddable tool that we can deploy immediately behind a flag
- Unlock a massive feedback pool (our customers)
- Transform GTM sales pitches for contracting 
- Accelerate development

So...read this first. Think about it. Challenge it. Tell me what you hate. And then go look at what I built and fix it. Make it better.

Nothing about this is final. Nothing is absolute. No one doesn't not always sometimes make mistakes. Except me, so consider this gospel. But that actually brings up an important point. That's why everything is pink - it makes it an obvious protoytpe.

And when we get to a point where we're all proud of this -- with *us* including our customers, we launch it.

Let's begin.

I wrote this file. Correction, I write this file. I actively modify it. 100% of the words here are mine (minus the earlier series that look like an excitable cartoon wrote them).

Everything else came from AI. A combination of Claude 3.5, Claude 4, and 5o, most recently. I worked closely and was simultaneously its architect, prodcut manager, designer, customer, support team member, and more. It was the same back to me.

Some requirements and features are therefore probably stupid. The ones I specified or built, I assume. That context is important for understanding why this exists.

The purpose of this application is to make contracting delightful. The essence of contracting is a legally binding agreement, typically in a written form. It is arguably the essence of democracy, if not solely due to its importance in the foundation of capitalism.

Executing contracts between governments and its citizens is, therefore, one of the most important things that it does. You know, do what you say and say what you do. That kind of thing.

Back to this application.

Government agencies almost always use Word. They write and manage their contracting process in Word. Or at least, everything relating to the written contract. The execution of the contract, management of its spend, vendoer performance, etc, happens elsewhere. We call that the contract record.

This is the contract document.

It's designed to be a bidirectional system that is tailored to the government contracting process, which is as follows:

STEPS 






# 🚀 OpenGov Document Collaboration Tool












A powerful local application that enables seamless collaboration between Microsoft Word and web-based document editing.

## **⚡ Quick Start (2 Minutes)**

1. **Download:** Clone or download this repository
2. **Run:** Double-click `start.bat` (Windows)
3. **Use:** Open the web editor and Word add-in that launch automatically

**📖 Full Setup Guide:** [docs/SETUP.md](docs/SETUP.md)

---

## **🔧 Daily Usage Commands**

### **🚀 Initial Setup**
```bash
# First time only - install dependencies
npm install

# Start all services
start.bat          # Windows (recommended)
# OR manually: npm run start-api && npm run start-web && npm run start-addin
```

### **🔄 Restart Everything**
```bash
# Stop all services and restart fresh
start.bat     # Windows (automatically stops existing services first)
```

### **🛑 Close All Services**
```bash
# Stop all running servers and processes
end.bat           # Windows
```

### **📥 Update Software (when main branch changes)**
```bash
# Stop services first
end.bat

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart services
start.bat
```

**💡 Pro Tip:** Always run `end.bat` before `git pull` to avoid port conflicts!

---

## **✨ Features**

- **🔄 Bidirectional Sync** - Changes in Word sync to web, and vice versa
- **🌐 Web Editor** - Full-featured document editing in your browser
- **📄 Word Integration** - Native Microsoft Word add-in
- **🔒 Checkout System** - Prevents editing conflicts
- **🔔 Real-time Notifications** - See what's happening across platforms
- **💾 Local Storage** - Everything runs on your computer

---

## **🎯 Use Cases**

- **Document Review** - Collaborate on contracts, reports, and proposals
- **Cross-Platform Editing** - Switch between Word and web seamlessly
- **Version Control** - Track changes and prevent conflicts
- **Team Collaboration** - Multiple editors with conflict prevention

---

## **📋 System Requirements**

- **Windows 10/11** (macOS/Linux support via PowerShell)
- **Microsoft Word 2016+** or Word Online
- **Node.js LTS** (auto-checked by setup script)
- **Modern Web Browser** (Chrome, Edge, Firefox)

---

## **📁 Documentation**

- **[🚀 Setup Guide](docs/SETUP.md)** - Complete installation instructions
- **[🔧 Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions  
- **[🤔 What Am I Running?](docs/WHAT-AM-I-RUNNING.md)** - Technical overview
- **[📚 Lessons Learned](lessons-learned/README.md)** - Development insights

---

## **🏗️ Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Microsoft     │    │   API Server    │    │   Web Editor    │
│     Word        │◄──►│  (Port 3001)    │◄──►│  (Port 3002)    │
│   + Add-in      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Three Components:**
- **API Server** - Document storage and state management
- **Web Editor** - Browser-based editing with SuperDoc
- **Word Add-in** - Native Office.js integration

---

## **🔒 Security & Privacy**

- ✅ **100% Local** - No external servers or cloud dependencies
- ✅ **Your Data Stays Put** - Documents stored in local `uploads/` folder
- ✅ **Standard Technologies** - Uses Office.js and web standards
- ✅ **Open Source** - Inspect and modify all code

---

## **🚦 Status**

- ✅ **Working MVP** - Full bidirectional sync functional
- ✅ **Word Add-in** - Complete Office.js integration
- ✅ **Web Editor** - SuperDoc-powered editing
- ✅ **Real-time Sync** - SSE-based communication
- ✅ **Conflict Prevention** - Checkout/checkin workflow

---

## **🛠️ Development**

### **Branch Strategy**
- `main` - Stable, user-ready code
- `feature/*` - New features under development

### **Quick Development Setup**
```bash
npm install
npm run start-api     # Terminal 1
npm run start-web     # Terminal 2  
npm run start-addin   # Terminal 3
```

**For Users:** Just use `start.bat` - it handles everything automatically.

---

## **📞 Support**

**Having Issues?**
1. Check [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. Look for error messages in command windows
3. Try restarting: close everything, run `start.bat` again

**For Developers:**
- See [Lessons Learned](lessons-learned/README.md) for technical insights
- Check console logs for debugging information
- Use browser dev tools for web editor issues

---

## **📜 License**

[Add your license here]

---

**🎉 Ready to start collaborating? Run `start.bat` and you'll be up in 2 minutes!** 