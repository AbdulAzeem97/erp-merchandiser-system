#!/bin/bash

# Jobs Data-Only Database Dump Script
# Exports only job-related table data (no schema)
# Usage: ./dump-jobs-data-only.sh [output_file]

set -e

# Database connection parameters (can be overridden by environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-erp_merchandiser}"
DB_USER="${DB_USER:-erp_user}"
DB_PASSWORD="${DB_PASSWORD:-DevPassword123!}"

# Output file
OUTPUT_FILE="${1:-jobs-data-only-dump-$(date +%Y%m%d-%H%M%S).sql}"

# Job-related tables to export
JOB_TABLES=(
    "job_cards"
    "prepress_jobs"
    "job_production_planning"
    "job_workflow_steps"
    "job_ctp_machines"
    "ratio_reports"
    "item_specifications"
    "job_attachments"
    "cutting_assignments"
    "job_lifecycle_history"
    "job_process_selections"
)

echo "=========================================="
echo "PostgreSQL Jobs Data-Only Dump"
echo "=========================================="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Output: $OUTPUT_FILE"
echo "Tables: ${JOB_TABLES[*]}"
echo "=========================================="

# Export PGPASSWORD for non-interactive authentication
export PGPASSWORD="$DB_PASSWORD"

# Create data-only dump for job tables
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --data-only \
  --no-owner \
  --no-privileges \
  --table="$(IFS=,; echo "${JOB_TABLES[*]}")" \
  --file="$OUTPUT_FILE"

# Check if dump was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Jobs data dump created successfully: $OUTPUT_FILE"
    echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
    
    # Count rows in dump (approximate)
    ROW_COUNT=$(grep -c "^INSERT INTO" "$OUTPUT_FILE" 2>/dev/null || echo "0")
    echo "Approximate INSERT statements: $ROW_COUNT"
else
    echo ""
    echo "❌ Error creating jobs data dump"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo ""
echo "=========================================="
echo "Dump completed successfully!"
echo "=========================================="
echo ""
echo "Note: This dump contains only data (INSERT statements)"
echo "Make sure to run schema migration before importing this data."

