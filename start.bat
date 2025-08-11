@echo off
title OpenGov Startup
echo =====================================================
echo OpenGov Document Collaboration Tool - Startup Wizard
echo =====================================================
echo.

REM Step 0: Welcome modal (Yes to continue, No to cancel)
echo Showing welcome message...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\welcome-modal.ps1"
if errorlevel 100 (
  echo Startup cancelled by user.
  pause
  exit /b 0
)
echo.

echo Step 1/6: Closing Word if it's open...
taskkill /IM WINWORD.EXE /F >nul 2>&1
echo   Done.
echo.

echo Step 2/6: Stopping previous servers...
call end.bat >nul 2>&1
echo   Done.
echo.

echo Step 3/6: Freeing ports (3001 API)...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
  echo   Killing PID %%P on port 3001
  taskkill /PID %%P /F >nul 2>&1
  goto :port3001_done
)
:port3001_done
echo   Done.
echo.

echo Step 4/6: Trusting local dev certificates (one-time prompt)...
call npx --yes office-addin-dev-certs install -y >nul 2>&1
echo   Done.
echo.

echo Step 5/6: Starting API Server (port 3001)...
start "API Server" cmd /k "npm run start:api"
echo   Waiting for API health (http://localhost:3001/api/health)...
for /L %%i in (1,1,20) do (
  powershell -NoProfile -Command "try{Invoke-WebRequest -UseBasicParsing http://localhost:3001/api/health -TimeoutSec 1 ^| Out-Null; exit 0}catch{exit 1}" >nul 2>&1 && goto :api_up
  >nul timeout /t 1 /nobreak
)
:api_up
echo   API is up.
echo.

echo Step 6/6: Starting Web Viewer and Word Add-in...
start "Web Viewer" cmd /k "npm run start:web"
start "Word Add-in" cmd /k "npm start"
echo   Word will open automatically with the add-in. If prompted, allow the add-in to run.
echo.
echo ===============================================
echo Services are starting:
echo   API Server:  http://localhost:3001
echo   Web Viewer:  http://localhost:3002/viewer.html
echo   Dev Server:  https://localhost:3000 (Word Add-in)
echo ===============================================
echo.
echo Tips:
echo - If you see a cert prompt, click Yes/Trust.
echo - If the add-in taskpane does not appear, close Word and run this again.
echo - To stop everything, close the opened windows or run end.bat.
echo.
pause