# Quick LAN Server Status Check
$SERVER_IP = "192.168.2.124"

Write-Host "🔍 Checking LAN Server Status..." -ForegroundColor Blue
Write-Host ""

# Check IP
Write-Host "Server IP Configuration:" -ForegroundColor Yellow
ipconfig | Select-String "192.168.2"
Write-Host ""

# Check Docker
Write-Host "Docker Containers:" -ForegroundColor Yellow
docker-compose -f docker-compose.complete.yml ps
Write-Host ""

# Check Ports
Write-Host "Open Ports:" -ForegroundColor Yellow
netstat -an | findstr "8080 5001 5432"
Write-Host ""

# Check Firewall
Write-Host "Firewall Rules:" -ForegroundColor Yellow
Get-NetFirewallRule -DisplayName "ERP*" | Select-Object DisplayName, Enabled
Write-Host ""

# Check Services
Write-Host "Service Health:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${SERVER_IP}:5001/api/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ Backend: Online" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend: Offline" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://${SERVER_IP}:8080" -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ Frontend: Online" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend: Offline" -ForegroundColor Red
}

Write-Host ""
Write-Host "Access URL: http://${SERVER_IP}:8080" -ForegroundColor Green

