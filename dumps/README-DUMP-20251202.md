# Complete Database Dump - December 2, 2025

## Dump File
**File:** `complete-dump-20251202.sql`  
**Date:** December 2, 2025  
**Size:** ~123 MB  
**Location:** `dumps/complete-dump-20251202.sql`

## Download Link
**Google Drive:** [Download Complete Dump (20251202)](https://drive.google.com/file/d/13YBOHwAtnjLwXIoEYtQ4AEsQrDGeK5B9/view?usp=sharing)

## Contents
This dump includes:
- ✅ Complete database schema (all tables, indexes, constraints)
- ✅ All users and roles data
- ✅ All production data (jobs, products, materials, etc.)
- ✅ All configuration data

## Note
This dump file exceeds GitHub's 100MB file size limit and is not tracked in git. The file is available:
- Locally in the `dumps/` folder
- On Google Drive (see download link above)

## How to Use

### Restore on a new server:
```bash
# Using psql
psql -U erp_user -d erp_merchandiser < dumps/complete-dump-20251202.sql

# Or using Docker
docker exec -i erp-postgres-dev psql -U erp_user -d erp_merchandiser < dumps/complete-dump-20251202.sql
```

### Environment Variables:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_merchandiser
DB_USER=erp_user
DB_PASSWORD=DevPassword123!
```

## Alternative: Use Git LFS
If you need to track this file in git, consider using Git Large File Storage (LFS):
```bash
git lfs install
git lfs track "dumps/complete-dump-*.sql"
git add .gitattributes
git add dumps/complete-dump-20251202.sql
git commit -m "Add complete database dump with LFS"
```

## Related Files
- `schema-only-dump-20251126-225356.sql` - Schema only (tracked in git)
- `products-data-20251126-234745.sql` - Products data only (tracked in git)
- See `LOCAL-PC-IMPORT-GUIDE.md` for import instructions

