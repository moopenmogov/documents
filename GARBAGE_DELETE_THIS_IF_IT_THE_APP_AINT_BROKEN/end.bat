@echo off
echo Stopping all project servers...

REM Kill Node.js processes (API server)
echo Stopping API server...
taskkill /f /im node.exe 2>nul

REM Kill http-server processes
echo Stopping web server...
taskkill /f /im http-server.exe 2>nul

REM Kill any webpack dev server processes
echo Stopping webpack dev server...
taskkill /f /im webpack.exe 2>nul

REM Kill Office add-in debugging processes
echo Stopping Office add-in...
npm run stop 2>nul

REM Kill any remaining processes on our ports
echo Stopping processes on ports 3000, 3001, 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul

echo.
echo All servers stopped!
echo.
pause
