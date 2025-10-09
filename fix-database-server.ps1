# Fix Database Issues on Server
# Run this if products table has missing columns

Write-Host "🔧 Fixing Database Schema..." -ForegroundColor Blue
Write-Host ""

cd C:\erp-merchandiser-system

# Option 1: Quick Fix (Add missing column only)
Write-Host "Option 1: Quick Fix (adds missing column)" -ForegroundColor Yellow
Write-Host "Option 2: Complete Reset (fresh database with all data)" -ForegroundColor Yellow
Write-Host ""
$choice = Read-Host "Enter 1 or 2"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "🔧 Adding missing material_id column..." -ForegroundColor Blue
    
    # Run SQL fix
    Get-Content fix-products-table.sql | docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser
    
    Write-Host "✅ Column added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Restarting backend..." -ForegroundColor Blue
    docker-compose -f docker-compose.complete.yml restart backend
    
    Start-Sleep -Seconds 5
    Write-Host "✅ Backend restarted" -ForegroundColor Green
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "⚠️  This will delete ALL existing data!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -eq "yes") {
        Write-Host ""
        Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
        docker-compose -f docker-compose.complete.yml down -v
        
        Write-Host "🗑️  Cleaning volumes..." -ForegroundColor Yellow
        docker volume prune -f
        
        Write-Host "🔨 Building fresh setup..." -ForegroundColor Blue
        docker-compose -f docker-compose.complete.yml build --no-cache
        
        Write-Host "🚀 Starting containers..." -ForegroundColor Blue
        docker-compose -f docker-compose.complete.yml up -d
        
        Write-Host "⏳ Waiting for database initialization (60 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 60
        
        Write-Host "✅ Fresh database setup complete!" -ForegroundColor Green
    } else {
        Write-Host "❌ Operation cancelled" -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Blue
docker-compose -f docker-compose.complete.yml ps

Write-Host ""
Write-Host "🔍 Verifying products table..." -ForegroundColor Blue
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d erp_merchandiser -c "\d products"

Write-Host ""
Write-Host "✅ Fix completed!" -ForegroundColor Green
Write-Host "🌐 Try creating product again at: http://192.168.2.124:8080" -ForegroundColor Yellow
Write-Host ""

