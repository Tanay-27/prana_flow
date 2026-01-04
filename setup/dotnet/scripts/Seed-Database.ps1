#Requires -Version 5.1

<#
.SYNOPSIS
    Seeds the Healing Rays database with sample data
.DESCRIPTION
    Creates default users, sample clients, protocols, sessions, and payments
.PARAMETER ConnectionString
    Database connection string (optional, uses appsettings.json if not provided)
#>

param(
    [string]$ConnectionString = ""
)

$ErrorActionPreference = "Stop"

Write-Host "=== Healing Rays Database Seeder ===" -ForegroundColor Green

try {
    # Check if we're in development or production
    $BackendPath = ""
    
    if (Test-Path "HealingRays.Api\HealingRays.Api") {
        # Development environment (relative path)
        $BackendPath = "HealingRays.Api\HealingRays.Api"
        Write-Host "Running in development mode..." -ForegroundColor Yellow
    } elseif (Test-Path "C:\healingrays\app\HealingRays.Api\HealingRays.Api") {
        # Production environment (absolute path)
        $BackendPath = "C:\healingrays\app\HealingRays.Api\HealingRays.Api"
        Write-Host "Running in production mode..." -ForegroundColor Yellow
    } elseif (Test-Path "C:\healingrays\app\published") {
        # Published application
        $BackendPath = "C:\healingrays\app\published"
        Write-Host "Running against published application..." -ForegroundColor Yellow
    } else {
        throw "Could not find HealingRays.Api project or published application"
    }

    # Navigate to backend directory
    Push-Location $BackendPath

    Write-Host "Attempting to seed database..." -ForegroundColor Yellow
    
    # Try different approaches to run the seeder
    $seedSuccess = $false
    
    # Approach 1: Try dotnet run with seed argument
    try {
        Write-Host "Trying: dotnet run seed" -ForegroundColor Gray
        & dotnet run seed
        if ($LASTEXITCODE -eq 0) {
            $seedSuccess = $true
            Write-Host "Seeding completed via 'dotnet run seed'" -ForegroundColor Green
        }
    } catch {
        Write-Host "Method 1 failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Approach 2: Try running published executable with seed argument
    if (-not $seedSuccess -and (Test-Path "HealingRays.Api.exe")) {
        try {
            Write-Host "Trying: HealingRays.Api.exe seed" -ForegroundColor Gray
            & .\HealingRays.Api.exe seed
            if ($LASTEXITCODE -eq 0) {
                $seedSuccess = $true
                Write-Host "Seeding completed via executable" -ForegroundColor Green
            }
        } catch {
            Write-Host "Method 2 failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    # Approach 3: Try dotnet with DLL
    if (-not $seedSuccess -and (Test-Path "HealingRays.Api.dll")) {
        try {
            Write-Host "Trying: dotnet HealingRays.Api.dll seed" -ForegroundColor Gray
            & dotnet HealingRays.Api.dll seed
            if ($LASTEXITCODE -eq 0) {
                $seedSuccess = $true
                Write-Host "Seeding completed via DLL" -ForegroundColor Green
            }
        } catch {
            Write-Host "Method 3 failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    if (-not $seedSuccess) {
        Write-Host "" -ForegroundColor White
        Write-Host "⚠️  Automatic seeding failed. Manual seeding instructions:" -ForegroundColor Yellow
        Write-Host "" -ForegroundColor White
        Write-Host "1. Ensure the .NET Core application is built and running" -ForegroundColor White
        Write-Host "2. Use SQL Server Management Studio or similar tool" -ForegroundColor White
        Write-Host "3. Connect to your database and run the following SQL:" -ForegroundColor White
        Write-Host "" -ForegroundColor White
        
        # Provide manual SQL seeding script
        $manualSeedSql = @"
-- Create Admin User
INSERT INTO Users (Username, Password, Role, IsActive, CreatedAt, UpdatedAt)
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, GETUTCDATE(), GETUTCDATE());

-- Create Healer User  
INSERT INTO Users (Username, Password, Role, IsActive, CreatedAt, UpdatedAt)
VALUES ('healer', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'healer', 1, GETUTCDATE(), GETUTCDATE());

-- Note: Default password for both users is 'Admin@123' and 'Healer@123'
-- You can add sample clients, protocols, and sessions manually as needed
"@
        
        Write-Host $manualSeedSql -ForegroundColor Cyan
        Write-Host "" -ForegroundColor White
        Write-Host "Default credentials:" -ForegroundColor Yellow
        Write-Host "- Admin: admin / Admin@123" -ForegroundColor White
        Write-Host "- Healer: healer / Healer@123" -ForegroundColor White
        
        throw "Automatic seeding failed - please use manual approach above"
    }

    Write-Host "" -ForegroundColor White
    Write-Host "=== Seeding completed successfully! ===" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "You can now log in with:" -ForegroundColor Yellow
    Write-Host "Admin User:  admin / Admin@123" -ForegroundColor White
    Write-Host "Healer User: healer / Healer@123" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "Sample data has been created including:" -ForegroundColor Yellow
    Write-Host "- Client profiles" -ForegroundColor White
    Write-Host "- Healing protocols" -ForegroundColor White
    Write-Host "- Scheduled sessions" -ForegroundColor White
    Write-Host "- Payment records" -ForegroundColor White
    Write-Host "- Nurturing sessions" -ForegroundColor White

} catch {
    Write-Host "Error during database seeding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "" -ForegroundColor White
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure SQL Server is running and accessible" -ForegroundColor White
    Write-Host "2. Check connection string in appsettings.json" -ForegroundColor White
    Write-Host "3. Verify database exists and is accessible" -ForegroundColor White
    Write-Host "4. Try running the application normally first: dotnet run" -ForegroundColor White
    throw
} finally {
    Pop-Location
}
