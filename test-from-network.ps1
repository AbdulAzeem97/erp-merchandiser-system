# Test if the system is accessible from network
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Network Access" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$localIP = "192.168.2.124"

# Test if ports are listening
Write-Host "1. Checking if servers are listening..." -ForegroundColor Yellow
$listening5001 = netstat -an | Select-String "0.0.0.0:5001.*LISTENING"
$listening8080 = netstat -an | Select-String "0.0.0.0:8080.*LISTENING"

if ($listening5001) {
    Write-Host "   Backend (5001): LISTENING" -ForegroundColor Green
} else {
    Write-Host "   Backend (5001): NOT LISTENING" -ForegroundColor Red
}

if ($listening8080) {
    Write-Host "   Frontend (8080): LISTENING" -ForegroundColor Green
} else {
    Write-Host "   Frontend (8080): NOT LISTENING" -ForegroundColor Red
}
Write-Host ""

# Test backend health
Write-Host "2. Testing backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${localIP}:5001/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   Backend API: WORKING" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($content.status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Backend API: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test frontend
Write-Host "3. Testing frontend server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${localIP}:8080" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   Frontend: ACCESSIBLE" -ForegroundColor Green
    }
} catch {
    Write-Host "   Frontend: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Check firewall rules
Write-Host "4. Checking Windows Firewall rules..." -ForegroundColor Yellow
$rule5001 = netsh advfirewall firewall show rule name="ERP Backend 5001" 2>$null
$rule8080 = netsh advfirewall firewall show rule name="ERP Frontend 8080" 2>$null

if ($rule5001 -match "Rule Name") {
    Write-Host "   Port 5001: ALLOWED" -ForegroundColor Green
} else {
    Write-Host "   Port 5001: BLOCKED (No firewall rule)" -ForegroundColor Red
}

if ($rule8080 -match "Rule Name") {
    Write-Host "   Port 8080: ALLOWED" -ForegroundColor Green
} else {
    Write-Host "   Port 8080: BLOCKED (No firewall rule)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not ($rule5001 -match "Rule Name") -or -not ($rule8080 -match "Rule Name")) {
    Write-Host "ISSUE FOUND: Firewall is blocking connections!" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Yellow
    Write-Host "1. Right-click on 'ALLOW-FIREWALL.bat'" -ForegroundColor White
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor White
    Write-Host "3. Click 'Yes' when prompted" -ForegroundColor White
    Write-Host "4. Test again from another device" -ForegroundColor White
} else {
    Write-Host "Firewall is configured correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "If you still can't access from other devices:" -ForegroundColor Yellow
    Write-Host "- Make sure other device is on same network (192.168.2.x)" -ForegroundColor White
    Write-Host "- Check if antivirus is blocking connections" -ForegroundColor White
    Write-Host "- Try disabling Windows Firewall temporarily to test" -ForegroundColor White
}

Write-Host ""
Write-Host "Network URLs to share:" -ForegroundColor Cyan
Write-Host "http://192.168.2.124:8080" -ForegroundColor White
Write-Host ""

