#!/bin/bash

# Jobs Data Import Script
# Imports job data from data-only dump file
# Usage: ./import-jobs-data.sh <dump_file>

set -e

# Check if dump file is provided
if [ -z "$1" ]; then
    echo "❌ Error: Dump file path required"
    echo "Usage: ./import-jobs-data.sh <dump_file>"
    exit 1
fi

DUMP_FILE="$1"

# Check if dump file exists
if [ ! -f "$DUMP_FILE" ]; then
    echo "❌ Error: Dump file not found: $DUMP_FILE"
    exit 1
fi

# Database connection parameters (can be overridden by environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-erp_merchandiser}"
DB_USER="${DB_USER:-erp_user}"
DB_PASSWORD="${DB_PASSWORD:-DevPassword123!}"

echo "=========================================="
echo "PostgreSQL Jobs Data Import"
echo "=========================================="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Dump file: $DUMP_FILE"
echo "=========================================="

# Export PGPASSWORD for non-interactive authentication
export PGPASSWORD="$DB_PASSWORD"

# Check if database is accessible
echo ""
echo "🔍 Checking database connection..."
psql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --command="SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Error: Cannot connect to database"
    echo "Please check your database connection parameters"
    exit 1
fi

echo "✅ Database connection successful"

# Count INSERT statements in dump
INSERT_COUNT=$(grep -c "^INSERT INTO" "$DUMP_FILE" 2>/dev/null || echo "0")
echo "📊 Found $INSERT_COUNT INSERT statements in dump file"

# Ask for confirmation
echo ""
read -p "Do you want to proceed with import? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Import cancelled"
    exit 0
fi

echo ""
echo "📥 Importing data..."
echo "   (This may take a few moments)"

# Import data
psql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --file="$DUMP_FILE" \
  --quiet

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Data import completed successfully!"
    
    # Verify import by counting rows in key tables
    echo ""
    echo "🔍 Verifying imported data..."
    
    VERIFY_TABLES=("job_cards" "prepress_jobs" "job_production_planning")
    
    for table in "${VERIFY_TABLES[@]}"; do
        ROW_COUNT=$(psql \
          --host="$DB_HOST" \
          --port="$DB_PORT" \
          --username="$DB_USER" \
          --dbname="$DB_NAME" \
          --tuples-only \
          --command="SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ' || echo "0")
        echo "   $table: $ROW_COUNT rows"
    done
else
    echo ""
    echo "❌ Error importing data"
    echo "Please check the error messages above"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo ""
echo "=========================================="
echo "Import completed successfully!"
echo "=========================================="

