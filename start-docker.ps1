# ===================================================================
# Complete Docker Deployment Script (PowerShell)
# ===================================================================
# One-command deployment for ERP Merchandiser System
# ===================================================================

$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "" "Blue"
Write-ColorOutput "============================================" "Blue"
Write-ColorOutput "  ERP Merchandiser System - Docker Setup" "Blue"
Write-ColorOutput "============================================" "Blue"
Write-ColorOutput "" "Blue"

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-ColorOutput "✅ Docker is installed" "Green"
} catch {
    Write-ColorOutput "❌ Docker is not installed. Please install Docker Desktop first." "Red"
    exit 1
}

# Check if Docker Compose is available
try {
    docker-compose --version 2>$null | Out-Null
    $composeCommand = "docker-compose"
} catch {
    try {
        docker compose version | Out-Null
        $composeCommand = "docker compose"
    } catch {
        Write-ColorOutput "❌ Docker Compose is not available" "Red"
        exit 1
    }
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    if (Test-Path "env.docker.example") {
        Copy-Item "env.docker.example" ".env"
        Write-ColorOutput "📝 Created .env file from env.docker.example" "Yellow"
        Write-ColorOutput "⚠️  Please review .env file and update passwords if needed" "Yellow"
        Write-ColorOutput "" "White"
    } else {
        Write-ColorOutput "❌ env.docker.example not found" "Red"
        exit 1
    }
} else {
    Write-ColorOutput "✅ .env file exists" "Green"
}

# Create necessary directories
Write-ColorOutput "📁 Creating necessary directories..." "Blue"
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path "uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "init-db" | Out-Null
Write-ColorOutput "✅ Directories created" "Green"
Write-ColorOutput "" "White"

# Stop existing containers
Write-ColorOutput "🛑 Stopping existing containers..." "Yellow"
& $composeCommand -f docker-compose.complete.yml down 2>$null
Write-ColorOutput "" "White"

# Build images
Write-ColorOutput "🔨 Building Docker images..." "Blue"
Write-ColorOutput "   This may take a few minutes..." "Yellow"
& $composeCommand -f docker-compose.complete.yml build --no-cache
Write-ColorOutput "✅ Images built successfully" "Green"
Write-ColorOutput "" "White"

# Start containers
Write-ColorOutput "🚀 Starting containers..." "Blue"
& $composeCommand -f docker-compose.complete.yml up -d
Write-ColorOutput "" "White"

# Wait for services
Write-ColorOutput "⏳ Waiting for services to be ready..." "Yellow"
Write-ColorOutput "   This may take 30-60 seconds..." "Yellow"
Start-Sleep -Seconds 10

# Check container status
Write-ColorOutput "" "White"
Write-ColorOutput "📊 Container Status:" "Blue"
& $composeCommand -f docker-compose.complete.yml ps
Write-ColorOutput "" "White"

# Check PostgreSQL
Write-ColorOutput "🔍 Checking PostgreSQL..." "Blue"
$pgReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        & $composeCommand -f docker-compose.complete.yml exec -T postgres pg_isready -U postgres 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ PostgreSQL is ready" "Green"
            $pgReady = $true
            break
        }
    } catch {}
    Write-ColorOutput "   Waiting... ($i/30)" "Yellow"
    Start-Sleep -Seconds 2
}

if (-not $pgReady) {
    Write-ColorOutput "⚠️  PostgreSQL may still be starting. Check logs if needed." "Yellow"
}

# Check Backend
Write-ColorOutput "🔍 Checking Backend API..." "Blue"
$backendReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✅ Backend API is ready" "Green"
            $backendReady = $true
            break
        }
    } catch {}
    Write-ColorOutput "   Waiting... ($i/30)" "Yellow"
    Start-Sleep -Seconds 2
}

if (-not $backendReady) {
    Write-ColorOutput "⚠️  Backend may still be starting. Check logs if needed." "Yellow"
}

# Check Frontend
Write-ColorOutput "🔍 Checking Frontend..." "Blue"
$frontendReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✅ Frontend is ready" "Green"
            $frontendReady = $true
            break
        }
    } catch {}
    Write-ColorOutput "   Waiting... ($i/30)" "Yellow"
    Start-Sleep -Seconds 2
}

if (-not $frontendReady) {
    Write-ColorOutput "⚠️  Frontend may still be starting. Check logs if needed." "Yellow"
}

# Success message
Write-ColorOutput "" "White"
Write-ColorOutput "============================================" "Green"
Write-ColorOutput "  ✅ Deployment Completed Successfully!" "Green"
Write-ColorOutput "============================================" "Green"
Write-ColorOutput "" "White"
Write-ColorOutput "📝 Access Information:" "Blue"
Write-ColorOutput "   Frontend:  http://localhost:8080" "Yellow"
Write-ColorOutput "   Backend:   http://localhost:5001" "Yellow"
Write-ColorOutput "   Database:  localhost:5432" "Yellow"
Write-ColorOutput "" "White"
Write-ColorOutput "👥 Default User Credentials:" "Blue"
Write-ColorOutput "   Admin:              admin@horizonsourcing.com / admin123" "White"
Write-ColorOutput "   HOD Prepress:       hod.prepress@horizonsourcing.com / hod123" "White"
Write-ColorOutput "   Designer:           designer@horizonsourcing.com / designer123" "White"
Write-ColorOutput "   QA Prepress:        qa.prepress@horizonsourcing.com / qa123" "White"
Write-ColorOutput "   CTP Operator:       ctp.operator@horizonsourcing.com / ctp123" "White"
Write-ColorOutput "   Inventory Manager:  inventory.manager@horizonsourcing.com / inventory123" "White"
Write-ColorOutput "   Procurement Manager: procurement.manager@horizonsourcing.com / procurement123" "White"
Write-ColorOutput "" "White"
Write-ColorOutput "⚠️  Change all default passwords after first login!" "Yellow"
Write-ColorOutput "" "White"
Write-ColorOutput "🔧 Useful Commands:" "Blue"
Write-ColorOutput "   View logs:          docker-compose -f docker-compose.complete.yml logs -f" "White"
Write-ColorOutput "   Stop services:      docker-compose -f docker-compose.complete.yml down" "White"
Write-ColorOutput "   Restart services:   docker-compose -f docker-compose.complete.yml restart" "White"
Write-ColorOutput "" "White"
Write-ColorOutput "🎉 Your ERP System is now running!" "Green"
Write-ColorOutput "   Open http://localhost:8080 in your browser" "Green"
Write-ColorOutput "" "White"

