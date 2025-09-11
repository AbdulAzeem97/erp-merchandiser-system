# 🌐 ERP Merchandiser System - Network Access Guide

## ✅ Network Setup Complete!

Your ERP Merchandiser System is now fully configured for network access. Team members on your local network can access the system using your computer's IP address.

## 📱 Network Access URLs

**Your Local IP:** `192.168.2.56`

### For Team Members:
- **Main Application:** `http://192.168.2.56:8080`
- **Backend API:** `http://192.168.2.56:3001/api`
- **Health Check:** `http://192.168.2.56:3001/health`

## 🔐 Login Credentials

All users have the password: **`password123`**

### Available User Accounts:

| Role | Email | Name |
|------|-------|------|
| **Designer** | `emma.wilson@horizonsourcing.com` | Emma Wilson |
| **Designer** | `james.brown@horizonsourcing.com` | James Brown |
| **Designer** | `lisa.garcia@horizonsourcing.com` | Lisa Garcia |
| **HOD Prepress** | `hodprepress@horizonsourcing.com` | Sarah Johnson |
| **HOD Prepress** | `alex.kumar@horizonsourcing.com` | Alex Kumar |
| **Merchandiser** | `merchandiser1@horizonsourcing.com` | John Merchandiser |
| **Merchandiser** | `tom.anderson@horizonsourcing.com` | Tom Anderson |
| **Merchandiser** | `anna.taylor@horizonsourcing.com` | Anna Taylor |
| **Merchandiser** | `david.martinez@horizonsourcing.com` | David Martinez |
| **Head of Merchandiser** | `sarah.chen@horizonsourcing.com` | Sarah Chen |
| **Head of Production** | `mike.rodriguez@horizonsourcing.com` | Mike Rodriguez |
| **Inventory Head** | `inventory@horizonsourcing.com` | Inventory Manager |
| **System Administrator** | `admin@horizonsourcing.com` | System Administrator |

## 🚀 Starting the Network Server

### Option 1: PowerShell Script (Recommended)
```powershell
.\start-network-server.ps1
```

### Option 2: Batch File (Simple)
```cmd
start-network.bat
```

### Option 3: Node.js Script
```bash
node start-network-server.js
```

## 🔧 Manual Startup Commands

If you prefer to start manually:

### Backend Server:
```powershell
$env:JWT_SECRET='your-super-secret-jwt-key-change-this-in-production'; $env:PORT=3001; $env:NODE_ENV='development'; node server/index.js
```

### Frontend Server:
```powershell
$env:VITE_API_BASE_URL='http://192.168.2.56:3001/api'; $env:VITE_API_URL='http://192.168.2.56:3001'; npm run dev
```

## 🛡️ Security Notes

- **Windows Firewall:** Make sure Windows Firewall allows connections on ports 3001 and 8080
- **Network Access:** Anyone on your local network (192.168.2.x) can access the system
- **Development Mode:** The system is configured for development with permissive CORS settings
- **Password:** All users currently use the same password for testing purposes

## 🧪 Testing Network Access

### Quick Test Scripts:
```bash
# Test network configuration
node test-network-config.js

# Test login functionality
node test-correct-login.js

# Get network information
node get-network-info.js
```

## 📋 Troubleshooting

### If team members can't access the system:

1. **Check Windows Firewall:**
   - Open Windows Defender Firewall
   - Allow apps through firewall
   - Add Node.js and allow both private and public networks

2. **Verify IP Address:**
   - Run `ipconfig` in Command Prompt
   - Look for your current IP address
   - Update the URLs if your IP has changed

3. **Check if servers are running:**
   - Backend: `http://192.168.2.56:3001/health`
   - Frontend: `http://192.168.2.56:8080`

4. **Restart servers:**
   ```powershell
   taskkill /F /IM node.exe
   .\start-network-server.ps1
   ```

## 🎯 Features Available

- ✅ **User Authentication** - Login with role-based access
- ✅ **Designer Dashboard** - Job assignments and status updates
- ✅ **HOD Dashboard** - Job management and approval
- ✅ **Merchandiser Portal** - Job creation and tracking
- ✅ **Inventory Management** - Material and stock management
- ✅ **Production Tracking** - Job lifecycle management
- ✅ **Real-time Updates** - Socket.io integration
- ✅ **Network Access** - Multi-user support

## 📞 Support

If you encounter any issues:
1. Check the server logs in the terminal
2. Verify network connectivity
3. Test with the provided test scripts
4. Ensure Windows Firewall is properly configured

---

**🎉 Your ERP Merchandiser System is now ready for team collaboration!**
