@echo off
cls
echo ========================================
echo DATABASE MIGRATION - Quick Setup
echo ========================================
echo.
echo This script will migrate all Prisma schemas and SQL files.
echo.

REM Ask for password
echo What is your PostgreSQL password?
echo.
echo Common defaults:
echo   1. postgres
echo   2. (blank - just press Enter)
echo   3. admin
echo   4. password
echo.
set /p DB_PASSWORD="Enter password: "

REM If blank, try "postgres" as default
if "%DB_PASSWORD%"=="" set DB_PASSWORD=postgres

echo.
echo Using password: %DB_PASSWORD%
echo.
echo Testing connection...

REM Set environment
set PGPASSWORD=%DB_PASSWORD%
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=erp_merchandiser

REM Test connection
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d postgres -c "SELECT 1;" >nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Cannot connect to PostgreSQL!
    echo ========================================
    echo.
    echo The password "%DB_PASSWORD%" is INCORRECT.
    echo.
    echo What to do:
    echo   1. Try again with a different password
    echo   2. See: FIND-POSTGRES-PASSWORD.md
    echo   3. Reset your PostgreSQL password
    echo.
    pause
    exit /b 1
)

echo Connection successful!
echo.

REM Create DATABASE_URL
set DATABASE_URL=postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%?schema=public

REM Create .env file
echo Creating .env file...
(
echo DATABASE_URL="%DATABASE_URL%"
echo PORT=5001
echo NODE_ENV=development
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
echo DB_TYPE=postgresql
echo DB_HOST=%DB_HOST%
echo DB_PORT=%DB_PORT%
echo DB_NAME=%DB_NAME%
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo VITE_API_URL=http://192.168.2.124:5001
echo VITE_API_BASE_URL=http://192.168.2.124:5001/api
) > .env

echo .env file created!
echo.

REM Create database
echo Creating database...
psql -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;" 2>nul
echo Database ready!
echo.

REM Run Prisma migration
echo Applying Prisma schema...
echo This may take a minute...
call npx prisma generate
call npx prisma db push --accept-data-loss
echo.

REM Apply SQL files
echo Applying additional SQL migrations...

if exist "server\database\migrations\001_add_prepress_and_roles.sql" (
    echo   - Prepress and roles...
    psql -U %DB_USER% -d %DB_NAME% -f "server\database\migrations\001_add_prepress_and_roles.sql" 2>nul
)

if exist "server\database\migrations\create_inventory_module.sql" (
    echo   - Inventory module...
    psql -U %DB_USER% -d %DB_NAME% -f "server\database\migrations\create_inventory_module.sql" 2>nul
)

if exist "create-item-specifications-table.sql" (
    echo   - Item specifications...
    psql -U %DB_USER% -d %DB_NAME% -f "create-item-specifications-table.sql" 2>nul
)

if exist "create-procurement-schema.sql" (
    echo   - Procurement schema...
    psql -U %DB_USER% -d %DB_NAME% -f "create-procurement-schema.sql" 2>nul
)

if exist "create-ratio-reports-table.sql" (
    echo   - Ratio reports...
    psql -U %DB_USER% -d %DB_NAME% -f "create-ratio-reports-table.sql" 2>nul
)

if exist "add-ctp-fields.sql" (
    echo   - CTP fields...
    psql -U %DB_USER% -d %DB_NAME% -f "add-ctp-fields.sql" 2>nul
)

echo SQL migrations complete!
echo.

REM Verify
echo Verifying database...
psql -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
echo.

echo ========================================
echo MIGRATION COMPLETE!
echo ========================================
echo.
echo Next steps:
echo   1. Seed database (optional): node prisma\comprehensive-seed.cjs
echo   2. Start servers: start-network-auto.ps1
echo   3. Access system: http://192.168.2.124:8080
echo   4. Login: admin@erp.local / password123
echo.
echo Your password has been saved to .env file
echo.
pause

