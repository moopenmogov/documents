@echo off
echo.
echo ========================================
echo   OpenGov Document Collaboration Tool
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    echo After installing Node.js, run this script again.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Cannot find package.json
    echo Please make sure you're running this from the Document project folder
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
    echo.
)

:: Check if ports are available
echo 🔍 Checking if ports are available...
netstat -an | find "3001" | find "LISTENING" >nul
if not errorlevel 1 (
    echo ❌ Port 3001 is already in use
    echo Please close any other applications using port 3001
    pause
    exit /b 1
)

netstat -an | find "3002" | find "LISTENING" >nul
if not errorlevel 1 (
    echo ❌ Port 3002 is already in use
    echo Please close any other applications using port 3002
    pause
    exit /b 1
)

netstat -an | find "3000" | find "LISTENING" >nul
if not errorlevel 1 (
    echo ❌ Port 3000 is already in use
    echo Please close any other applications using port 3000
    pause
    exit /b 1
)

echo ✅ Ports are available
echo.

:: Start the API server
echo 🚀 Starting API server...
start "API Server" cmd /k "echo API Server - Keep this window open && node api-server.js"

:: Wait a moment for API server to start
timeout /t 3 /nobreak >nul

:: Start the web viewer
echo 🌐 Starting web viewer...
start "Web Viewer" cmd /k "echo Web Viewer - Keep this window open && npx http-server -p 3002 -c-1"

:: Wait a moment for web viewer to start
timeout /t 2 /nobreak >nul

:: Start the Word add-in development server
echo 📄 Starting Word add-in development server...
start "Word Add-in Dev" cmd /k "echo Word Add-in Development Server - Keep this window open && npm start"

:: Wait for add-in dev server to start
timeout /t 3 /nobreak >nul

:: Open browsers
echo 🌍 Opening web editor in your browser...
start http://localhost:3002/viewer.html

echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo Your applications are now running:
echo.
echo 📊 Web Viewer: http://localhost:3002/viewer.html
echo 📄 Word Add-in: Available for Microsoft Word (background server)
echo.
echo To use the Word add-in:
echo 1. Open Microsoft Word
echo 2. Go to Insert ^> Add-ins ^> My Add-ins
echo 3. Upload the manifest.xml file from this folder
echo.
echo ⚠️  IMPORTANT: Keep the command windows open!
echo    Closing them will stop the servers.
echo.
echo Press any key to close this setup window...
pause >nul