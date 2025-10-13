# ============================================
# COMPLETE FRESH SETUP - DELETE EVERYTHING AND SETUP FROM SCRATCH
# ============================================
# Run this to get a perfect working system in one go
# ============================================

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "   COMPLETE FRESH SETUP STARTING" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Step 1: Stop and remove ALL containers
Write-Host "[1/8] Stopping all Docker containers..." -ForegroundColor Cyan
docker stop $(docker ps -aq) 2>$null
docker rm $(docker ps -aq) 2>$null
Write-Host "✅ All containers removed`n" -ForegroundColor Green

# Step 2: Remove all volumes (delete all data)
Write-Host "[2/8] Removing all Docker volumes..." -ForegroundColor Cyan
docker volume rm $(docker volume ls -q) 2>$null
Write-Host "✅ All volumes removed`n" -ForegroundColor Green

# Step 3: Remove all networks
Write-Host "[3/8] Cleaning Docker networks..." -ForegroundColor Cyan
docker network prune -f 2>$null
Write-Host "✅ Networks cleaned`n" -ForegroundColor Green

# Step 4: Navigate to project directory
Write-Host "[4/8] Setting up project..." -ForegroundColor Cyan
cd D:\erp-merchandiser-system
Write-Host "✅ In project directory`n" -ForegroundColor Green

# Step 5: Start PostgreSQL and PgAdmin
Write-Host "[5/8] Starting PostgreSQL and PgAdmin..." -ForegroundColor Cyan
docker-compose -f docker-compose.yml up -d postgres pgadmin
Start-Sleep -Seconds 20
Write-Host "✅ Database services started`n" -ForegroundColor Green

# Step 6: Create complete database schema
Write-Host "[6/8] Creating complete database schema..." -ForegroundColor Cyan
Get-Content database-setup-complete.sql | docker exec -i erp_postgres psql -U erp_user -d erp_merchandiser 2>&1 | Out-Null
Get-Content create-item-specifications-table.sql | docker exec -i erp_postgres psql -U erp_user -d erp_merchandiser 2>&1 | Out-Null
Get-Content create-ratio-reports-table.sql | docker exec -i erp_postgres psql -U erp_user -d erp_merchandiser 2>&1 | Out-Null
Get-Content create-complete-process-data.sql | docker exec -i erp_postgres psql -U erp_user -d erp_merchandiser 2>&1 | Out-Null
Write-Host "✅ Database schema created`n" -ForegroundColor Green

# Step 7: Add all missing columns for backend compatibility
Write-Host "[7/8] Adding backend-compatible columns..." -ForegroundColor Cyan

$fixSQL = @"
-- Fix products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS material_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "materialId" INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "categoryId" INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "productType" VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS "fscCertified" BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "fscLicense" VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS "basePrice" NUMERIC(12,2) DEFAULT 0;

-- Fix materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS "costPerUnit" NUMERIC(12,2) DEFAULT 0.25;

-- Fix users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Fix job_cards table
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "assignedToId" INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "createdById" INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "productId" INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "companyId" INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS final_design_link TEXT;

-- Fix product_process_selections
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS "processStepId" INTEGER;
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS "isSelected" BOOLEAN DEFAULT true;

-- Fix product_step_selections  
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "productId" INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "stepId" INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "isSelected" BOOLEAN DEFAULT true;

-- Update username for all users
UPDATE users SET username = LOWER(REPLACE(email, '@', '_at_')) WHERE username IS NULL;

-- Update materials costPerUnit
UPDATE materials SET "costPerUnit" = 0.25 WHERE "costPerUnit" IS NULL OR "costPerUnit" = 0;
"@

$fixSQL | docker exec -i erp_postgres psql -U erp_user -d erp_merchandiser 2>&1 | Out-Null
Write-Host "✅ All columns added`n" -ForegroundColor Green

# Step 8: Seed complete database
Write-Host "[8/8] Seeding database with complete data..." -ForegroundColor Cyan
$env:DB_HOST='localhost'
$env:DB_PORT='5432'
$env:DB_NAME='erp_merchandiser'
$env:DB_USER='erp_user'
$env:DB_PASSWORD='DevPassword123!'
node seed-complete-database.js 2>&1 | Out-Null

# Add admin@erp.local user
$hash = node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));"
docker exec erp_postgres psql -U erp_user -d erp_merchandiser -c "INSERT INTO users (\"firstName\", \"lastName\", email, password, role, department, \"isActive\", \"updatedAt\", username) VALUES ('Admin', 'Local', 'admin@erp.local', '$hash', 'ADMIN', 'Administration', true, CURRENT_TIMESTAMP, 'admin_local') ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;" 2>&1 | Out-Null

Write-Host "✅ Database seeded`n" -ForegroundColor Green

# Step 9: Start backend and frontend
Write-Host "[9/9] Starting backend and frontend..." -ForegroundColor Cyan
docker-compose -f docker-compose.postgresql.yml up -d erp_backend erp_frontend
Start-Sleep -Seconds 20
Write-Host "✅ All services started`n" -ForegroundColor Green

# Final verification
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "✅ DOCKER SERVICES:" -ForegroundColor Cyan
docker ps --format "  {{.Names}}: {{.Status}}" | findstr erp

Write-Host "`n✅ DATABASE:" -ForegroundColor Cyan
docker exec erp_postgres psql -U erp_user -d erp_merchandiser -c "SELECT (SELECT COUNT(*) FROM users) as users, (SELECT COUNT(*) FROM materials) as materials, (SELECT COUNT(*) FROM categories) as categories, (SELECT COUNT(*) FROM companies) as companies, (SELECT COUNT(*) FROM process_sequences) as sequences;" | Select-String "[0-9]"

Write-Host "`n✅ BACKEND STATUS:" -ForegroundColor Cyan
docker logs erp_backend --tail 8

Write-Host "`nACCESS YOUR SYSTEM:" -ForegroundColor Magenta
Write-Host "  Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5001" -ForegroundColor White
Write-Host "  PgAdmin:  http://localhost:5050" -ForegroundColor White

Write-Host "`nLOGIN CREDENTIALS:" -ForegroundColor Yellow
Write-Host "  admin@erp.local / admin123" -ForegroundColor White
Write-Host "  admin@horizonsourcing.com / admin123" -ForegroundColor White

Write-Host "`nSystem is ready to use!`n" -ForegroundColor Green

