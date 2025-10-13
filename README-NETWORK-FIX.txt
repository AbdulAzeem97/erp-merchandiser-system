================================================================================
    ERP MERCHANDISER SYSTEM - NETWORK ACCESS FIX
================================================================================

PROBLEM: System works on server PC but NOT on other devices in network

SOLUTION: Run the firewall fix (3 simple steps)

================================================================================
STEP 1: ADD FIREWALL RULES
================================================================================

1. Find the file:     ALLOW-FIREWALL.bat
2. Right-click on it
3. Select:            "Run as Administrator"
4. Click:             "Yes" when prompted
5. Wait for:          "Firewall rules added successfully!"
6. Press any key to close

================================================================================
STEP 2: VERIFY IT WORKED
================================================================================

Open PowerShell in this folder and run:

    .\test-from-network.ps1

You should see:
    Port 5001: ALLOWED ✓
    Port 8080: ALLOWED ✓

================================================================================
STEP 3: TEST FROM ANOTHER DEVICE
================================================================================

On your phone or another computer:

1. Connect to same WiFi network (192.168.2.x)
2. Open any web browser
3. Go to:  http://192.168.2.124:8080
4. Login with:
   - Email:    admin@erp.local
   - Password: password123

================================================================================
WHAT'S THE ISSUE?
================================================================================

Your servers are running perfectly, but Windows Firewall is blocking 
connections from other devices. The batch file will add firewall rules to 
allow traffic on ports 5001 (backend) and 8080 (frontend).

================================================================================
NEED HELP?
================================================================================

See detailed guide:  FIX-NETWORK-ACCESS.md

Test connection:     .\test-from-network.ps1

Start servers:       .\start-network-auto.ps1

================================================================================

