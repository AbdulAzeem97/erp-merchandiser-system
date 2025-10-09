# 🐳 Complete Docker Deployment Guide

**One-Command Deployment for ERP Merchandiser System**

This guide provides complete instructions to deploy the entire ERP system using Docker with zero configuration required.

---

## 🚀 Quick Start (1-Command Deployment)

### Windows (PowerShell)

```powershell
git clone https://github.com/AbdulAzeem97/erp-merchandiser-system.git
cd erp-merchandiser-system
.\start-docker.ps1
```

### Linux/macOS (Bash)

```bash
git clone https://github.com/AbdulAzeem97/erp-merchandiser-system.git
cd erp-merchandiser-system
chmod +x start-docker.sh
./start-docker.sh
```

**That's it!** The system will:
1. ✅ Check Docker installation
2. ✅ Create environment configuration
3. ✅ Build all Docker images
4. ✅ Start PostgreSQL database
5. ✅ Create and seed database automatically
6. ✅ Start backend API server
7. ✅ Start frontend application
8. ✅ Wait for all services to be ready
9. ✅ Display access information

---

## 📋 Prerequisites

### Required Software

- **Docker Desktop** (Windows/macOS) or **Docker Engine** (Linux)
  - Version 20.10 or higher
  - Download: https://www.docker.com/products/docker-desktop

- **Docker Compose**
  - Usually included with Docker Desktop
  - Linux: `sudo apt-get install docker-compose`

- **Git** (to clone the repository)
  - Download: https://git-scm.com/downloads

### System Requirements

- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** Minimum 5GB free space
- **Ports:** 5432, 5001, 8080 must be available

---

## 🛠️ What Gets Deployed

### Docker Services

1. **PostgreSQL Database** (`erp-postgres`)
   - PostgreSQL 15 Alpine
   - Port: 5432
   - Database: `erp_merchandiser`
   - Auto-initialized with schema and data

2. **Backend API Server** (`erp-backend`)
   - Node.js 18 Alpine
   - Port: 5001
   - RESTful API + Socket.IO
   - Automatically waits for database

3. **Frontend Application** (`erp-frontend`)
   - Node.js 18 Alpine with serve
   - Port: 8080
   - Built React + Vite application
   - Optimized production build

### Data Persistence

- **PostgreSQL Data:** Persisted in Docker volume `postgres_data`
- **Upload Files:** Persisted in `./uploads` directory
- **Log Files:** Persisted in `./logs` directory

---

## 🎯 After Deployment

### Access the System

Once deployment completes (usually 2-3 minutes):

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:5001
- **Database:** localhost:5432

### Default User Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@horizonsourcing.com | admin123 |
| HOD Prepress | hod.prepress@horizonsourcing.com | hod123 |
| Designer | designer@horizonsourcing.com | designer123 |
| QA Prepress | qa.prepress@horizonsourcing.com | qa123 |
| CTP Operator | ctp.operator@horizonsourcing.com | ctp123 |
| Inventory Manager | inventory.manager@horizonsourcing.com | inventory123 |
| Procurement Manager | procurement.manager@horizonsourcing.com | procurement123 |

**⚠️ IMPORTANT:** Change all passwords after first login!

---

## 🔧 Docker Commands

### View Container Status

```bash
docker-compose -f docker-compose.complete.yml ps
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.complete.yml logs -f

# Specific service
docker-compose -f docker-compose.complete.yml logs -f backend
docker-compose -f docker-compose.complete.yml logs -f frontend
docker-compose -f docker-compose.complete.yml logs -f postgres
```

### Stop Services

```bash
docker-compose -f docker-compose.complete.yml down
```

### Stop and Remove Volumes (⚠️ Deletes all data)

```bash
docker-compose -f docker-compose.complete.yml down -v
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.complete.yml restart

# Restart specific service
docker-compose -f docker-compose.complete.yml restart backend
```

### Rebuild Images

```bash
docker-compose -f docker-compose.complete.yml build --no-cache
docker-compose -f docker-compose.complete.yml up -d
```

### Access Database

```bash
# Using psql in container
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser

# Run SQL file
docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser < your-script.sql
```

### Access Backend Shell

```bash
docker-compose -f docker-compose.complete.yml exec backend sh
```

### Clean Everything and Start Fresh

```bash
# Stop and remove containers, networks, volumes
docker-compose -f docker-compose.complete.yml down -v

# Remove images
docker rmi erp-merchandiser-system_backend erp-merchandiser-system_frontend

# Start fresh
./start-docker.sh  # or .\start-docker.ps1 on Windows
```

---

## 🔍 Troubleshooting

### Issue: Port Already in Use

**Error:** `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution:**

```bash
# Find process using the port (Linux/macOS)
lsof -i :5432
kill -9 <PID>

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5432).OwningProcess | Stop-Process -Force

# Or change port in docker-compose.complete.yml
ports:
  - "5433:5432"  # Use 5433 on host instead
```

### Issue: Docker Build Fails

**Error:** `failed to solve: error from sender: context canceled`

**Solution:**

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker-compose.complete.yml build --no-cache
```

### Issue: Database Not Initializing

**Symptoms:** Backend crashes or "connection refused" errors

**Solution:**

```bash
# Check PostgreSQL logs
docker-compose -f docker-compose.complete.yml logs postgres

# Manually initialize
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -f /app/database-setup-complete.sql
```

### Issue: Frontend Shows "Cannot connect to API"

**Solution:**

1. Check backend is running:
   ```bash
   curl http://localhost:5001/api/health
   ```

2. Check backend logs:
   ```bash
   docker-compose -f docker-compose.complete.yml logs backend
   ```

3. Verify environment variables in `.env` file

### Issue: Permission Denied (Linux)

**Error:** `permission denied while trying to connect to Docker daemon`

**Solution:**

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or:
newgrp docker

# Or run with sudo
sudo ./start-docker.sh
```

### Issue: Out of Disk Space

**Solution:**

```bash
# Clean up unused Docker resources
docker system prune -a --volumes

# Check Docker disk usage
docker system df
```

---

## 🔐 Production Deployment

### Security Checklist

Before deploying to production:

- [ ] **Change Database Password**
  - Edit `docker-compose.complete.yml`
  - Update `POSTGRES_PASSWORD` to a strong password

- [ ] **Change JWT Secret**
  - Edit `.env` file
  - Set `JWT_SECRET` to a random 64+ character string

- [ ] **Update CORS Origins**
  - Edit `.env` file
  - Set `ALLOWED_ORIGINS` to your domain

- [ ] **Enable SSL/TLS**
  - Use reverse proxy (nginx/Caddy)
  - Configure HTTPS certificates

- [ ] **Change All Default Passwords**
  - Login as each user
  - Change password immediately

- [ ] **Disable PostgreSQL Port Exposure**
  - Remove `ports` section from postgres service
  - Access only via internal Docker network

- [ ] **Enable Docker Secrets**
  - Use Docker secrets for sensitive data
  - Don't store passwords in plain text

### Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Backup Script

```bash
#!/bin/bash
# backup-docker-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f docker-compose.complete.yml exec -T postgres pg_dump -U postgres erp_merchandiser | gzip > $BACKUP_DIR/erp_backup_$DATE.sql.gz

# Keep only last 7 backups
find $BACKUP_DIR -name "erp_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: erp_backup_$DATE.sql.gz"
```

### Restore from Backup

```bash
# Extract and restore
gunzip < backups/erp_backup_YYYYMMDD_HHMMSS.sql.gz | docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser
```

---

## 📊 Monitoring

### Check Service Health

```bash
# Check all services
docker-compose -f docker-compose.complete.yml ps

# Check health status
docker inspect --format='{{.State.Health.Status}}' erp-postgres
docker inspect --format='{{.State.Health.Status}}' erp-backend
docker inspect --format='{{.State.Health.Status}}' erp-frontend
```

### Resource Usage

```bash
# Container resource usage
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune
```

---

## 🔄 Update Deployment

### Pull Latest Code

```bash
# Stop services
docker-compose -f docker-compose.complete.yml down

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.complete.yml build --no-cache
docker-compose -f docker-compose.complete.yml up -d
```

---

## 🌐 Cloud Deployment

### AWS EC2

```bash
# SSH to EC2 instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and deploy
git clone https://github.com/AbdulAzeem97/erp-merchandiser-system.git
cd erp-merchandiser-system
sudo ./start-docker.sh
```

### DigitalOcean Droplet

```bash
# Use Docker Marketplace image or install manually
# Same steps as AWS EC2
```

### Google Cloud Platform

```bash
# Create VM with Docker pre-installed
gcloud compute instances create erp-instance \
  --machine-type=n1-standard-2 \
  --image-family=cos-stable \
  --image-project=cos-cloud

# SSH and deploy
gcloud compute ssh erp-instance
# Then follow AWS steps
```

---

## 📚 Architecture

```
┌─────────────────────────────────────────┐
│           User Browser                   │
│         (localhost:8080)                 │
└────────────────┬────────────────────────┘
                 │ HTTP/WebSocket
┌────────────────▼────────────────────────┐
│         Frontend Container               │
│    (React + Vite - Port 8080)           │
└────────────────┬────────────────────────┘
                 │ API Calls
┌────────────────▼────────────────────────┐
│         Backend Container                │
│  (Node.js + Express - Port 5001)        │
│  - REST API                              │
│  - Socket.IO                             │
│  - Authentication                        │
└────────────────┬────────────────────────┘
                 │ SQL Queries
┌────────────────▼────────────────────────┐
│       PostgreSQL Container               │
│    (PostgreSQL 15 - Port 5432)          │
│  - Database: erp_merchandiser            │
│  - 30+ Tables                            │
│  - Auto-initialized                      │
└──────────────────────────────────────────┘
```

---

## ✅ What's Included

- ✅ **30+ Database Tables** (Products, Jobs, Inventory, Procurement, etc.)
- ✅ **7 User Roles** with RBAC (Admin, HOD, Designer, QA, CTP, Inventory, Procurement)
- ✅ **Complete Seeded Data** (Users, Categories, Materials, Suppliers, etc.)
- ✅ **Automatic Database Initialization** (No manual setup required)
- ✅ **Health Checks** (All services monitored)
- ✅ **Hot Reload** (Development mode available)
- ✅ **Persistent Data** (Volumes for database and uploads)
- ✅ **Production Ready** (Optimized builds)
- ✅ **One-Command Deployment** (Automated scripts)
- ✅ **Cross-Platform** (Windows, Linux, macOS)

---

## 🎉 Success!

If you see this message after running the script:

```
============================================
  ✅ Deployment Completed Successfully!
============================================

Frontend:  http://localhost:8080
Backend:   http://localhost:5001
Database:  localhost:5432
```

**Your system is ready!** Open http://localhost:8080 and login with any of the default credentials.

---

## 📞 Support

For issues or questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review Docker logs: `docker-compose -f docker-compose.complete.yml logs -f`
3. Open an issue on GitHub
4. Check [DATABASE-SETUP-README.md](DATABASE-SETUP-README.md) for database specifics

---

**Made with ❤️ for easy deployment**

