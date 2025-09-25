# Start ERP System on Network
Write-Host "🚀 Starting ERP System on Network..." -ForegroundColor Green

# Kill any existing processes
Write-Host "🔄 Stopping existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Start Backend
Write-Host "📡 Starting Backend Server..." -ForegroundColor Cyan
$env:JWT_SECRET='your-super-secret-jwt-key-change-this-in-production'
$env:PORT=3001
$env:NODE_ENV='development'
Start-Process -FilePath "node" -ArgumentList "server/index.js" -WindowStyle Minimized

# Wait a moment
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
$env:VITE_API_BASE_URL='http://localhost:3001/api'
$env:VITE_API_URL='http://localhost:3001'
Start-Process -FilePath "npm" -ArgumentList "run", "dev", "--", "--port", "8080", "--host", "0.0.0.0" -WindowStyle Minimized

# Wait for servers to start
Write-Host "⏳ Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Test servers
Write-Host "🧪 Testing servers..." -ForegroundColor Cyan

# Test Backend
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5
    Write-Host "✅ Backend: $($backendResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 5
    Write-Host "✅ Frontend: $($frontendResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "📱 Network Access: Anyone on your network can access these URLs" -ForegroundColor Yellow
Write-Host "🔑 Login: inventory@horizonsourcing.com / password123" -ForegroundColor Yellow



