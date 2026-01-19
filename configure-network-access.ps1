# PowerShell script to configure Windows Firewall for ERP System Network Access
# Run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Network Access Configuration         " -ForegroundColor Cyan
Write-Host "  ERP Merchandiser System              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Get network IP
Write-Host "🔍 Detecting network configuration..." -ForegroundColor Yellow
$networkIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"} | Select-Object -First 1).IPAddress

if ($networkIP) {
    Write-Host "📡 Detected IP Address: $networkIP" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not auto-detect IP. Using default: 192.168.2.124" -ForegroundColor Yellow
    $networkIP = "192.168.2.124"
}

Write-Host ""
Write-Host "🔧 Configuring Windows Firewall..." -ForegroundColor Yellow
Write-Host ""

# Remove existing rules if they exist
Write-Host "🧹 Removing old firewall rules (if any)..." -ForegroundColor Cyan
Remove-NetFirewallRule -DisplayName "ERP System - Frontend" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "ERP System - Backend" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "ERP System - PostgreSQL" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "ERP System - Redis" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "ERP System - PgAdmin" -ErrorAction SilentlyContinue

# Add new firewall rules
Write-Host "➕ Adding firewall rules..." -ForegroundColor Cyan

# Frontend (Port 8080)
New-NetFirewallRule -DisplayName "ERP System - Frontend" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 8080 `
    -Action Allow `
    -Profile Any `
    -Description "Allow access to ERP System Frontend (React)" | Out-Null
Write-Host "   ✅ Frontend (Port 8080)" -ForegroundColor Green

# Backend (Port 5001)
New-NetFirewallRule -DisplayName "ERP System - Backend" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 5001 `
    -Action Allow `
    -Profile Any `
    -Description "Allow access to ERP System Backend API" | Out-Null
Write-Host "   ✅ Backend API (Port 5001)" -ForegroundColor Green

# PostgreSQL (Port 5432)
New-NetFirewallRule -DisplayName "ERP System - PostgreSQL" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 5432 `
    -Action Allow `
    -Profile Any `
    -Description "Allow access to PostgreSQL Database" | Out-Null
Write-Host "   ✅ PostgreSQL (Port 5432)" -ForegroundColor Green

# Redis (Port 6379)
New-NetFirewallRule -DisplayName "ERP System - Redis" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 6379 `
    -Action Allow `
    -Profile Any `
    -Description "Allow access to Redis Cache" | Out-Null
Write-Host "   ✅ Redis (Port 6379)" -ForegroundColor Green

# PgAdmin (Port 5050)
New-NetFirewallRule -DisplayName "ERP System - PgAdmin" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 5050 `
    -Action Allow `
    -Profile Any `
    -Description "Allow access to PgAdmin" | Out-Null
Write-Host "   ✅ PgAdmin (Port 5050)" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Firewall configuration complete!" -ForegroundColor Green
Write-Host ""

# Update .env file
Write-Host "📝 Updating .env file with network IP..." -ForegroundColor Yellow

if (Test-Path ".env.network") {
    $envContent = Get-Content ".env.network" -Raw
    $envContent = $envContent -replace 'NETWORK_IP=.*', "NETWORK_IP=$networkIP"
    $envContent = $envContent -replace 'VITE_API_BASE_URL=http://.*:5001/api', "VITE_API_BASE_URL=http://${networkIP}:5001/api"
    $envContent = $envContent -replace 'CORS_ORIGIN=http://.*:8080', "CORS_ORIGIN=http://${networkIP}:8080,http://localhost:8080,http://127.0.0.1:8080"
    Set-Content ".env.network" -Value $envContent
    
    # Copy to .env
    Copy-Item ".env.network" ".env" -Force
    Write-Host "✅ .env file updated with IP: $networkIP" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.network file not found. Please create it manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Configuration Complete!              " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Network Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://${networkIP}:8080" -ForegroundColor White
Write-Host "   Backend:   http://${networkIP}:5001" -ForegroundColor White
Write-Host "   Database:  ${networkIP}:5432" -ForegroundColor White
Write-Host "   PgAdmin:   http://${networkIP}:5050" -ForegroundColor White
Write-Host ""
Write-Host "🔥 Firewall Ports Opened:" -ForegroundColor Cyan
Write-Host "   ✅ 8080 (Frontend)" -ForegroundColor Green
Write-Host "   ✅ 5001 (Backend API)" -ForegroundColor Green
Write-Host "   ✅ 5432 (PostgreSQL)" -ForegroundColor Green
Write-Host "   ✅ 6379 (Redis)" -ForegroundColor Green
Write-Host "   ✅ 5050 (PgAdmin)" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Rebuild and restart Docker containers:" -ForegroundColor White
Write-Host "      docker-compose -f docker-compose.complete.yml down" -ForegroundColor Gray
Write-Host "      docker-compose -f docker-compose.complete.yml build frontend" -ForegroundColor Gray
Write-Host "      docker-compose -f docker-compose.complete.yml up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Access from any device on your network:" -ForegroundColor White
Write-Host "      http://${networkIP}:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Network access is now enabled!" -ForegroundColor Green
Write-Host ""

