@echo off
echo ============================================
echo ERP System - Firewall Configuration
echo ============================================
echo.
echo Adding firewall rules to allow network access...
echo.

REM Add rule for Backend Port 5001
netsh advfirewall firewall add rule name="ERP Backend 5001" dir=in action=allow protocol=TCP localport=5001
netsh advfirewall firewall add rule name="ERP Backend 5001 Out" dir=out action=allow protocol=TCP localport=5001

REM Add rule for Frontend Port 8080
netsh advfirewall firewall add rule name="ERP Frontend 8080" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="ERP Frontend 8080 Out" dir=out action=allow protocol=TCP localport=8080

REM Add rule for Node.js
for /f "tokens=*" %%i in ('where node') do set NODEPATH=%%i
netsh advfirewall firewall add rule name="Node.js ERP" dir=in action=allow program="%NODEPATH%" enable=yes
netsh advfirewall firewall add rule name="Node.js ERP Out" dir=out action=allow program="%NODEPATH%" enable=yes

echo.
echo ============================================
echo Firewall rules added successfully!
echo ============================================
echo.
echo Your ERP system should now be accessible from other devices.
echo.
echo Network URL: http://192.168.2.124:8080
echo.
pause

