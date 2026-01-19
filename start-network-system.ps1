# PowerShell script to start ERP System with Network Access
# This script ensures the system is accessible from the network

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ERP System - Network Start           " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get network IP
$networkIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"} | Select-Object -First 1).IPAddress

if (-not $networkIP) {
    $networkIP = "192.168.2.124"
}

Write-Host "📡 Network IP: $networkIP" -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.complete.yml down 2>$null

Write-Host ""

# Check if .env file exists and has correct network IP
Write-Host "📝 Configuring environment..." -ForegroundColor Yellow
if (Test-Path ".env.network") {
    # Update network IP in .env.network
    $envContent = Get-Content ".env.network" -Raw
    $envContent = $envContent -replace 'NETWORK_IP=.*', "NETWORK_IP=$networkIP"
    $envContent = $envContent -replace 'VITE_API_BASE_URL=http://.*:5001/api', "VITE_API_BASE_URL=http://${networkIP}:5001/api"
    Set-Content ".env.network" -Value $envContent
    
    # Copy to .env
    Copy-Item ".env.network" ".env" -Force
    Write-Host "✅ Environment configured for network IP: $networkIP" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.network not found, using existing .env" -ForegroundColor Yellow
}

Write-Host ""

# Rebuild frontend with correct API URL
Write-Host "🏗️  Rebuilding frontend with network configuration..." -ForegroundColor Yellow
Write-Host "   This ensures the frontend uses the correct API URL..." -ForegroundColor Cyan

$env:VITE_API_BASE_URL = "http://${networkIP}:5001/api"
docker-compose -f docker-compose.complete.yml build frontend --build-arg VITE_API_URL="http://${networkIP}:5001"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Start all services
Write-Host "🚀 Starting all services..." -ForegroundColor Yellow
docker-compose -f docker-compose.complete.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ System Started on Network!        " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 Network Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://${networkIP}:8080" -ForegroundColor White
Write-Host "   Backend:   http://${networkIP}:5001" -ForegroundColor White
Write-Host "   PgAdmin:   http://${networkIP}:5050" -ForegroundColor White
Write-Host ""

Write-Host "💻 Local Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:8080" -ForegroundColor White
Write-Host "   Backend:   http://localhost:5001" -ForegroundColor White
Write-Host ""

Write-Host "🗄️  Database Connection:" -ForegroundColor Cyan
Write-Host "   Host:      $networkIP" -ForegroundColor White
Write-Host "   Port:      5432" -ForegroundColor White
Write-Host "   Database:  erp_merchandiser" -ForegroundColor White
Write-Host "   User:      erp_user" -ForegroundColor White
Write-Host "   Password:  DevPassword123!" -ForegroundColor White
Write-Host ""

Write-Host "👤 Login Credentials:" -ForegroundColor Cyan
Write-Host "   Username:  admin" -ForegroundColor White
Write-Host "   Password:  admin123" -ForegroundColor White
Write-Host ""

Write-Host "📱 Access from other devices:" -ForegroundColor Yellow
Write-Host "   1. Connect device to same network" -ForegroundColor White
Write-Host "   2. Open browser and go to: http://${networkIP}:8080" -ForegroundColor Cyan
Write-Host "   3. Login with admin/admin123" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  Make sure Windows Firewall allows these ports:" -ForegroundColor Yellow
Write-Host "   Run: .\configure-network-access.ps1" -ForegroundColor White
Write-Host "   (Run as Administrator)" -ForegroundColor Gray
Write-Host ""

Write-Host "📋 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:     docker-compose -f docker-compose.complete.yml logs -f" -ForegroundColor White
Write-Host "   Check status:  docker-compose -f docker-compose.complete.yml ps" -ForegroundColor White
Write-Host "   Stop system:   docker-compose -f docker-compose.complete.yml down" -ForegroundColor White
Write-Host ""

Write-Host "🎉 System is ready for network access!" -ForegroundColor Green
Write-Host ""

# Check if user wants to view logs
$viewLogs = Read-Host "Do you want to view the logs? (y/N)"
if ($viewLogs -eq 'y' -or $viewLogs -eq 'Y') {
    Write-Host ""
    Write-Host "📜 Showing logs (Press Ctrl+C to exit)..." -ForegroundColor Yellow
    docker-compose -f docker-compose.complete.yml logs -f
}

