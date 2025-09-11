# ERP Merchandiser System - Network Server Startup Script
# This script starts both backend and frontend servers for network access

Write-Host "🌐 Starting ERP Merchandiser System for Network Access..." -ForegroundColor Cyan
Write-Host ""

# Function to get local IP address
function Get-LocalIP {
    $interfaces = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }
    if ($interfaces) {
        return $interfaces[0].IPAddress
    }
    return "localhost"
}

# Get local IP and ports
$localIP = Get-LocalIP
$backendPort = if ($env:PORT) { $env:PORT } else { "3001" }
$frontendPort = "8080"

Write-Host "📍 Detected Local IP: $localIP" -ForegroundColor Green
Write-Host "🔧 Backend Port: $backendPort" -ForegroundColor Yellow
Write-Host "🎨 Frontend Port: $frontendPort" -ForegroundColor Yellow
Write-Host ""

# Kill any existing Node.js processes
Write-Host "🔄 Stopping any existing processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
} catch {
    Write-Host "No existing Node.js processes found" -ForegroundColor Gray
}

# Set environment variables
$env:JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production"
$env:PORT = $backendPort
$env:NODE_ENV = "development"
$env:VITE_API_BASE_URL = "http://${localIP}:${backendPort}/api"
$env:VITE_API_URL = "http://${localIP}:${backendPort}"

Write-Host "📡 Starting Backend Server..." -ForegroundColor Cyan

# Start backend server
$backendJob = Start-Job -ScriptBlock {
    param($backendPort, $localIP)
    Set-Location $using:PWD
    $env:JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production"
    $env:PORT = $backendPort
    $env:NODE_ENV = "development"
    node server/index.js
} -ArgumentList $backendPort, $localIP

# Wait a moment for backend to start
Start-Sleep -Seconds 3

Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan

# Start frontend server
$frontendJob = Start-Job -ScriptBlock {
    param($localIP, $backendPort)
    Set-Location $using:PWD
    $env:VITE_API_BASE_URL = "http://${localIP}:${backendPort}/api"
    $env:VITE_API_URL = "http://${localIP}:${backendPort}"
    npm run dev
} -ArgumentList $localIP, $backendPort

# Wait a moment for frontend to start
Start-Sleep -Seconds 5

# Display access information
Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Magenta
Write-Host "🚀 ERP MERCHANDISER SYSTEM - NETWORK ACCESS READY" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor Magenta
Write-Host "📍 Your Local IP: $localIP" -ForegroundColor White
Write-Host "🔧 Backend API: http://${localIP}:${backendPort}" -ForegroundColor White
Write-Host "🎨 Frontend App: http://${localIP}:${frontendPort}" -ForegroundColor White
Write-Host "🏥 Health Check: http://${localIP}:${backendPort}/health" -ForegroundColor White
Write-Host ("=" * 80) -ForegroundColor Magenta
Write-Host "📱 Network Access URLs:" -ForegroundColor Yellow
Write-Host "   • Main Application: http://${localIP}:${frontendPort}" -ForegroundColor White
Write-Host "   • API Endpoint: http://${localIP}:${backendPort}/api" -ForegroundColor White
Write-Host ("=" * 80) -ForegroundColor Magenta
Write-Host "👥 Share these URLs with your team members on the same network" -ForegroundColor Cyan
Write-Host "🔒 Make sure Windows Firewall allows connections on these ports" -ForegroundColor Red
Write-Host ("=" * 80) -ForegroundColor Magenta
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Team members can access the system using your IP address" -ForegroundColor Gray
Write-Host "   • If connection fails, check Windows Firewall settings" -ForegroundColor Gray
Write-Host "   • Press Ctrl+C to stop both servers" -ForegroundColor Gray
Write-Host ""
Write-Host "🔄 System is running... Press Ctrl+C to stop" -ForegroundColor Green
Write-Host ""

# Monitor jobs and display output
try {
    while ($true) {
        # Check backend job
        if ($backendJob.State -eq "Running") {
            $backendOutput = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
            if ($backendOutput) {
                Write-Host "[Backend] $backendOutput" -ForegroundColor Blue
            }
        }
        
        # Check frontend job
        if ($frontendJob.State -eq "Running") {
            $frontendOutput = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
            if ($frontendOutput) {
                Write-Host "[Frontend] $frontendOutput" -ForegroundColor Green
            }
        }
        
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Shutting down servers..." -ForegroundColor Red
    Stop-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Host "✅ Servers stopped successfully" -ForegroundColor Green
}
