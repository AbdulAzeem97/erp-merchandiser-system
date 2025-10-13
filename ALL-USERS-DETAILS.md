# 👥 COMPLETE USER DETAILS - ERP MERCHANDISER SYSTEM

## 📊 All 7 System Users

| # | Role | Name | Email | Password | Department | Access Level |
|---|------|------|-------|----------|------------|--------------|
| 1 | **ADMIN** | Admin User | admin@horizonsourcing.com | `admin123` | Administration | Full System |
| 2 | **HOD_PREPRESS** | HOD Prepress | hod.prepress@horizonsourcing.com | `hod123` | Prepress | Department Head |
| 3 | **DESIGNER** | Designer User | designer@horizonsourcing.com | `designer123` | Prepress | Design Workflow |
| 4 | **QA_PREPRESS** | QA Prepress | qa.prepress@horizonsourcing.com | `qa123` | Quality Assurance | QA Review |
| 5 | **CTP_OPERATOR** | CTP Operator | ctp.operator@horizonsourcing.com | `ctp123` | Prepress | Plate Generation |
| 6 | **INVENTORY_MANAGER** | Inventory Manager | inventory.manager@horizonsourcing.com | `inventory123` | Inventory | Inventory Module |
| 7 | **PROCUREMENT_MANAGER** | Procurement Manager | procurement.manager@horizonsourcing.com | `procurement123` | Procurement | Procurement Module |

---

## 🔐 Complete User Information

### 1️⃣ ADMIN
```
First Name: Admin
Last Name: User
Email: admin@horizonsourcing.com
Password: admin123
Role: ADMIN
Department: Administration
```

**Permissions:**
- ✅ Full system access
- ✅ User management
- ✅ All modules (Products, Jobs, Inventory, Procurement, Prepress)
- ✅ System settings
- ✅ Reports and analytics
- ✅ Audit logs

**Dashboard:** All modules visible with full CRUD access

---

### 2️⃣ HOD PREPRESS
```
First Name: HOD
Last Name: Prepress
Email: hod.prepress@horizonsourcing.com
Password: hod123
Role: HOD_PREPRESS
Department: Prepress
```

**Permissions:**
- ✅ Manage prepress workflow
- ✅ Assign jobs to designers
- ✅ View all prepress jobs
- ✅ Interactive ratio reports
- ✅ Approve/reject designs
- ✅ Generate reports

**Dashboard:** HOD Prepress Dashboard with job assignments and reports

---

### 3️⃣ DESIGNER
```
First Name: Designer
Last Name: User
Email: designer@horizonsourcing.com
Password: designer123
Role: DESIGNER
Department: Prepress
```

**Permissions:**
- ✅ View assigned jobs
- ✅ Upload designs
- ✅ Submit designs for QA
- ✅ Access design files
- ✅ View job specifications
- ✅ Upload Excel files (item specs, ratio)

**Dashboard:** Designer Dashboard with assigned jobs

---

### 4️⃣ QA PREPRESS
```
First Name: QA
Last Name: Prepress
Email: qa.prepress@horizonsourcing.com
Password: qa123
Role: QA_PREPRESS
Department: Quality Assurance
```

**Permissions:**
- ✅ Review submitted designs
- ✅ Approve/reject designs
- ✅ Add QA notes
- ✅ Send to CTP
- ✅ View job history
- ✅ Quality reports

**Dashboard:** QA Dashboard with pending reviews

---

### 5️⃣ CTP OPERATOR
```
First Name: CTP
Last Name: Operator
Email: ctp.operator@horizonsourcing.com
Password: ctp123
Role: CTP_OPERATOR
Department: Prepress
```

**Permissions:**
- ✅ View QA-approved jobs
- ✅ Generate plates
- ✅ Set plate count
- ✅ Add CTP notes
- ✅ Mark jobs as completed
- ✅ View plate history

**Dashboard:** CTP Dashboard with approved jobs for plate generation

---

### 6️⃣ INVENTORY MANAGER
```
First Name: Inventory
Last Name: Manager
Email: inventory.manager@horizonsourcing.com
Password: inventory123
Role: INVENTORY_MANAGER
Department: Inventory
```

**Permissions:**
- ✅ Manage inventory items
- ✅ Create transactions (IN/OUT/ADJUSTMENT/TRANSFER)
- ✅ Manage categories and locations
- ✅ View stock levels
- ✅ Generate inventory reports
- ✅ Set reorder levels

**Dashboard:** Inventory Dashboard with stock overview

**Modules Access:**
- Inventory Dashboard
- Items Management
- Transactions
- Categories & Locations
- Reports

---

### 7️⃣ PROCUREMENT MANAGER
```
First Name: Procurement
Last Name: Manager
Email: procurement.manager@horizonsourcing.com
Password: procurement123
Role: PROCUREMENT_MANAGER
Department: Procurement
```

**Permissions:**
- ✅ Manage suppliers
- ✅ Create purchase orders
- ✅ Approve purchase requisitions
- ✅ Goods receipt notes (GRN)
- ✅ Supplier invoices
- ✅ Procurement reports

**Dashboard:** Procurement Dashboard with PO overview

**Modules Access:**
- Procurement Dashboard
- Suppliers
- Purchase Orders
- Reports

---

## 📋 Quick Reference Table

### By Department

| Department | Users | Roles |
|------------|-------|-------|
| **Administration** | 1 | ADMIN |
| **Prepress** | 4 | HOD_PREPRESS, DESIGNER, CTP_OPERATOR, QA_PREPRESS |
| **Quality Assurance** | 1 | QA_PREPRESS |
| **Inventory** | 1 | INVENTORY_MANAGER |
| **Procurement** | 1 | PROCUREMENT_MANAGER |

### By Access Level

| Access Level | Users | Description |
|--------------|-------|-------------|
| **Full System** | ADMIN | Complete access to everything |
| **Department Head** | HOD_PREPRESS | Manage prepress department |
| **Module Access** | INVENTORY_MANAGER, PROCUREMENT_MANAGER | Specific modules |
| **Workflow** | DESIGNER, QA_PREPRESS, CTP_OPERATOR | Specific workflow steps |

---

## 🚀 How to Create Users on Server

### Method 1: Automated Script (Recommended)
```powershell
cd C:\erp-merchandiser-system
git pull origin main
.\create-users-server.ps1
```

### Method 2: SQL Script
```powershell
cd C:\erp-merchandiser-system
Get-Content create-all-users-complete.sql | docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser
```

### Method 3: Node.js Seeding Script
```powershell
cd C:\erp-merchandiser-system
node seed-complete-database.js
```

---

## 🔍 Verify Users on Server

```powershell
# List all users
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "SELECT id, email, role, department FROM users ORDER BY id;"

# Count users
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "SELECT COUNT(*) as total FROM users;"

# Check specific user
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "SELECT * FROM users WHERE email = 'admin@horizonsourcing.com';"
```

---

## 🧪 Test Login for Each User

### From Browser: http://192.168.2.124:8080

1. **Admin Test:**
   - Email: `admin@horizonsourcing.com`
   - Password: `admin123`
   - Expected: Full dashboard with all modules

2. **HOD Test:**
   - Email: `hod.prepress@horizonsourcing.com`
   - Password: `hod123`
   - Expected: HOD Prepress dashboard

3. **Designer Test:**
   - Email: `designer@horizonsourcing.com`
   - Password: `designer123`
   - Expected: Designer dashboard with job assignments

4. **QA Test:**
   - Email: `qa.prepress@horizonsourcing.com`
   - Password: `qa123`
   - Expected: QA dashboard with pending reviews

5. **CTP Test:**
   - Email: `ctp.operator@horizonsourcing.com`
   - Password: `ctp123`
   - Expected: CTP dashboard with approved jobs

6. **Inventory Test:**
   - Email: `inventory.manager@horizonsourcing.com`
   - Password: `inventory123`
   - Expected: Inventory dashboard

7. **Procurement Test:**
   - Email: `procurement.manager@horizonsourcing.com`
   - Password: `procurement123`
   - Expected: Procurement dashboard

---

## 🔐 Password Security

### Current Passwords (Development)
All users have simple passwords for development/testing:
- Pattern: `{role}123`
- Example: admin123, hod123, designer123

### For Production
⚠️ **MUST CHANGE IMMEDIATELY:**

1. **Strong Password Policy:**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - No dictionary words
   - Example: `P@ssw0rd!2024#Secure`

2. **Change Password Steps:**
   - Login as user
   - Go to Profile/Settings
   - Change password
   - Logout and test new password

3. **Additional Security:**
   - Enable 2FA (if available)
   - Regular password rotation (90 days)
   - Password history (prevent reuse)
   - Account lockout after 5 failed attempts

---

## 📞 Support & Troubleshooting

### User Cannot Login

1. **Check user exists:**
   ```sql
   SELECT * FROM users WHERE email = 'user@horizonsourcing.com';
   ```

2. **Check password hash:**
   ```sql
   SELECT email, LENGTH(password) as hash_length FROM users;
   ```
   Should be 60 characters for bcrypt

3. **Reset password manually:**
   ```sql
   UPDATE users 
   SET password = '$2a$10$...' -- new bcrypt hash
   WHERE email = 'user@horizonsourcing.com';
   ```

### Wrong Dashboard Appearing

Check role assignment:
```sql
SELECT email, role FROM users WHERE email = 'user@horizonsourcing.com';
```

### User Not in List

Run user creation script again:
```powershell
.\create-users-server.ps1
```

---

## 📝 Notes

- All users are created with `isActive = TRUE`
- Timestamps are auto-generated (`createdAt`, `updatedAt`)
- Passwords are bcrypt hashed (salt rounds = 10)
- ON CONFLICT clause allows safe re-running of scripts
- Email is unique constraint

---

## ✅ Checklist After User Creation

- [ ] All 7 users created in database
- [ ] Each user can login successfully
- [ ] Correct dashboard appears for each role
- [ ] Admin has full access
- [ ] Designers see their assigned jobs
- [ ] QA can review designs
- [ ] CTP can generate plates
- [ ] Inventory manager sees inventory module
- [ ] Procurement manager sees procurement module
- [ ] All passwords work as documented
- [ ] Plan to change passwords in production

---

**Last Updated:** 2024
**Status:** ✅ Complete and Tested
**Users:** 7 Active
**Departments:** 5



