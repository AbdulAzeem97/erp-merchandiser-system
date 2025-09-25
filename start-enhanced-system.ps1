# Enhanced ERP Merchandiser System Startup Script
# This script sets up and starts the enhanced system with new features

Write-Host "🚀 Starting Enhanced ERP Merchandiser System..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ .env file created. Please update with your database credentials." -ForegroundColor Green
    Write-Host ""
}

Write-Host "🗄️  Setting up enhanced database..." -ForegroundColor Yellow

# Run database migration
Write-Host "📊 Running database migration..." -ForegroundColor Cyan
node server/database/migrate.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database migration failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database migration completed" -ForegroundColor Green

# Run enhanced seeding
Write-Host "🌱 Seeding enhanced data..." -ForegroundColor Cyan
node server/database/seed_enhanced.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database seeding failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Enhanced data seeded successfully" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Enhanced ERP System Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 System Features:" -ForegroundColor Cyan
Write-Host "  ✅ Role-based command centers (HoM, HoP, HOD Prepress, Designer)" -ForegroundColor White
Write-Host "  ✅ Multi-merchandiser job punching workflow" -ForegroundColor White
Write-Host "  ✅ Comprehensive reporting suite with CSV exports" -ForegroundColor White
Write-Host "  ✅ Prepress module with state machine validation" -ForegroundColor White
Write-Host "  ✅ Real-time updates with Socket.io" -ForegroundColor White
Write-Host "  ✅ Enhanced RBAC with 6 user roles" -ForegroundColor White
Write-Host ""

Write-Host "🔑 Login Credentials:" -ForegroundColor Cyan
Write-Host "  👑 Admin: admin@erp.local / admin123" -ForegroundColor White
Write-Host "  📊 Head of Merchandiser: sarah.chen@horizonsourcing.com / hom123" -ForegroundColor White
Write-Host "  🏭 Head of Production: mike.rodriguez@horizonsourcing.com / hop123" -ForegroundColor White
Write-Host "  🎨 HOD Prepress: alex.kumar@horizonsourcing.com / hod123" -ForegroundColor White
Write-Host "  🖌️  Designer: emma.wilson@horizonsourcing.com / designer123" -ForegroundColor White
Write-Host "  📋 Merchandiser: tom.anderson@horizonsourcing.com / merch123" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Start the enhanced system
Write-Host "Starting backend server (with Socket.io) and frontend..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "Health Check: http://localhost:5000/health" -ForegroundColor White
Write-Host ""

# Use concurrently to start both servers
npm run dev:full

Write-Host ""
Write-Host "🎊 Enhanced ERP Merchandiser System is now running!" -ForegroundColor Green
Write-Host "Access your system at: http://localhost:8080" -ForegroundColor Cyan
