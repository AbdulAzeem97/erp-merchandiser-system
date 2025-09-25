#!/usr/bin/env powershell

<#
.SYNOPSIS
    Start ERP Merchandiser System in Production Mode

.DESCRIPTION
    This script starts the complete ERP system including:
    - PostgreSQL and Redis containers
    - Backend API server
    - Frontend application (in production builds)
    - Health monitoring
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$Development = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$BackgroundMode = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$StatusOnly = $false
)

# Colors for output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Blue }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Step { param($Message) Write-Host "🔄 $Message" -ForegroundColor Cyan }

Write-Host ""
Write-Host "🚀 ERP Merchandiser System Startup" -ForegroundColor Magenta
Write-Host "====================================" -ForegroundColor Magenta

# Check if we just want status
if ($StatusOnly) {
    Write-Step "Checking system status..."
    
    # Check Docker containers
    $containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Write-Host ""
    Write-Host "📦 Docker Containers:" -ForegroundColor Yellow
    Write-Host $containers
    
    # Check if API is responding
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5001/health" -TimeoutSec 5
        Write-Success "API Server: Running ($($health.status))"
    } catch {
        Write-Warning "API Server: Not responding"
    }
    
    # Check frontend (if development)
    if ($Development) {
        try {
            $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5
            Write-Success "Frontend: Running (Development)"
        } catch {
            Write-Warning "Frontend: Not running"
        }
    }
    
    exit 0
}

# Step 1: Check prerequisites
Write-Step "Checking prerequisites..."

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in PATH"
    exit 1
}

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH"
    exit 1
}

Write-Success "Prerequisites check passed"

# Step 2: Start infrastructure
Write-Step "Starting infrastructure services..."

try {
    # Start PostgreSQL and Redis
    if ($Development) {
        docker-compose up -d postgres redis pgadmin
    } else {
        docker-compose -f docker-compose.prod.yml up -d postgres redis
    }
    
    Write-Success "Infrastructure services started"
    
    # Wait for PostgreSQL to be ready
    Write-Info "Waiting for PostgreSQL to initialize..."
    $ready = $false
    $attempts = 0
    $maxAttempts = 30
    
    do {
        Start-Sleep -Seconds 2
        $attempts++
        
        try {
            if ($Development) {
                $result = docker exec erp-postgres-dev pg_isready -U erp_user
            } else {
                $result = docker exec erp-postgres pg_isready -U erp_user
            }
            
            if ($LASTEXITCODE -eq 0) {
                $ready = $true
                Write-Success "PostgreSQL is ready"
            }
        } catch {
            # Continue waiting
        }
        
        if ($attempts -ge $maxAttempts) {
            Write-Error "PostgreSQL failed to start within timeout"
            exit 1
        }
        
        if (!$ready) {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
        
    } while (!$ready)
    
} catch {
    Write-Error "Failed to start infrastructure: $($_.Exception.Message)"
    exit 1
}

# Step 3: Verify database schema
Write-Step "Verifying database setup..."

try {
    $env:NODE_ENV = if ($Development) { "development" } else { "production" }
    
    # Quick schema verification
    if ($Development) {
        $tableCount = docker exec erp-postgres-dev psql -U erp_user -d erp_merchandiser -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
    } else {
        $tableCount = docker exec erp-postgres psql -U erp_user -d erp_merchandiser -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
    }
    
    $tableCount = $tableCount.Trim()
    
    if ([int]$tableCount -gt 20) {
        Write-Success "Database schema verified ($tableCount tables)"
    } else {
        Write-Warning "Database may need migration (only $tableCount tables found)"
        Write-Info "Run: node complete-migration.js"
    }
    
} catch {
    Write-Warning "Could not verify database schema"
}

# Step 4: Start application
Write-Step "Starting application services..."

if ($Development) {
    Write-Info "Starting in DEVELOPMENT mode"
    Write-Info "Frontend: http://localhost:5173"
    Write-Info "Backend: http://localhost:5001"
    Write-Info "PgAdmin: http://localhost:5050"
    
    if ($BackgroundMode) {
        Write-Info "Starting in background mode..."
        Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev:full"
        Write-Success "Development servers started in background"
    } else {
        Write-Info "Starting in interactive mode (Ctrl+C to stop)..."
        Write-Info "Opening application in browser in 10 seconds..."
        
        # Start the development servers
        npm run dev:full
    }
    
} else {
    Write-Info "Starting in PRODUCTION mode"
    Write-Info "Server: http://localhost:5000"
    
    # Ensure production build exists
    if (!(Test-Path "dist")) {
        Write-Step "Building production application..."
        npm run build
    }
    
    if ($BackgroundMode) {
        Write-Info "Starting in background mode..."
        Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "server"
        Write-Success "Production server started in background"
    } else {
        Write-Info "Starting production server (Ctrl+C to stop)..."
        Write-Info "Opening application in browser in 10 seconds..."
        
        # Start production server
        $env:NODE_ENV = "production"
        npm run server
    }
}

# Step 5: Open browser (if not background mode)
if (!$BackgroundMode) {
    Start-Sleep -Seconds 10
    
    try {
        if ($Development) {
            Start-Process "http://localhost:5173"
        } else {
            Start-Process "http://localhost:5000"
        }
    } catch {
        # Browser opening failed, continue anyway
    }
}

Write-Host ""
Write-Success "ERP Merchandiser System started successfully!"
Write-Host ""

# Display access information
Write-Host "🔗 Access Points:" -ForegroundColor Yellow
if ($Development) {
    Write-Host "   🌐 Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "   🔧 Backend API: http://localhost:5001" -ForegroundColor White
    Write-Host "   📊 PgAdmin: http://localhost:5050" -ForegroundColor White
} else {
    Write-Host "   🌐 Application: http://localhost:5000" -ForegroundColor White
    Write-Host "   🏥 Health Check: http://localhost:5000/health" -ForegroundColor White
}

Write-Host ""
Write-Host "🔑 Login Credentials:" -ForegroundColor Yellow
Write-Host "   👤 Admin: admin@erp.local / admin123" -ForegroundColor White
Write-Host "   🎨 Designer: emma.wilson@horizonsourcing.com / password123" -ForegroundColor White
Write-Host "   👔 Merchandiser: tom.anderson@horizonsourcing.com / password123" -ForegroundColor White

Write-Host ""
Write-Host "📊 System Commands:" -ForegroundColor Yellow
Write-Host "   Status Check: .\start-production-system.ps1 -StatusOnly" -ForegroundColor White
Write-Host "   Stop System: docker-compose down" -ForegroundColor White
Write-Host "   View Logs: docker-compose logs -f" -ForegroundColor White

Write-Host ""

if ($BackgroundMode) {
    Write-Info "System is running in background. Use -StatusOnly to check status."
} else {
    Write-Info "Press Ctrl+C to stop the system"
}