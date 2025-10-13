# Check All Existing Users in Database

Write-Host "🔍 Checking all existing users in database..." -ForegroundColor Blue
Write-Host ""

cd C:\erp-merchandiser-system

# Get all users from database
docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser -c "
SELECT 
    id,
    \"firstName\" || ' ' || \"lastName\" AS \"Full Name\",
    email,
    role,
    department,
    \"isActive\" AS active,
    \"lastLogin\" AS \"Last Login\"
FROM users
ORDER BY id;
"

Write-Host ""
Write-Host "Total Users:" -ForegroundColor Yellow
docker-compose -f docker-compose.complete.yml exec -T postgres psql -U postgres -d erp_merchandiser -t -c "SELECT COUNT(*) FROM users;"



