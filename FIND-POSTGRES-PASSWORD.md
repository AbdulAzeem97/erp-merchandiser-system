# 🔍 How to Find Your PostgreSQL Password

## The migration is failing because we need the correct PostgreSQL password.

---

## 🎯 Quick Solutions (Try These First)

### Option 1: Try Common Default Passwords

Run the migration and try these passwords when prompted:
1. **postgres** (most common)
2. **(blank - just press Enter)**
3. **admin**
4. **password**
5. **root**
6. **123456**

### Option 2: Check Your Installation Notes

When you installed PostgreSQL, you should have set a password. Check:
- Installation documents
- Password manager
- Setup notes

---

## 🔧 How to Reset PostgreSQL Password (If You Forgot)

### Method 1: Using pg_hba.conf (Easiest)

1. **Find pg_hba.conf file:**
   - Usually in: `C:\Program Files\PostgreSQL\15\data\pg_hba.conf`
   - Or: `C:\Program Files\PostgreSQL\14\data\pg_hba.conf`

2. **Edit the file as Administrator:**
   - Right-click on Notepad → Run as Administrator
   - Open `pg_hba.conf`
   
3. **Find this line:**
   ```
   host    all             all             127.0.0.1/32            md5
   ```
   
4. **Change `md5` to `trust`:**
   ```
   host    all             all             127.0.0.1/32            trust
   ```

5. **Restart PostgreSQL:**
   ```cmd
   net stop postgresql-x64-15
   net start postgresql-x64-15
   ```

6. **Connect without password:**
   ```cmd
   psql -U postgres
   ```

7. **Set new password:**
   ```sql
   ALTER USER postgres PASSWORD 'newpassword123';
   \q
   ```

8. **Change `trust` back to `md5` in pg_hba.conf**

9. **Restart PostgreSQL again**

---

## 🚀 Easy One-Command Migration

Once you know your password, create a `.env` file with this content:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/erp_merchandiser?schema=public"
PORT=5001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_merchandiser
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE
VITE_API_URL=http://192.168.2.124:5001
VITE_API_BASE_URL=http://192.168.2.124:5001/api
```

**Replace `YOUR_PASSWORD_HERE` with your actual password!**

Then run:
```cmd
npx prisma db push --accept-data-loss
node run-complete-migration.js
```

---

## 📋 Check if PostgreSQL is Running

```powershell
# Check service status
Get-Service -Name "postgresql*"

# Start if not running
net start postgresql-x64-15
```

---

## 💡 Alternative: Use PgAdmin

If you have PgAdmin installed (usually comes with PostgreSQL):

1. Open PgAdmin
2. Right-click on "Servers" → Create → Server
3. Try connecting with different passwords
4. Once you find the right one, note it down!

---

## 🎯 What Password Do You Remember?

Common patterns:
- Same as your Windows password?
- Same as another database password?
- Company default password?
- "postgres" + year? (postgres2024)
- First name + numbers?

---

## ✅ Once You Have the Password

Run this command and enter your password when prompted:

```cmd
node run-complete-migration.js
```

Or manually create the `.env` file as shown above and then:

```cmd
npx prisma generate
npx prisma db push --accept-data-loss
```

---

## 🆘 Still Stuck?

### Nuclear Option: Reinstall PostgreSQL

1. Uninstall PostgreSQL
2. Reinstall and SET A NEW PASSWORD YOU'LL REMEMBER
3. Write it down immediately!
4. Run migration

---

**What's your PostgreSQL password?** Try the migration script again with the correct password!

