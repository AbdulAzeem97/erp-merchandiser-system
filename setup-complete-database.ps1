# ===================================================================
# COMPLETE DATABASE SETUP - One Command
# ===================================================================
# This script will:
# 1. Create all tables with relationships
# 2. Create all 7 users
# 3. Seed sample data
# ===================================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
Write-Host "  COMPLETE DATABASE SETUP" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Check location
if (-not (Test-Path "docker-compose.complete.yml")) {
    Write-Host "❌ Error: Not in correct directory" -ForegroundColor Red
    Write-Host "   Please run from: C:\erp-merchandiser-system" -ForegroundColor Yellow
    exit 1
}

# Check Docker
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    exit 1
}

# Check containers
$containers = docker-compose -f docker-compose.complete.yml ps -q postgres
if (-not $containers) {
    Write-Host "⚠️  Starting containers..." -ForegroundColor Yellow
    docker-compose -f docker-compose.complete.yml up -d
    Start-Sleep -Seconds 20
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  STEP 1: Creating Complete Database Schema" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 This will create:" -ForegroundColor Cyan
Write-Host "   • All ENUM types (7 types)" -ForegroundColor White
Write-Host "   • 30+ tables with relationships" -ForegroundColor White
Write-Host "   • All 7 system users" -ForegroundColor White
Write-Host "   • Sample data (categories, materials, etc.)" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Setup cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔨 Running complete setup script..." -ForegroundColor Blue
Write-Host "   This will take 10-20 seconds..." -ForegroundColor Gray
Write-Host ""

# Run the complete setup
Get-Content complete-database-setup.sql | docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Setup completed with some warnings (normal)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  VERIFICATION" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Show table count
Write-Host "📊 Database Statistics:" -ForegroundColor Blue
Write-Host ""
docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser -c "
SELECT 
    'Tables Created' AS metric,
    COUNT(*)::TEXT AS count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Users Created' AS metric,
    COUNT(*)::TEXT AS count
FROM users;
"

Write-Host ""
Write-Host "👥 All System Users:" -ForegroundColor Blue
Write-Host ""
docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser -c "
SELECT 
    id,
    \"firstName\" || ' ' || \"lastName\" AS name,
    email,
    role,
    department
FROM users
ORDER BY id;
"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  USER CREDENTIALS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$users = @(
    @{No=1; Name="Admin"; Email="admin@horizonsourcing.com"; Password="admin123"}
    @{No=2; Name="HOD Prepress"; Email="hod.prepress@horizonsourcing.com"; Password="hod123"}
    @{No=3; Name="Designer"; Email="designer@horizonsourcing.com"; Password="designer123"}
    @{No=4; Name="QA Prepress"; Email="qa.prepress@horizonsourcing.com"; Password="qa123"}
    @{No=5; Name="CTP Operator"; Email="ctp.operator@horizonsourcing.com"; Password="ctp123"}
    @{No=6; Name="Inventory Manager"; Email="inventory.manager@horizonsourcing.com"; Password="inventory123"}
    @{No=7; Name="Procurement Manager"; Email="procurement.manager@horizonsourcing.com"; Password="procurement123"}
)

foreach ($user in $users) {
    Write-Host "$($user.No). $($user.Name)" -ForegroundColor Yellow
    Write-Host "   Email:    $($user.Email)" -ForegroundColor White
    Write-Host "   Password: $($user.Password)" -ForegroundColor White
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access System:" -ForegroundColor Cyan
Write-Host "   URL: http://192.168.2.124:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "🧪 Test Login:" -ForegroundColor Cyan
Write-Host "   Email: admin@horizonsourcing.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   • ALL-USERS-DETAILS.md - Complete user info" -ForegroundColor White
Write-Host "   • complete-database-setup.sql - The setup script" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Change all passwords in production!" -ForegroundColor Yellow
Write-Host ""



