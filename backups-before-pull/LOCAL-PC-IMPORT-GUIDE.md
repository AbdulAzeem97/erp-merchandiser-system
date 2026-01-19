# Import Production Jobs to Local PC Database

## Step 1: Transfer Dump File
Copy the production jobs dump file to your local PC:
- File: production-jobs-data-*.sql
- Location on production server: dumps/production-jobs-data-*.sql

Transfer methods:
- SCP: scp user@production-server:/path/to/dumps/production-jobs-data-*.sql ./
- USB drive
- Network share
- Cloud storage

## Step 2: On Local PC - Prepare Database

### Option A: Using Docker (Recommended)
`ash
# Make sure PostgreSQL container is running
docker ps | grep postgres

# If not running, start it:
docker-compose up -d postgres

# Wait for database to be ready
docker exec <postgres-container> pg_isready -U erp_user
`

### Option B: Using Local PostgreSQL
`ash
# Make sure PostgreSQL is running
# Connect to database
psql -U erp_user -d erp_merchandiser
`

## Step 3: Import Jobs Data

### Using Docker:
`ash
# Import the dump file
docker exec -i <postgres-container> psql -U erp_user -d erp_merchandiser < production-jobs-data-*.sql
`

### Using Local PostgreSQL:
`ash
# Import the dump file
psql -U erp_user -d erp_merchandiser < production-jobs-data-*.sql
`

### Using Windows (PowerShell):
`powershell
Get-Content production-jobs-data-*.sql | docker exec -i <postgres-container> psql -U erp_user -d erp_merchandiser
`

## Step 4: Verify Import

`ash
# Check job cards count
docker exec <postgres-container> psql -U erp_user -d erp_merchandiser -c "SELECT COUNT(*) FROM job_cards;"

# Check prepress jobs count
docker exec <postgres-container> psql -U erp_user -d erp_merchandiser -c "SELECT COUNT(*) FROM prepress_jobs;"

# List all job-related tables
docker exec <postgres-container> psql -U erp_user -d erp_merchandiser -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%job%' OR table_name LIKE '%prepress%';"
`

## Important Notes

1. **Schema Must Match**: Make sure your local database has the same schema as production
   - Run migrations first: 
ode scripts/run-complete-migration.js
   - Or import schema: docker exec -i <postgres-container> psql -U erp_user -d erp_merchandiser < schema-only-dump-*.sql

2. **Data Conflicts**: If jobs already exist, you may need to:
   - Clear existing data first (if testing)
   - Or use INSERT ... ON CONFLICT DO UPDATE
   - Or import to a fresh database

3. **Foreign Keys**: Make sure related data exists:
   - Users (for job assignments)
   - Companies (for job_cards)
   - Materials, Products, etc.

## Troubleshooting

### Error: relation does not exist
- Solution: Run schema migration first

### Error: duplicate key value
- Solution: Clear existing data or use ON CONFLICT handling

### Error: foreign key constraint
- Solution: Import related tables first (users, companies, etc.)
