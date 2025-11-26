#!/bin/bash

# Production Jobs Data Import Script
# Imports the production jobs dump file
# Usage: ./import-production-jobs.sh [dump_file]

set -e

# Check if dump file is provided
if [ -z "$1" ]; then
    echo "=========================================="
    echo "Production Jobs Import Script"
    echo "=========================================="
    echo ""
    echo "Usage: ./import-production-jobs.sh <dump_file>"
    echo ""
    echo "Example:"
    echo "  ./import-production-jobs.sh dumps/production-jobs-final-20251126-225804.sql"
    echo ""
    
    # Try to find latest dump file
    if [ -d "dumps" ]; then
        LATEST_DUMP=$(ls -t dumps/production-jobs-final-*.sql 2>/dev/null | head -1)
        if [ -n "$LATEST_DUMP" ]; then
            echo "Found latest dump: $LATEST_DUMP"
            echo "Run: ./import-production-jobs.sh $LATEST_DUMP"
        fi
    fi
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
echo "Production Jobs Data Import"
echo "=========================================="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Dump file: $DUMP_FILE"
echo "File size: $(du -h "$DUMP_FILE" | cut -f1)"
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
    echo ""
    echo "Set these environment variables if needed:"
    echo "  export DB_HOST=your_host"
    echo "  export DB_PORT=5432"
    echo "  export DB_NAME=erp_merchandiser"
    echo "  export DB_USER=your_user"
    echo "  export DB_PASSWORD=your_password"
    exit 1
fi

echo "✅ Database connection successful"

# Count INSERT statements in dump
INSERT_COUNT=$(grep -c "^INSERT INTO" "$DUMP_FILE" 2>/dev/null || echo "0")
echo "📊 Found $INSERT_COUNT INSERT statements in dump file"

# Show what tables will be imported
echo ""
echo "📋 Tables in dump file:"
grep "^INSERT INTO" "$DUMP_FILE" | sed 's/INSERT INTO //; s/ (.*//' | sort -u | while read table; do
    echo "   - $table"
done

# Ask for confirmation
echo ""
read -p "Do you want to proceed with import? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Import cancelled"
    exit 0
fi

echo ""
echo "📥 Importing data..."
echo "   (This may take a few moments for large files)"

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
    
    VERIFY_TABLES=("job_cards" "prepress_jobs" "job_production_planning" "ratio_reports" "item_specifications")
    
    for table in "${VERIFY_TABLES[@]}"; do
        ROW_COUNT=$(psql \
          --host="$DB_HOST" \
          --port="$DB_PORT" \
          --username="$DB_USER" \
          --dbname="$DB_NAME" \
          --tuples-only \
          --command="SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ' || echo "0")
        if [ "$ROW_COUNT" != "0" ]; then
            echo "   ✅ $table: $ROW_COUNT rows"
        else
            echo "   ⚠️  $table: 0 rows (table might not exist or is empty)"
        fi
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
echo ""
echo "Next steps:"
echo "  1. Verify data in your application"
echo "  2. Test login and job access"
echo "  3. Check that all jobs are visible in dashboards"

