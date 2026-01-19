# Docker Start Script for ERP Merchandiser System
# This script will start the complete ERP system with database restoration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ERP Merchandiser System - Docker Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}
Write-Host "Docker is running!" -ForegroundColor Green
Write-Host ""

# Navigate to the project directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Create .env.docker file if it doesn't exist
if (-not (Test-Path ".env.docker")) {
    Write-Host "Creating .env.docker file..." -ForegroundColor Yellow
    Copy-Item "env.docker.template" ".env.docker"
    Write-Host ".env.docker file created successfully!" -ForegroundColor Green
} else {
    Write-Host ".env.docker file already exists." -ForegroundColor Green
}
Write-Host ""

# Check if dump file exists
$dumpPath = "..\erp_merchandiser_backup.dump"
if (-not (Test-Path $dumpPath)) {
    Write-Host "Warning: Dump file not found at $dumpPath" -ForegroundColor Yellow
    Write-Host "The system will start but the database will be empty." -ForegroundColor Yellow
    $continue = Read-Host "Do you want to continue? (y/n)"
    if ($continue -ne "y") {
        exit 0
    }
} else {
    Write-Host "Dump file found: $dumpPath" -ForegroundColor Green
}
Write-Host ""

# Stop any existing containers
Write-Host "Stopping any existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.full.yml down
Write-Host ""

# Build and start services
Write-Host "Building and starting services..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Cyan
docker-compose -f docker-compose.full.yml up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "ERP System is starting up!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services will be available at:" -ForegroundColor Cyan
    Write-Host "  - Frontend:  http://localhost:8080" -ForegroundColor White
    Write-Host "  - Backend:   http://localhost:5001" -ForegroundColor White
    Write-Host "  - Database:  localhost:5432" -ForegroundColor White
    Write-Host "  - Redis:     localhost:6379" -ForegroundColor White
    Write-Host ""
    Write-Host "To view logs, run:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose.full.yml logs -f" -ForegroundColor White
    Write-Host ""
    Write-Host "To stop the system, run:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose.full.yml down" -ForegroundColor White
    Write-Host ""
    Write-Host "Waiting for services to be healthy (this may take 1-2 minutes)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30
    
    Write-Host ""
    Write-Host "Checking service status..." -ForegroundColor Yellow
    docker-compose -f docker-compose.full.yml ps
    
} else {
    Write-Host ""
    Write-Host "Error: Failed to start services" -ForegroundColor Red
    Write-Host "Check the logs for more details:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose.full.yml logs" -ForegroundColor White
    exit 1
}


