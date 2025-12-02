@echo off
REM Clear existing job data and import fresh production data
REM Usage: clear-and-import-jobs.bat <dump_file>

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: clear-and-import-jobs.bat ^<dump_file^>
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
echo Clear and Import Production Jobs
echo ==========================================
echo Database: %DB_NAME%
echo Dump file: %DUMP_FILE%
echo ==========================================
echo.

set /p CONFIRM="⚠️  This will DELETE all existing job data. Continue? (yes/no): "
if /i not "%CONFIRM%"=="yes" (
    echo Operation cancelled
    exit /b 0
)

echo.
echo Clearing existing job data...

set PGPASSWORD=%DB_PASSWORD%

REM Clear job-related tables
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SET session_replication_role = 'replica'; DELETE FROM prepress_activity; DELETE FROM job_ctp_machines; DELETE FROM job_workflow_steps; DELETE FROM cutting_assignments; DELETE FROM job_production_planning; DELETE FROM prepress_jobs; DELETE FROM job_lifecycles; DELETE FROM job_process_selections; DELETE FROM item_specification_items; DELETE FROM item_specifications; DELETE FROM ratio_reports; DELETE FROM job_attachments; DELETE FROM job_cards; SET session_replication_role = 'origin';"

echo ✅ Existing data cleared
echo.

echo Importing production data...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%DUMP_FILE%"

if errorlevel 1 (
    echo.
    echo ❌ Import failed
    set PGPASSWORD=
    exit /b 1
)

echo.
echo ✅ Import completed successfully!
echo.
echo Verifying imported data...

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 'job_cards' as table_name, COUNT(*) as count FROM job_cards UNION ALL SELECT 'prepress_jobs', COUNT(*) FROM prepress_jobs UNION ALL SELECT 'ratio_reports', COUNT(*) FROM ratio_reports UNION ALL SELECT 'item_specifications', COUNT(*) FROM item_specifications UNION ALL SELECT 'job_lifecycles', COUNT(*) FROM job_lifecycles ORDER BY table_name;"

set PGPASSWORD=

echo.
echo ==========================================
echo ✅ Clear and import completed!
echo ==========================================

