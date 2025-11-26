#!/bin/bash

# Products Data Import Script
# Imports products and related data from dump file
# Usage: ./import-products-data.sh <dump_file>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./import-products-data.sh <dump_file>"
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
echo "Products Data Import"
echo "=========================================="
echo "Database: $DB_NAME"
echo "Dump file: $DUMP_FILE"
echo "=========================================="
echo ""

echo "📥 Importing products data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DUMP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Import completed successfully!"
    echo ""
    echo "🔍 Verifying imported data..."
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            'products' as table_name, COUNT(*) as count FROM products
        UNION ALL
            SELECT 'categories', COUNT(*) FROM categories
        UNION ALL
            SELECT 'materials', COUNT(*) FROM materials
        UNION ALL
            SELECT 'companies', COUNT(*) FROM companies
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
echo "Import completed!"
echo "=========================================="

