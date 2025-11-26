@echo off
REM Products Data Import Script for Windows
REM Usage: import-products-data.bat <dump_file>

setlocal

if "%~1"=="" (
    echo Usage: import-products-data.bat ^<dump_file^>
    exit /b 1
)

set DUMP_FILE=%~1

if not exist "%DUMP_FILE%" (
    echo Error: Dump file not found: %DUMP_FILE%
    exit /b 1
)

if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=erp_merchandiser
if "%DB_USER%"=="" set DB_USER=erp_user
if "%DB_PASSWORD%"=="" set DB_PASSWORD=DevPassword123!

echo ==========================================
echo Products Data Import
echo ==========================================
echo Database: %DB_NAME%
echo Dump file: %DUMP_FILE%
echo ==========================================
echo.

set PGPASSWORD=%DB_PASSWORD%

echo Importing products data...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%DUMP_FILE%"

if errorlevel 1 (
    echo.
    echo Import failed
    set PGPASSWORD=
    exit /b 1
)

echo.
echo Import completed successfully!
echo.
echo Verifying imported data...

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 'products' as table_name, COUNT(*) as count FROM products UNION ALL SELECT 'categories', COUNT(*) FROM categories UNION ALL SELECT 'materials', COUNT(*) FROM materials UNION ALL SELECT 'companies', COUNT(*) FROM companies ORDER BY table_name;"

set PGPASSWORD=

echo.
echo ==========================================
echo Import completed!
echo ==========================================

