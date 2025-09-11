# PowerShell script to start the system and open prepress demo
Write-Host "🚀 Starting ERP Merchandiser System with Modern Prepress Demo..." -ForegroundColor Green

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

# Open the prepress demo in browser
Write-Host "🌐 Opening Modern Prepress Demo in browser..." -ForegroundColor Green
Start-Process "http://localhost:5173/prepress/demo"

Write-Host ""
Write-Host "✅ Modern Prepress System is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Available URLs:" -ForegroundColor Cyan
Write-Host "   • Prepress Demo: http://localhost:5173/prepress/demo" -ForegroundColor White
Write-Host "   • HOD Dashboard: http://localhost:5173/prepress/hod/modern" -ForegroundColor White
Write-Host "   • Designer Workbench: http://localhost:5173/prepress/designer/modern" -ForegroundColor White
Write-Host "   • Job Lifecycle Demo: http://localhost:5173/jobs/demo" -ForegroundColor White
Write-Host "   • Main Dashboard: http://localhost:5173/" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Modern Prepress Features:" -ForegroundColor Cyan
Write-Host "   • Real-time job status updates" -ForegroundColor White
Write-Host "   • Modern glass morphism UI" -ForegroundColor White
Write-Host "   • Interactive Kanban boards" -ForegroundColor White
Write-Host "   • Designer productivity tracking" -ForegroundColor White
Write-Host "   • Comprehensive analytics" -ForegroundColor White
Write-Host "   • Socket.io real-time communication" -ForegroundColor White
Write-Host "   • Responsive design for all devices" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Backend API Endpoints:" -ForegroundColor Cyan
Write-Host "   • Enhanced Prepress API: http://localhost:3001/api/enhanced-prepress" -ForegroundColor White
Write-Host "   • Real-time Socket.io: ws://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "👥 Test Users:" -ForegroundColor Cyan
Write-Host "   • HOD Prepress: hod.prepress@horizonsourcing.com / password123" -ForegroundColor White
Write-Host "   • Designer: designer@horizonsourcing.com / password123" -ForegroundColor White
Write-Host "   • Admin: admin@horizonsourcing.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "🎨 UI Features:" -ForegroundColor Cyan
Write-Host "   • Glass morphism effects with backdrop blur" -ForegroundColor White
Write-Host "   • Smooth Framer Motion animations" -ForegroundColor White
Write-Host "   • Interactive hover effects" -ForegroundColor White
Write-Host "   • Professional color schemes" -ForegroundColor White
Write-Host "   • Modern typography with Inter font" -ForegroundColor White
Write-Host "   • Responsive grid layouts" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

