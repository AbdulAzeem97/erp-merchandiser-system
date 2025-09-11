@echo off
echo 🌐 Starting ERP Merchandiser System for Network Access...
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found_ip
    )
)
:found_ip

echo 📍 Detected Local IP: %LOCAL_IP%
echo 🔧 Backend Port: 3001
echo 🎨 Frontend Port: 8080
echo.

REM Kill existing Node.js processes
echo 🔄 Stopping any existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Set environment variables
set JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
set PORT=3001
set NODE_ENV=development
set VITE_API_BASE_URL=http://%LOCAL_IP%:3001/api
set VITE_API_URL=http://%LOCAL_IP%:3001

echo 📡 Starting Backend Server...
start "Backend Server" cmd /k "node server/index.js"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

echo 🎨 Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo ================================================================================
echo 🚀 ERP MERCHANDISER SYSTEM - NETWORK ACCESS READY
echo ================================================================================
echo 📍 Your Local IP: %LOCAL_IP%
echo 🔧 Backend API: http://%LOCAL_IP%:3001
echo 🎨 Frontend App: http://%LOCAL_IP%:8080
echo 🏥 Health Check: http://%LOCAL_IP%:3001/health
echo ================================================================================
echo 📱 Network Access URLs:
echo    • Main Application: http://%LOCAL_IP%:8080
echo    • API Endpoint: http://%LOCAL_IP%:3001/api
echo ================================================================================
echo 👥 Share these URLs with your team members on the same network
echo 🔒 Make sure Windows Firewall allows connections on these ports
echo ================================================================================
echo.
echo 💡 Tips:
echo    • Team members can access the system using your IP address
echo    • If connection fails, check Windows Firewall settings
echo    • Close the command windows to stop the servers
echo.
echo 🔄 System is running... Close this window when done
echo.
pause
