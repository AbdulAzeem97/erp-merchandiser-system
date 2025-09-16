# ERP Merchandiser System - Docker Startup Script (PowerShell)
# This script starts the complete PostgreSQL-based ERP system using Docker

Write-Host "🚀 Starting ERP Merchandiser System with PostgreSQL..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.postgresql.yml down

# Ask about removing volumes
$removeVolumes = Read-Host "🗑️  Remove existing volumes? (y/N)"
if ($removeVolumes -match "^[Yy]$") {
    Write-Host "🧹 Cleaning up volumes..." -ForegroundColor Yellow
    docker volume prune -f
    docker-compose -f docker-compose.postgresql.yml down -v
}

# Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Cyan
docker-compose -f docker-compose.postgresql.yml up --build -d

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose -f docker-compose.postgresql.yml ps

# Display service URLs
Write-Host ""
Write-Host "✅ ERP Merchandiser System is running!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Service URLs:" -ForegroundColor White
Write-Host "   🖥️  Backend API:     http://localhost:5001" -ForegroundColor White
Write-Host "   🌐 Frontend:        http://localhost:8080" -ForegroundColor White
Write-Host "   🗄️  pgAdmin:        http://localhost:8081" -ForegroundColor White
Write-Host "   💾 PostgreSQL:     localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Default Credentials:" -ForegroundColor Yellow
Write-Host "   pgAdmin: admin@erp.local / admin123" -ForegroundColor Yellow
Write-Host "   Database: erp_user / DevPassword123!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Management Commands:" -ForegroundColor Cyan
Write-Host "   View logs:    docker-compose -f docker-compose.postgresql.yml logs -f" -ForegroundColor White
Write-Host "   Stop system:  docker-compose -f docker-compose.postgresql.yml down" -ForegroundColor White
Write-Host "   Restart:      docker-compose -f docker-compose.postgresql.yml restart" -ForegroundColor White
Write-Host ""

# Optional: Open browser
$openBrowser = Read-Host "🌐 Open frontend in browser? (y/N)"
if ($openBrowser -match "^[Yy]$") {
    Start-Process "http://localhost:8080"
}