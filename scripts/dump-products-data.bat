@echo off
REM Products Data-Only Database Dump Script for Windows
REM Usage: dump-products-data.bat [output_file]

setlocal enabledelayedexpansion

REM Database connection parameters
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=erp_merchandiser
if "%DB_USER%"=="" set DB_USER=erp_user
if "%DB_PASSWORD%"=="" set DB_PASSWORD=DevPassword123!

REM Output file
if "%~1"=="" (
    for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set datetime=%%a
    set OUTPUT_FILE=products-data-only-dump-%datetime:~0,8%-%datetime:~8,6%.sql
) else (
    set OUTPUT_FILE=%~1
)

echo ==========================================
echo PostgreSQL Products Data-Only Dump
echo ==========================================
echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo Output: %OUTPUT_FILE%
echo ==========================================
echo.

REM Export PGPASSWORD
set PGPASSWORD=%DB_PASSWORD%

REM Create data-only dump
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --data-only --no-owner --no-privileges --table=products --table=categories --table=materials --table=companies --table=process_sequences --table=process_steps --table=product_process_selections -f "%OUTPUT_FILE%"

if errorlevel 1 (
    echo.
    echo Error creating products data dump
    set PGPASSWORD=
    exit /b 1
)

echo.
echo Products data dump created successfully: %OUTPUT_FILE%

REM Count INSERT statements
set INSERT_COUNT=0
for /f %%a in ('findstr /c:"INSERT INTO" "%OUTPUT_FILE%" ^| find /c /v ""') do set INSERT_COUNT=%%a
echo Approximate INSERT statements: %INSERT_COUNT%

set PGPASSWORD=

echo.
echo ==========================================
echo Dump completed successfully!
echo ==========================================

