# ===================================================================
# Create All System Users - PowerShell Script
# ===================================================================
# Run this on server to create all 7 users
# ===================================================================

Write-Host "============================================" -ForegroundColor Blue
Write-Host "  Creating All System Users" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

cd C:\erp-merchandiser-system

# Check if SQL file exists
if (-not (Test-Path "create-all-users.sql")) {
    Write-Host "❌ create-all-users.sql not found" -ForegroundColor Red
    Write-Host "   Please git pull first" -ForegroundColor Yellow
    exit 1
}

# Run SQL script
Write-Host "📝 Creating users in database..." -ForegroundColor Blue
Get-Content create-all-users.sql | docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser

Write-Host ""
Write-Host "✅ All users created successfully!" -ForegroundColor Green
Write-Host ""

# Show all users
Write-Host "👥 All System Users:" -ForegroundColor Blue
Write-Host ""
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "SELECT id, email, role, department FROM users ORDER BY id;"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  User Credentials" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Admin" -ForegroundColor Yellow
Write-Host "   Email:    admin@horizonsourcing.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "2. HOD Prepress" -ForegroundColor Yellow
Write-Host "   Email:    hod.prepress@horizonsourcing.com" -ForegroundColor White
Write-Host "   Password: hod123" -ForegroundColor White
Write-Host ""
Write-Host "3. Designer" -ForegroundColor Yellow
Write-Host "   Email:    designer@horizonsourcing.com" -ForegroundColor White
Write-Host "   Password: designer123" -ForegroundColor White
Write-Host ""
Write-Host "4. QA Prepress" -ForegroundColor Yellow
Write-Host "   Email:    qa.prepress@horizonsourcing.com" -ForegroundColor White
Write-Host "   Password: qa123" -ForegroundColor White
Write-Host ""
Write-Host "5. CTP Operator" -ForegroundColor Yellow
Write-Host "   Email:    ctp.operator@horizonsourcing.com" -ForegroundColor White
Write-Host "   Password: ctp123" -ForegroundColor White
Write-Host ""
Write-Host "6. Inventory Manager" -ForegroundColor Yellow
Write-Host "   Email:    inventory.manager@horizonsourcing.com" -ForegroundColor White
Write-Host "   Password: inventory123" -ForegroundColor White
Write-Host ""
Write-Host "7. Procurement Manager" -ForegroundColor Yellow
Write-Host "   Email:    procurement.manager@horizonsourcing.com" -ForegroundColor White
Write-Host "   Password: procurement123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Change all passwords after first login!" -ForegroundColor Yellow
Write-Host ""

