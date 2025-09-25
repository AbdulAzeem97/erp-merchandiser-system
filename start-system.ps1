# ERP Merchandiser System Launcher (PowerShell)
# Run this script to start the complete ERP system

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    ERP Merchandiser System Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting ERP System..." -ForegroundColor Yellow
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host 'Press Enter to exit'
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "npm not found"
    }
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: npm is not available" -ForegroundColor Red
    Read-Host 'Press Enter to exit'
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Failed to install dependencies" -ForegroundColor Red
        Read-Host 'Press Enter to exit'
        exit 1
    }
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

# Check if database exists, if not run migration and seeding
if (-not (Test-Path "erp_merchandiser.db")) {
    Write-Host "Setting up database..." -ForegroundColor Yellow
    
    Write-Host "Running database migration..." -ForegroundColor Yellow
    npm run db:migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Database migration failed" -ForegroundColor Red
        Read-Host 'Press Enter to exit'
        exit 1
    }
    
    Write-Host "Running database seeding..." -ForegroundColor Yellow
    npm run db:seed
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Database seeding failed" -ForegroundColor Red
        Read-Host 'Press Enter to exit'
        exit 1
    }
    
    Write-Host "✓ Database setup completed" -ForegroundColor Green
} else {
    Write-Host "✓ Database already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Starting Backend Server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor White
Write-Host ""

# Start backend server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run server" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Starting Frontend Server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:8080 (or next available port)" -ForegroundColor White
Write-Host ""

# Start frontend server in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    System Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend Server: http://localhost:5000" -ForegroundColor White
Write-Host "Frontend Server: http://localhost:8080 (or check the terminal for exact port)" -ForegroundColor White
Write-Host ""
Write-Host "Default Admin Login:" -ForegroundColor Yellow
Write-Host "Email: admin@erp.local" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host ""

# Wait a moment for servers to start
Start-Sleep -Seconds 5

# Try to open the frontend in the default browser
try {
    Start-Process "http://localhost:8080"
    Write-Host "✓ Opened frontend in browser" -ForegroundColor Green
} catch {
    Write-Host "⚠ Could not open browser automatically" -ForegroundColor Yellow
    Write-Host "Please manually open: http://localhost:8080" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    ERP System is now running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To stop the system:" -ForegroundColor Yellow
Write-Host "1. Close the terminal windows" -ForegroundColor White
Write-Host "2. Or press Ctrl+C in each terminal" -ForegroundColor White
Write-Host ""
Write-Host "Enjoy your ERP system!" -ForegroundColor Cyan
Write-Host ""
Read-Host 'Press Enter to exit'
