# PowerShell script to start the server and open job lifecycle demo
Write-Host "🚀 Starting ERP Merchandiser System with Job Lifecycle Demo..." -ForegroundColor Green

# Kill any existing Node processes
Write-Host "🔄 Stopping existing Node processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

# Wait a moment
Start-Sleep -Seconds 2

# Start the backend server
Write-Host "🔧 Starting backend server on port 3001..." -ForegroundColor Blue
$env:PORT=3001
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; node server/index.js" -WindowStyle Minimized

# Wait for server to start
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start the frontend development server
Write-Host "🎨 Starting frontend development server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run dev" -WindowStyle Minimized

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Open the job lifecycle demo in browser
Write-Host "🌐 Opening Job Lifecycle Demo in browser..." -ForegroundColor Green
Start-Process "http://localhost:5173/jobs/demo"

Write-Host ""
Write-Host "✅ Job Lifecycle System is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Available URLs:" -ForegroundColor Cyan
Write-Host "   • Job Lifecycle Demo: http://localhost:5173/jobs/demo" -ForegroundColor White
Write-Host "   • Job Management: http://localhost:5173/jobs" -ForegroundColor White
Write-Host "   • Job Dashboard: http://localhost:5173/jobs/dashboard" -ForegroundColor White
Write-Host "   • Job Lifecycle: http://localhost:5173/jobs/lifecycle" -ForegroundColor White
Write-Host "   • Job Workflow: http://localhost:5173/jobs/workflow" -ForegroundColor White
Write-Host "   • Main Dashboard: http://localhost:5173/" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Features to explore:" -ForegroundColor Cyan
Write-Host "   • Complete job lifecycle tracking (12 stages)" -ForegroundColor White
Write-Host "   • Interactive workflow visualizer" -ForegroundColor White
Write-Host "   • Real-time progress tracking" -ForegroundColor White
Write-Host "   • Modern UI with animations" -ForegroundColor White
Write-Host "   • Department-wise job management" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

