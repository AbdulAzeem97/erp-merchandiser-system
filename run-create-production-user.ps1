# PowerShell script to create production user using psql

Write-Host "🔐 Creating Production User..." -ForegroundColor Cyan
Write-Host "Email: production@horizonsourcing.com" -ForegroundColor Yellow
Write-Host "Password: password" -ForegroundColor Yellow
Write-Host "Role: PRODUCTION_MANAGER" -ForegroundColor Yellow
Write-Host ""

$sqlFile = "create-production-user.sql"

if (Test-Path $sqlFile) {
    Write-Host "📄 Found SQL file: $sqlFile" -ForegroundColor Green
    Write-Host "`n🔄 Attempting to run SQL script..." -ForegroundColor Cyan
    
    # Try with postgres user
    $result = & psql -U postgres -d erp_merchandiser -f $sqlFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ User created successfully!" -ForegroundColor Green
        Write-Host "`n🔑 Login Credentials:" -ForegroundColor Cyan
        Write-Host "   Email: production@horizonsourcing.com" -ForegroundColor White
        Write-Host "   Password: password" -ForegroundColor White
        Write-Host "`n🚀 Access URL: http://localhost:5173/production/smart-dashboard" -ForegroundColor Green
    }
    else {
        Write-Host "`n⚠️  Could not connect to database automatically." -ForegroundColor Yellow
        Write-Host "Please run manually:" -ForegroundColor Yellow
        Write-Host "   psql -U postgres -d erp_merchandiser -f $sqlFile" -ForegroundColor White
        Write-Host "`nOr copy-paste the SQL from $sqlFile into your database client." -ForegroundColor Yellow
    }
}
else {
    Write-Host "❌ SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}
