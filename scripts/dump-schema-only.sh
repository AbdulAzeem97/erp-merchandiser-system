#!/bin/bash

# Schema-Only Database Dump Script
# Exports database structure (tables, columns, indexes, constraints) without data
# Usage: ./dump-schema-only.sh [output_file]

set -e

# Database connection parameters (can be overridden by environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-erp_merchandiser}"
DB_USER="${DB_USER:-erp_user}"
DB_PASSWORD="${DB_PASSWORD:-DevPassword123!}"

# Output file
OUTPUT_FILE="${1:-schema-only-dump-$(date +%Y%m%d-%H%M%S).sql}"

echo "=========================================="
echo "PostgreSQL Schema-Only Dump"
echo "=========================================="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Output: $OUTPUT_FILE"
echo "=========================================="

# Export PGPASSWORD for non-interactive authentication
export PGPASSWORD="$DB_PASSWORD"

# Create schema-only dump
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --file="$OUTPUT_FILE"

# Check if dump was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema dump created successfully: $OUTPUT_FILE"
    echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
else
    echo ""
    echo "❌ Error creating schema dump"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo ""
echo "=========================================="
echo "Dump completed successfully!"
echo "=========================================="

