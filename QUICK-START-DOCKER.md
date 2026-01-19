# 🚀 Quick Start Guide - Docker Deployment

## ✅ System is Running!

Your ERP Merchandiser System is now live and fully operational!

## 🌐 Access Your System

### 🖥️ Main Application (Frontend)
```
http://localhost:8080
```
👤 **Login Credentials:**
- Username: `admin`
- Password: `admin123`

### 🔌 Backend API
```
http://localhost:5001
```
Health check: http://localhost:5001/health

### 🗄️ Database Access
```
Host: localhost:5432
Database: erp_merchandiser
User: erp_user
Password: DevPassword123!
```

### 🔧 PgAdmin (Database Management)
```
http://localhost:5050
```
- Email: `admin@erp.local`
- Password: `admin123`

## 📋 Quick Commands

### View Logs
```bash
docker-compose -f docker-compose.complete.yml logs -f
```

### Check Status
```bash
docker-compose -f docker-compose.complete.yml ps
```

### Stop System
```bash
docker-compose -f docker-compose.complete.yml down
```

### Start System
```bash
docker-compose -f docker-compose.complete.yml up -d
```

### Restart Specific Service
```bash
docker-compose -f docker-compose.complete.yml restart backend
docker-compose -f docker-compose.complete.yml restart frontend
```

## 👥 User Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| manager | manager123 | Manager |
| sales | sales123 | Sales |
| production | prod123 | Production |

## 📦 What's Running

- ✅ **Frontend** - React application on port 8080
- ✅ **Backend** - Node.js API on port 5001
- ✅ **PostgreSQL** - Database on port 5432 (restored from dump)
- ✅ **Redis** - Cache on port 6379
- ✅ **PgAdmin** - Database UI on port 5050

## 🎯 Next Steps

1. Open http://localhost:8080 in your browser
2. Login with admin/admin123
3. Explore the system features
4. Start managing your merchandising operations!

## 📚 Documentation

For more details, see:
- `DOCKER-DEPLOYMENT-SUCCESS.md` - Complete deployment details
- `DOCKER-COMPLETE-SETUP-README.md` - Comprehensive setup guide
- `README.md` - General documentation

## 🆘 Need Help?

If something isn't working:
1. Check logs: `docker-compose -f docker-compose.complete.yml logs`
2. Verify all containers are running: `docker ps`
3. Restart services if needed: `docker-compose -f docker-compose.complete.yml restart`

---

**🎉 Happy Manufacturing!**

