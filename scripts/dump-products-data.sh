#!/bin/bash

# Products Data-Only Database Dump Script
# Exports products and related tables data
# Usage: ./dump-products-data.sh [output_file]

set -e

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-erp_merchandiser}"
DB_USER="${DB_USER:-erp_user}"
DB_PASSWORD="${DB_PASSWORD:-DevPassword123!}"

# Output file
OUTPUT_FILE="${1:-products-data-only-dump-$(date +%Y%m%d-%H%M%S).sql}"

# Product-related tables to export
PRODUCT_TABLES=(
    "products"
    "categories"
    "materials"
    "companies"
    "process_sequences"
    "process_steps"
    "product_process_selections"
)

echo "=========================================="
echo "PostgreSQL Products Data-Only Dump"
echo "=========================================="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Output: $OUTPUT_FILE"
echo "Tables: ${PRODUCT_TABLES[*]}"
echo "=========================================="

# Export PGPASSWORD
export PGPASSWORD="$DB_PASSWORD"

# Create data-only dump for product tables
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --data-only \
  --no-owner \
  --no-privileges \
  --table="$(IFS=,; echo "${PRODUCT_TABLES[*]}")" \
  --file="$OUTPUT_FILE"

# Check if dump was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Products data dump created successfully: $OUTPUT_FILE"
    echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
    
    # Count rows in dump
    INSERT_COUNT=$(grep -c "^INSERT INTO" "$OUTPUT_FILE" 2>/dev/null || echo "0")
    echo "Approximate INSERT statements: $INSERT_COUNT"
else
    echo ""
    echo "❌ Error creating products data dump"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo ""
echo "=========================================="
echo "Dump completed successfully!"
echo "=========================================="

