# ERP Merchandiser System - PowerShell Startup Script
# This script starts all services and keeps them running continuously

param(
    [switch]$Verbose,
    [switch]$KeepOpen
)

Write-Host "🚀 Starting ERP Merchandiser System..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    try {
        $null = New-Object Net.Sockets.TcpClient("localhost", $Port)
        return $true
    }
    catch {
        return $false
    }
}

# Function to wait for service to be ready
function Wait-ForService {
    param(
        [string]$ServiceName,
        [int]$Port,
        [int]$TimeoutSeconds = 60
    )

    Write-Host "⏳ Waiting for $ServiceName on port $Port..." -ForegroundColor Yellow
    $elapsed = 0

    while (-not (Test-Port -Port $Port) -and $elapsed -lt $TimeoutSeconds) {
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }

    if (Test-Port -Port $Port) {
        Write-Host "`n✅ $ServiceName is ready on port $Port!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "`n❌ $ServiceName failed to start on port $Port" -ForegroundColor Red
        return $false
    }
}

try {
    # Step 1: Start Docker services
    Write-Host "`n🐳 Starting Docker services..." -ForegroundColor Blue
    $dockerResult = docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start Docker services"
    }

    # Step 2: Wait for PostgreSQL
    if (-not (Wait-ForService -ServiceName "PostgreSQL" -Port 5432)) {
        throw "PostgreSQL failed to start"
    }

    # Step 3: Wait for Redis
    if (-not (Wait-ForService -ServiceName "Redis" -Port 6379)) {
        throw "Redis failed to start"
    }

    # Step 4: Start Prisma Studio in background
    Write-Host "`n📊 Starting Prisma Studio..." -ForegroundColor Blue
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npx prisma studio --port 5555" -WindowStyle Hidden

    # Wait for Prisma Studio
    if (-not (Wait-ForService -ServiceName "Prisma Studio" -Port 5555)) {
        Write-Host "⚠️  Prisma Studio might take longer to start" -ForegroundColor Yellow
    }

    # Step 5: Start Backend and Frontend
    Write-Host "`n🖥️  Starting Backend and Frontend servers..." -ForegroundColor Blue

    # Start the main application
    $process = Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run start:quick" -PassThru -WindowStyle Normal

    # Wait for Backend
    if (-not (Wait-ForService -ServiceName "Backend API" -Port 5001)) {
        throw "Backend API failed to start"
    }

    # Wait for Frontend (try multiple ports as Vite auto-increments)
    $frontendStarted = $false
    foreach ($port in @(8080, 8081, 8082, 8083)) {
        Start-Sleep -Seconds 5
        if (Test-Port -Port $port) {
            Write-Host "✅ Frontend is ready on port $port!" -ForegroundColor Green
            $frontendPort = $port
            $frontendStarted = $true
            break
        }
    }

    if (-not $frontendStarted) {
        Write-Host "⚠️  Frontend might still be starting..." -ForegroundColor Yellow
    }

    # Step 6: Display access information
    Write-Host "`n🎉 ERP Merchandiser System is now running!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 APPLICATION ACCESS:" -ForegroundColor Yellow
    Write-Host "   Frontend:      http://localhost:$($frontendPort ?? '8080-8083')" -ForegroundColor White
    Write-Host "   Backend API:   http://localhost:5001" -ForegroundColor White
    Write-Host "   Health Check:  http://localhost:5001/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🗄️  DATABASE ACCESS:" -ForegroundColor Yellow
    Write-Host "   Prisma Studio: http://localhost:5555" -ForegroundColor White
    Write-Host "   PGAdmin:       http://localhost:5050" -ForegroundColor White
    Write-Host "   PostgreSQL:    localhost:5432" -ForegroundColor White
    Write-Host "   Redis:         localhost:6379" -ForegroundColor White
    Write-Host ""
    Write-Host "🔐 DATABASE CREDENTIALS:" -ForegroundColor Yellow
    Write-Host "   Database:      erp_merchandiser" -ForegroundColor White
    Write-Host "   Username:      erp_user" -ForegroundColor White
    Write-Host "   Password:      DevPassword123!" -ForegroundColor White
    Write-Host ""
    Write-Host "👤 APPLICATION USERS:" -ForegroundColor Yellow
    Write-Host "   Admin:         admin@erp.local / admin123" -ForegroundColor White
    Write-Host "   Manager:       manager@erp.local / admin123" -ForegroundColor White
    Write-Host "   Production:    productionhead@erp.local / admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 DATA SUMMARY:" -ForegroundColor Yellow
    Write-Host "   Products:      112 (across all categories)" -ForegroundColor White
    Write-Host "   Materials:     31 (Art Paper, CS1, CS2, etc.)" -ForegroundColor White
    Write-Host "   Companies:     5 (Nike, Adidas, Puma, etc.)" -ForegroundColor White
    Write-Host "   Process Steps: 98 (complete workflows)" -ForegroundColor White
    Write-Host "   Job Cards:     5 (sample jobs ready)" -ForegroundColor White
    Write-Host ""

    if ($KeepOpen) {
        Write-Host "💡 RUNNING CONTINUOUSLY..." -ForegroundColor Green
        Write-Host "   Press Ctrl+C to stop all services" -ForegroundColor Yellow
        Write-Host "   Or close this window to keep services running in background" -ForegroundColor Yellow
        Write-Host ""

        # Keep the script running
        try {
            while ($true) {
                Start-Sleep -Seconds 30

                # Check if main services are still running
                $services = @(
                    @{Name="PostgreSQL"; Port=5432},
                    @{Name="Redis"; Port=6379},
                    @{Name="Backend"; Port=5001}
                )

                foreach ($service in $services) {
                    if (-not (Test-Port -Port $service.Port)) {
                        Write-Host "⚠️  $($service.Name) appears to be down!" -ForegroundColor Red
                    }
                }

                Write-Host "." -NoNewline -ForegroundColor Green
            }
        }
        catch [System.Management.Automation.PipelineStoppedException] {
            Write-Host "`n`n🛑 Shutting down services..." -ForegroundColor Red
        }
    } else {
        Write-Host "💡 Services are running in background!" -ForegroundColor Green
        Write-Host "   Use 'docker-compose down' to stop Docker services" -ForegroundColor Yellow
        Write-Host "   Use Task Manager to stop Node.js processes if needed" -ForegroundColor Yellow
    }

} catch {
    Write-Host "`n❌ Error starting ERP system: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "   1. Ensure Docker Desktop is running" -ForegroundColor White
    Write-Host "   2. Check if ports 5001, 5432, 6379, 5555, 5050, 8080+ are available" -ForegroundColor White
    Write-Host "   3. Verify npm dependencies are installed" -ForegroundColor White
    Write-Host "   4. Check Docker containers: docker ps" -ForegroundColor White
    exit 1
}

Write-Host "`n🎯 ERP System startup complete!" -ForegroundColor Green