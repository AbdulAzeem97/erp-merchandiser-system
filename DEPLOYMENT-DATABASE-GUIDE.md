# 🚀 Complete Deployment Guide - Database Setup

This guide provides complete instructions for deploying the ERP Merchandiser System database on any server, whether it's development, staging, or production.

---

## 📑 Table of Contents

1. [Quick Start (Automated)](#-quick-start-automated)
2. [Manual Setup (Step-by-Step)](#-manual-setup-step-by-step)
3. [Docker Deployment](#-docker-deployment)
4. [Cloud Deployment](#-cloud-deployment)
5. [Production Considerations](#-production-considerations)
6. [Backup & Restore](#-backup--restore)
7. [Troubleshooting](#-troubleshooting)

---

## ⚡ Quick Start (Automated)

### Windows (PowerShell)

```powershell
# Clone repository
git clone https://github.com/yourusername/erp-merchandiser-system.git
cd erp-merchandiser-system

# Run automated setup
.\setup-database.ps1
```

### Linux/macOS (Bash)

```bash
# Clone repository
git clone https://github.com/yourusername/erp-merchandiser-system.git
cd erp-merchandiser-system

# Make script executable
chmod +x setup-database.sh

# Run automated setup
./setup-database.sh
```

**What the script does:**
- ✅ Checks PostgreSQL and Node.js installation
- ✅ Creates database
- ✅ Installs npm dependencies
- ✅ Configures environment variables
- ✅ Creates all database tables
- ✅ Seeds initial data and users
- ✅ Displays login credentials

---

## 📖 Manual Setup (Step-by-Step)

If you prefer manual control or the automated script doesn't work for your environment:

### 1. Prerequisites

Ensure you have:
- PostgreSQL 12 or higher
- Node.js 18 or higher
- Git
- Text editor

### 2. Clone Repository

```bash
git clone https://github.com/yourusername/erp-merchandiser-system.git
cd erp-merchandiser-system
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Create Database

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE erp_merchandiser;

-- Verify
\l

-- Exit
\q
```

### 5. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit with your settings
nano .env  # or use your preferred editor
```

Required environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_merchandiser
DB_USER=postgres
DB_PASSWORD=your_secure_password

PORT=5001
NODE_ENV=production
JWT_SECRET=generate_strong_random_string_here
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:8080
```

### 6. Run Database Schema

```bash
psql -U postgres -d erp_merchandiser -f database-setup-complete.sql
```

### 7. Seed Initial Data

```bash
node seed-complete-database.js
```

### 8. Start Application

```bash
# Backend
npm run server

# Frontend (separate terminal)
npm run dev
```

### 9. Test Access

Open browser: `http://localhost:8080`

Login with: `admin@horizonsourcing.com` / `admin123`

---

## 🐳 Docker Deployment

### Using Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: erp_merchandiser
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database-setup-complete.sql:/docker-entrypoint-initdb.d/01-schema.sql

  backend:
    build: .
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: erp_merchandiser
      DB_USER: postgres
      DB_PASSWORD: secure_password
      PORT: 5001
      NODE_ENV: production
      JWT_SECRET: your_jwt_secret
    ports:
      - "5001:5001"
    depends_on:
      - postgres
    command: sh -c "sleep 10 && node seed-complete-database.js && npm run server"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "8080:8080"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Deploy with Docker

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## ☁️ Cloud Deployment

### AWS RDS PostgreSQL

1. **Create RDS Instance:**
   - Engine: PostgreSQL 15
   - Instance class: db.t3.micro (or larger)
   - Storage: 20 GB (or more)
   - Enable automatic backups
   - Note the endpoint and credentials

2. **Connect and Setup:**

```bash
# Set environment variables
export DB_HOST=your-rds-endpoint.amazonaws.com
export DB_PORT=5432
export DB_NAME=erp_merchandiser
export DB_USER=postgres
export DB_PASSWORD=your_rds_password

# Run schema setup
psql -h $DB_HOST -U $DB_USER -d postgres -c "CREATE DATABASE erp_merchandiser;"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database-setup-complete.sql

# Seed data
node seed-complete-database.js
```

### Google Cloud SQL

```bash
# Create Cloud SQL instance (via console or gcloud)
gcloud sql instances create erp-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create erp_merchandiser --instance=erp-db

# Connect via Cloud SQL Proxy
cloud_sql_proxy -instances=PROJECT:REGION:erp-db=tcp:5432

# Run setup
psql -h localhost -U postgres -d erp_merchandiser -f database-setup-complete.sql
node seed-complete-database.js
```

### Azure Database for PostgreSQL

```bash
# Create server (via portal or Azure CLI)
az postgres server create \
  --resource-group myresourcegroup \
  --name erp-db-server \
  --location eastus \
  --admin-user postgres \
  --admin-password SecurePassword123! \
  --sku-name B_Gen5_1

# Create database
az postgres db create \
  --resource-group myresourcegroup \
  --server-name erp-db-server \
  --name erp_merchandiser

# Connect and setup
psql "host=erp-db-server.postgres.database.azure.com port=5432 dbname=erp_merchandiser user=postgres@erp-db-server password=SecurePassword123! sslmode=require"

# Run setup
\i database-setup-complete.sql
```

### Heroku PostgreSQL

```bash
# Create Heroku app
heroku create erp-merchandiser

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Get database URL
heroku config:get DATABASE_URL

# Connect and setup
heroku pg:psql < database-setup-complete.sql

# Deploy app
git push heroku main

# Run seeding
heroku run node seed-complete-database.js
```

---

## 🔒 Production Considerations

### Security Checklist

- [ ] **Change all default passwords immediately**
- [ ] **Use strong JWT secret** (minimum 64 characters random)
- [ ] **Enable SSL for database connections**
- [ ] **Use environment-specific .env files** (never commit to git)
- [ ] **Enable PostgreSQL SSL mode** (`sslmode=require`)
- [ ] **Restrict database access** (firewall rules, VPC)
- [ ] **Use connection pooling** (already configured in app)
- [ ] **Set up database user with limited privileges** (not using postgres superuser)
- [ ] **Enable database audit logging**
- [ ] **Implement rate limiting** (API level)

### Performance Optimization

```sql
-- Analyze tables for query optimization
ANALYZE;

-- Update table statistics
VACUUM ANALYZE;

-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Add additional indexes if needed
CREATE INDEX CONCURRENTLY idx_custom ON table_name(column_name);
```

### Monitoring Setup

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Check database size
SELECT pg_database.datname, 
       pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database;

-- Monitor connections
SELECT count(*) FROM pg_stat_activity;

-- Check table sizes
SELECT schemaname AS schema,
       tablename AS table,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

---

## 💾 Backup & Restore

### Automated Daily Backups

#### Linux Cron Job

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump -U postgres erp_merchandiser | gzip > /backups/erp_$(date +\%Y\%m\%d).sql.gz

# Keep only last 7 days
0 3 * * * find /backups -name "erp_*.sql.gz" -mtime +7 -delete
```

#### Windows Task Scheduler

```powershell
# Create backup script: backup-database.ps1
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "F:\backups\erp_$date.backup"
& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" -U postgres -F c -b -v -f $backupFile erp_merchandiser

# Schedule in Task Scheduler (run daily at 2 AM)
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File F:\scripts\backup-database.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "ERP Database Backup"
```

### Manual Backup

```bash
# Full backup (custom format - recommended)
pg_dump -U postgres -F c -b -v -f erp_backup_$(date +%Y%m%d).backup erp_merchandiser

# SQL format backup
pg_dump -U postgres erp_merchandiser > erp_backup_$(date +%Y%m%d).sql

# Compressed SQL backup
pg_dump -U postgres erp_merchandiser | gzip > erp_backup_$(date +%Y%m%d).sql.gz
```

### Restore from Backup

```bash
# Restore from custom format
pg_restore -U postgres -d erp_merchandiser -v erp_backup.backup

# Restore from SQL
psql -U postgres -d erp_merchandiser < erp_backup.sql

# Restore from compressed SQL
gunzip < erp_backup.sql.gz | psql -U postgres -d erp_merchandiser
```

### Point-in-Time Recovery (PITR)

For production, enable WAL archiving:

```conf
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: Connection timeout

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # macOS
Get-Service postgresql*  # Windows

# Check if port is open
netstat -an | grep 5432
```

#### Issue: "database does not exist"

```bash
# List all databases
psql -U postgres -l

# Create if missing
createdb -U postgres erp_merchandiser
```

#### Issue: Permission denied

```bash
# Grant privileges
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE erp_merchandiser TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

#### Issue: Out of memory

```conf
# Increase PostgreSQL memory (postgresql.conf)
shared_buffers = 256MB
work_mem = 16MB
maintenance_work_mem = 128MB
```

#### Issue: Too many connections

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Increase max connections (postgresql.conf)
max_connections = 200

-- Then restart PostgreSQL
```

### Logs Location

- **Linux:** `/var/log/postgresql/`
- **macOS:** `/usr/local/var/log/postgresql/`
- **Windows:** `C:\Program Files\PostgreSQL\15\data\log\`
- **Application logs:** `./logs/`

---

## 📞 Support & Resources

- **Documentation:** [DATABASE-SETUP-README.md](DATABASE-SETUP-README.md)
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Project Issues:** GitHub Issues page

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Database is accessible from application server
- [ ] All tables created (30+ tables)
- [ ] All users can login with default credentials
- [ ] Change all default passwords
- [ ] Backups are running automatically
- [ ] Monitoring is set up
- [ ] SSL is enabled for database connections
- [ ] Firewall rules are configured
- [ ] Application is accessible via web browser
- [ ] All role-based dashboards work correctly
- [ ] File uploads work (design files, Excel files)
- [ ] API endpoints respond correctly
- [ ] WebSocket connections work (real-time updates)
- [ ] Email notifications configured (if applicable)
- [ ] Documentation is updated with your environment details

---

**🎉 Your ERP Merchandiser System database is now deployed and ready for production use!**

For questions or issues, please refer to the main [README.md](README.md) or open an issue on GitHub.

