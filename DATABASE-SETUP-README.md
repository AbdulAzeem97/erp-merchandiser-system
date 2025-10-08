# 🚀 Complete Database Setup Guide

This guide will help you set up the complete ERP Merchandiser System database on any server with PostgreSQL.

---

## 📋 Prerequisites

Before starting, ensure you have:

1. **PostgreSQL 12+** installed and running
2. **Node.js 18+** installed
3. **npm** or **yarn** package manager
4. Database credentials (host, port, username, password)

---

## 🔧 Step 1: Create PostgreSQL Database

### Option A: Using psql Command Line

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE erp_merchandiser;

# Exit psql
\q
```

### Option B: Using pgAdmin or GUI Tool

1. Open your PostgreSQL management tool
2. Create a new database named: `erp_merchandiser`
3. Set encoding to: `UTF8`
4. Leave other settings as default

---

## 📦 Step 2: Install Dependencies

Navigate to your project directory and install required packages:

```bash
cd erp-merchandiser-system
npm install
```

Key dependencies needed:
- `pg` - PostgreSQL client
- `bcryptjs` - Password hashing
- `express` - Web framework
- `dotenv` - Environment variables

---

## 🔐 Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from example
cp env.example .env
```

Edit `.env` and set your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_merchandiser
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server Configuration
PORT=5001
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:8080
```

**⚠️ IMPORTANT:** Change the `JWT_SECRET` to a strong random string in production!

---

## 🗄️ Step 4: Run Database Schema Setup

### Method 1: Using SQL File (Recommended)

```bash
# Run the complete schema setup
psql -U postgres -d erp_merchandiser -f database-setup-complete.sql
```

This will:
- ✅ Create all ENUM types
- ✅ Create all 30+ tables
- ✅ Set up foreign key relationships
- ✅ Create indexes for performance
- ✅ Insert basic sample data

### Method 2: Using Node.js Script

If you prefer using a Node script:

```bash
node create-complete-postgresql-schema.js
```

---

## 🌱 Step 5: Seed Database with Users & Data

Run the seeding script to populate the database with users and sample data:

```bash
node seed-complete-database.js
```

This will create:
- ✅ 7 user accounts with hashed passwords
- ✅ Sample categories and materials
- ✅ Sample companies
- ✅ Process steps
- ✅ Inventory categories and items
- ✅ Inventory locations
- ✅ Sample suppliers

### Default User Credentials

After seeding, you can login with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@horizonsourcing.com | admin123 |
| HOD Prepress | hod.prepress@horizonsourcing.com | hod123 |
| Designer | designer@horizonsourcing.com | designer123 |
| QA Prepress | qa.prepress@horizonsourcing.com | qa123 |
| CTP Operator | ctp.operator@horizonsourcing.com | ctp123 |
| Inventory Manager | inventory.manager@horizonsourcing.com | inventory123 |
| Procurement Manager | procurement.manager@horizonsourcing.com | procurement123 |

**🔒 SECURITY NOTE:** Change all default passwords after first login in production!

---

## ✅ Step 6: Verify Database Setup

Check if everything is set up correctly:

```bash
# Test database connection
node test-database-connection.js
```

Or manually verify in psql:

```sql
-- Connect to database
psql -U postgres -d erp_merchandiser

-- Check tables
\dt

-- Check users
SELECT id, email, role FROM users;

-- Check enums
\dT+

-- Exit
\q
```

You should see:
- ✅ 30+ tables created
- ✅ 7 users in the users table
- ✅ Multiple ENUM types defined
- ✅ Sample data in various tables

---

## 🚀 Step 7: Start the Application

### Start Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm run server
```

Backend will run on: `http://localhost:5001`

### Start Frontend (Separate Terminal)

```bash
# Development mode
npm run dev:frontend

# Production build
npm run build
npm run preview
```

Frontend will run on: `http://localhost:8080`

---

## 🔍 Step 8: Test the System

1. **Open Browser:** Navigate to `http://localhost:8080`
2. **Login:** Use any of the default credentials above
3. **Test Features:**
   - Navigate through role-based dashboards
   - Create a job card
   - Upload design files
   - Test inventory management
   - Test procurement features

---

## 📊 Database Schema Overview

### Core Tables (11)
- `users` - System users with roles
- `companies` - Customer companies
- `categories` - Product categories
- `materials` - Raw materials
- `products` - Product catalog
- `process_steps` - Production process steps
- `product_process_sequences` - Product-specific processes
- `job_cards` - Main job tracking
- `prepress_jobs` - Prepress workflow
- `job_lifecycle` - Job progress tracking

### Inventory Tables (5)
- `inventory_items` - Item master data
- `inventory_categories` - Item categorization
- `inventory_locations` - Storage locations
- `inventory_transactions` - All movements
- `inventory_balances` - Current stock levels

### Procurement Tables (8)
- `suppliers` - Supplier master
- `purchase_requisitions` - Internal purchase requests
- `purchase_requisition_details` - Requisition items
- `purchase_orders` - PO master
- `purchase_order_details` - PO line items
- `goods_receipt_notes` - Goods receiving
- `grn_details` - GRN line items
- `supplier_invoices` - Invoice tracking

---

## 🛠️ Troubleshooting

### Issue: "FATAL: database does not exist"

**Solution:**
```bash
createdb -U postgres erp_merchandiser
```

### Issue: "FATAL: password authentication failed"

**Solution:**
1. Check your `.env` file has correct password
2. Verify PostgreSQL user exists:
   ```sql
   psql -U postgres
   \du
   ```

### Issue: "relation already exists"

**Solution:**
```bash
# Drop existing database and recreate
psql -U postgres
DROP DATABASE erp_merchandiser;
CREATE DATABASE erp_merchandiser;
\q

# Re-run setup
psql -U postgres -d erp_merchandiser -f database-setup-complete.sql
node seed-complete-database.js
```

### Issue: "port 5432 connection refused"

**Solution:**
1. Start PostgreSQL service:
   ```bash
   # Linux
   sudo systemctl start postgresql
   
   # macOS
   brew services start postgresql
   
   # Windows
   net start postgresql-x64-XX
   ```

### Issue: ES Module Import Errors

**Solution:**
Ensure `package.json` has:
```json
{
  "type": "module"
}
```

---

## 🔄 Database Migration/Update

If you already have an existing database and want to update:

```bash
# Backup existing database
pg_dump -U postgres erp_merchandiser > backup_$(date +%Y%m%d).sql

# Run update scripts (if available)
psql -U postgres -d erp_merchandiser -f migrations/update_xxx.sql
```

---

## 📁 Database Backup & Restore

### Backup Database

```bash
# Full backup
pg_dump -U postgres -d erp_merchandiser -F c -b -v -f erp_backup_$(date +%Y%m%d_%H%M%S).backup

# SQL format backup
pg_dump -U postgres erp_merchandiser > erp_backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# From custom format
pg_restore -U postgres -d erp_merchandiser -v erp_backup.backup

# From SQL format
psql -U postgres -d erp_merchandiser < erp_backup.sql
```

---

## 🌐 Production Deployment Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Update `JWT_SECRET` to strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Enable SSL for PostgreSQL connections
- [ ] Set up database backups (daily recommended)
- [ ] Configure firewall rules
- [ ] Set up database connection pooling
- [ ] Enable database query logging
- [ ] Create read-only database user for reports
- [ ] Document your specific environment variables
- [ ] Test disaster recovery procedures

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-XX-main.log`
3. Check application logs in `logs/` directory
4. Verify all environment variables are set correctly
5. Ensure PostgreSQL version is 12 or higher

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Client](https://node-postgres.com/)
- [Express.js Guide](https://expressjs.com/)
- Project-specific docs in `/docs` directory

---

## ✨ Quick Start Summary

```bash
# 1. Create database
createdb -U postgres erp_merchandiser

# 2. Install dependencies
npm install

# 3. Configure environment
cp env.example .env
# Edit .env with your credentials

# 4. Setup schema
psql -U postgres -d erp_merchandiser -f database-setup-complete.sql

# 5. Seed data
node seed-complete-database.js

# 6. Start application
npm run dev

# 7. Open browser
# http://localhost:8080
```

---

**🎉 You're all set! Your ERP Merchandiser System is ready to use!**

