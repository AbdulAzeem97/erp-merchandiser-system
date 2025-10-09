# 🚀 Quick Start - Docker Deployment

**Get the complete ERP system running in 2 minutes!**

---

## ⚡ One-Command Deployment

### Windows
```powershell
git clone https://github.com/AbdulAzeem97/erp-merchandiser-system.git
cd erp-merchandiser-system
.\start-docker.ps1
```

### Linux/macOS
```bash
git clone https://github.com/AbdulAzeem97/erp-merchandiser-system.git
cd erp-merchandiser-system
chmod +x start-docker.sh
./start-docker.sh
```

---

## 🎯 What Happens

The script will automatically:

1. ✅ Check Docker installation
2. ✅ Create `.env` configuration file
3. ✅ Build Docker images (PostgreSQL, Backend, Frontend)
4. ✅ Start all containers
5. ✅ Create database and all tables
6. ✅ Seed initial data (users, categories, etc.)
7. ✅ Wait for services to be ready
8. ✅ Display access information

**Time:** ~2-3 minutes (depending on your internet speed)

---

## 🌐 Access the System

After deployment completes:

- **Open Browser:** http://localhost:8080
- **Login with:**
  - Email: `admin@horizonsourcing.com`
  - Password: `admin123`

---

## 👥 All User Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@horizonsourcing.com | admin123 |
| HOD Prepress | hod.prepress@horizonsourcing.com | hod123 |
| Designer | designer@horizonsourcing.com | designer123 |
| QA Prepress | qa.prepress@horizonsourcing.com | qa123 |
| CTP Operator | ctp.operator@horizonsourcing.com | ctp123 |
| Inventory Manager | inventory.manager@horizonsourcing.com | inventory123 |
| Procurement Manager | procurement.manager@horizonsourcing.com | procurement123 |

---

## 🛑 Stop the System

```bash
docker-compose -f docker-compose.complete.yml down
```

---

## 🔄 Restart the System

```bash
docker-compose -f docker-compose.complete.yml up -d
```

---

## 📊 View Logs

```bash
docker-compose -f docker-compose.complete.yml logs -f
```

---

## 🆘 Having Issues?

See the complete guide: [DOCKER-DEPLOYMENT-COMPLETE.md](DOCKER-DEPLOYMENT-COMPLETE.md)

---

**That's it! You're ready to use the system! 🎉**

