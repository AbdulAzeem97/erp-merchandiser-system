# 👥 Complete User Credentials

## All System Users

| # | Role | First Name | Last Name | Email | Password | Department |
|---|------|------------|-----------|-------|----------|------------|
| 1 | **ADMIN** | Admin | User | admin@horizonsourcing.com | admin123 | Administration |
| 2 | **HOD_PREPRESS** | HOD | Prepress | hod.prepress@horizonsourcing.com | hod123 | Prepress |
| 3 | **DESIGNER** | Designer | User | designer@horizonsourcing.com | designer123 | Prepress |
| 4 | **QA_PREPRESS** | QA | Prepress | qa.prepress@horizonsourcing.com | qa123 | Quality Assurance |
| 5 | **CTP_OPERATOR** | CTP | Operator | ctp.operator@horizonsourcing.com | ctp123 | Prepress |
| 6 | **INVENTORY_MANAGER** | Inventory | Manager | inventory.manager@horizonsourcing.com | inventory123 | Inventory |
| 7 | **PROCUREMENT_MANAGER** | Procurement | Manager | procurement.manager@horizonsourcing.com | procurement123 | Procurement |

---

## User Roles & Permissions

### 1. ADMIN
- **Access:** Full system access
- **Can do:** Manage all modules, users, settings
- **Email:** admin@horizonsourcing.com
- **Password:** admin123

### 2. HOD_PREPRESS
- **Access:** Prepress department management
- **Can do:** Assign jobs, view reports, manage prepress workflow
- **Email:** hod.prepress@horizonsourcing.com
- **Password:** hod123

### 3. DESIGNER
- **Access:** Design workflow
- **Can do:** Create designs, upload files, submit for QA
- **Email:** designer@horizonsourcing.com
- **Password:** designer123

### 4. QA_PREPRESS
- **Access:** Quality assurance
- **Can do:** Review designs, approve/reject, send to CTP
- **Email:** qa.prepress@horizonsourcing.com
- **Password:** qa123

### 5. CTP_OPERATOR
- **Access:** CTP (Computer-to-Plate) operations
- **Can do:** Generate plates, manage CTP workflow
- **Email:** ctp.operator@horizonsourcing.com
- **Password:** ctp123

### 6. INVENTORY_MANAGER
- **Access:** Inventory management system
- **Can do:** Manage items, transactions, stock, locations, reports
- **Email:** inventory.manager@horizonsourcing.com
- **Password:** inventory123

### 7. PROCUREMENT_MANAGER
- **Access:** Procurement system
- **Can do:** Manage suppliers, purchase orders, requisitions, GRNs
- **Email:** procurement.manager@horizonsourcing.com
- **Password:** procurement123

---

## Quick Reference

### For Testing:
```
Email: admin@horizonsourcing.com
Password: admin123
```

### For Production:
⚠️ **IMPORTANT:** Change all passwords after first login!

---

## Creating Users on Server

### Option 1: Using PowerShell Script
```powershell
cd C:\erp-merchandiser-system
.\create-users-server.ps1
```

### Option 2: Using SQL Script
```powershell
Get-Content create-all-users.sql | docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser
```

### Option 3: Using Node.js Script
```powershell
node seed-complete-database.js
```

---

## Verifying Users

```powershell
# Check all users
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "SELECT id, email, role, department FROM users;"

# Count users
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "SELECT COUNT(*) FROM users;"
```

---

## Manual User Creation (Database)

If you need to add users manually:

```sql
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('First', 'Last', 'email@example.com', '$2a$10$hashedpassword', 'ROLE_NAME', 'Department', TRUE);
```

**Available Roles:**
- ADMIN
- HEAD_OF_MERCHANDISER
- HEAD_OF_PRODUCTION
- HOD_PREPRESS
- DESIGNER
- MERCHANDISER
- QA
- QA_PREPRESS
- CTP_OPERATOR
- INVENTORY_MANAGER
- PROCUREMENT_MANAGER

---

## Password Hashing

Passwords are hashed using bcrypt with 10 rounds.

To generate a new password hash:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your_password', 10);
console.log(hash);
```

---

## Security Notes

1. **Default Passwords:** All users have simple passwords for initial setup
2. **Change Immediately:** In production, change all passwords after first login
3. **Password Policy:** Implement strong password requirements (min 8 chars, uppercase, lowercase, numbers)
4. **Two-Factor Auth:** Consider implementing 2FA for admin users
5. **Regular Audits:** Review user access regularly

---

## Access URLs

- **Frontend:** http://192.168.2.124:8080
- **Backend API:** http://192.168.2.124:5001

---

## Support

For issues with user creation or login, check:
1. Database connection
2. Users table exists
3. Password hashes are correct
4. Role enum values match

```powershell
# Check users table
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "\d users"

# Check enum values
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "\dT+ user_role"
```

