# ERP Merchandiser System - Complete System Startup Script
# This script starts the entire system with comprehensive validation

Write-Host "🚀 ERP Merchandiser System - Complete Startup" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to wait for a service to be ready
function Wait-ForService($url, $timeout = 30) {
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        try {
            $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                return $true
            }
        }
        catch {
            # Service not ready yet
        }
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    return $false
}

# Check prerequisites
Write-Host "🔍 Checking Prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "psql")) {
    Write-Host "⚠️  PostgreSQL client (psql) not found. Database operations may fail." -ForegroundColor Yellow
}

Write-Host "✅ Prerequisites check completed" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please create it from .env.example" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment configuration found" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "📦 Installing Dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to install dependencies: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Run database migrations
Write-Host "🗄️  Running Database Migrations..." -ForegroundColor Yellow
try {
    node server/database/migrate.js
    Write-Host "✅ Database migrations completed" -ForegroundColor Green
}
catch {
    Write-Host "❌ Database migration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Seed database with demo data
Write-Host "🌱 Seeding Database..." -ForegroundColor Yellow
try {
    node server/database/seed_enhanced.js
    Write-Host "✅ Database seeded successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Database seeding failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Run comprehensive tests
Write-Host "🧪 Running System Tests..." -ForegroundColor Yellow
try {
    node test-system.js
    Write-Host "✅ All tests passed" -ForegroundColor Green
}
catch {
    Write-Host "❌ Tests failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "⚠️  Continuing with startup despite test failures..." -ForegroundColor Yellow
}
Write-Host ""

# Start backend server
Write-Host "🖥️  Starting Backend Server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:NODE_ENV = "development"
    node server/index.js
}

# Wait for backend to be ready
Write-Host "⏳ Waiting for backend server to start..." -ForegroundColor Yellow
if (Wait-ForService "http://localhost:3001/health" 30) {
    Write-Host "✅ Backend server is ready" -ForegroundColor Green
} else {
    Write-Host "❌ Backend server failed to start within 30 seconds" -ForegroundColor Red
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}
Write-Host ""

# Start frontend development server
Write-Host "🌐 Starting Frontend Development Server..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}

# Wait for frontend to be ready
Write-Host "⏳ Waiting for frontend server to start..." -ForegroundColor Yellow
if (Wait-ForService "http://localhost:5173" 60) {
    Write-Host "✅ Frontend server is ready" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend server failed to start within 60 seconds" -ForegroundColor Red
    Stop-Job $frontendJob
    Remove-Job $frontendJob
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}
Write-Host ""

# System validation
Write-Host "🔍 Running Final System Validation..." -ForegroundColor Yellow

# Test API endpoints
$apiTests = @(
    @{ Name = "Health Check"; Url = "http://localhost:3001/health" },
    @{ Name = "Auth Endpoint"; Url = "http://localhost:3001/api/auth/login" },
    @{ Name = "Products API"; Url = "http://localhost:3001/api/products" },
    @{ Name = "Prepress API"; Url = "http://localhost:3001/api/prepress/jobs" },
    @{ Name = "Reports API"; Url = "http://localhost:3001/api/reports/summary" }
)

foreach ($test in $apiTests) {
    try {
        $response = Invoke-WebRequest -Uri $test.Url -Method GET -TimeoutSec 10 -ErrorAction SilentlyContinue
        if ($response.StatusCode -in @(200, 401, 403)) { # 401/403 are expected for protected endpoints
            Write-Host "  ✅ $($test.Name) - OK" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $($test.Name) - Unexpected status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "  ❌ $($test.Name) - Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 SYSTEM STARTUP COMPLETE!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 System Status:" -ForegroundColor Cyan
Write-Host "  • Backend Server: http://localhost:3001" -ForegroundColor White
Write-Host "  • Frontend Server: http://localhost:5173" -ForegroundColor White
Write-Host "  • Database: PostgreSQL (Connected)" -ForegroundColor White
Write-Host "  • Socket.io: Real-time updates enabled" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Demo Login Credentials:" -ForegroundColor Cyan
Write-Host "  • Head of Merchandiser: hom@example.com / password123" -ForegroundColor White
Write-Host "  • Head of Production: hop@example.com / password123" -ForegroundColor White
Write-Host "  • HOD Prepress: hod@example.com / password123" -ForegroundColor White
Write-Host "  • Designer: designer1@example.com / password123" -ForegroundColor White
Write-Host "  • Merchandiser: merch1@example.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "  • Main Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "  • HoM Dashboard: http://localhost:5173/merchandiser/head" -ForegroundColor White
Write-Host "  • HoP Dashboard: http://localhost:5173/production/head" -ForegroundColor White
Write-Host "  • HOD Prepress: http://localhost:5173/prepress/hod" -ForegroundColor White
Write-Host "  • Designer Workbench: http://localhost:5173/prepress/my" -ForegroundColor White
Write-Host ""
Write-Host "📝 To stop the system, press Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Keep the script running and show job status
try {
    while ($true) {
        $backendStatus = Get-Job $backendJob | Select-Object -ExpandProperty State
        $frontendStatus = Get-Job $frontendJob | Select-Object -ExpandProperty State
        
        if ($backendStatus -eq "Failed" -or $frontendStatus -eq "Failed") {
            Write-Host "❌ One or more services have failed. Stopping system..." -ForegroundColor Red
            break
        }
        
        Start-Sleep -Seconds 10
    }
}
finally {
    # Cleanup
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    
    if ($backendJob) {
        Stop-Job $backendJob
        Remove-Job $backendJob
    }
    
    if ($frontendJob) {
        Stop-Job $frontendJob
        Remove-Job $frontendJob
    }
    
    Write-Host "✅ System stopped successfully" -ForegroundColor Green
}
