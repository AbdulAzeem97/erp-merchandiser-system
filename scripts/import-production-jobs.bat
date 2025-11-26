@echo off
REM Production Jobs Data Import Script for Windows
REM Usage: import-production-jobs.bat [dump_file]

setlocal enabledelayedexpansion

REM Check if dump file is provided
if "%~1"=="" (
    echo ==========================================
    echo Production Jobs Import Script
    echo ==========================================
    echo.
    echo Usage: import-production-jobs.bat ^<dump_file^>
    echo.
    echo Example:
    echo   import-production-jobs.bat dumps\production-jobs-final-20251126-225804.sql
    echo.
    
    REM Try to find latest dump file
    if exist "dumps\production-jobs-final-*.sql" (
        for /f "delims=" %%f in ('dir /b /o-d dumps\production-jobs-final-*.sql 2^>nul') do (
            echo Found latest dump: dumps\%%f
            echo Run: import-production-jobs.bat dumps\%%f
            goto :end
        )
    )
    goto :end
)

set DUMP_FILE=%~1

REM Check if dump file exists
if not exist "%DUMP_FILE%" (
    echo Error: Dump file not found: %DUMP_FILE%
    exit /b 1
)

REM Database connection parameters (can be overridden by environment variables)
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=erp_merchandiser
if "%DB_USER%"=="" set DB_USER=erp_user
if "%DB_PASSWORD%"=="" set DB_PASSWORD=DevPassword123!

echo ==========================================
echo Production Jobs Data Import
echo ==========================================
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo Dump file: %DUMP_FILE%
echo ==========================================
echo.

REM Check if database is accessible
echo Checking database connection...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT version();" >nul 2>&1

if errorlevel 1 (
    echo Error: Cannot connect to database
    echo Please check your database connection parameters
    echo.
    echo Set these environment variables if needed:
    echo   set DB_HOST=your_host
    echo   set DB_PORT=5432
    echo   set DB_NAME=erp_merchandiser
    echo   set DB_USER=your_user
    echo   set DB_PASSWORD=your_password
    exit /b 1
)

echo Database connection successful
echo.

REM Count INSERT statements
set INSERT_COUNT=0
for /f %%a in ('findstr /c:"INSERT INTO" "%DUMP_FILE%" ^| find /c /v ""') do set INSERT_COUNT=%%a
echo Found %INSERT_COUNT% INSERT statements in dump file
echo.

REM Ask for confirmation
set /p CONFIRM="Do you want to proceed with import? (yes/no): "
if /i not "%CONFIRM%"=="yes" (
    echo Import cancelled
    exit /b 0
)

echo.
echo Importing data...
echo This may take a few moments for large files...
echo.

REM Set PGPASSWORD environment variable
set PGPASSWORD=%DB_PASSWORD%

REM Import data
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%DUMP_FILE%"

if errorlevel 1 (
    echo.
    echo Error importing data
    echo Please check the error messages above
    set PGPASSWORD=
    exit /b 1
)

echo.
echo Data import completed successfully!
echo.

REM Verify import
echo Verifying imported data...
echo.

REM Check key tables
for %%t in (job_cards prepress_jobs job_production_planning ratio_reports item_specifications) do (
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM %%t;" >temp_count.txt 2>nul
    set /p ROW_COUNT=<temp_count.txt
    set ROW_COUNT=!ROW_COUNT: =!
    if "!ROW_COUNT!"=="" set ROW_COUNT=0
    if !ROW_COUNT! GTR 0 (
        echo    %%t: !ROW_COUNT! rows
    ) else (
        echo    %%t: 0 rows ^(table might not exist or is empty^)
    )
    del temp_count.txt 2>nul
)

set PGPASSWORD=

echo.
echo ==========================================
echo Import completed successfully!
echo ==========================================
echo.
echo Next steps:
echo   1. Verify data in your application
echo   2. Test login and job access
echo   3. Check that all jobs are visible in dashboards

:end
endlocal

