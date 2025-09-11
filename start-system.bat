@echo off
echo 🚀 Starting Complete ERP Merchandiser System...
echo.

echo 📡 Starting Backend Server...
start "Backend Server" cmd /k "set JWT_SECRET=your-super-secret-jwt-key-change-this-in-production && set PORT=3001 && node server/index.js"

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo 🎨 Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting in separate windows!
echo.
echo 🌐 Access URLs:
echo    Frontend: http://localhost:8081
echo    Backend:  http://localhost:3001
echo.
echo 🔑 Login Credentials:
echo    Admin: admin@horizonsourcing.com / admin123
echo    Designer: emma.wilson@horizonsourcing.com / admin123
echo    Merchandiser: tom.anderson@horizonsourcing.com / admin123
echo    Inventory: inventory@horizonsourcing.com / admin123
echo.
pause