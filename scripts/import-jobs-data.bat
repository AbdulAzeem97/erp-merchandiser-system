@echo off
REM Jobs Data Import Script for Windows
REM Usage: import-jobs-data.bat <dump_file>

if "%1"=="" (
    echo Error: Dump file path required
    echo Usage: import-jobs-data.bat ^<dump_file^>
    exit /b 1
)

set DUMP_FILE=%1

if not exist "%DUMP_FILE%" (
    echo Error: Dump file not found: %DUMP_FILE%
    exit /b 1
)

echo ==========================================
echo PostgreSQL Jobs Data Import
echo ==========================================
echo Dump file: %DUMP_FILE%
echo Database: erp_merchandiser
echo ==========================================
echo.

echo Importing data...
docker exec -i erp-postgres psql -U erp_user -d erp_merchandiser < "%DUMP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Data import completed successfully!
    echo.
    echo Verifying imported data...
    docker exec erp-postgres psql -U erp_user -d erp_merchandiser -c "SELECT 'job_cards' as table_name, COUNT(*) as count FROM job_cards UNION ALL SELECT 'prepress_jobs', COUNT(*) FROM prepress_jobs;"
) else (
    echo.
    echo Error importing data
    exit /b 1
)

echo.
echo ==========================================
echo Import completed!
echo ==========================================
