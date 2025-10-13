@echo off
echo ========================================
echo ERP System - Database Migration
echo ========================================
echo.

REM Prompt for database password
set /p DB_PASSWORD="Enter PostgreSQL password (default: postgres): "
if "%DB_PASSWORD%"=="" set DB_PASSWORD=postgres

REM Set default values
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=postgres
set DB_NAME=erp_merchandiser

echo.
echo Configuration:
echo   Host: %DB_HOST%
echo   Port: %DB_PORT%
echo   User: %DB_USER%
echo   Database: %DB_NAME%
echo.

REM Set environment variables
set PGPASSWORD=%DB_PASSWORD%
set DATABASE_URL=postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%?schema=public

REM Create .env file
echo Creating .env file...
(
echo # Database Configuration
echo DATABASE_URL="%DATABASE_URL%"
echo.
echo # Backend Configuration
echo PORT=5001
echo NODE_ENV=development
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
echo.
echo # Database Details
echo DB_TYPE=postgresql
echo DB_HOST=%DB_HOST%
echo DB_PORT=%DB_PORT%
echo DB_NAME=%DB_NAME%
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo.
echo # Frontend API Configuration
echo VITE_API_URL=http://192.168.2.124:5001
echo VITE_API_BASE_URL=http://192.168.2.124:5001/api
) > .env
echo   .env file created
echo.

REM Test connection
echo Testing database connection...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "SELECT 1;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Cannot connect to PostgreSQL!
    echo   Please check:
    echo     - PostgreSQL is running
    echo     - Password is correct
    echo     - Host and port are correct
    echo.
    pause
    exit /b 1
)
echo   Connection successful!
echo.

REM Create database
echo Creating database...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;" 2>&1 | findstr /C:"already exists" >nul
if %ERRORLEVEL% EQU 0 (
    echo   Database already exists
) else (
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;" >nul 2>&1
    echo   Database created
)
echo.

REM Generate Prisma Client
echo Generating Prisma Client...
call npx prisma generate
echo.

REM Push Prisma schema
echo Applying Prisma schema to database...
call npx prisma db push --accept-data-loss
echo.

REM Apply SQL migrations
echo Applying SQL migrations...
if exist "server\database\migrations\001_add_prepress_and_roles.sql" (
    echo   Applying: 001_add_prepress_and_roles.sql
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "server\database\migrations\001_add_prepress_and_roles.sql" >nul 2>&1
)
if exist "server\database\migrations\create_inventory_module.sql" (
    echo   Applying: create_inventory_module.sql
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "server\database\migrations\create_inventory_module.sql" >nul 2>&1
)
if exist "create-item-specifications-table.sql" (
    echo   Applying: create-item-specifications-table.sql
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "create-item-specifications-table.sql" >nul 2>&1
)
if exist "create-procurement-schema.sql" (
    echo   Applying: create-procurement-schema.sql
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "create-procurement-schema.sql" >nul 2>&1
)
if exist "create-ratio-reports-table.sql" (
    echo   Applying: create-ratio-reports-table.sql
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "create-ratio-reports-table.sql" >nul 2>&1
)
if exist "add-ctp-fields.sql" (
    echo   Applying: add-ctp-fields.sql
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "add-ctp-fields.sql" >nul 2>&1
)
echo   SQL migrations applied
echo.

REM Verify
echo Verifying database...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
echo.

echo ========================================
echo Migration Complete!
echo ========================================
echo.
echo Next Steps:
echo   1. Seed database: node prisma\comprehensive-seed.cjs
echo   2. Start servers: start-network-auto.ps1
echo   3. Access system: http://192.168.2.124:8080
echo.
pause

