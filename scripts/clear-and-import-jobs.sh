#!/bin/bash

# Clear existing job data and import fresh production data
# Usage: ./clear-and-import-jobs.sh <dump_file>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./clear-and-import-jobs.sh <dump_file>"
    exit 1
fi

DUMP_FILE="$1"

if [ ! -f "$DUMP_FILE" ]; then
    echo "❌ Error: Dump file not found: $DUMP_FILE"
    exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-erp_merchandiser}"
DB_USER="${DB_USER:-erp_user}"
DB_PASSWORD="${DB_PASSWORD:-DevPassword123!}"

export PGPASSWORD="$DB_PASSWORD"

echo "=========================================="
echo "Clear and Import Production Jobs"
echo "=========================================="
echo "Database: $DB_NAME"
echo "Dump file: $DUMP_FILE"
echo "=========================================="
echo ""

# Ask for confirmation
read -p "⚠️  This will DELETE all existing job data. Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Operation cancelled"
    exit 0
fi

echo ""
echo "🗑️  Clearing existing job data..."

# Clear job-related tables (in correct order to respect foreign keys)
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Delete in order (child tables first)
DELETE FROM prepress_activity;
DELETE FROM job_ctp_machines;
DELETE FROM job_workflow_steps;
DELETE FROM cutting_assignments;
DELETE FROM job_production_planning;
DELETE FROM prepress_jobs;
DELETE FROM job_lifecycles;
DELETE FROM job_process_selections;
DELETE FROM item_specification_items;
DELETE FROM item_specifications;
DELETE FROM ratio_reports;
DELETE FROM job_attachments;
DELETE FROM job_cards;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Reset sequences
SELECT setval('job_cards_id_seq', 1, false);
SELECT setval('prepress_jobs_id_seq', 1, false);
SELECT setval('ratio_reports_id_seq', 1, false);
EOF

echo "✅ Existing data cleared"
echo ""

echo "📥 Importing production data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DUMP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Import completed successfully!"
    echo ""
    echo "🔍 Verifying imported data..."
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            'job_cards' as table_name, COUNT(*) as count FROM job_cards
        UNION ALL
            SELECT 'prepress_jobs', COUNT(*) FROM prepress_jobs
        UNION ALL
            SELECT 'ratio_reports', COUNT(*) FROM ratio_reports
        UNION ALL
            SELECT 'item_specifications', COUNT(*) FROM item_specifications
        UNION ALL
            SELECT 'job_lifecycles', COUNT(*) FROM job_lifecycles
        ORDER BY table_name;
    "
else
    echo ""
    echo "❌ Import failed"
    exit 1
fi

unset PGPASSWORD

echo ""
echo "=========================================="
echo "✅ Clear and import completed!"
echo "=========================================="

