# 🚀 ERP Merchandiser System - Quick Start Guide

## Single Command to Start Everything!

### Option 1: PowerShell Script (Recommended)
```powershell
.\start-system.ps1
```

### Option 2: Batch Script
```cmd
start-system.bat
```

### Option 3: NPM Command (Complete Setup)
```bash
npm run start
```

### Option 4: NPM Command (Quick Start - if database exists)
```bash
npm run start:quick
```

---

## What Each Command Does:

### 🎯 **PowerShell Script** (`start-system.ps1`)
- ✅ Checks Node.js and npm installation
- ✅ Installs dependencies if needed
- ✅ Sets up database (migration + seeding)
- ✅ Starts backend server in new window
- ✅ Starts frontend server in new window
- ✅ Opens browser automatically
- ✅ Color-coded output with status indicators

### 🎯 **Batch Script** (`start-system.bat`)
- ✅ Same features as PowerShell but for CMD
- ✅ Opens servers in separate windows
- ✅ Automatic browser opening

### 🎯 **NPM Start** (`npm run start`)
- ✅ Runs database migration
- ✅ Runs database seeding
- ✅ Starts both servers concurrently
- ✅ Single terminal window

### 🎯 **NPM Quick Start** (`npm run start:quick`)
- ✅ Starts both servers concurrently
- ✅ Skips database setup (assumes it exists)
- ✅ Fastest option for daily use

---

## 🌐 Access Your System

Once started, your ERP system will be available at:

- **Frontend**: http://localhost:8080 (or next available port)
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## 🔑 Default Login

```
Email: admin@horizonsourcing.com
Password: admin123
```

---

## 🛑 How to Stop the System

1. **If using scripts**: Close the terminal windows
2. **If using npm**: Press `Ctrl+C` in the terminal
3. **Force stop**: `taskkill /F /IM node.exe` (Windows)

---

## 📋 System Requirements

- Node.js 18+ 
- npm 8+
- Windows 10/11 (for scripts)
- PowerShell 5+ (for PowerShell script)

---

## 🎉 Enjoy Your ERP System!

Your complete ERP Merchandiser system includes:
- ✅ Product Management
- ✅ Job Card Management  
- ✅ Company Management
- ✅ Professional PDF Generation
- ✅ Advanced Dashboard
- ✅ Real-time Backend Status
- ✅ File Upload System
- ✅ User Authentication

**Choose any command above and start your ERP system in seconds!** 🚀
