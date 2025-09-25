# PowerShell script to start ERP system with network access
# This script will find your IP address and start the servers

Write-Host "🌐 Starting ERP Merchandiser System with Network Access" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Get the local IP address
Write-Host "🔍 Finding your local IP address..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*" } | Select-Object -First 1).IPAddress

if ($ipAddress) {
    Write-Host "✅ Found IP address: $ipAddress" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not find local IP address. Using localhost." -ForegroundColor Yellow
    $ipAddress = "localhost"
}

Write-Host ""
Write-Host "🌐 Network Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://$ipAddress`:8080" -ForegroundColor White
Write-Host "  Backend:  http://$ipAddress`:5001" -ForegroundColor White
Write-Host "  Health:   http://$ipAddress`:5001/health" -ForegroundColor White
Write-Host ""

# Check if ports are available
Write-Host "🔍 Checking if ports are available..." -ForegroundColor Yellow

$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
$port5001 = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue

if ($port8080) {
    Write-Host "⚠️  Port 8080 is already in use. Stopping existing process..." -ForegroundColor Yellow
    $process = Get-Process -Id $port8080.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.Id -Force
        Start-Sleep -Seconds 2
    }
}

if ($port5001) {
    Write-Host "⚠️  Port 5001 is already in use. Stopping existing process..." -ForegroundColor Yellow
    $process = Get-Process -Id $port5001.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.Id -Force
        Start-Sleep -Seconds 2
    }
}

Write-Host "✅ Ports are available" -ForegroundColor Green
Write-Host ""

# Start the servers
Write-Host "🚀 Starting servers..." -ForegroundColor Green
Write-Host "  - Backend server on 0.0.0.0:5001" -ForegroundColor White
Write-Host "  - Frontend server on 0.0.0.0:8080" -ForegroundColor White
Write-Host ""

# Start the system
npm run start:quick

Write-Host ""
Write-Host "🎉 ERP System started with network access!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Access from other devices on your network:" -ForegroundColor Cyan
Write-Host "  http://$ipAddress`:8080" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  - Make sure other devices are on the same WiFi network" -ForegroundColor White
Write-Host "  - Windows Firewall may ask for permission - allow it" -ForegroundColor White
Write-Host "  - If connection fails, check firewall settings" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop the servers, press Ctrl+C" -ForegroundColor Red
