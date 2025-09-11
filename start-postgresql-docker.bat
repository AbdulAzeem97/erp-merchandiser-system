@echo off
echo 🚀 Starting PostgreSQL with Docker...
echo.

echo 📋 Checking if Docker is installed...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is installed
echo.

echo 📋 Starting PostgreSQL container...
docker-compose up -d postgres

echo.
echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

echo.
echo 🔍 Checking PostgreSQL status...
docker-compose ps

echo.
echo ✅ PostgreSQL is running!
echo.
echo 📊 Connection Details:
echo   Host: localhost
echo   Port: 5432
echo   Database: erp_merchandiser
echo   Username: erp_user
echo   Password: secure_password_123
echo.
echo 🌐 Optional: pgAdmin is available at http://localhost:5050
echo   Email: admin@erp.com
echo   Password: admin123
echo.
echo 🎯 Next Steps:
echo   1. Run: node migrate-to-postgresql.js
echo   2. Start your application: npm start
echo.
pause

