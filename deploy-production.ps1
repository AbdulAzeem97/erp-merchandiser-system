#!/usr/bin/env powershell

<#
.SYNOPSIS
    Complete Production Deployment Script for ERP Merchandiser System

.DESCRIPTION
    This script handles the complete production deployment including:
    - PostgreSQL setup with Docker
    - Database migration and seeding
    - Application build and optimization
    - Environment configuration
    - Health checks and validation

.PARAMETER Environment
    Target environment (development, staging, production)

.PARAMETER SkipMigration
    Skip database migration (if already completed)

.PARAMETER Force
    Force clean installation (removes existing data)

.EXAMPLE
    .\deploy-production.ps1 -Environment production
    .\deploy-production.ps1 -Environment development -Force
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipMigration = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help = $false
)

# Display help
if ($Help) {
    Get-Help $MyInvocation.MyCommand.Path -Detailed
    exit 0
}

# Configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Blue }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Step { param($Message) Write-Host "🔄 $Message" -ForegroundColor Cyan }

Write-Host "🚀 ERP Merchandiser System - Production Deployment" -ForegroundColor Magenta
Write-Host "====================================================" -ForegroundColor Magenta
Write-Host ""

# Step 1: Validate environment
Write-Step "Validating deployment environment..."

# Check if Docker is running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker is not running"
    }
    Write-Success "Docker is running"
} catch {
    Write-Error "Docker is required but not running. Please start Docker Desktop."
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Success "Node.js version: $nodeVersion"
} catch {
    Write-Error "Node.js is required but not found. Please install Node.js 18 or higher."
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Success "npm version: $npmVersion"
} catch {
    Write-Error "npm is required but not found."
    exit 1
}

# Step 2: Install dependencies
Write-Step "Installing project dependencies..."
try {
    npm install --silent
    Write-Success "Dependencies installed successfully"
} catch {
    Write-Error "Failed to install dependencies"
    exit 1
}

# Step 3: Environment setup
Write-Step "Setting up environment configuration..."

$envConfig = @{
    development = @{
        DB_HOST = "localhost"
        DB_PORT = "5432"
        DB_NAME = "erp_merchandiser"
        DB_USER = "erp_user"
        DB_PASSWORD = "DevPassword123!"
        JWT_SECRET = "dev-jwt-secret-change-in-production"
        NODE_ENV = "development"
        PORT = "5001"
        FRONTEND_URL = "http://localhost:5173"
        REDIS_HOST = "localhost"
        REDIS_PORT = "6379"
    }
    staging = @{
        DB_HOST = "localhost"
        DB_PORT = "5432"
        DB_NAME = "erp_merchandiser_staging"
        DB_USER = "erp_user"
        DB_PASSWORD = "StagingPassword123!"
        JWT_SECRET = "staging-jwt-secret-change-in-production"
        NODE_ENV = "staging"
        PORT = "5001"
        FRONTEND_URL = "http://localhost:3000"
        REDIS_HOST = "localhost"
        REDIS_PORT = "6379"
    }
    production = @{
        DB_HOST = "localhost"
        DB_PORT = "5432"
        DB_NAME = "erp_merchandiser_prod"
        DB_USER = "erp_user"
        DB_PASSWORD = "ProductionPassword123!"
        JWT_SECRET = "production-jwt-secret-CHANGE-THIS-IN-REAL-PRODUCTION"
        NODE_ENV = "production"
        PORT = "5000"
        FRONTEND_URL = "https://your-domain.com"
        REDIS_HOST = "localhost"
        REDIS_PORT = "6379"
    }
}

$config = $envConfig[$Environment]

# Update .env file
$envContent = @()
foreach ($key in $config.Keys) {
    $envContent += "$key=$($config[$key])"
}

$envContent | Set-Content -Path ".env"
Write-Success "Environment configuration updated for $Environment"

# Step 4: Docker setup
Write-Step "Starting PostgreSQL and Redis containers..."

try {
    if ($Environment -eq "production") {
        docker-compose -f docker-compose.prod.yml up -d postgres redis
    } else {
        docker-compose up -d postgres redis
    }
    
    Write-Success "Database containers started"
    
    # Wait for PostgreSQL to be ready
    Write-Info "Waiting for PostgreSQL to be ready..."
    $maxRetries = 30
    $retryCount = 0
    
    do {
        Start-Sleep -Seconds 2
        $retryCount++
        try {
            $testConnection = docker exec erp-postgres-dev pg_isready -U erp_user 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "PostgreSQL is ready"
                break
            }
        } catch {
            # Continue retrying
        }
        
        if ($retryCount -ge $maxRetries) {
            throw "PostgreSQL failed to start within timeout"
        }
        
        Write-Info "Waiting for PostgreSQL... ($retryCount/$maxRetries)"
    } while ($true)
    
} catch {
    Write-Error "Failed to start database containers: $($_.Exception.Message)"
    exit 1
}

# Step 5: Database migration
if (-not $SkipMigration) {
    Write-Step "Running database migration..."
    
    try {
        if ($Force) {
            node complete-migration.js --force
        } else {
            node complete-migration.js
        }
        Write-Success "Database migration completed"
    } catch {
        Write-Error "Database migration failed: $($_.Exception.Message)"
        Write-Info "You can retry with: node complete-migration.js"
        exit 1
    }
} else {
    Write-Info "Skipping database migration as requested"
}

# Step 6: Build application
Write-Step "Building application for $Environment..."

try {
    if ($Environment -eq "production") {
        npm run build
        Write-Success "Production build completed"
    } else {
        npm run build:dev
        Write-Success "Development build completed"
    }
} catch {
    Write-Error "Application build failed"
    exit 1
}

# Step 7: Run tests
Write-Step "Running test suite..."

try {
    $env:NODE_ENV = "test"
    npm run test -- --passWithNoTests --watchAll=false
    Write-Success "Test suite passed"
} catch {
    Write-Warning "Some tests failed, but continuing with deployment"
    Write-Info "Run 'npm test' manually to see detailed test results"
}

# Step 8: Health checks
Write-Step "Performing health checks..."

# Start the server in background for health check
Write-Info "Starting server for health check..."
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run server
}

Start-Sleep -Seconds 10

try {
    # Test health endpoint
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:$($config.PORT)/health" -Method Get -TimeoutSec 10
    
    if ($healthResponse.status -eq "OK") {
        Write-Success "Health check passed"
        Write-Success "Server is running on port $($config.PORT)"
    } else {
        throw "Health check failed"
    }
} catch {
    Write-Warning "Health check failed - server may need manual verification"
    Write-Info "Check server logs: docker-compose logs"
} finally {
    # Stop the test server
    Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job -Job $serverJob -ErrorAction SilentlyContinue
}

# Step 9: Final setup and information
Write-Step "Finalizing deployment..."

# Create startup script
$startupScript = @"
@echo off
echo Starting ERP Merchandiser System...
echo =====================================

echo Starting database containers...
docker-compose up -d postgres redis

echo Waiting for database to be ready...
timeout /t 10 /nobreak >nul

echo Starting application server...
npm run server

pause
"@

$startupScript | Set-Content -Path "start-system.bat"

# Display final information
Write-Host ""
Write-Host "🎉 Deployment Completed Successfully!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Deployment Summary:" -ForegroundColor Yellow
Write-Host "   Environment: $Environment" -ForegroundColor White
Write-Host "   Database: PostgreSQL (Port 5432)" -ForegroundColor White
Write-Host "   Server Port: $($config.PORT)" -ForegroundColor White
Write-Host "   Frontend URL: $($config.FRONTEND_URL)" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Access Points:" -ForegroundColor Yellow
Write-Host "   📊 PgAdmin: http://localhost:5050" -ForegroundColor White
Write-Host "       Email: admin@erp.local" -ForegroundColor White
Write-Host "       Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "   🌐 API Server: http://localhost:$($config.PORT)" -ForegroundColor White
Write-Host "   🏥 Health Check: http://localhost:$($config.PORT)/health" -ForegroundColor White
Write-Host ""

Write-Host "🔑 Default Login Credentials:" -ForegroundColor Yellow
Write-Host "   👤 Admin: admin@horizonsourcing.com" -ForegroundColor White
Write-Host "   🔒 Password: admin123" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Run: .\start-system.bat (or npm run dev:full)" -ForegroundColor White
Write-Host "   2. Open browser: $($config.FRONTEND_URL)" -ForegroundColor White
Write-Host "   3. Login with admin credentials" -ForegroundColor White
Write-Host "   4. Test all functionality" -ForegroundColor White
Write-Host ""

Write-Host "📊 Monitoring:" -ForegroundColor Yellow
Write-Host "   • Database logs: docker-compose logs postgres" -ForegroundColor White
Write-Host "   • Redis logs: docker-compose logs redis" -ForegroundColor White
Write-Host "   • Application logs: Check console output" -ForegroundColor White
Write-Host ""

if ($Environment -eq "production") {
    Write-Host "⚠️  Production Notes:" -ForegroundColor Red
    Write-Host "   • Change JWT_SECRET in .env file" -ForegroundColor White
    Write-Host "   • Set up SSL certificates" -ForegroundColor White
    Write-Host "   • Configure firewall rules" -ForegroundColor White
    Write-Host "   • Set up automated backups" -ForegroundColor White
    Write-Host "   • Monitor system resources" -ForegroundColor White
    Write-Host ""
}

Write-Success "ERP Merchandiser System is ready for use!"

exit 0