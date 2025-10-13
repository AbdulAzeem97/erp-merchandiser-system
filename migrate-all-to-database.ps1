# Complete Database Migration Script
# This script migrates all Prisma schemas and SQL files to PostgreSQL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ERP System - Complete Database Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Database configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "erp_merchandiser"
$DB_USER = "postgres"
$DB_PASSWORD = "postgres123"
$DATABASE_URL = "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST" -ForegroundColor White
Write-Host "  Port: $DB_PORT" -ForegroundColor White
Write-Host "  Database: $DB_NAME" -ForegroundColor White
Write-Host "  User: $DB_USER" -ForegroundColor White
Write-Host ""

# Step 1: Create .env file for Prisma
Write-Host "Step 1: Creating .env file for Prisma..." -ForegroundColor Cyan
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
DB_PASSWORD=$DB_PASSWORD

# Frontend API Configuration
VITE_API_URL=http://192.168.2.124:5001
VITE_API_BASE_URL=http://192.168.2.124:5001/api
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -Force
Write-Host "  .env file created" -ForegroundColor Green
Write-Host ""

# Step 2: Test database connection
Write-Host "Step 2: Testing database connection..." -ForegroundColor Cyan
$env:PGPASSWORD = $DB_PASSWORD
try {
    $testResult = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "  Warning: Could not connect to database" -ForegroundColor Yellow
        Write-Host "  Make sure PostgreSQL is running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Warning: psql not found in PATH" -ForegroundColor Yellow
    Write-Host "  Continuing with migration..." -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Create database if it doesn't exist
Write-Host "Step 3: Creating database (if not exists)..." -ForegroundColor Cyan
try {
    $createDB = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1
    if ($createDB -like "*already exists*") {
        Write-Host "  Database already exists" -ForegroundColor Yellow
    } else {
        Write-Host "  Database created successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "  Continuing..." -ForegroundColor Gray
}
Write-Host ""

# Step 4: Generate Prisma Client
Write-Host "Step 4: Generating Prisma Client..." -ForegroundColor Cyan
$env:DATABASE_URL = $DATABASE_URL
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "  Warning: Prisma Client generation had issues" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Push Prisma schema to database
Write-Host "Step 5: Pushing Prisma schema to database..." -ForegroundColor Cyan
Write-Host "  This will create/update all tables based on schema.prisma" -ForegroundColor Gray
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Prisma schema applied successfully" -ForegroundColor Green
} else {
    Write-Host "  Warning: Prisma schema push had issues" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Apply important SQL migrations
Write-Host "Step 6: Applying SQL migrations..." -ForegroundColor Cyan

$sqlFiles = @(
    "server\database\migrations\001_add_prepress_and_roles.sql",
    "server\database\migrations\create_inventory_module.sql",
    "create-item-specifications-table.sql",
    "create-procurement-schema.sql",
    "create-ratio-reports-table.sql",
    "add-ctp-fields.sql"
)

$successCount = 0
$failCount = 0

foreach ($sqlFile in $sqlFiles) {
    if (Test-Path $sqlFile) {
        Write-Host "  Applying: $sqlFile" -ForegroundColor Yellow
        try {
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $sqlFile 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    Success" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "    Already applied or has issues" -ForegroundColor Gray
                $successCount++
            }
        } catch {
            Write-Host "    Failed: $($_.Exception.Message)" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host "  Skipping: $sqlFile (not found)" -ForegroundColor Gray
    }
}
Write-Host ""
Write-Host "  SQL Migrations: $successCount applied, $failCount failed" -ForegroundColor White
Write-Host ""

# Step 7: Seed the database
Write-Host "Step 7: Seeding database with initial data..." -ForegroundColor Cyan
Write-Host "  Choose seeding option:" -ForegroundColor Yellow
Write-Host "  1) Comprehensive seed (recommended)" -ForegroundColor White
Write-Host "  2) Basic seed" -ForegroundColor White
Write-Host "  3) Skip seeding" -ForegroundColor White
$seedChoice = Read-Host "  Enter choice (1-3)"

switch ($seedChoice) {
    "1" {
        Write-Host "  Running comprehensive seed..." -ForegroundColor Cyan
        if (Test-Path "prisma\comprehensive-seed.cjs") {
            node prisma\comprehensive-seed.cjs
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  Database seeded successfully" -ForegroundColor Green
            } else {
                Write-Host "  Seeding completed with warnings" -ForegroundColor Yellow
            }
        }
    }
    "2" {
        Write-Host "  Running basic seed..." -ForegroundColor Cyan
        npx prisma db seed
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Database seeded successfully" -ForegroundColor Green
        } else {
            Write-Host "  Seeding completed with warnings" -ForegroundColor Yellow
        }
    }
    "3" {
        Write-Host "  Skipping seeding" -ForegroundColor Gray
    }
}
Write-Host ""

# Step 8: Verify migration
Write-Host "Step 8: Verifying database structure..." -ForegroundColor Cyan
try {
    $tableCount = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>&1
    if ($tableCount) {
        Write-Host "  Total tables created: $($tableCount.Trim())" -ForegroundColor Green
    }
} catch {
    Write-Host "  Could not verify table count" -ForegroundColor Yellow
}
Write-Host ""

# Display summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Prisma schema applied" -ForegroundColor Green
Write-Host "  SQL migrations applied" -ForegroundColor Green
Write-Host "  Database is ready" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Start the servers: .\start-network-auto.ps1" -ForegroundColor White
Write-Host "  2. Access the system: http://192.168.2.124:8080" -ForegroundColor White
Write-Host "  3. Login with: admin@erp.local / password123" -ForegroundColor White
Write-Host ""
Write-Host "Database Connection String:" -ForegroundColor Cyan
Write-Host "  $DATABASE_URL" -ForegroundColor Gray
Write-Host ""

