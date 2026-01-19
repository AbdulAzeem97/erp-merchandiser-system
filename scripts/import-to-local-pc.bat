@echo off
REM Quick Import Script for Local PC
REM Imports production jobs data to local database

echo ==========================================
echo Import Production Jobs to Local Database
echo ==========================================
echo.

REM Find the latest production jobs dump
for /f "delims=" %%i in ('dir /b /o-d dumps\production-jobs-data-*.sql 2^>nul') do set LATEST_DUMP=%%i & goto :found
echo Error: No production jobs dump file found in dumps/ directory
echo Please copy the dump file from production server first
pause
exit /b 1

:found
echo Found dump file: %LATEST_DUMP%
echo.

REM Check if PostgreSQL container is running
docker ps --filter "name=postgres" --format "{{.Names}}" | findstr /i "postgres" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: PostgreSQL container is not running
    echo Please start it first: docker-compose up -d postgres
    pause
    exit /b 1
)

echo PostgreSQL container is running
echo.

REM Get container name
for /f "tokens=*" %%i in ('docker ps --filter "name=postgres" --format "{{.Names}}"') do set POSTGRES_CONTAINER=%%i

echo Using container: %POSTGRES_CONTAINER%
echo.

REM Ask for confirmation
set /p CONFIRM="Do you want to import jobs data? This will add/update jobs in your local database. (yes/no): "
if /i not "%CONFIRM%"=="yes" (
    echo Import cancelled
    pause
    exit /b 0
)

echo.
echo Importing jobs data...
echo This may take a few moments...
echo.

REM Import the dump
docker exec -i %POSTGRES_CONTAINER% psql -U erp_user -d erp_merchandiser < "dumps\%LATEST_DUMP%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo Import completed successfully!
    echo ==========================================
    echo.
    echo Verifying imported data...
    docker exec %POSTGRES_CONTAINER% psql -U erp_user -d erp_merchandiser -c "SELECT 'job_cards' as table_name, COUNT(*) as count FROM job_cards UNION ALL SELECT 'prepress_jobs', COUNT(*) FROM prepress_jobs UNION ALL SELECT 'job_production_planning', COUNT(*) FROM job_production_planning;"
) else (
    echo.
    echo ==========================================
    echo Error importing data
    echo ==========================================
    echo Please check the error messages above
    echo.
    echo Common issues:
    echo - Schema mismatch: Run migrations first
    echo - Foreign key errors: Import related data first
    echo - Duplicate keys: Data already exists
)

echo.
pause
