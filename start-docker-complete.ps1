# PowerShell script to start the complete ERP system with Docker using dump file
# This script will start all services including database restoration from dump

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ERP Merchandiser System - Docker     " -ForegroundColor Cyan
Write-Host "  Complete Setup with Database Restore " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        Write-Host "   Download Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running." -ForegroundColor Red
    Write-Host "   Download Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if dump file exists
Write-Host "🔍 Checking for database dump file..." -ForegroundColor Yellow
if (-not (Test-Path "erp_merchandiser_backup.dump")) {
    Write-Host "❌ Database dump file not found: erp_merchandiser_backup.dump" -ForegroundColor Red
    Write-Host "   Please ensure the dump file is in the root directory." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Dump file found" -ForegroundColor Green

# Check if docker-compose.complete.yml exists
if (-not (Test-Path "docker-compose.complete.yml")) {
    Write-Host "❌ docker-compose.complete.yml not found" -ForegroundColor Red
    exit 1
}

# Stop any running containers
Write-Host ""
Write-Host "🛑 Stopping any existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.complete.yml down 2>$null

# Clean up old volumes (optional - comment out if you want to keep data)
$response = Read-Host "Do you want to clean up old volumes? This will DELETE all existing data. (y/N)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "🧹 Removing old volumes..." -ForegroundColor Yellow
    docker-compose -f docker-compose.complete.yml down -v
    Write-Host "✅ Old volumes removed" -ForegroundColor Green
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env" -ErrorAction SilentlyContinue
    if (Test-Path ".env") {
        Write-Host "✅ .env file created from env.example" -ForegroundColor Green
        Write-Host "⚠️  Please review and update .env file with your settings" -ForegroundColor Yellow
    }
}

# Build and start containers
Write-Host ""
Write-Host "🏗️  Building Docker images..." -ForegroundColor Yellow
Write-Host "   This may take several minutes on first run..." -ForegroundColor Cyan

docker-compose -f docker-compose.complete.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker images built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Starting containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.complete.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Write-Host "   This may take 1-2 minutes..." -ForegroundColor Cyan

# Wait for services to be healthy
$maxAttempts = 60
$attempt = 0
$allHealthy = $false

while (-not $allHealthy -and $attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 5
    $attempt++
    
    # Check health status
    $containers = docker-compose -f docker-compose.complete.yml ps --format json | ConvertFrom-Json
    $unhealthy = $containers | Where-Object { $_.Health -ne "healthy" -and $_.State -eq "running" }
    
    if ($unhealthy.Count -eq 0) {
        $allHealthy = $true
    } else {
        $progress = [math]::Round(($attempt / $maxAttempts) * 100)
        Write-Host "   Attempt $attempt/$maxAttempts - $($unhealthy.Count) containers still initializing... $progress%" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ ERP System Started Successfully!  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:8080" -ForegroundColor White
Write-Host "   Backend:   http://localhost:5001" -ForegroundColor White
Write-Host "   PgAdmin:   http://localhost:5050" -ForegroundColor White
Write-Host "              Email: admin@erp.local" -ForegroundColor Gray
Write-Host "              Password: admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Database Info:" -ForegroundColor Cyan
Write-Host "   Host:      localhost" -ForegroundColor White
Write-Host "   Port:      5432" -ForegroundColor White
Write-Host "   Database:  erp_merchandiser" -ForegroundColor White
Write-Host "   User:      erp_user" -ForegroundColor White
Write-Host "   Password:  DevPassword123!" -ForegroundColor White
Write-Host ""
Write-Host "📋 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:     docker-compose -f docker-compose.complete.yml logs -f" -ForegroundColor White
Write-Host "   Stop system:   docker-compose -f docker-compose.complete.yml down" -ForegroundColor White
Write-Host "   Restart:       docker-compose -f docker-compose.complete.yml restart" -ForegroundColor White
Write-Host "   Status:        docker-compose -f docker-compose.complete.yml ps" -ForegroundColor White
Write-Host ""
Write-Host "🎉 System is ready to use!" -ForegroundColor Green
Write-Host ""

# Ask if user wants to view logs
$viewLogs = Read-Host "Do you want to view the logs? (y/N)"
if ($viewLogs -eq 'y' -or $viewLogs -eq 'Y') {
    Write-Host ""
    Write-Host "📜 Showing logs (Press Ctrl+C to exit)..." -ForegroundColor Yellow
    docker-compose -f docker-compose.complete.yml logs -f
}

