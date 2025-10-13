# Windows Firewall Configuration for ERP Merchandiser System
# Run this script as Administrator

Write-Host "🔒 Configuring Windows Firewall for ERP Merchandiser System" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click on PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Function to add firewall rule
function Add-FirewallRuleIfNotExists {
    param(
        [string]$Name,
        [string]$DisplayName,
        [string]$Protocol,
        [string]$LocalPort,
        [string]$Direction,
        [string]$Action
    )
    
    $existingRule = Get-NetFirewallRule -DisplayName $DisplayName -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Host "   ℹ️  Rule '$DisplayName' already exists, removing old rule..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName $DisplayName -ErrorAction SilentlyContinue
    }
    
    try {
        New-NetFirewallRule -DisplayName $DisplayName `
                           -Direction $Direction `
                           -Action $Action `
                           -Protocol $Protocol `
                           -LocalPort $LocalPort `
                           -Profile Any | Out-Null
        Write-Host "   ✅ Added rule: $DisplayName" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "   ❌ Failed to add rule: $DisplayName" -ForegroundColor Red
        Write-Host "      Error: $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "📋 Adding Firewall Rules..." -ForegroundColor Cyan
Write-Host ""

$success = $true

# Add rule for Node.js
Write-Host "1️⃣  Node.js Application Rules:" -ForegroundColor Yellow
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if ($nodePath) {
    Write-Host "   Node.js found at: $nodePath" -ForegroundColor Gray
    
    # Remove old rules
    Get-NetFirewallRule -DisplayName "Node.js*" -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue
    
    # Add new rules for Node.js executable
    try {
        New-NetFirewallRule -DisplayName "Node.js - Inbound" `
                           -Direction Inbound `
                           -Program $nodePath `
                           -Action Allow `
                           -Profile Any | Out-Null
        Write-Host "   ✅ Node.js inbound traffic allowed" -ForegroundColor Green
        
        New-NetFirewallRule -DisplayName "Node.js - Outbound" `
                           -Direction Outbound `
                           -Program $nodePath `
                           -Action Allow `
                           -Profile Any | Out-Null
        Write-Host "   ✅ Node.js outbound traffic allowed" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed to add Node.js rules" -ForegroundColor Red
        $success = $false
    }
} else {
    Write-Host "   ⚠️  Node.js not found in PATH" -ForegroundColor Yellow
    $success = $false
}
Write-Host ""

# Add rules for Backend Port (5001)
Write-Host "2️⃣  Backend Server Port (5001):" -ForegroundColor Yellow
if (Add-FirewallRuleIfNotExists -DisplayName "ERP Backend - Port 5001 (TCP-In)" `
                                 -Protocol TCP `
                                 -LocalPort 5001 `
                                 -Direction Inbound `
                                 -Action Allow) {
    # Success
} else {
    $success = $false
}

if (Add-FirewallRuleIfNotExists -DisplayName "ERP Backend - Port 5001 (TCP-Out)" `
                                 -Protocol TCP `
                                 -LocalPort 5001 `
                                 -Direction Outbound `
                                 -Action Allow) {
    # Success
} else {
    $success = $false
}
Write-Host ""

# Add rules for Frontend Port (8080)
Write-Host "3️⃣  Frontend Server Port (8080):" -ForegroundColor Yellow
if (Add-FirewallRuleIfNotExists -DisplayName "ERP Frontend - Port 8080 (TCP-In)" `
                                 -Protocol TCP `
                                 -LocalPort 8080 `
                                 -Direction Inbound `
                                 -Action Allow) {
    # Success
} else {
    $success = $false
}

if (Add-FirewallRuleIfNotExists -DisplayName "ERP Frontend - Port 8080 (TCP-Out)" `
                                 -Protocol TCP `
                                 -LocalPort 8080 `
                                 -Direction Outbound `
                                 -Action Allow) {
    # Success
} else {
    $success = $false
}
Write-Host ""

# Add rules for PostgreSQL Port (5432) - in case database is accessed remotely
Write-Host "4️⃣  PostgreSQL Database Port (5432):" -ForegroundColor Yellow
if (Add-FirewallRuleIfNotExists -DisplayName "PostgreSQL - Port 5432 (TCP-In)" `
                                 -Protocol TCP `
                                 -LocalPort 5432 `
                                 -Direction Inbound `
                                 -Action Allow) {
    # Success
} else {
    $success = $false
}
Write-Host ""

# Display summary
Write-Host "========================================" -ForegroundColor Cyan
if ($success) {
    Write-Host "✅ FIREWALL CONFIGURATION COMPLETE!" -ForegroundColor Green
} else {
    Write-Host "⚠️  FIREWALL CONFIGURATION COMPLETED WITH WARNINGS" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# List all ERP-related firewall rules
Write-Host "📋 Active Firewall Rules for ERP System:" -ForegroundColor Cyan
Write-Host ""
Get-NetFirewallRule -DisplayName "*ERP*" -ErrorAction SilentlyContinue | 
    Format-Table DisplayName, Direction, Action, Enabled -AutoSize
Get-NetFirewallRule -DisplayName "Node.js*" -ErrorAction SilentlyContinue | 
    Format-Table DisplayName, Direction, Action, Enabled -AutoSize
Get-NetFirewallRule -DisplayName "PostgreSQL*" -ErrorAction SilentlyContinue | 
    Format-Table DisplayName, Direction, Action, Enabled -AutoSize
Write-Host ""

Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Close all PowerShell windows" -ForegroundColor White
Write-Host "   2. Run: " -ForegroundColor White -NoNewline
Write-Host ".\start-network-lan.ps1" -ForegroundColor Cyan
Write-Host "   3. Access the system from any device on your network" -ForegroundColor White
Write-Host ""
Write-Host "🔍 To verify firewall rules:" -ForegroundColor Yellow
Write-Host "   Get-NetFirewallRule -DisplayName '*ERP*' | Format-List" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
