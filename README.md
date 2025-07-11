# Hello Moti Word Add-in

A simple Word add-in that displays "Hello Moti!" and can insert text into your document.

## Quick Start

1. **Start the development server:**
   ```
   npm start
   ```

2. **Sideload the add-in in Word:**
   - Open Microsoft Word
   - Go to **Insert** > **Add-ins** > **My Add-ins**
   - Click **Upload My Add-in**
   - Select the `manifest.xml` file from this folder
   - Click **Upload**

3. **Use the add-in:**
   - Look for the "Hello Group" in the Home tab of Word
   - Click the "Hello Moti" button
   - The task pane will open with your greeting!
   - Click "Insert Hello Message" to add text to your document

## Files

- `manifest.xml` - Defines the add-in for Office
- `taskpane.html` - Main task pane UI
- `commands.html` - Required commands file
- `assets/` - Icon files
- `package.json` - Development server configuration

## Requirements

- Microsoft Word (Office 365 or Office 2016+)
- Node.js (for the development server)

That's it! Your simple Word add-in is ready to go! 🎉 