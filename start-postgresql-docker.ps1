Write-Host "🚀 Starting PostgreSQL with Docker..." -ForegroundColor Green
Write-Host ""

Write-Host "📋 Checking if Docker is installed..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "📋 Starting PostgreSQL container..." -ForegroundColor Yellow
docker-compose up -d postgres

Write-Host ""
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🔍 Checking PostgreSQL status..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "✅ PostgreSQL is running!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Connection Details:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  Database: erp_merchandiser" -ForegroundColor White
Write-Host "  Username: erp_user" -ForegroundColor White
Write-Host "  Password: secure_password_123" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Optional: pgAdmin is available at http://localhost:5050" -ForegroundColor Cyan
Write-Host "  Email: admin@erp.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Run: node migrate-to-postgresql.js" -ForegroundColor White
Write-Host "  2. Start your application: npm start" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"

