# Smart Production Dashboard - User Credentials

## 🔐 Access Roles

The Smart Production Dashboard is accessible to the following roles:

| Role | Access Level | Can Do |
|------|-------------|--------|
| **PRODUCTION_MANAGER** | Full Access | Create, view, edit, and apply planning |
| **CUTTING_HEAD** | Full Access | Create, view, edit, and apply planning |
| **MERCHANDISER** | Full Access | Create, view, edit, and apply planning |
| **DIRECTOR** | Read-Only | View planning and reports only |
| **FINANCE** | Read-Only | View planning and cost reports only |
| **ADMIN** | Full Access | All permissions |

---

## ✅ Production User (Recommended - Full Access)

### Production Manager
```
Email: production@horizonsourcing.com
Password: password
Role: PRODUCTION_MANAGER
```

**To create this user, run:**
```bash
psql -U postgres -d erp_merchandiser -f create-production-user.sql
```

**OR use Node.js script:**
```bash
node create-production-user.js
```

---

## ✅ Existing Credentials (Can Access Now)

### 1. Admin User (Full Access)
```
Email: admin@horizonsourcing.com
Password: admin123
Role: ADMIN
```

### 2. Merchandiser User (Full Access)
```
Email: tom.anderson@horizonsourcing.com
Password: merch123
Role: MERCHANDISER
```

**OR**

```
Email: john.doe@horizonsourcing.com
Password: password123
Role: MERCHANDISER
```

---

## 🆕 Create New Users for Smart Production Dashboard

### Option 1: Using SQL Script

Run the SQL script to create users:

```bash
# For PostgreSQL
psql -U postgres -d erp_merchandiser -f create-smart-production-user.sql
```

This will create users with password: **`production123`**

### Option 2: Using Node.js Script

Create a file `create-smart-production-user.js`:

```javascript
import bcrypt from 'bcryptjs';
import dbAdapter from './server/database/adapter.js';

async function createUsers() {
  const password = await bcrypt.hash('production123', 10);
  
  // Production Manager
  await dbAdapter.query(`
    INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (email) DO UPDATE SET role = $5
  `, ['Production', 'Manager', 'production.manager@horizonsourcing.com', password, 'PRODUCTION_MANAGER', 'Production', true]);
  
  // Cutting Head
  await dbAdapter.query(`
    INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (email) DO UPDATE SET role = $5
  `, ['Cutting', 'Head', 'cutting.head@horizonsourcing.com', password, 'CUTTING_HEAD', 'Cutting', true]);
  
  console.log('✅ Users created successfully!');
}

createUsers();
```

---

## 📋 New User Credentials (After Running Script)

### Production Manager (Full Access)
```
Email: production.manager@horizonsourcing.com
Password: production123
Role: PRODUCTION_MANAGER
```

### Cutting Head (Full Access)
```
Email: cutting.head@horizonsourcing.com
Password: production123
Role: CUTTING_HEAD
```

### Director (Read-Only)
```
Email: production.director@horizonsourcing.com
Password: production123
Role: DIRECTOR
```

### Finance Manager (Read-Only)
```
Email: finance.manager@horizonsourcing.com
Password: production123
Role: FINANCE
```

---

## 🚀 Quick Start

1. **Use Existing Admin Account:**
   - Email: `admin@horizonsourcing.com`
   - Password: `admin123`
   - Navigate to: `/production/smart-dashboard`

2. **Or Use Existing Merchandiser Account:**
   - Email: `tom.anderson@horizonsourcing.com`
   - Password: `merch123`
   - Navigate to: `/production/smart-dashboard`

3. **Or Create New User:**
   - Run the SQL script: `create-smart-production-user.sql`
   - Use any of the new credentials above

---

## 🔒 Security Note

⚠️ **IMPORTANT:** Change all default passwords after first login in production environment!

---

## 📍 Access URL

After logging in, navigate to:
```
http://localhost:5173/production/smart-dashboard
```

Or use the sidebar menu: **"Smart Production Dashboard"**

