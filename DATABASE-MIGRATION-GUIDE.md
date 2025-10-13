# 🗄️ Database Migration Guide

## Complete Guide to Migrate All Prisma Schemas and SQL Files

---

## 📋 What Will Be Migrated

### 1. **Prisma Schema** (`prisma/schema.prisma`)
- Users, Companies, Products, Categories
- Materials, Inventory, Job Cards
- Process Sequences, Job Lifecycle
- Audit Logs, System Configuration

### 2. **SQL Migration Files**
- Prepress module and roles
- Inventory module
- Item specifications
- Procurement schema
- Ratio reports
- CTP fields

---

## 🚀 Migration Options

### Option 1: Batch File (Simplest - Recommended)

```cmd
.\migrate-database.bat
```

**When prompted:**
- Enter PostgreSQL password (default is usually `postgres` or leave blank)
- Press Enter to continue

This will:
1. Test database connection
2. Create database if not exists
3. Apply all Prisma schemas
4. Execute all SQL migrations
5. Verify the setup

---

### Option 2: PowerShell Script

```powershell
powershell -ExecutionPolicy Bypass -File migrate-all-to-database.ps1
```

This provides more detailed output and interactive seeding options.

---

### Option 3: Node.js Script

```bash
node migrate-all-simple.js
```

**Note:** Update the password in the script first if not using default:
```javascript
// In migrate-all-simple.js, line 20:
password: 'YOUR_POSTGRES_PASSWORD'
```

---

### Option 4: Manual Step-by-Step

If you prefer to do it manually:

#### Step 1: Create .env file
```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/erp_merchandiser?schema=public"
PORT=5001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_merchandiser
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
VITE_API_URL=http://192.168.2.124:5001
VITE_API_BASE_URL=http://192.168.2.124:5001/api
```

#### Step 2: Create Database
```cmd
psql -U postgres -c "CREATE DATABASE erp_merchandiser;"
```

#### Step 3: Generate Prisma Client
```cmd
npx prisma generate
```

#### Step 4: Apply Prisma Schema
```cmd
npx prisma db push --accept-data-loss
```

#### Step 5: Apply SQL Migrations
```cmd
psql -U postgres -d erp_merchandiser -f server\database\migrations\001_add_prepress_and_roles.sql
psql -U postgres -d erp_merchandiser -f server\database\migrations\create_inventory_module.sql
psql -U postgres -d erp_merchandiser -f create-item-specifications-table.sql
psql -U postgres -d erp_merchandiser -f create-procurement-schema.sql
psql -U postgres -d erp_merchandiser -f create-ratio-reports-table.sql
psql -U postgres -d erp_merchandiser -f add-ctp-fields.sql
```

---

## 🔑 Common PostgreSQL Passwords

Try these common defaults:
- `postgres`
- (blank - just press Enter)
- `admin`
- `password`
- `root`
- `123456`

---

## 🛠️ Troubleshooting

### Issue: "password authentication failed"

**Solution 1: Reset PostgreSQL Password**
```cmd
REM Run as Administrator
psql -U postgres
ALTER USER postgres PASSWORD 'newpassword';
\q
```

**Solution 2: Check pg_hba.conf**
1. Find PostgreSQL data directory
2. Open `pg_hba.conf`
3. Change `md5` to `trust` temporarily
4. Restart PostgreSQL service
5. Run migration
6. Change back to `md5`

**Solution 3: Use Environment Variable**
```cmd
set PGPASSWORD=your_password
psql -U postgres -d erp_merchandiser
```

### Issue: "psql command not found"

**Solution:** Add PostgreSQL to PATH
1. Find PostgreSQL bin folder (usually `C:\Program Files\PostgreSQL\15\bin`)
2. Add to System PATH environment variable
3. Restart terminal

### Issue: "database already exists"

This is OK! The script will continue and update the existing database.

### Issue: "Prisma command not found"

**Solution:**
```cmd
npm install -g prisma
npm install
```

---

## ✅ After Migration

### 1. Seed the Database
```cmd
node prisma\comprehensive-seed.cjs
```

This will create:
- Admin user
- Sample companies
- Sample products
- Sample job cards
- Process sequences

### 2. Verify Migration

**Check tables:**
```cmd
psql -U postgres -d erp_merchandiser -c "\dt"
```

**Check table count:**
```cmd
psql -U postgres -d erp_merchandiser -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
```

**Should show 15+ tables**

### 3. Start the System
```powershell
.\start-network-auto.ps1
```

### 4. Test Login
- URL: http://192.168.2.124:8080
- Email: admin@erp.local
- Password: password123

---

## 📊 Expected Database Structure

After migration, you should have these tables:

- ✅ users
- ✅ companies
- ✅ products
- ✅ categories
- ✅ materials
- ✅ inventory_items
- ✅ inventory_logs
- ✅ process_sequences
- ✅ process_steps
- ✅ product_process_selections
- ✅ job_cards
- ✅ job_lifecycles
- ✅ system_config
- ✅ audit_logs
- ✅ prepress_jobs (from SQL migration)
- ✅ item_specifications (from SQL migration)
- ✅ procurement_items (from SQL migration)
- ✅ ratio_reports (from SQL migration)

---

## 🎯 Quick Start (If You Know Your Password)

```cmd
REM Replace 'yourpassword' with your actual PostgreSQL password
set PGPASSWORD=yourpassword
.\migrate-database.bat
```

When prompted, just press Enter (password is already set).

---

## 📝 Database Configuration Files Created

After migration, these files will exist:

1. **`.env`** - Main environment configuration with DATABASE_URL
2. **`generated/prisma`** - Generated Prisma Client

---

## 🆘 Need Help?

### Check PostgreSQL Status
```cmd
sc query postgresql-x64-15
```

### Start PostgreSQL Service
```cmd
net start postgresql-x64-15
```

### Connect to PostgreSQL
```cmd
psql -U postgres
```

### List All Databases
```sql
\l
```

### Connect to ERP Database
```sql
\c erp_merchandiser
```

### List All Tables
```sql
\dt
```

### Check Table Structure
```sql
\d+ users
```

---

## 💡 Pro Tips

1. **Backup First** (if you have existing data):
   ```cmd
   pg_dump -U postgres erp_merchandiser > backup.sql
   ```

2. **Fresh Start** (if you want to start clean):
   ```cmd
   psql -U postgres -c "DROP DATABASE IF EXISTS erp_merchandiser;"
   .\migrate-database.bat
   ```

3. **Check Logs** (if something fails):
   - PostgreSQL logs are usually in `C:\Program Files\PostgreSQL\15\data\log`

4. **Use PgAdmin** (GUI tool):
   - Easier to manage databases visually
   - Usually installed with PostgreSQL

---

## 🎉 Success Indicators

After successful migration, you should see:

```
✅ Connection successful
✅ Database created
✅ .env file created
✅ Prisma Client generated
✅ Prisma schema applied
✅ SQL migrations applied
✅ Total tables: 15+
```

---

## 📞 Quick Reference Commands

```cmd
REM Run migration
.\migrate-database.bat

REM Seed database
node prisma\comprehensive-seed.cjs

REM Start system
.\start-network-auto.ps1

REM Check database
psql -U postgres -d erp_merchandiser -c "\dt"

REM Access system
start http://192.168.2.124:8080
```

---

**Ready to migrate? Run:** `.\migrate-database.bat`

