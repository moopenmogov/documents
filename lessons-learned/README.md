# Lessons Learned: OpenGov Contract Redlining Project

## Overview

This directory contains detailed lessons learned from developing a Word add-in with SuperDoc web viewer integration for real-time contract collaboration. The project involved building bidirectional sync between Microsoft Word and a web-based document editor.

**⚠️ CRITICAL:** If you're developing a Word add-in, **READ THE INFRASTRUCTURE GUIDE FIRST**. It could save you days of troubleshooting.

## Documentation Index

### 🏗️ Infrastructure & Setup
- **[Word Add-in Infrastructure](word-addin-infrastructure.md)** ⭐ **START HERE** - Critical Office Generator vs manual setup lessons
- [Development Environment Setup](development-environment.md) - Servers, ports, and tool configuration
- [Project Architecture Decisions](project-architecture.md) - Structure, naming, and organization

### 🔧 Technical Integration  
- [API Integration Guide](api-integration.md) - Office.js, SuperDoc, Express patterns
- [Git Workflow Best Practices](git-workflow.md) - Branch management and commit strategies

### 🚨 Troubleshooting & Common Pitfalls
- [Troubleshooting Guide](troubleshooting-guide.md) - Registry issues, cache problems, common errors
- [Performance & Debugging](performance-debugging.md) - Node.js processes, memory leaks, monitoring

## Key Breakthrough Lessons

### 1. **Office Generator vs Manual Setup** 
**THE GAME CHANGER:** Using Microsoft's official `yo office` generator instead of manual Word add-in configuration solved weeks of registry and sideloading issues in one step.

### 2. **Port Strategy**
- **3000**: Office add-in development server (Office Generator default)
- **3001**: API server (document sync backend) 
- **3002**: Web viewer (SuperDoc frontend)

### 3. **Office.js API Patterns**
- Use `Office.context.document.getFileAsync(Office.FileType.Compressed)` for exports
- Use `context.document.body.insertFileFromBase64()` for imports
- **Never** use non-existent methods like `doc.getFilePropertiesBase64()`

### 4. **SuperDoc Integration**
- Version `@harbour-enterprises/superdoc@^0.14.19` works reliably
- Fix script paths from `/node_modules` to `./node_modules` in web viewer
- Export returns arrays with Blob at index 0, handle chunked base64 conversion

### 5. **Git Strategy for Complex Features**
- Create solid foundations before feature development
- Commit working states frequently as checkpoints
- Clean up repo structure before merging to main
- Use descriptive commit messages with status indicators (✅ ❌ 🎯)

## Project Context

**Built:** Word add-in + SuperDoc web viewer + Express API server  
**Goal:** Real-time collaborative contract redlining  
**Tech Stack:** Office.js, Express, SuperDoc, Office Generator, Node.js  
**Timeline:** Multiple iterations from manual setup hell to working foundation  

## Success Metrics

✅ **Stable Word add-in** loading without registry hacks  
✅ **Bidirectional sync** between Word and web viewer  
✅ **SuperDoc integration** with OpenGov branding  
✅ **Clean project structure** ready for real-time features  
✅ **Multiple sync workflows** (Word→Web, Web→Word, Direct file upload)

---

**Next Phase:** Server-Sent Events (SSE) for real-time synchronization

*Last Updated: January 2025*