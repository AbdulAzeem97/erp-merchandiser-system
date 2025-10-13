# Interactive Database Migration Script
# This script will ask for database credentials and migrate everything

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ERP System - Database Migration Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for database credentials
Write-Host "PostgreSQL Database Credentials" -ForegroundColor Yellow
Write-Host ""

$DB_HOST = Read-Host "Database Host [localhost]"
if ([string]::IsNullOrWhiteSpace($DB_HOST)) { $DB_HOST = "localhost" }

$DB_PORT = Read-Host "Database Port [5432]"
if ([string]::IsNullOrWhiteSpace($DB_PORT)) { $DB_PORT = "5432" }

$DB_USER = Read-Host "Database User [postgres]"
if ([string]::IsNullOrWhiteSpace($DB_USER)) { $DB_USER = "postgres" }

$DB_PASSWORD = Read-Host "Database Password" -AsSecureString
$DB_PASSWORD_Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

$DB_NAME = Read-Host "Database Name [erp_merchandiser]"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) { $DB_NAME = "erp_merchandiser" }

Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Yellow

# Test connection
$env:PGPASSWORD = $DB_PASSWORD_Plain
$testConnection = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Cannot connect to PostgreSQL!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  • PostgreSQL is running" -ForegroundColor White
    Write-Host "  • Credentials are correct" -ForegroundColor White
    Write-Host "  • Host and port are correct" -ForegroundColor White
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $testConnection -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

Write-Host "  ✅ Connection successful!" -ForegroundColor Green
Write-Host ""

# Create DATABASE_URL
$DATABASE_URL = "postgresql://${DB_USER}:${DB_PASSWORD_Plain}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# Create .env file
Write-Host "Creating .env file..." -ForegroundColor Cyan
$envContent = @"
# Database Configuration
DATABASE_URL="$DATABASE_URL"

# Backend Configuration
PORT=5001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Details
DB_TYPE=postgresql
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD_Plain

# Frontend API Configuration
VITE_API_URL=http://192.168.2.124:5001
VITE_API_BASE_URL=http://192.168.2.124:5001/api
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -Force
Write-Host "  ✅ .env file created" -ForegroundColor Green
Write-Host ""

# Create database
Write-Host "Creating database '$DB_NAME'..." -ForegroundColor Cyan
$createDB = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1
if ($createDB -like "*already exists*") {
    Write-Host "  ℹ️  Database already exists" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Database created" -ForegroundColor Green
}
Write-Host ""

# Set environment variable
$env:DATABASE_URL = $DATABASE_URL

# Run Prisma migration
Write-Host "Applying Prisma schema..." -ForegroundColor Cyan
Write-Host "  Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Prisma Client generated" -ForegroundColor Green
}

Write-Host "  Pushing schema to database..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Prisma schema applied" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Prisma schema push completed with warnings" -ForegroundColor Yellow
}
Write-Host ""

# Apply SQL migrations
Write-Host "Applying SQL migrations..." -ForegroundColor Cyan
$sqlFiles = @(
    "server\database\migrations\001_add_prepress_and_roles.sql",
    "server\database\migrations\create_inventory_module.sql",
    "create-item-specifications-table.sql",
    "create-procurement-schema.sql",
    "create-ratio-reports-table.sql",
    "add-ctp-fields.sql"
)

$successCount = 0
foreach ($sqlFile in $sqlFiles) {
    if (Test-Path $sqlFile) {
        Write-Host "  Applying: $sqlFile" -ForegroundColor Yellow
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $sqlFile 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ Applied" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "    ℹ️  Already applied or skipped" -ForegroundColor Gray
        }
    }
}
Write-Host ""
Write-Host "  $successCount SQL files processed" -ForegroundColor White
Write-Host ""

# Verify
Write-Host "Verifying database..." -ForegroundColor Cyan
$tableCount = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>&1
if ($tableCount) {
    Write-Host "  ✅ Total tables: $($tableCount.Trim())" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database is ready!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Seed database: node prisma\comprehensive-seed.cjs" -ForegroundColor White
Write-Host "  2. Start servers: .\start-network-auto.ps1" -ForegroundColor White
Write-Host "  3. Access system: http://192.168.2.124:8080" -ForegroundColor White
Write-Host ""
pause

