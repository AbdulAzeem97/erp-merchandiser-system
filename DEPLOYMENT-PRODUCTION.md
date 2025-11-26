# Production Deployment Guide

This guide walks you through deploying the ERP system to a new server using Git clone, Docker, and database migration.

## Prerequisites

- **New Server Requirements:**
  - Linux/Unix-based OS (Ubuntu 20.04+ recommended)
  - Docker and Docker Compose installed
  - Git installed
  - PostgreSQL client tools (`pg_dump`, `psql`)
  - At least 4GB RAM, 20GB disk space

- **Current Production Server:**
  - Access to PostgreSQL database
  - Ability to run shell scripts
  - PostgreSQL client tools

## Overview

The deployment process involves:
1. **On Production Server:** Create database dumps (schema and data)
2. **On New Server:** Git clone, setup Docker, run migrations, import data

---

## Part 1: Create Database Dumps (On Production Server)

### Step 1.1: Create Schema-Only Dump

This exports the database structure without data.

```bash
# Navigate to project directory
cd /path/to/erp-merchandiser-system

# Make script executable
chmod +x scripts/dump-schema-only.sh

# Run schema dump (uses environment variables or defaults)
./scripts/dump-schema-only.sh

# Or specify custom output file
./scripts/dump-schema-only.sh schema-only-dump-20250126.sql
```

**Output:** `schema-only-dump-YYYYMMDD-HHMMSS.sql`

### Step 1.2: Create Jobs Data-Only Dump

This exports only job-related table data.

```bash
# Make script executable
chmod +x scripts/dump-jobs-data-only.sh

# Run data dump
./scripts/dump-jobs-data-only.sh

# Or specify custom output file
./scripts/dump-jobs-data-only.sh jobs-data-only-dump-20250126.sql
```

**Output:** `jobs-data-only-dump-YYYYMMDD-HHMMSS.sql`

### Step 1.3: Transfer Dump Files to New Server

Copy both dump files to the new server:

```bash
# Using SCP
scp schema-only-dump-*.sql user@new-server:/path/to/dumps/
scp jobs-data-only-dump-*.sql user@new-server:/path/to/dumps/

# Or using SFTP, USB drive, or any other method
```

---

## Part 2: Deploy to New Server

### Step 2.1: Git Clone Repository

```bash
# Clone the repository
git clone <repository-url> erp-merchandiser-system
cd erp-merchandiser-system

# Checkout the correct branch (if not main)
git checkout main
```

### Step 2.2: Setup Environment Variables

Create `.env` file in the project root:

```bash
cp env.example .env
nano .env
```

**Required variables:**
```env
# Database
POSTGRES_PASSWORD=your_secure_password_here
DB_HOST=postgres
DB_PORT=5432
DB_NAME=erp_merchandiser
DB_USER=erp_admin

# Redis
REDIS_PASSWORD=your_redis_password_here

# JWT
JWT_SECRET=your_super_secure_jwt_secret_key

# Application
BACKEND_PORT=5001
FRONTEND_PORT=8080
HTTP_PORT=80
HTTPS_PORT=443
```

### Step 2.3: Create Required Directories

```bash
# Create directories for dumps, uploads, and logs
mkdir -p dumps uploads logs
```

### Step 2.4: Copy Dump Files

Place the dump files from production server into the `dumps/` directory:

```bash
# Copy dump files
cp /path/to/schema-only-dump-*.sql dumps/
cp /path/to/jobs-data-only-dump-*.sql dumps/
```

### Step 2.5: Start Database Only

First, start only the PostgreSQL database:

```bash
docker-compose -f docker-compose.production.yml up -d postgres
```

Wait for database to be ready (check logs):

```bash
docker-compose -f docker-compose.production.yml logs postgres
```

### Step 2.6: Run Schema Migration

The complete migration will be run automatically when you start all services, but you can also run it manually:

**Option A: Using Docker (Recommended)**

```bash
# Run migrations service
docker-compose -f docker-compose.production.yml up migrations

# Check migration logs
docker-compose -f docker-compose.production.yml logs migrations
```

**Option B: Manual Execution**

```bash
# Make script executable
chmod +x scripts/run-complete-migration.js

# Set database connection (if not using Docker)
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=erp_merchandiser
export DB_USER=erp_admin
export DB_PASSWORD=your_password

# Run migration
node scripts/run-complete-migration.js
```

### Step 2.7: Import Jobs Data

After schema migration is complete, import the jobs data:

```bash
# Make script executable
chmod +x scripts/import-jobs-data.sh

# Import data (replace with your actual dump file)
./scripts/import-jobs-data.sh dumps/jobs-data-only-dump-YYYYMMDD-HHMMSS.sql
```

**Note:** The script will ask for confirmation before importing.

### Step 2.8: Start All Services

Once migrations and data import are complete, start all services:

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Step 2.9: Verify Deployment

1. **Check Database:**
   ```bash
   # Connect to database
   docker-compose -f docker-compose.production.yml exec postgres psql -U erp_admin -d erp_merchandiser
   
   # Check job counts
   SELECT COUNT(*) FROM job_cards;
   SELECT COUNT(*) FROM prepress_jobs;
   SELECT COUNT(*) FROM job_production_planning;
   ```

2. **Check Backend:**
   ```bash
   curl http://localhost:5001/api/health
   ```

3. **Check Frontend:**
   - Open browser: `http://your-server-ip:8080`
   - Try logging in with existing credentials

---

## Troubleshooting

### Migration Errors

**Error: "relation already exists"**
- This is normal if running migration on existing database
- The migration uses `IF NOT EXISTS` clauses, so it's safe to ignore

**Error: "column already exists"**
- Same as above - safe to ignore

**Error: "foreign key constraint violation"**
- Make sure you've imported data in the correct order
- Check that all referenced tables exist

### Data Import Errors

**Error: "relation does not exist"**
- Make sure schema migration ran successfully
- Check that all tables were created

**Error: "duplicate key value"**
- Data might already be imported
- Check if data exists before importing

### Docker Issues

**Error: "Cannot connect to database"**
- Check if PostgreSQL container is running: `docker-compose ps`
- Check database logs: `docker-compose logs postgres`
- Verify connection string in `.env` file

**Error: "Port already in use"**
- Change ports in `.env` file
- Or stop conflicting services

---

## Rollback Procedure

If something goes wrong, you can rollback:

1. **Stop all services:**
   ```bash
   docker-compose -f docker-compose.production.yml down
   ```

2. **Remove database volume (WARNING: This deletes all data):**
   ```bash
   docker-compose -f docker-compose.production.yml down -v
   ```

3. **Start fresh and try again**

---

## Post-Deployment Checklist

- [ ] Database schema migrated successfully
- [ ] Jobs data imported successfully
- [ ] Backend API responding
- [ ] Frontend accessible
- [ ] Can login with existing credentials
- [ ] Jobs are visible in dashboards
- [ ] All workflows functioning correctly

---

## Additional Notes

### Database Connection from Host

If you need to connect to the database from the host machine (not inside Docker):

```bash
# Get database container IP
docker inspect erp-postgres-prod | grep IPAddress

# Or use port mapping (if configured)
psql -h localhost -p 5432 -U erp_admin -d erp_merchandiser
```

### Backup Before Migration

Always backup your production database before running migrations:

```bash
# Full backup
pg_dump -h localhost -U erp_user -d erp_merchandiser -F c -f backup-$(date +%Y%m%d).dump
```

### Custom Database Credentials

If your production database uses different credentials, update the scripts:

```bash
export DB_HOST=your-db-host
export DB_PORT=5432
export DB_NAME=your-db-name
export DB_USER=your-db-user
export DB_PASSWORD=your-db-password
```

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify database connection
3. Check migration file: `server/database/migrations/000_complete_schema_migration.sql`
4. Review this guide's troubleshooting section

---

**Last Updated:** 2025-01-26
**Version:** 1.0.0

