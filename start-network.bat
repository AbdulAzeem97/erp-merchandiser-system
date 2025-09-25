@echo off
echo 🌐 Starting ERP Merchandiser System with Network Access
echo =================================================
echo.

REM Kill any existing Node.js processes
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

REM Start the system
echo 🚀 Starting servers...
echo   - Backend server on 0.0.0.0:5001
echo   - Frontend server on 0.0.0.0:8080
echo.

npm run start:quick

echo.
echo 🎉 ERP System started with network access!
echo.
echo 📱 Access from other devices on your network:
echo   http://YOUR_IP:8080
echo.
echo 💡 To find your IP address, run: ipconfig
echo.
pause