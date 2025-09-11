# Start Backend with PostgreSQL
$env:PG_HOST = "localhost"
$env:JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production"
$env:PORT = 3002
$env:NODE_ENV = "development"
Write-Host "Starting backend with PostgreSQL..."
node server/index.js
