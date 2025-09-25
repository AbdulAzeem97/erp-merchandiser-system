# ERP Application Firewall Configuration Script
# Run this script as Administrator

Write-Host "Configuring Windows Firewall for ERP Application..." -ForegroundColor Green

# Add firewall rules for backend port 5001
try {
    New-NetFirewallRule -DisplayName "ERP Backend Port 5001" -Direction Inbound -Protocol TCP -LocalPort 5001 -Action Allow -Profile Any
    Write-Host "✅ Backend port 5001 rule added successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to add backend rule: $($_.Exception.Message)" -ForegroundColor Red
}

# Add firewall rules for frontend port 8080
try {
    New-NetFirewallRule -DisplayName "ERP Frontend Port 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Any
    Write-Host "✅ Frontend port 8080 rule added successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to add frontend rule: $($_.Exception.Message)" -ForegroundColor Red
}

# Add firewall rules for Vite dev server port 8081 (backup)
try {
    New-NetFirewallRule -DisplayName "ERP Frontend Port 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Any
    Write-Host "✅ Frontend port 8081 rule added successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to add frontend 8081 rule: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nFirewall configuration completed!" -ForegroundColor Green
Write-Host "Your ERP application should now be accessible from other devices on the network." -ForegroundColor Yellow
Write-Host "`nAccess URLs:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "Backend: http://localhost:5001" -ForegroundColor White

Read-Host "Press Enter to continue"
