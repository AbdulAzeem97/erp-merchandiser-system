# Start ERP Servers with Proper Configuration
Write-Host "Starting ERP Servers with Fixed Configuration..." -ForegroundColor Cyan
Write-Host "=" * 60

# Stop any existing processes
Write-Host "🛑 Stopping existing processes..." -ForegroundColor Yellow
try {
    taskkill /F /IM node.exe 2>$null
    Write-Host "✅ Existing processes stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No existing processes to stop" -ForegroundColor Blue
}

# Wait a moment
Start-Sleep -Seconds 3

# Start Backend Server
Write-Host "🔧 Starting Backend Server on port 3001..." -ForegroundColor Yellow
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

# Wait for backend to start
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test backend
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 10
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend health check: PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend health check: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend health check: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Start Frontend Server
Write-Host "🎨 Starting Frontend Server on port 8080..." -ForegroundColor Yellow
$localIP = "localhost"
$backendPort = 3001

$frontendJob = Start-Job -ScriptBlock {
    param($localIP, $backendPort)
    Set-Location $using:PWD
    $env:VITE_API_BASE_URL = "http://${localIP}:${backendPort}/api"
    $env:VITE_API_URL = "http://${localIP}:${backendPort}"
    npm run dev -- --port 8080 --host
} -ArgumentList $localIP, $backendPort

Write-Host "✅ Frontend server started (Job ID: $($frontendJob.Id))" -ForegroundColor Green

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend access: PASSED" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend access: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend access: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test login API
Write-Host "🔐 Testing login API..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@erp.local"
        password = "password123"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10
    
    if ($loginResponse.StatusCode -eq 200) {
        $loginData = $loginResponse.Content | ConvertFrom-Json
        Write-Host "✅ Login API: PASSED" -ForegroundColor Green
        Write-Host "   User: $($loginData.user.first_name) $($loginData.user.last_name)" -ForegroundColor White
        Write-Host "   Role: $($loginData.user.role)" -ForegroundColor White
    } else {
        Write-Host "❌ Login API: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Login API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Display final status
Write-Host ""
Write-Host "🎉 ERP System Status:" -ForegroundColor Green
Write-Host "=" * 60
Write-Host "📱 Access URLs:" -ForegroundColor Cyan
Write-Host "   • Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "   • Backend API: http://localhost:3001/api" -ForegroundColor White
Write-Host "   • Health Check: http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Login Credentials:" -ForegroundColor Cyan
Write-Host "   • Admin: admin@erp.local / password123" -ForegroundColor White
Write-Host "   • Designer: emma.wilson@horizonsourcing.com / password123" -ForegroundColor White
Write-Host "   • Inventory: inventory@horizonsourcing.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "To stop servers:" -ForegroundColor Yellow
Write-Host "   • Run: Stop-Job $($backendJob.Id), $($frontendJob.Id)" -ForegroundColor White
Write-Host "   • Or: taskkill /F /IM node.exe" -ForegroundColor White
Write-Host ""

# Show job status
Write-Host "📊 Job Status:" -ForegroundColor Cyan
Get-Job | Format-Table Id, Name, State, HasMoreData

Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
