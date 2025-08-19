# 🚀 OpenGov Document Collaboration - Setup Guide

## **📋 What This Tool Does**
This application allows you to collaborate on Word documents through:
- **Web Editor**: Edit documents in your browser with real-time collaboration
- **Word Add-in**: Work directly in Microsoft Word with seamless synchronization
- **Live Sync**: Changes made in either platform sync automatically

---

## **⚙️ Prerequisites**

### **1. Install Node.js**
- Download from: https://nodejs.org/
- Choose the **LTS version** (recommended)
- Install with default settings
- Restart your computer after installation

### **2. Microsoft Word**
- Word 2016 or newer (Windows)
- Word Online also supported

---

## **📥 Download the Application**

### **Option A: Download ZIP (Easiest)**
1. Go to: `[GITHUB_REPO_URL]`
2. Click the green **"Code"** button
3. Select **"Download ZIP"**
4. Extract the ZIP file to your desired location
5. Rename the folder to something simple like `DocumentProject`

### **Option B: Git Clone (If you have Git)**
```bash
git clone [GITHUB_REPO_URL]
cd Document\ project
```

---

## **🎯 One-Click Setup**

1. **Navigate to the folder** where you extracted/cloned the project
2. **Double-click** `start.bat`
3. **Wait** for the setup to complete (30-60 seconds)
4. **Two browser windows** will open automatically:
   - Web Editor: `http://localhost:3002/web-viewer.html`
   - Word Add-in Developer: `http://localhost:3000`

### **✅ Success Signs:**
- You see three command prompt windows (keep them open!)
- Web editor loads with "OpenGov" header
- No error messages in the setup window

---

## **📄 Setting Up the Word Add-in**

### **One-Time Setup:**
1. **Open Microsoft Word**
2. Go to **Insert** → **Add-ins** → **My Add-ins**
3. Click **Upload My Add-in**
4. Browse to your project folder
5. Select **`manifest.xml`**
6. Click **Upload**

### **Using the Add-in:**
1. Look for **"OpenGov Contract Redlining"** in your Word ribbon
2. Click it to open the task pane
3. The add-in will connect automatically

---

## **🎮 Quick Start Workflow**

### **Scenario 1: Start in Web Editor**
1. Open `http://localhost:3002/web-viewer.html`
2. Click **"📁 Open"** to upload a Word document
3. Make edits in the web editor
4. In Word: Open the add-in and click **"View Last Saved"**
5. Your document appears in Word with all web changes!

### **Scenario 2: Start in Word**
1. Open a Word document
2. Open the OpenGov add-in
3. Click **"🌐 Share to Web"**
4. The document automatically opens in the web editor
5. Edit in either platform - changes sync both ways!

---

## **🛑 Stopping the Application**

When you're done:
1. **Close the browser tabs**
2. **Close the three command prompt windows**
3. That's it! The application stops automatically.

---

## **❗ Troubleshooting**

### **"Node.js is not installed"**
- Download Node.js from https://nodejs.org/
- Restart your computer after installation
- Run `start.bat` again

### **"Port already in use"**
- Close any other web development tools
- Restart your computer if the issue persists
- Run `start.bat` again

### **"Add-in won't load in Word"**
- Make sure the three command windows are still open
- Try restarting Word
- Re-upload the `manifest.xml` file

### **"Web editor shows errors"**
- Check that all three command windows are running
- Refresh the browser page
- Make sure you're using `http://localhost:3002/web-viewer.html`

### **Still having issues?**
Check `docs/TROUBLESHOOTING.md` for detailed solutions.

---

## **📞 Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Look for error messages in the command prompt windows
3. Take screenshots of any error messages for support

---

**🎉 You're ready to start collaborating on documents!**