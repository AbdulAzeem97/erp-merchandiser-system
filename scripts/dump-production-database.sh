#!/bin/bash

# Database Dump Script for Production ERP System
# Creates a PostgreSQL dump with timestamp for safe backup and migration

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

# Output directory
OUTPUT_DIR="./database-dumps"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="${OUTPUT_DIR}/erp_merchandiser_${TIMESTAMP}.dump"

# Create output directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"

echo -e "${GREEN}🗄️  Production Database Dump Script${NC}"
echo "=========================================="
echo "Database: ${DB_NAME}"
echo "Host: ${DB_HOST}:${DB_PORT}"
echo "User: ${DB_USER}"
echo "Output: ${DUMP_FILE}"
echo ""

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ Error: pg_dump command not found${NC}"
    echo "Please install PostgreSQL client tools:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  CentOS/RHEL: sudo yum install postgresql"
    echo "  macOS: brew install postgresql"
    exit 1
fi

# Set PGPASSWORD environment variable for non-interactive password
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

# Get database size for progress indication
DB_SIZE=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));" | xargs)
echo "Database size: ${DB_SIZE}"
echo ""

# Create dump with custom format (compressed, flexible)
echo -e "${YELLOW}📦 Creating database dump...${NC}"
echo "This may take several minutes for large databases..."
echo ""

if PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -Fc \
    -f "${DUMP_FILE}" \
    --verbose 2>&1 | while IFS= read -r line; do
        echo "  $line"
    done; then
    
    # Get dump file size
    DUMP_SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
    
    echo ""
    echo -e "${GREEN}✅ Database dump created successfully!${NC}"
    echo "=========================================="
    echo "Dump file: ${DUMP_FILE}"
    echo "File size: ${DUMP_SIZE}"
    echo ""
    echo "To restore this dump, use:"
    echo "  ./scripts/import-production-dump.sh ${DUMP_FILE}"
    echo ""
    echo "Or manually:"
    echo "  pg_restore -h <host> -U <user> -d <database> ${DUMP_FILE}"
    echo ""
    
    # List recent dumps
    echo "Recent dumps in ${OUTPUT_DIR}:"
    ls -lh "${OUTPUT_DIR}"/*.dump 2>/dev/null | tail -5 | awk '{print "  " $9 " (" $5 ")"}'
    
    exit 0
else
    echo ""
    echo -e "${RED}❌ Error: Database dump failed${NC}"
    exit 1
fi


