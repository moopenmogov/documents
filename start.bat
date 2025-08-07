@echo off
echo OpenGov Document Collaboration Tool - Starting All Services
echo.

REM First, stop any existing processes
echo Step 1: Stopping any existing servers...
call end.bat

echo.
echo Step 2: Starting all services...
echo.

REM Start API Server (Port 3001) in new window
echo Starting API Server on port 3001...
start "API Server" cmd /k "npm run start:api"

REM Wait a moment for API server to start
timeout /t 3 /nobreak >nul

REM Start Web Viewer (Port 3002) in new window
echo Starting Web Viewer on port 3002...
start "Web Viewer" cmd /k "npm run start:web"

REM Wait a moment for web server to start
timeout /t 3 /nobreak >nul

REM Start Word Add-in (Port 3000) in new window
echo Starting Word Add-in on port 3000...
start "Word Add-in" cmd /k "npm start"

echo.
echo ===============================================
echo All services are starting!
echo.
echo API Server:    http://localhost:3001
echo Web Viewer:    http://localhost:3002/viewer.html
echo Word Add-in:   http://localhost:3000
echo.
echo Wait a few seconds for all services to be ready.
echo ===============================================
echo.
pause