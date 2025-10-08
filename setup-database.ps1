# ===================================================================
# Automated Database Setup Script (PowerShell)
# ===================================================================
# This script automates the complete database setup process
# Run this on a fresh server with PostgreSQL installed
# ===================================================================

param(
    [string]$DBName = "erp_merchandiser",
    [string]$DBUser = "postgres",
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432"
)

$ErrorActionPreference = "Stop"

# Color functions
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "============================================" -ForegroundColor Blue
    Write-Host ""
}

Write-Header "  ERP Merchandiser System - Database Setup  "

# [1/7] Check PostgreSQL installation
Write-Host "[1/7] Checking PostgreSQL installation..." -ForegroundColor Blue
try {
    $psqlVersion = psql --version
    Write-Success "PostgreSQL is installed"
    Write-Host "        $psqlVersion" -ForegroundColor Gray
} catch {
    Write-Error-Custom "PostgreSQL is not installed. Please install PostgreSQL 12+ first."
    exit 1
}

# [2/7] Check Node.js installation
Write-Host ""
Write-Host "[2/7] Checking Node.js installation..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Success "Node.js is installed"
    Write-Host "        $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Error-Custom "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
}

# [3/7] Create database
Write-Host ""
Write-Host "[3/7] Creating database..." -ForegroundColor Blue
try {
    $env:PGPASSWORD = $env:DB_PASSWORD
    $dbExists = psql -U $DBUser -h $DBHost -p $DBPort -tAc "SELECT 1 FROM pg_database WHERE datname='$DBName'" 2>$null
    
    if ($dbExists -eq "1") {
        Write-Info "Database '$DBName' already exists"
        $response = Read-Host "Do you want to drop and recreate it? (y/N)"
        if ($response -eq "y" -or $response -eq "Y") {
            psql -U $DBUser -h $DBHost -p $DBPort -c "DROP DATABASE $DBName;"
            psql -U $DBUser -h $DBHost -p $DBPort -c "CREATE DATABASE $DBName;"
            Write-Success "Database recreated"
        }
    } else {
        psql -U $DBUser -h $DBHost -p $DBPort -c "CREATE DATABASE $DBName;"
        Write-Success "Database created: $DBName"
    }
} catch {
    Write-Error-Custom "Failed to create database: $_"
    exit 1
}

# [4/7] Install npm dependencies
Write-Host ""
Write-Host "[4/7] Installing Node.js dependencies..." -ForegroundColor Blue
if (Test-Path "package.json") {
    npm install
    Write-Success "Dependencies installed"
} else {
    Write-Error-Custom "package.json not found. Are you in the project root directory?"
    exit 1
}

# [5/7] Check .env file
Write-Host ""
Write-Host "[5/7] Checking environment configuration..." -ForegroundColor Blue
if (-not (Test-Path ".env")) {
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Info ".env file created from env.example"
        Write-Info "Please edit .env file with your database credentials"
        Read-Host "Press Enter to continue after editing .env"
    } else {
        Write-Error-Custom ".env file not found. Please create one with database credentials."
        exit 1
    }
} else {
    Write-Success ".env file exists"
}

# [6/7] Run database schema setup
Write-Host ""
Write-Host "[6/7] Setting up database schema..." -ForegroundColor Blue
if (Test-Path "database-setup-complete.sql") {
    $env:PGPASSWORD = $env:DB_PASSWORD
    psql -U $DBUser -h $DBHost -p $DBPort -d $DBName -f database-setup-complete.sql
    Write-Success "Database schema created"
} else {
    Write-Error-Custom "database-setup-complete.sql not found"
    exit 1
}

# [7/7] Seed database
Write-Host ""
Write-Host "[7/7] Seeding database with initial data..." -ForegroundColor Blue
if (Test-Path "seed-complete-database.js") {
    node seed-complete-database.js
    Write-Success "Database seeded successfully"
} else {
    Write-Error-Custom "seed-complete-database.js not found"
    exit 1
}

# Success message
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✅ Database Setup Completed Successfully!  " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Default User Credentials:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Admin:              admin@horizonsourcing.com / admin123"
Write-Host "HOD Prepress:       hod.prepress@horizonsourcing.com / hod123"
Write-Host "Designer:           designer@horizonsourcing.com / designer123"
Write-Host "QA Prepress:        qa.prepress@horizonsourcing.com / qa123"
Write-Host "CTP Operator:       ctp.operator@horizonsourcing.com / ctp123"
Write-Host "Inventory Manager:  inventory.manager@horizonsourcing.com / inventory123"
Write-Host "Procurement Manager: procurement.manager@horizonsourcing.com / procurement123"
Write-Host ""
Write-Host "⚠️  IMPORTANT: Change all default passwords in production!" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Blue
Write-Host "  1. Start backend:  npm run server"
Write-Host "  2. Start frontend: npm run dev"
Write-Host "  3. Open browser:   http://localhost:8080"
Write-Host ""

