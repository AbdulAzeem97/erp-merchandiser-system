# ===================================================================
# Create All System Users - Complete Version
# ===================================================================
# This script creates all 7 users in the database
# Run on server: C:\erp-merchandiser-system
# ===================================================================

param(
    [switch]$Fresh  # Use -Fresh to delete all existing users first
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
Write-Host "  ERP System - User Creation" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Check current directory
if (-not (Test-Path "docker-compose.complete.yml")) {
    Write-Host "❌ Error: docker-compose.complete.yml not found" -ForegroundColor Red
    Write-Host "   Please run this from C:\erp-merchandiser-system" -ForegroundColor Yellow
    exit 1
}

# Check if SQL file exists
if (-not (Test-Path "create-all-users-complete.sql")) {
    Write-Host "❌ Error: create-all-users-complete.sql not found" -ForegroundColor Red
    Write-Host "   Running git pull to get latest files..." -ForegroundColor Yellow
    git pull origin main
    Write-Host ""
}

# Check Docker is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check containers are running
$containers = docker-compose -f docker-compose.complete.yml ps -q
if (-not $containers) {
    Write-Host "⚠️  Containers are not running. Starting them..." -ForegroundColor Yellow
    docker-compose -f docker-compose.complete.yml up -d
    Start-Sleep -Seconds 15
}

Write-Host ""

# Fresh start option
if ($Fresh) {
    Write-Host "⚠️  FRESH START MODE: This will DELETE ALL EXISTING USERS!" -ForegroundColor Yellow
    $confirm = Read-Host "Are you sure? Type 'yes' to confirm"
    
    if ($confirm -eq "yes") {
        Write-Host ""
        Write-Host "🗑️  Deleting all existing users..." -ForegroundColor Yellow
        docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser -c "DELETE FROM users;"
        Write-Host "✅ All users deleted" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "❌ Operation cancelled" -ForegroundColor Red
        exit 0
    }
}

# Create users
Write-Host "📝 Creating all system users..." -ForegroundColor Blue
Write-Host "   This will take a few seconds..." -ForegroundColor Gray
Write-Host ""

$result = Get-Content create-all-users-complete.sql | docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Users created successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some warnings occurred (this is normal if users already exist)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Created Users" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Show all users
docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser -c "
SELECT 
    ROW_NUMBER() OVER (ORDER BY 
        CASE role
            WHEN 'ADMIN' THEN 1
            WHEN 'HOD_PREPRESS' THEN 2
            WHEN 'DESIGNER' THEN 3
            WHEN 'QA_PREPRESS' THEN 4
            WHEN 'CTP_OPERATOR' THEN 5
            WHEN 'INVENTORY_MANAGER' THEN 6
            WHEN 'PROCUREMENT_MANAGER' THEN 7
        END
    ) as \"#\",
    \"firstName\" || ' ' || \"lastName\" as \"Name\",
    email as \"Email\",
    role as \"Role\",
    department as \"Department\"
FROM users
ORDER BY 
    CASE role
        WHEN 'ADMIN' THEN 1
        WHEN 'HOD_PREPRESS' THEN 2
        WHEN 'DESIGNER' THEN 3
        WHEN 'QA_PREPRESS' THEN 4
        WHEN 'CTP_OPERATOR' THEN 5
        WHEN 'INVENTORY_MANAGER' THEN 6
        WHEN 'PROCUREMENT_MANAGER' THEN 7
    END;
"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  User Credentials" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$users = @(
    @{Name="Admin"; Email="admin@horizonsourcing.com"; Password="admin123"; Role="Full System Access"}
    @{Name="HOD Prepress"; Email="hod.prepress@horizonsourcing.com"; Password="hod123"; Role="Prepress Department"}
    @{Name="Designer"; Email="designer@horizonsourcing.com"; Password="designer123"; Role="Design Workflow"}
    @{Name="QA Prepress"; Email="qa.prepress@horizonsourcing.com"; Password="qa123"; Role="Quality Assurance"}
    @{Name="CTP Operator"; Email="ctp.operator@horizonsourcing.com"; Password="ctp123"; Role="Plate Generation"}
    @{Name="Inventory Manager"; Email="inventory.manager@horizonsourcing.com"; Password="inventory123"; Role="Inventory Module"}
    @{Name="Procurement Manager"; Email="procurement.manager@horizonsourcing.com"; Password="procurement123"; Role="Procurement Module"}
)

$counter = 1
foreach ($user in $users) {
    Write-Host "$counter. $($user.Name)" -ForegroundColor Yellow
    Write-Host "   Email:    $($user.Email)" -ForegroundColor White
    Write-Host "   Password: $($user.Password)" -ForegroundColor White
    Write-Host "   Access:   $($user.Role)" -ForegroundColor Gray
    Write-Host ""
    $counter++
}

Write-Host "============================================" -ForegroundColor Blue
Write-Host ""
Write-Host "🌐 Access URL: " -NoNewline
Write-Host "http://192.168.2.124:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "   • Test each user login" -ForegroundColor White
Write-Host "   • Change all passwords in production" -ForegroundColor White
Write-Host "   • Keep this information secure" -ForegroundColor White
Write-Host ""

# Count verification
$count = docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser -t -c "SELECT COUNT(*) FROM users;"
Write-Host "📊 Total Users in Database: " -NoNewline
Write-Host $count.Trim() -ForegroundColor Green

Write-Host ""
Write-Host "✅ User creation complete!" -ForegroundColor Green
Write-Host ""

# Show test command
Write-Host "🧪 To test login, open browser:" -ForegroundColor Cyan
Write-Host "   http://192.168.2.124:8080" -ForegroundColor White
Write-Host ""
Write-Host "📚 For complete details, see:" -ForegroundColor Cyan
Write-Host "   ALL-USERS-DETAILS.md" -ForegroundColor White
Write-Host ""



