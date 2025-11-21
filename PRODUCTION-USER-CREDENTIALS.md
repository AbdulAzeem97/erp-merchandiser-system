# Production User Credentials

## 🎯 Smart Production Dashboard User

### Login Credentials
```
Email: production@horizonsourcing.com
Password: password
Role: PRODUCTION_MANAGER
```

### Access Level
- ✅ **Full Access** to Smart Production Dashboard
- ✅ Can create, view, edit, and apply planning
- ✅ Can manage sheet optimization and costing
- ✅ Can update inventory and workflow

---

## 🚀 How to Create This User

### Option 1: Using SQL Script (Recommended)

1. **Run the SQL script:**
   ```bash
   psql -U postgres -d erp_merchandiser -f create-production-user.sql
   ```

2. **Or if using Docker:**
   ```bash
   docker-compose exec postgres psql -U postgres -d erp_merchandiser -f /path/to/create-production-user.sql
   ```

### Option 2: Using Node.js Script

1. **Make sure database is running and configured**
2. **Run the script:**
   ```bash
   node create-production-user.js
   ```

### Option 3: Manual SQL Insert

Connect to your PostgreSQL database and run:

```sql
-- Hash for password "password" (bcrypt, 10 rounds)
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('Production', 'User', 'production@horizonsourcing.com', '$2a$10$C3Kxr/ERcusVzJAjSKY9o.NxxnnSRS2h5.T6tpEdw9pUnGYYA7Pde', 'PRODUCTION_MANAGER', 'Production', TRUE)
ON CONFLICT (email) DO UPDATE SET 
  role = 'PRODUCTION_MANAGER',
  password = '$2a$10$C3Kxr/ERcusVzJAjSKY9o.NxxnnSRS2h5.T6tpEdw9pUnGYYA7Pde',
  "isActive" = TRUE;
```

---

## 📍 Access URL

After creating the user, login and navigate to:
```
http://localhost:5173/production/smart-dashboard
```

Or use the sidebar menu: **"Smart Production Dashboard"**

---

## ✅ Verify User Creation

Check if user was created successfully:

```sql
SELECT id, email, role, department, "isActive" 
FROM users 
WHERE email = 'production@horizonsourcing.com';
```

You should see:
- Email: `production@horizonsourcing.com`
- Role: `PRODUCTION_MANAGER`
- Department: `Production`
- isActive: `true`

---

## 🔒 Security Note

⚠️ **IMPORTANT:** Change the password after first login in production environment!

