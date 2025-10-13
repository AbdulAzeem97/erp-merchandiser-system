# Quick Firewall Rule Addition for ERP System
# This adds rules to allow Node.js through Windows Firewall

Write-Host "Adding Windows Firewall Rules..." -ForegroundColor Cyan
Write-Host ""

# Add rule for port 5001 (Backend)
Write-Host "Adding rule for Backend (Port 5001)..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="ERP Backend Port 5001" dir=in action=allow protocol=TCP localport=5001
netsh advfirewall firewall add rule name="ERP Backend Port 5001 Out" dir=out action=allow protocol=TCP localport=5001

# Add rule for port 8080 (Frontend)
Write-Host "Adding rule for Frontend (Port 8080)..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="ERP Frontend Port 8080" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="ERP Frontend Port 8080 Out" dir=out action=allow protocol=TCP localport=8080

# Add rule for Node.js executable
Write-Host "Adding rule for Node.js..." -ForegroundColor Yellow
$nodePath = (Get-Command node).Source
netsh advfirewall firewall add rule name="Node.js ERP System" dir=in action=allow program="$nodePath" enable=yes
netsh advfirewall firewall add rule name="Node.js ERP System Out" dir=out action=allow program="$nodePath" enable=yes

Write-Host ""
Write-Host "Firewall rules added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Testing ports..." -ForegroundColor Cyan

# Test if ports are listening
Write-Host "Checking port 5001..." -ForegroundColor Yellow
netstat -an | findstr ":5001"

Write-Host "Checking port 8080..." -ForegroundColor Yellow
netstat -an | findstr ":8080"

Write-Host ""
Write-Host "Done! Try accessing from another device now." -ForegroundColor Green

