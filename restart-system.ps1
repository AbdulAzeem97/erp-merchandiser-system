# ERP System Restart Script
# This script will properly restart the ERP system with network configuration

Write-Host "🔄 Restarting ERP Merchandiser System..." -ForegroundColor Cyan
Write-Host "=" * 50

# Step 1: Stop all Node.js processes
Write-Host "🛑 Stopping all Node.js processes..." -ForegroundColor Yellow
try {
    taskkill /F /IM node.exe 2>$null
    Write-Host "✅ All Node.js processes stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No Node.js processes were running" -ForegroundColor Blue
}

# Step 2: Wait a moment
Write-Host "⏳ Waiting 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 3: Start Backend Server
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Yellow
$env:JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production"
$env:PORT = 3001
$env:NODE_ENV = "development"

$backendJob = Start-Job -ScriptBlock {
    param($jwtSecret, $port, $nodeEnv)
    $env:JWT_SECRET = $jwtSecret
    $env:PORT = $port
    $env:NODE_ENV = $nodeEnv
    Set-Location $using:PWD
    node server/index.js
} -ArgumentList $env:JWT_SECRET, $env:PORT, $env:NODE_ENV

Write-Host "✅ Backend server started (Job ID: $($backendJob.Id))" -ForegroundColor Green

# Step 4: Wait for backend to start
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 5: Start Frontend Server
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Yellow
$localIP = "192.168.2.56"
$backendPort = 3001

$frontendJob = Start-Job -ScriptBlock {
    param($localIP, $backendPort)
    Set-Location $using:PWD
    $env:VITE_API_BASE_URL = "http://${localIP}:${backendPort}/api"
    $env:VITE_API_URL = "http://${localIP}:${backendPort}"
    npm run dev
} -ArgumentList $localIP, $backendPort

Write-Host "✅ Frontend server started (Job ID: $($frontendJob.Id))" -ForegroundColor Green

# Step 6: Wait for frontend to start
Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Step 7: Test the system
Write-Host "🧪 Testing system..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://192.168.2.56:3001/health" -TimeoutSec 10
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend health check: PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend health check: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend health check: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://192.168.2.56:8080" -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend access: PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend access: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend access: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Display access information
Write-Host ""
Write-Host "🎉 ERP System Restarted Successfully!" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "📱 Access URLs:" -ForegroundColor Cyan
Write-Host "   • Frontend: http://192.168.2.56:8080" -ForegroundColor White
Write-Host "   • Backend API: http://192.168.2.56:3001/api" -ForegroundColor White
Write-Host "   • Health Check: http://192.168.2.56:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Login Credentials:" -ForegroundColor Cyan
Write-Host "   • Admin: admin@horizonsourcing.com / password123" -ForegroundColor White
Write-Host "   • Designer: emma.wilson@horizonsourcing.com / password123" -ForegroundColor White
Write-Host "   • Inventory: inventory@horizonsourcing.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test Login:" -ForegroundColor Cyan
Write-Host "   • Open: simple-login-test.html" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop the system:" -ForegroundColor Yellow
Write-Host "   • Run: Stop-Job $($backendJob.Id), $($frontendJob.Id)" -ForegroundColor White
Write-Host "   • Or: taskkill /F /IM node.exe" -ForegroundColor White
Write-Host ""

# Keep the script running to show job status
Write-Host "📊 Job Status:" -ForegroundColor Cyan
Get-Job | Format-Table Id, Name, State, HasMoreData

Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
