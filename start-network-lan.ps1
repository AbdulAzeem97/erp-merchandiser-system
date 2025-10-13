# ERP Merchandiser System - LAN Network Server Startup Script
# This script configures and starts both servers for LAN access

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ERP Merchandiser - LAN Network Setup" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to get local IP address
function Get-LocalIP {
    $interfaces = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.IPAddress -notlike "127.*" -and 
        $_.IPAddress -notlike "169.254.*" -and
        ($_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual")
    }
    if ($interfaces) {
        # Prefer 192.168.x.x addresses
        $preferred = $interfaces | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1
        if ($preferred) {
            return $preferred.IPAddress
        }
        return $interfaces[0].IPAddress
    }
    return "192.168.2.124"
}

# Get local IP
$localIP = Get-LocalIP
Write-Host "Detected Local IP: $localIP" -ForegroundColor Green
Write-Host ""

# Ask user to confirm or change IP
$confirmIP = Read-Host "Is this IP correct? (Y/N) [Y]"
if ($confirmIP -eq "N" -or $confirmIP -eq "n") {
    $localIP = Read-Host "Enter your local IP address"
}

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
$backendProcess = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$env:JWT_SECRET='your-super-secret-jwt-key-change-this-in-production'; `$env:PORT='5001'; `$env:NODE_ENV='development'; `$env:DB_TYPE='postgresql'; `$env:DB_HOST='localhost'; `$env:DB_PORT='5432'; `$env:DB_NAME='erp_merchandiser'; `$env:DB_USER='postgres'; `$env:DB_PASSWORD='postgres123'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; node server/index.js"
) -PassThru -WindowStyle Normal

# Wait for backend to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test backend health
try {
    $healthCheck = Invoke-WebRequest -Uri "http://${localIP}:5001/health" -UseBasicParsing -TimeoutSec 5
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "Backend is running and healthy!" -ForegroundColor Green
    }
} catch {
    Write-Host "Backend health check failed, but continuing..." -ForegroundColor Yellow
    Write-Host "   Backend may still be starting up" -ForegroundColor Gray
}
Write-Host ""

Write-Host "Starting Frontend Server on port 8080..." -ForegroundColor Cyan
Write-Host "   Frontend will be available at: http://${localIP}:8080" -ForegroundColor Gray
Write-Host ""

# Start frontend server in a new process  
$frontendProcess = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$env:VITE_API_URL='http://${localIP}:5001'; `$env:VITE_API_BASE_URL='http://${localIP}:5001/api'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; Write-Host 'Frontend API URL: http://${localIP}:5001' -ForegroundColor Cyan; npm run dev"
) -PassThru -WindowStyle Normal

# Wait for frontend to start
Write-Host "Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

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
Write-Host "   From Other Devices on Network:" -ForegroundColor Cyan  
Write-Host "      Frontend: http://${localIP}:8080" -ForegroundColor White
Write-Host "      Backend:  http://${localIP}:5001" -ForegroundColor White
Write-Host "      Health:   http://${localIP}:5001/health" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Security Notes:" -ForegroundColor Yellow
Write-Host "   Make sure Windows Firewall allows Node.js" -ForegroundColor Gray
Write-Host "   Ports 5001 and 8080 must be open" -ForegroundColor Gray
Write-Host "   All devices must be on the same network" -ForegroundColor Gray
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "   If connection fails, run: .\fix-firewall.ps1" -ForegroundColor Gray
Write-Host "   Check Windows Firewall settings" -ForegroundColor Gray
Write-Host "   Verify IP address with: ipconfig" -ForegroundColor Gray
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "   Password for all users: password123" -ForegroundColor Gray
Write-Host "   Admin: admin@erp.local" -ForegroundColor Gray
Write-Host "   Designer: emma.wilson@horizonsourcing.com" -ForegroundColor Gray
Write-Host "   Merchandiser: merchandiser1@horizonsourcing.com" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Both servers are running in separate windows" -ForegroundColor Cyan
Write-Host "You can close this window safely" -ForegroundColor Cyan
Write-Host ""
