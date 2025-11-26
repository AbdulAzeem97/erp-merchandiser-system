# Production Jobs Data Import Instructions

## Dump File Information

**File:** `production-jobs-final-20251126-225804.sql`  
**Size:** 113.08 MB  
**Location:** `dumps/production-jobs-final-20251126-225804.sql`

## Production Data Included

- **Job Cards:** 69
- **Prepress Jobs:** 45
- **Prepress Activity:** 114
- **Ratio Reports:** 26
- **Item Specifications:** 20
- **Job Process Selections:** 23
- **Job Lifecycles:** 15

## Import Methods

### Method 1: Using Import Script (Recommended)

#### On Linux/Unix Server:
```bash
# Make script executable
chmod +x scripts/import-production-jobs.sh

# Run import
./scripts/import-production-jobs.sh dumps/production-jobs-final-20251126-225804.sql
```

#### On Windows:
```cmd
# Run batch file
scripts\import-production-jobs.bat dumps\production-jobs-final-20251126-225804.sql
```

### Method 2: Manual Import

#### On Linux/Unix:
```bash
# Set database password
export PGPASSWORD=your_password

# Import
psql -h localhost -p 5432 -U erp_user -d erp_merchandiser -f dumps/production-jobs-final-20251126-225804.sql
```

#### On Windows:
```cmd
# Set database password
set PGPASSWORD=your_password

# Import
psql -h localhost -p 5432 -U erp_user -d erp_merchandiser -f dumps\production-jobs-final-20251126-225804.sql
```

## Prerequisites

1. **Database must exist:**
   - Database name: `erp_merchandiser`
   - Schema migration must be run first (if on new server)

2. **Database connection:**
   - PostgreSQL must be running
   - User must have INSERT permissions
   - Connection details must be correct

3. **For new server deployment:**
   - Run schema migration first: `scripts/run-complete-migration.js`
   - Then import this data

## Verification

After import, verify data:

```sql
-- Connect to database
psql -U erp_user -d erp_merchandiser

-- Check row counts
SELECT COUNT(*) FROM job_cards;
SELECT COUNT(*) FROM prepress_jobs;
SELECT COUNT(*) FROM job_production_planning;
SELECT COUNT(*) FROM ratio_reports;
SELECT COUNT(*) FROM item_specifications;
```

Expected counts:
- job_cards: 69
- prepress_jobs: 45
- ratio_reports: 26
- item_specifications: 20

## Troubleshooting

### Error: "relation does not exist"
- **Solution:** Run schema migration first
- Run: `scripts/run-complete-migration.js`

### Error: "duplicate key value"
- **Solution:** Data might already be imported
- Check if data exists before importing

### Error: "permission denied"
- **Solution:** Check database user permissions
- Ensure user has INSERT privileges

### Error: "connection refused"
- **Solution:** Check PostgreSQL is running
- Verify connection parameters (host, port, user, password)

## Next Steps After Import

1. ✅ Verify data in application
2. ✅ Test login with existing credentials
3. ✅ Check jobs are visible in dashboards
4. ✅ Verify all workflows are working
5. ✅ Test job creation and updates

## Notes

- This dump contains **only job-related data** (no schema)
- Schema migration must be run separately
- Import is safe to run multiple times (will show duplicate key errors for existing data)
- Large file (113 MB) - import may take 2-5 minutes

