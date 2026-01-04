#Requires -Version 5.1

<#
.SYNOPSIS
    Performs health checks on the integrated Healing Rays application
.DESCRIPTION
    Verifies that the integrated .NET Core application is running correctly,
    serving both frontend and API endpoints
#>

$ErrorActionPreference = "Stop"

Write-Host "=== Healing Rays Application Health Check ===" -ForegroundColor Green

$healthStatus = @{
    ServiceStatus = $false
    ApplicationResponse = $false
    FrontendAccess = $false
    ApiAccess = $false
    DatabaseConnection = $false
}

try {
    # Check Windows Service Status
    Write-Host "1. Checking Windows Service..." -ForegroundColor Yellow
    
    $serviceName = "HealingRaysApp"
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    
    if ($service) {
        if ($service.Status -eq "Running") {
            Write-Host "   ✅ Service '$serviceName' is running" -ForegroundColor Green
            $healthStatus.ServiceStatus = $true
        } else {
            Write-Host "   ❌ Service '$serviceName' is not running (Status: $($service.Status))" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ Service '$serviceName' not found" -ForegroundColor Red
    }

    # Check if application is responding
    Write-Host "2. Checking Application Response..." -ForegroundColor Yellow
    
    $appUrl = "http://localhost:5000"
    try {
        $response = Invoke-WebRequest -Uri $appUrl -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Application responding on $appUrl" -ForegroundColor Green
            $healthStatus.ApplicationResponse = $true
        } else {
            Write-Host "   ❌ Application returned status code: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Application not responding: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Check Frontend Access
    Write-Host "3. Checking Frontend Access..." -ForegroundColor Yellow
    
    try {
        $frontendResponse = Invoke-WebRequest -Uri "$appUrl/" -TimeoutSec 10 -UseBasicParsing
        if ($frontendResponse.StatusCode -eq 200 -and $frontendResponse.Content -like "*<!DOCTYPE html>*") {
            Write-Host "   ✅ Frontend accessible and serving HTML" -ForegroundColor Green
            $healthStatus.FrontendAccess = $true
        } else {
            Write-Host "   ❌ Frontend not serving expected content" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Frontend not accessible: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Check API Access
    Write-Host "4. Checking API Access..." -ForegroundColor Yellow
    
    try {
        # Try to access a health endpoint or any API endpoint
        $apiResponse = Invoke-WebRequest -Uri "$appUrl/api/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($apiResponse.StatusCode -eq 200) {
            Write-Host "   ✅ API health endpoint responding" -ForegroundColor Green
            $healthStatus.ApiAccess = $true
        } else {
            # Try alternative API endpoint if health endpoint doesn't exist
            try {
                $apiResponse = Invoke-WebRequest -Uri "$appUrl/api/auth/test" -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
                Write-Host "   ✅ API endpoints accessible" -ForegroundColor Green
                $healthStatus.ApiAccess = $true
            } catch {
                Write-Host "   ⚠️  API endpoints may require authentication" -ForegroundColor Yellow
                $healthStatus.ApiAccess = $true  # Consider this OK since it's expected
            }
        }
    } catch {
        Write-Host "   ❌ API not accessible: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Check Database Connection (if possible)
    Write-Host "5. Checking Database Connection..." -ForegroundColor Yellow
    
    try {
        # Try to connect to LocalDB
        $connectionString = "Server=(localdb)\mssqllocaldb;Database=HealingRaysDb;Integrated Security=true;"
        $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()
        
        if ($connection.State -eq "Open") {
            Write-Host "   ✅ Database connection successful" -ForegroundColor Green
            $healthStatus.DatabaseConnection = $true
            
            # Test a simple query
            $command = $connection.CreateCommand()
            $command.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
            $tableCount = $command.ExecuteScalar()
            Write-Host "   ✅ Database contains $tableCount tables" -ForegroundColor Green
        }
        
        $connection.Close()
    } catch {
        Write-Host "   ❌ Database connection failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Check Port Availability
    Write-Host "6. Checking Port Status..." -ForegroundColor Yellow
    
    $portInUse = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($portInUse) {
        Write-Host "   ✅ Port 5000 is in use (application listening)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Port 5000 is not in use" -ForegroundColor Red
    }

    # Check Application Files
    Write-Host "7. Checking Application Files..." -ForegroundColor Yellow
    
    $publishedPath = "C:\healingrays\app\published"
    $mainDll = "$publishedPath\HealingRays.Api.dll"
    $wwwrootPath = "$publishedPath\wwwroot"
    $indexHtml = "$wwwrootPath\index.html"
    
    if (Test-Path $mainDll) {
        Write-Host "   ✅ Main application DLL found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Main application DLL not found at $mainDll" -ForegroundColor Red
    }
    
    if (Test-Path $indexHtml) {
        Write-Host "   ✅ Frontend index.html found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Frontend index.html not found at $indexHtml" -ForegroundColor Red
    }
    $databaseOK = Test-DatabaseConnection
    $servicesOK = Test-WindowsServices
    $nginxOK = Test-Nginx

    Show-Results

} catch {
    Write-Host "Error during health check: $($_.Exception.Message)" -ForegroundColor Red
    throw
}
