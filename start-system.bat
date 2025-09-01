@echo off
echo.
echo ========================================
echo    ERP Merchandiser System Launcher
echo ========================================
echo.
echo Starting ERP System...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if database exists, if not run migration and seeding
if not exist "erp_merchandiser.db" (
    echo Setting up database...
    echo Running database migration...
    npm run db:migrate
    if %errorlevel% neq 0 (
        echo ERROR: Database migration failed
        pause
        exit /b 1
    )
    
    echo Running database seeding...
    npm run db:seed
    if %errorlevel% neq 0 (
        echo ERROR: Database seeding failed
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo    Starting Backend Server...
echo ========================================
echo Backend will be available at: http://localhost:5000
echo.

REM Start backend server in a new window
start "ERP Backend Server" cmd /k "npm run server"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo    Starting Frontend Server...
echo ========================================
echo Frontend will be available at: http://localhost:8080 (or next available port)
echo.

REM Start frontend server in a new window
start "ERP Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo    System Started Successfully!
echo ========================================
echo.
echo Backend Server: http://localhost:5000
echo Frontend Server: http://localhost:8080 (or check the terminal for exact port)
echo.
echo Default Admin Login:
echo Email: admin@horizonsourcing.com
echo Password: admin123
echo.
echo Press any key to open the frontend in your browser...
pause >nul

REM Try to open the frontend in the default browser
start http://localhost:8080

echo.
echo ========================================
echo    ERP System is now running!
echo ========================================
echo.
echo To stop the system:
echo 1. Close the terminal windows
echo 2. Or press Ctrl+C in each terminal
echo.
echo Enjoy your ERP system! 🚀
echo.
pause
