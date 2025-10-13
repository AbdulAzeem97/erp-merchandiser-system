# 👥 COMPLETE USERS LIST - ERP MERCHANDISER SYSTEM

## 📊 ALL USERS (Old + New Format)

---

## ✅ STANDARDIZED USERS (Current System)

| # | Name | Email | Password | Role | Department |
|---|------|-------|----------|------|------------|
| 1 | Admin User | admin@horizonsourcing.com | `admin123` | ADMIN | Administration |
| 2 | HOD Prepress | hod.prepress@horizonsourcing.com | `hod123` | HOD_PREPRESS | Prepress |
| 3 | Designer User | designer@horizonsourcing.com | `designer123` | DESIGNER | Prepress |
| 4 | QA Prepress | qa.prepress@horizonsourcing.com | `qa123` | QA_PREPRESS | Quality Assurance |
| 5 | CTP Operator | ctp.operator@horizonsourcing.com | `ctp123` | CTP_OPERATOR | Prepress |
| 6 | Inventory Manager | inventory.manager@horizonsourcing.com | `inventory123` | INVENTORY_MANAGER | Inventory |
| 7 | Procurement Manager | procurement.manager@horizonsourcing.com | `procurement123` | PROCUREMENT_MANAGER | Procurement |

---

## 📝 OLD USERS (If They Exist in Your Database)

### **OLD EMAIL FORMAT (.net.pk domain):**

| Name | Old Email | Password | Role | Status |
|------|-----------|----------|------|--------|
| Designer 1 | designing@horizonsourcing.net.pk | designer123 | DESIGNER | May exist |
| Designer 2 | designing2@horizonsourcing.net.pk | designer123 | DESIGNER | May exist |
| Designer 3 | designing3@horizonsourcing.net.pk | designer123 | DESIGNER | May exist |
| Designer 4 | designing4@horizonsourcing.net.pk | designer123 | DESIGNER | May exist |
| Kamran Khan | kamran.khan@horizonsourcing.net.pk | kamran123 | ADMIN or HOD | May exist |
| Admin 1 | admin1@horizonsourcing.net.pk | admin123 | ADMIN | May exist |
| Admin 2 | admin2@horizonsourcing.net.pk | admin123 | ADMIN | May exist |
| QA 1 | qa1@horizonsourcing.net.pk | qa123 | QA_PREPRESS | May exist |
| QA 2 | qa2@horizonsourcing.net.pk | qa123 | QA_PREPRESS | May exist |
| HOD 1 | hod1@horizonsourcing.net.pk | hod123 | HOD_PREPRESS | May exist |

---

## 🔄 MIGRATION: Old → New Users

### **Replace Old with New:**

```sql
-- Delete old users (if exist)
DELETE FROM users WHERE email LIKE '%@horizonsourcing.net.pk';

-- Create new standardized users
-- (Run complete-database-setup.sql or setup-complete-database.ps1)
```

---

## 📋 COMPLETE LIST - All Possible Users

### **1. ADMIN USERS**

```
✅ NEW (Recommended):
Email: admin@horizonsourcing.com
Password: admin123
Role: ADMIN
Department: Administration

❌ OLD (If exists):
Email: admin1@horizonsourcing.net.pk
Password: admin123

Email: admin2@horizonsourcing.net.pk
Password: admin123

Email: kamran.khan@horizonsourcing.net.pk
Password: kamran123 or admin123
```

### **2. HOD PREPRESS**

```
✅ NEW (Recommended):
Email: hod.prepress@horizonsourcing.com
Password: hod123
Role: HOD_PREPRESS
Department: Prepress

❌ OLD (If exists):
Email: hod1@horizonsourcing.net.pk
Password: hod123

Email: hod.prepress@horizonsourcing.net.pk
Password: hod123
```

### **3. DESIGNERS**

```
✅ NEW (Recommended):
Email: designer@horizonsourcing.com
Password: designer123
Role: DESIGNER
Department: Prepress

❌ OLD (If exists):
Email: designing@horizonsourcing.net.pk
Password: designer123

Email: designing2@horizonsourcing.net.pk
Password: designer123

Email: designing3@horizonsourcing.net.pk
Password: designer123

Email: designing4@horizonsourcing.net.pk
Password: designer123
```

### **4. QA PREPRESS**

```
✅ NEW (Recommended):
Email: qa.prepress@horizonsourcing.com
Password: qa123
Role: QA_PREPRESS
Department: Quality Assurance

❌ OLD (If exists):
Email: qa1@horizonsourcing.net.pk
Password: qa123

Email: qa2@horizonsourcing.net.pk
Password: qa123

Email: qa.prepress@horizonsourcing.net.pk
Password: qa123
```

### **5. CTP OPERATOR**

```
✅ NEW (Recommended):
Email: ctp.operator@horizonsourcing.com
Password: ctp123
Role: CTP_OPERATOR
Department: Prepress

❌ OLD (If exists):
Email: ctp@horizonsourcing.net.pk
Password: ctp123
```

### **6. INVENTORY MANAGER**

```
✅ NEW (Recommended):
Email: inventory.manager@horizonsourcing.com
Password: inventory123
Role: INVENTORY_MANAGER
Department: Inventory
```

### **7. PROCUREMENT MANAGER**

```
✅ NEW (Recommended):
Email: procurement.manager@horizonsourcing.com
Password: procurement123
Role: PROCUREMENT_MANAGER
Department: Procurement
```

---

## 🔍 CHECK EXISTING USERS ON SERVER

```powershell
# Run this to see what's actually in database
cd C:\erp-merchandiser-system
.\check-all-existing-users.ps1
```

Or manually:
```powershell
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "SELECT id, email, role FROM users;"
```

---

## 🗑️ CLEAN OLD USERS & CREATE NEW

### **Option 1: Complete Fresh Setup**

```powershell
cd C:\erp-merchandiser-system

# Delete ALL old users
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "DELETE FROM users;"

# Create new standardized users
.\setup-complete-database.ps1
```

### **Option 2: Keep Old + Add New**

```powershell
# Just add new users (won't delete old ones)
.\create-users-complete.ps1
```

---

## 📊 RECOMMENDED USER STRUCTURE

### **Production Setup:**

```
ADMIN (1 user)
├── admin@horizonsourcing.com

HOD PREPRESS (1 user)
├── hod.prepress@horizonsourcing.com

DESIGNERS (1-4 users)
├── designer@horizonsourcing.com
├── designer2@horizonsourcing.com (optional)
├── designer3@horizonsourcing.com (optional)
└── designer4@horizonsourcing.com (optional)

QA PREPRESS (1-2 users)
├── qa.prepress@horizonsourcing.com
└── qa2.prepress@horizonsourcing.com (optional)

CTP OPERATOR (1 user)
├── ctp.operator@horizonsourcing.com

INVENTORY MANAGER (1 user)
├── inventory.manager@horizonsourcing.com

PROCUREMENT MANAGER (1 user)
└── procurement.manager@horizonsourcing.com
```

---

## 🔐 PASSWORD INFORMATION

### **Current Passwords (Development):**

All users follow pattern: `{role}123`

Examples:
- admin123
- hod123
- designer123
- qa123
- ctp123
- inventory123
- procurement123

### **Special Users (If They Exist):**

- **Kamran Khan:** kamran123 or admin123
- **Old format users:** Usually same as role (designer123, qa123, etc.)

---

## 🚀 CREATE MULTIPLE DESIGNERS (If Needed)

```sql
-- Add more designers
INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('Designer 2', 'User', 'designer2@horizonsourcing.com', '$2a$10$DqW8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7D', 'DESIGNER', 'Prepress', TRUE),
('Designer 3', 'User', 'designer3@horizonsourcing.com', '$2a$10$DqW8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7D', 'DESIGNER', 'Prepress', TRUE),
('Designer 4', 'User', 'designer4@horizonsourcing.com', '$2a$10$DqW8ZhQJ6bXZxQXZ7J7wO8FQJ9J7J7J7J7J7J7J7J7J7J7J7J7J7D', 'DESIGNER', 'Prepress', TRUE)
ON CONFLICT (email) DO NOTHING;
```

---

## 📝 SUMMARY TABLE - ALL POSSIBLE USERS

| Email | Password | Role | Status |
|-------|----------|------|--------|
| **CURRENT/NEW** | | | |
| admin@horizonsourcing.com | admin123 | ADMIN | ✅ Active |
| hod.prepress@horizonsourcing.com | hod123 | HOD_PREPRESS | ✅ Active |
| designer@horizonsourcing.com | designer123 | DESIGNER | ✅ Active |
| qa.prepress@horizonsourcing.com | qa123 | QA_PREPRESS | ✅ Active |
| ctp.operator@horizonsourcing.com | ctp123 | CTP_OPERATOR | ✅ Active |
| inventory.manager@horizonsourcing.com | inventory123 | INVENTORY_MANAGER | ✅ Active |
| procurement.manager@horizonsourcing.com | procurement123 | PROCUREMENT_MANAGER | ✅ Active |
| **OLD (May exist)** | | | |
| designing@horizonsourcing.net.pk | designer123 | DESIGNER | ❓ Check |
| designing2@horizonsourcing.net.pk | designer123 | DESIGNER | ❓ Check |
| designing3@horizonsourcing.net.pk | designer123 | DESIGNER | ❓ Check |
| designing4@horizonsourcing.net.pk | designer123 | DESIGNER | ❓ Check |
| kamran.khan@horizonsourcing.net.pk | kamran123 | ADMIN | ❓ Check |
| admin1@horizonsourcing.net.pk | admin123 | ADMIN | ❓ Check |
| admin2@horizonsourcing.net.pk | admin123 | ADMIN | ❓ Check |
| qa1@horizonsourcing.net.pk | qa123 | QA_PREPRESS | ❓ Check |
| qa2@horizonsourcing.net.pk | qa123 | QA_PREPRESS | ❓ Check |
| hod1@horizonsourcing.net.pk | hod123 | HOD_PREPRESS | ❓ Check |

---

## ✅ RECOMMENDED ACTION

1. **Check what exists:**
   ```powershell
   .\check-all-existing-users.ps1
   ```

2. **Clean & Create New:**
   ```powershell
   .\setup-complete-database.ps1
   ```

3. **Test Each User:**
   - Go to http://192.168.2.124:8080
   - Try each email/password combination
   - Verify correct dashboard appears

---

## 📞 SUPPORT

Server par yeh command run karein to exact list mil jayegi:
```powershell
cd C:\erp-merchandiser-system
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "SELECT email, role, department FROM users ORDER BY email;"
```

---

**Note:** Old .net.pk domain users ko replace karna recommended hai new .com users se for standardization.



