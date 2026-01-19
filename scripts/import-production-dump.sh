#!/bin/bash

# Database Import Script for Production ERP System
# Imports a PostgreSQL dump to restore production data

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values (can be overridden by environment variables)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-erp_merchandiser}
DB_USER=${DB_USER:-erp_user}
DB_PASSWORD=${DB_PASSWORD:-}

# Get dump file from argument or find latest
DUMP_DIR="./database-dumps"
if [ -n "$1" ]; then
    DUMP_FILE="$1"
else
    # Find latest dump file
    DUMP_FILE=$(ls -t "${DUMP_DIR}"/*.dump 2>/dev/null | head -1)
fi

# Validate dump file
if [ -z "${DUMP_FILE}" ]; then
    echo -e "${RED}❌ Error: No dump file specified or found${NC}"
    echo "Usage: $0 [dump_file_path]"
    echo "Or place dump files in: ${DUMP_DIR}"
    exit 1
fi

if [ ! -f "${DUMP_FILE}" ]; then
    echo -e "${RED}❌ Error: Dump file not found: ${DUMP_FILE}${NC}"
    exit 1
fi

echo -e "${GREEN}📥 Production Database Import Script${NC}"
echo "=========================================="
echo "Dump file: ${DUMP_FILE}"
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "User: ${DB_USER}"
echo ""

# Check if pg_restore is available
if ! command -v pg_restore &> /dev/null; then
    echo -e "${RED}❌ Error: pg_restore command not found${NC}"
    echo "Please install PostgreSQL client tools:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  CentOS/RHEL: sudo yum install postgresql"
    echo "  macOS: brew install postgresql"
    exit 1
fi

# Set PGPASSWORD environment variable
export PGPASSWORD="${DB_PASSWORD}"

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
if ! PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    echo "Please check your connection settings:"
    echo "  DB_HOST=${DB_HOST}"
    echo "  DB_PORT=${DB_PORT}"
    echo "  DB_NAME=${DB_NAME}"
    echo "  DB_USER=${DB_USER}"
    exit 1
fi
echo -e "${GREEN}✅ Database connection successful${NC}"

# Get dump file size
DUMP_SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
echo "Dump file size: ${DUMP_SIZE}"
echo ""

# Confirm before proceeding
read -p "⚠️  This will overwrite existing data in ${DB_NAME}. Continue? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
    echo "Import cancelled."
    exit 0
fi

# Restore database
echo -e "${YELLOW}📦 Restoring database from dump...${NC}"
echo "This may take several minutes for large databases..."
echo ""

if PGPASSWORD="${DB_PASSWORD}" pg_restore \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --verbose \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    "${DUMP_FILE}" 2>&1 | while IFS= read -r line; do
        echo "  $line"
    done; then
    
    echo ""
    echo -e "${GREEN}✅ Database import completed!${NC}"
    echo ""
    
    # Verify import
    echo -e "${YELLOW}🔍 Verifying import...${NC}"
    
    # Check key tables
    KEY_TABLES=("users" "job_cards" "companies" "departments" "prepress_jobs")
    
    for table in "${KEY_TABLES[@]}"; do
        COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM ${table};" 2>/dev/null | xargs)
        if [ -n "${COUNT}" ]; then
            echo -e "  ${GREEN}✅${NC} ${table}: ${COUNT} rows"
        else
            echo -e "  ${YELLOW}⚠️${NC}  ${table}: table not found or empty"
        fi
    done
    
    # Get total table count
    TABLE_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    echo ""
    echo "Total tables in database: ${TABLE_COUNT}"
    
    echo ""
    echo -e "${GREEN}✅ Import verification complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run migrations: node scripts/run-new-migrations.js"
    echo "  2. Start Docker services: docker-compose -f docker-compose.production.yml up -d"
    echo ""
    
    exit 0
else
    echo ""
    echo -e "${RED}❌ Error: Database import failed${NC}"
    echo "Please check the error messages above and verify:"
    echo "  - Database connection settings are correct"
    echo "  - Database user has sufficient permissions"
    echo "  - Dump file is not corrupted"
    exit 1
fi


