# ===================================================================
# LAN Server Setup Script - Dell Machine
# Server IP: 192.168.2.124
# ===================================================================

$SERVER_IP = "192.168.2.124"

Write-Host "============================================" -ForegroundColor Blue
Write-Host "  ERP System - LAN Server Setup" -ForegroundColor Blue
Write-Host "  Server IP: $SERVER_IP" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Please run this script as Administrator" -ForegroundColor Yellow
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

# Step 1: Configure Firewall
Write-Host "[1/5] Configuring Windows Firewall..." -ForegroundColor Blue
try {
    # Remove existing rules if any
    Remove-NetFirewallRule -DisplayName "ERP Frontend" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "ERP Backend" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "ERP PostgreSQL" -ErrorAction SilentlyContinue
    
    # Add new rules
    New-NetFirewallRule -DisplayName "ERP Frontend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow | Out-Null
    New-NetFirewallRule -DisplayName "ERP Backend" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow | Out-Null
    New-NetFirewallRule -DisplayName "ERP PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow | Out-Null
    
    Write-Host "✅ Firewall rules configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Firewall configuration failed. Please configure manually." -ForegroundColor Yellow
}

# Step 2: Create/Update .env file
Write-Host ""
Write-Host "[2/5] Creating environment configuration..." -ForegroundColor Blue
$envContent = @"
# ===================================================================
# LAN Server Environment Configuration
# Server IP: $SERVER_IP
# ===================================================================

# DATABASE CONFIGURATION
DB_HOST=postgres
DB_PORT=5432
DB_NAME=erp_merchandiser
DB_USER=postgres
DB_PASSWORD=erp_secure_password_2024

# SERVER CONFIGURATION
PORT=5001
NODE_ENV=production

# JWT CONFIGURATION
JWT_SECRET=erp_jwt_secret_key_change_in_production_2024_secure_random_string_minimum_64_characters
JWT_EXPIRES_IN=7d

# CORS CONFIGURATION - LAN Access
FRONTEND_URL=http://${SERVER_IP}:8080
ALLOWED_ORIGINS=http://${SERVER_IP}:8080,http://localhost:8080,http://192.168.2.*:8080

# FILE UPLOAD CONFIGURATION
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# LOGGING CONFIGURATION
LOG_LEVEL=info
LOG_DIR=./logs

# SOCKET.IO CONFIGURATION
WS_PATH=/socket.io
WS_CORS_ORIGIN=http://${SERVER_IP}:8080

# FRONTEND CONFIGURATION
VITE_API_URL=http://${SERVER_IP}:5001
VITE_WS_URL=ws://${SERVER_IP}:5001
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "✅ Environment file created with IP: $SERVER_IP" -ForegroundColor Green

# Step 3: Create necessary directories
Write-Host ""
Write-Host "[3/5] Creating directories..." -ForegroundColor Blue
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path "uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "init-db" | Out-Null
Write-Host "✅ Directories created" -ForegroundColor Green

# Step 4: Stop existing containers
Write-Host ""
Write-Host "[4/5] Stopping existing containers..." -ForegroundColor Blue
docker-compose -f docker-compose.complete.yml down 2>$null
Write-Host "✅ Existing containers stopped" -ForegroundColor Green

# Step 5: Start Docker containers
Write-Host ""
Write-Host "[5/5] Starting Docker containers..." -ForegroundColor Blue
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
docker-compose -f docker-compose.complete.yml up -d --build

# Wait for services
Write-Host ""
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check status
Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Blue
docker-compose -f docker-compose.complete.yml ps

# Success message
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✅ LAN Server Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access Information:" -ForegroundColor Blue
Write-Host "   Server IP: $SERVER_IP" -ForegroundColor White
Write-Host ""
Write-Host "📱 Access from ANY device on LAN:" -ForegroundColor Blue
Write-Host "   Frontend:  http://${SERVER_IP}:8080" -ForegroundColor Yellow
Write-Host "   Backend:   http://${SERVER_IP}:5001" -ForegroundColor Yellow
Write-Host ""
Write-Host "👥 Login Credentials:" -ForegroundColor Blue
Write-Host "   Email:     admin@horizonsourcing.com" -ForegroundColor White
Write-Host "   Password:  admin123" -ForegroundColor White
Write-Host ""
Write-Host "🖥️  Devices on LAN can now access:" -ForegroundColor Green
Write-Host "   • Desktop PCs" -ForegroundColor White
Write-Host "   • Laptops" -ForegroundColor White
Write-Host "   • Tablets" -ForegroundColor White
Write-Host "   • Mobile Phones" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Blue
Write-Host "   View logs:    docker-compose -f docker-compose.complete.yml logs -f" -ForegroundColor White
Write-Host "   Stop server:  docker-compose -f docker-compose.complete.yml down" -ForegroundColor White
Write-Host "   Restart:      docker-compose -f docker-compose.complete.yml restart" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Make sure all devices are on the same network (192.168.2.x)" -ForegroundColor Yellow
Write-Host ""

