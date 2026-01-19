# 🌐 Network Access Setup Guide

## Complete Guide to Access ERP System from Any Device on Your Network

This guide will help you configure the ERP Merchandiser System to be accessible from any device on your local network at **192.168.2.124**.

---

## 📋 Prerequisites

1. **Windows with Administrator Access** - Required for firewall configuration
2. **Docker Desktop** - Running and operational
3. **Network Connection** - Server must be on local network (192.168.2.x)
4. **Ports Available** - 5001, 5432, 6379, 8080, 5050

---

## 🚀 Quick Setup (Automated)

### Step 1: Configure Windows Firewall

Run as Administrator:

```powershell
.\configure-network-access.ps1
```

This script will:
- ✅ Detect your network IP automatically
- ✅ Open required firewall ports (5001, 5432, 6379, 8080, 5050)
- ✅ Update .env file with correct network IP
- ✅ Configure CORS for network access

### Step 2: Start the System with Network Access

```powershell
.\start-network-system.ps1
```

This script will:
- ✅ Rebuild frontend with network IP
- ✅ Configure all services for network access
- ✅ Start all Docker containers
- ✅ Display network access URLs

---

## 🔧 Manual Setup (Step by Step)

### Step 1: Update Environment Configuration

1. Copy the network environment template:
   ```powershell
   Copy-Item .env.network .env
   ```

2. Edit `.env` and update the IP address (if different):
   ```bash
   NETWORK_IP=192.168.2.124
   VITE_API_BASE_URL=http://192.168.2.124:5001/api
   CORS_ORIGIN=http://192.168.2.124:8080,http://localhost:8080
   ```

### Step 2: Configure Windows Firewall

Run PowerShell as Administrator:

```powershell
# Frontend (React Application)
New-NetFirewallRule -DisplayName "ERP System - Frontend" `
    -Direction Inbound -Protocol TCP -LocalPort 8080 `
    -Action Allow -Profile Any

# Backend API
New-NetFirewallRule -DisplayName "ERP System - Backend" `
    -Direction Inbound -Protocol TCP -LocalPort 5001 `
    -Action Allow -Profile Any

# PostgreSQL Database
New-NetFirewallRule -DisplayName "ERP System - PostgreSQL" `
    -Direction Inbound -Protocol TCP -LocalPort 5432 `
    -Action Allow -Profile Any

# Redis Cache
New-NetFirewallRule -DisplayName "ERP System - Redis" `
    -Direction Inbound -Protocol TCP -LocalPort 6379 `
    -Action Allow -Profile Any

# PgAdmin
New-NetFirewallRule -DisplayName "ERP System - PgAdmin" `
    -Direction Inbound -Protocol TCP -LocalPort 5050 `
    -Action Allow -Profile Any
```

### Step 3: Rebuild and Restart Docker Containers

```bash
# Stop existing containers
docker-compose -f docker-compose.complete.yml down

# Rebuild frontend with network IP
docker-compose -f docker-compose.complete.yml build frontend

# Start all services
docker-compose -f docker-compose.complete.yml up -d
```

### Step 4: Verify Services

```bash
# Check container status
docker-compose -f docker-compose.complete.yml ps

# View logs
docker-compose -f docker-compose.complete.yml logs -f
```

---

## 🌐 Network Access URLs

Once configured, access the system from any device on your network:

### Main Application
```
http://192.168.2.124:8080
```
**Login:** admin / admin123

### Backend API
```
http://192.168.2.124:5001
```
**Health Check:** http://192.168.2.124:5001/health

### Database (PostgreSQL)
```
Host: 192.168.2.124
Port: 5432
Database: erp_merchandiser
User: erp_user
Password: DevPassword123!
```

### PgAdmin (Database Management)
```
http://192.168.2.124:5050
```
**Email:** admin@erp.local  
**Password:** admin123

---

## 📱 Accessing from Other Devices

### From Windows PC

1. Open browser (Chrome, Edge, Firefox)
2. Navigate to: `http://192.168.2.124:8080`
3. Login with admin/admin123

### From Mobile Device (Phone/Tablet)

1. Connect to same WiFi network
2. Open mobile browser
3. Navigate to: `http://192.168.2.124:8080`
4. Login with admin/admin123

### From Mac/Linux

1. Ensure on same network
2. Open browser
3. Navigate to: `http://192.168.2.124:8080`
4. Login with admin/admin123

---

## 🔍 Troubleshooting

### Issue: Cannot Access from Network

**Solution 1: Check Firewall**
```powershell
# Verify firewall rules exist
Get-NetFirewallRule -DisplayName "ERP System*"

# Re-run configuration
.\configure-network-access.ps1
```

**Solution 2: Verify Network IP**
```powershell
# Check your actual IP
ipconfig | findstr "IPv4"

# Update .env if IP is different
# Then rebuild frontend
docker-compose -f docker-compose.complete.yml build frontend
docker-compose -f docker-compose.complete.yml up -d
```

**Solution 3: Check Docker Bindings**
```bash
# Ensure services are bound to 0.0.0.0
docker-compose -f docker-compose.complete.yml ps

# Check port mappings
docker ps
```

### Issue: Frontend Loads but Can't Connect to Backend

**Check CORS Configuration:**
```bash
# View backend logs
docker logs erp-backend

# Should see CORS_ORIGIN with your network IP
```

**Rebuild Frontend:**
```bash
docker-compose -f docker-compose.complete.yml down
docker-compose -f docker-compose.complete.yml build frontend
docker-compose -f docker-compose.complete.yml up -d
```

### Issue: Connection Timeout

1. **Check Windows Defender Firewall:**
   - Open Windows Security
   - Firewall & network protection
   - Allow an app through firewall
   - Ensure ports 5001, 8080 are allowed

2. **Check Network:**
   ```powershell
   # Ping from another device
   ping 192.168.2.124
   ```

3. **Check Router:**
   - Ensure no AP isolation
   - Ensure devices are on same subnet

### Issue: Wrong IP Address

If your IP address is different:

1. Find your actual IP:
   ```powershell
   ipconfig
   ```

2. Update `.env`:
   ```bash
   NETWORK_IP=YOUR_ACTUAL_IP
   VITE_API_BASE_URL=http://YOUR_ACTUAL_IP:5001/api
   ```

3. Rebuild and restart:
   ```bash
   docker-compose -f docker-compose.complete.yml down
   docker-compose -f docker-compose.complete.yml build frontend
   docker-compose -f docker-compose.complete.yml up -d
   ```

---

## 🔒 Security Considerations

### For Network Access

1. **Change Default Passwords**
   ```bash
   # Update in .env:
   POSTGRES_PASSWORD=your_secure_password
   JWT_SECRET=your_secure_jwt_secret
   REDIS_PASSWORD=your_secure_redis_password
   ```

2. **Restrict Network Access**
   - Only allow access from trusted devices
   - Consider using VPN for remote access
   - Monitor access logs

3. **Enable Authentication**
   - All users must login
   - Use strong passwords
   - Regular password updates

4. **Network Isolation**
   - Keep on private network
   - Don't expose to internet directly
   - Use firewall rules to restrict access

### For Production

If deploying for production use:

1. **Use HTTPS**
   - Set up SSL certificates
   - Configure reverse proxy (nginx)
   - Force HTTPS connections

2. **Database Security**
   - Don't expose database port externally
   - Use strong passwords
   - Enable SSL connections

3. **Regular Updates**
   - Keep Docker images updated
   - Update dependencies
   - Security patches

---

## 📊 Port Configuration

| Service | Port | Protocol | Firewall Rule |
|---------|------|----------|---------------|
| Frontend | 8080 | TCP | Required |
| Backend API | 5001 | TCP | Required |
| PostgreSQL | 5432 | TCP | Optional* |
| Redis | 6379 | TCP | Optional* |
| PgAdmin | 5050 | TCP | Optional |

\* Database and Redis ports only need to be opened if you want to connect to them directly from other devices. For normal operation, only frontend (8080) and backend (5001) are required.

---

## 🧪 Testing Network Access

### Test from Server (Local)

```powershell
# Test frontend
Invoke-WebRequest -Uri http://192.168.2.124:8080 -UseBasicParsing

# Test backend
Invoke-WebRequest -Uri http://192.168.2.124:5001/health -UseBasicParsing

# Test database
Test-NetConnection -ComputerName 192.168.2.124 -Port 5432
```

### Test from Another Device

```bash
# Test frontend (use curl or browser)
curl http://192.168.2.124:8080

# Test backend
curl http://192.168.2.124:5001/health

# Test database
telnet 192.168.2.124 5432
```

---

## 📋 Quick Reference

### Start System with Network Access
```powershell
.\start-network-system.ps1
```

### Configure Firewall
```powershell
.\configure-network-access.ps1
```

### Check Status
```bash
docker-compose -f docker-compose.complete.yml ps
```

### View Logs
```bash
docker-compose -f docker-compose.complete.yml logs -f
```

### Restart Services
```bash
docker-compose -f docker-compose.complete.yml restart
```

### Stop System
```bash
docker-compose -f docker-compose.complete.yml down
```

---

## 🎯 What's Configured

When you run the automated setup:

✅ **Firewall Rules Added:**
- Port 8080: Frontend (React Application)
- Port 5001: Backend API (Node.js/Express)
- Port 5432: PostgreSQL Database
- Port 6379: Redis Cache
- Port 5050: PgAdmin

✅ **Docker Services Configured:**
- All services bind to 0.0.0.0 (all network interfaces)
- Frontend built with network IP for API calls
- Backend configured with network IP in CORS
- All containers on same Docker network

✅ **Environment Variables Set:**
- NETWORK_IP: 192.168.2.124
- VITE_API_BASE_URL: http://192.168.2.124:5001/api
- CORS_ORIGIN: Includes network IP
- All services configured for network access

---

## 📞 Support

If you encounter issues:

1. Check the logs:
   ```bash
   docker-compose -f docker-compose.complete.yml logs
   ```

2. Verify firewall rules:
   ```powershell
   Get-NetFirewallRule -DisplayName "ERP System*"
   ```

3. Test connectivity:
   ```powershell
   Test-NetConnection -ComputerName 192.168.2.124 -Port 8080
   ```

4. Rebuild and restart:
   ```bash
   docker-compose -f docker-compose.complete.yml down
   docker-compose -f docker-compose.complete.yml build
   docker-compose -f docker-compose.complete.yml up -d
   ```

---

## ✅ Success Checklist

- [ ] Firewall rules configured
- [ ] .env file updated with network IP
- [ ] Docker containers rebuilt
- [ ] All services running (docker ps)
- [ ] Can access http://192.168.2.124:8080 from server
- [ ] Can access from another device on network
- [ ] Backend API responding at http://192.168.2.124:5001/health
- [ ] Database accessible (if needed)

---

## 🎉 You're All Set!

Your ERP Merchandiser System is now accessible from any device on your network!

**Access URL:** http://192.168.2.124:8080  
**Login:** admin / admin123

Share this URL with your team and start collaborating!

---

**Last Updated:** October 13, 2025  
**Network IP:** 192.168.2.124  
**Status:** ✅ Configured for Network Access

