# ERP Merchandiser System - LAN Network Server Startup Script (Auto Mode)
# This script configures and starts both servers for LAN access automatically

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ERP Merchandiser - LAN Network Setup" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set the IP address (change this if your IP changes)
$localIP = "192.168.2.124"

Write-Host "Using Local IP: $localIP" -ForegroundColor Green
Write-Host ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "   Backend Port: 5001" -ForegroundColor White
Write-Host "   Frontend Port: 8080" -ForegroundColor White
Write-Host "   Local IP: $localIP" -ForegroundColor White
Write-Host ""

# Kill any existing Node.js processes
Write-Host "Stopping any existing processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "Existing processes stopped" -ForegroundColor Green
} catch {
    Write-Host "No existing processes found" -ForegroundColor Gray
}
Write-Host ""

# Set environment variables for backend
$env:JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production"
$env:PORT = "5001"
$env:NODE_ENV = "development"
$env:DB_TYPE = "postgresql"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"
$env:DB_NAME = "erp_merchandiser"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "postgres123"

# Set environment variables for frontend
$env:VITE_API_URL = "http://${localIP}:5001"
$env:VITE_API_BASE_URL = "http://${localIP}:5001/api"

Write-Host "Starting Backend Server on port 5001..." -ForegroundColor Cyan
Write-Host "   API will be available at: http://${localIP}:5001" -ForegroundColor Gray
Write-Host ""

# Start backend server in a new process
$backendCmd = "cd '$PWD'; `$env:JWT_SECRET='your-super-secret-jwt-key-change-this-in-production'; `$env:PORT='5001'; `$env:NODE_ENV='development'; `$env:DB_TYPE='postgresql'; `$env:DB_HOST='localhost'; `$env:DB_PORT='5432'; `$env:DB_NAME='erp_merchandiser'; `$env:DB_USER='postgres'; `$env:DB_PASSWORD='postgres123'; Write-Host '=== Backend Server Starting ===' -ForegroundColor Green; Write-Host 'API URL: http://${localIP}:5001/api' -ForegroundColor Cyan; node server/index.js"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 6

# Test backend health
Write-Host "Testing backend connection..." -ForegroundColor Yellow
$healthCheckPassed = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $healthCheck = Invoke-WebRequest -Uri "http://${localIP}:5001/health" -UseBasicParsing -TimeoutSec 3
        if ($healthCheck.StatusCode -eq 200) {
            Write-Host "Backend is running and healthy!" -ForegroundColor Green
            $healthCheckPassed = $true
            break
        }
    } catch {
        Write-Host "   Attempt $i/5 - Backend not ready yet..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $healthCheckPassed) {
    Write-Host "Backend health check timed out, but continuing..." -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Starting Frontend Server on port 8080..." -ForegroundColor Cyan
Write-Host "   Frontend will be available at: http://${localIP}:8080" -ForegroundColor Gray
Write-Host ""

# Start frontend server in a new process
$frontendCmd = "cd '$PWD'; `$env:VITE_API_URL='http://${localIP}:5001'; `$env:VITE_API_BASE_URL='http://${localIP}:5001/api'; Write-Host '=== Frontend Server Starting ===' -ForegroundColor Green; Write-Host 'Frontend URL: http://${localIP}:8080' -ForegroundColor Cyan; Write-Host 'API Endpoint: http://${localIP}:5001/api' -ForegroundColor Yellow; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

# Wait for frontend to start
Write-Host "Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SYSTEM IS READY FOR LAN ACCESS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   From This Computer:" -ForegroundColor Cyan
Write-Host "      Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "      Backend:  http://localhost:5001" -ForegroundColor White
Write-Host ""
Write-Host "   From Other Devices on Network (192.168.2.x):" -ForegroundColor Cyan  
Write-Host "      Frontend: http://192.168.2.124:8080" -ForegroundColor White
Write-Host "      Backend:  http://192.168.2.124:5001" -ForegroundColor White
Write-Host "      Health:   http://192.168.2.124:5001/health" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Security Notes:" -ForegroundColor Yellow
Write-Host "   Windows Firewall must allow Node.js connections" -ForegroundColor Gray
Write-Host "   Ports 5001 and 8080 must be open" -ForegroundColor Gray
Write-Host "   All devices must be on the same network (192.168.2.x)" -ForegroundColor Gray
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "   Password for all users: password123" -ForegroundColor White
Write-Host ""
Write-Host "   Admin: admin@erp.local" -ForegroundColor Gray
Write-Host "   Designer: emma.wilson@horizonsourcing.com" -ForegroundColor Gray
Write-Host "   Merchandiser: merchandiser1@horizonsourcing.com" -ForegroundColor Gray
Write-Host "   HOD Prepress: hodprepress@horizonsourcing.com" -ForegroundColor Gray
Write-Host "   Inventory: inventory@horizonsourcing.com" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Both servers are now running in separate windows" -ForegroundColor Cyan
Write-Host "Check those windows for server logs and status" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop servers: Close the backend and frontend windows" -ForegroundColor Yellow
Write-Host "Or run: Get-Process node | Stop-Process -Force" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray

