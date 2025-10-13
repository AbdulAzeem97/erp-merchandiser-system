# 🔥 FIX NETWORK ACCESS - Windows Firewall Blocking

## ❌ Current Problem
- ✅ Works on server PC (localhost:8080)
- ❌ Doesn't work from other devices (192.168.2.124:8080)
- 🔒 **Windows Firewall is blocking ports 5001 and 8080**

---

## ✅ SOLUTION (3 Simple Steps):

### **Step 1: Run the Firewall Fix**
1. Locate the file: **`ALLOW-FIREWALL.bat`** in this folder
2. **Right-click** on it
3. Select **"Run as Administrator"**
4. Click **"Yes"** when Windows asks for permission
5. Wait for it to say "Firewall rules added successfully!"
6. Press any key to close

### **Step 2: Verify It Worked**
Open PowerShell and run:
```powershell
.\test-from-network.ps1
```

You should see:
- ✅ Port 5001: ALLOWED
- ✅ Port 8080: ALLOWED

### **Step 3: Test from Another Device**
On your phone or another computer:
1. Connect to same WiFi (192.168.2.x network)
2. Open browser
3. Go to: **http://192.168.2.124:8080**
4. You should see the ERP login page!

---

## 🔍 What Was Wrong?

Your servers were running perfectly and listening on all network interfaces, but Windows Firewall was blocking incoming connections from other devices on the network.

### Technical Details:
- **Backend:** Listening on 0.0.0.0:5001 ✅
- **Frontend:** Listening on 0.0.0.0:8080 ✅
- **Firewall Rule for Port 5001:** Missing ❌
- **Firewall Rule for Port 8080:** Missing ❌

---

## 🛠️ Alternative Manual Method

If the batch file doesn't work, manually add firewall rules:

### Open Command Prompt as Administrator:
```cmd
netsh advfirewall firewall add rule name="ERP Backend 5001" dir=in action=allow protocol=TCP localport=5001
netsh advfirewall firewall add rule name="ERP Frontend 8080" dir=in action=allow protocol=TCP localport=8080
```

### Or Use Windows Firewall GUI:
1. Open **Windows Defender Firewall**
2. Click **"Advanced settings"**
3. Click **"Inbound Rules"** → **"New Rule"**
4. Select **"Port"** → Next
5. Select **"TCP"** and enter **"5001"** → Next
6. Select **"Allow the connection"** → Next
7. Check all profiles → Next
8. Name it **"ERP Backend 5001"** → Finish
9. Repeat for port **8080** (name it **"ERP Frontend 8080"**)

---

## 🧪 Testing Commands

### Check if servers are listening:
```powershell
netstat -an | findstr "5001 8080"
```
Should show: `0.0.0.0:5001` and `0.0.0.0:8080` LISTENING

### Check firewall rules:
```powershell
netsh advfirewall firewall show rule name="ERP Backend 5001"
netsh advfirewall firewall show rule name="ERP Frontend 8080"
```

### Test backend from server:
```powershell
curl http://192.168.2.124:5001/health
```
Should return: `{"status":"OK"}`

### Full diagnostic:
```powershell
.\test-from-network.ps1
```

---

## 📱 After Fixing - Share These URLs:

**From Server PC:**
- http://localhost:8080

**From Other Devices (on same network):**
- http://192.168.2.124:8080

**Login Credentials:**
- Email: `admin@erp.local`
- Password: `password123`

---

## ❓ Still Not Working?

### Check 1: Are both servers running?
```powershell
Get-Process node
```
Should show 2 Node.js processes

### Check 2: Did firewall rules get added?
```powershell
.\test-from-network.ps1
```
Should show ALLOWED for both ports

### Check 3: Is other device on same network?
On the other device, check WiFi settings:
- Should be connected to same router
- IP should be 192.168.2.xxx

### Check 4: Temporarily disable firewall (for testing)
```powershell
# Run as Administrator
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
```

Test if it works. If yes, the issue is definitely firewall.

Then re-enable:
```powershell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

And make sure to run `ALLOW-FIREWALL.bat` as Administrator.

---

## 🎯 Quick Fix Summary

**The issue:** Windows Firewall blocking network connections  
**The fix:** Run `ALLOW-FIREWALL.bat` as Administrator  
**Test:** Open http://192.168.2.124:8080 from another device  

---

**That's it! After running the firewall fix, your system will be accessible from the entire network! 🚀**

