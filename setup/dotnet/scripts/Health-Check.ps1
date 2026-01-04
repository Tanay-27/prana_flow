#Requires -Version 5.1

<#
.SYNOPSIS
    Performs health checks on Healing Rays deployment
.DESCRIPTION
    Tests backend API, database connection, frontend accessibility, and service status
#>

$ErrorActionPreference = "Stop"

Write-Host "=== Healing Rays Health Check ===" -ForegroundColor Green

$BackendUrl = "http://localhost:5001"
$FrontendUrl = "http://localhost"
$HealthCheckResults = @()

function Test-BackendAPI {
    Write-Host "Testing Backend API..." -ForegroundColor Yellow

    try {
        $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            $HealthCheckResults += "✅ Backend API: Responding (Status: $($response.StatusCode))"
            Write-Host "✅ Backend API responding" -ForegroundColor Green
            return $true
        } else {
            $HealthCheckResults += "❌ Backend API: Unexpected status $($response.StatusCode)"
            Write-Host "❌ Backend API unexpected status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        $HealthCheckResults += "❌ Backend API: Not responding - $($_.Exception.Message)"
        Write-Host "❌ Backend API not responding: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-Frontend {
    Write-Host "Testing Frontend..." -ForegroundColor Yellow

    try {
        $response = Invoke-WebRequest -Uri $FrontendUrl -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            $HealthCheckResults += "✅ Frontend: Responding (Status: $($response.StatusCode))"
            Write-Host "✅ Frontend responding" -ForegroundColor Green
            return $true
        } else {
            $HealthCheckResults += "❌ Frontend: Unexpected status $($response.StatusCode)"
            Write-Host "❌ Frontend unexpected status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        $HealthCheckResults += "❌ Frontend: Not responding - $($_.Exception.Message)"
        Write-Host "❌ Frontend not responding: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-DatabaseConnection {
    Write-Host "Testing Database Connection..." -ForegroundColor Yellow

    try {
        $connectionString = "Server=(localdb)\MSSQLLocalDB;Database=HealingRaysDb;Trusted_Connection=True;"
        $connection = New-Object System.Data.SqlClient.SqlConnection
        $connection.ConnectionString = $connectionString
        $connection.Open()
        $connection.Close()

        $HealthCheckResults += "✅ Database: Connection successful"
        Write-Host "✅ Database connection successful" -ForegroundColor Green
        return $true
    } catch {
        $HealthCheckResults += "❌ Database: Connection failed - $($_.Exception.Message)"
        Write-Host "❌ Database connection failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-WindowsServices {
    Write-Host "Testing Windows Services..." -ForegroundColor Yellow

    $services = @("HealingRaysBackend")
    $allServicesRunning = $true

    foreach ($service in $services) {
        try {
            $svc = Get-Service -Name $service -ErrorAction Stop
            if ($svc.Status -eq "Running") {
                $HealthCheckResults += "✅ Service $service: Running"
                Write-Host "✅ Service $service is running" -ForegroundColor Green
            } else {
                $HealthCheckResults += "❌ Service $service: $($svc.Status)"
                Write-Host "❌ Service $service is $($svc.Status)" -ForegroundColor Red
                $allServicesRunning = $false
            }
        } catch {
            $HealthCheckResults += "❌ Service $service: Not found"
            Write-Host "❌ Service $service not found" -ForegroundColor Red
            $allServicesRunning = $false
        }
    }

    return $allServicesRunning
}

function Test-Nginx {
    Write-Host "Testing Nginx..." -ForegroundColor Yellow

    try {
        $nginxProcess = Get-Process -Name "nginx" -ErrorAction Stop
        $HealthCheckResults += "✅ Nginx: Running (PID: $($nginxProcess.Id))"
        Write-Host "✅ Nginx is running" -ForegroundColor Green
        return $true
    } catch {
        $HealthCheckResults += "❌ Nginx: Not running"
        Write-Host "❌ Nginx is not running" -ForegroundColor Red
        return $false
    }
}

function Show-Results {
    Write-Host "`n=== Health Check Results ===" -ForegroundColor Cyan
    Write-Host "".PadRight(50, "=") -ForegroundColor Cyan

    foreach ($result in $HealthCheckResults) {
        Write-Host $result
    }

    Write-Host "".PadRight(50, "=") -ForegroundColor Cyan

    # Count successes and failures
    $successCount = ($HealthCheckResults | Where-Object { $_ -like "✅*" }).Count
    $failureCount = ($HealthCheckResults | Where-Object { $_ -like "❌*" }).Count
    $totalCount = $HealthCheckResults.Count

    Write-Host "Summary: $successCount/$totalCount checks passed" -ForegroundColor $(if ($failureCount -eq 0) { "Green" } else { "Red" })

    if ($failureCount -eq 0) {
        Write-Host "`n🎉 All health checks passed! Healing Rays is running successfully." -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Some health checks failed. Please review the results above." -ForegroundColor Red
        Write-Host "Common troubleshooting steps:" -ForegroundColor Yellow
        Write-Host "- Check service status: Get-Service HealingRaysBackend" -ForegroundColor White
        Write-Host "- Check logs: C:\healingrays\services\logs\" -ForegroundColor White
        Write-Host "- Verify database: sqlcmd -S '(localdb)\MSSQLLocalDB' -Q 'SELECT 1'" -ForegroundColor White
        Write-Host "- Restart services if needed" -ForegroundColor White
    }
}

# Main health check process
try {
    $backendOK = Test-BackendAPI
    $frontendOK = Test-Frontend
    $databaseOK = Test-DatabaseConnection
    $servicesOK = Test-WindowsServices
    $nginxOK = Test-Nginx

    Show-Results

} catch {
    Write-Host "Error during health check: $($_.Exception.Message)" -ForegroundColor Red
    throw
}
