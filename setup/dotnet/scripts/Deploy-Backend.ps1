#Requires -Version 5.1
#Requires -RunAsAdministrator

<#
.SYNOPSIS
    Deploys the Healing Rays backend as a Windows service
.DESCRIPTION
    Registers the .NET Core application as a Windows service using NSSM
#>

$ErrorActionPreference = "Stop"

Write-Host "=== Deploying Healing Rays Backend Service ===" -ForegroundColor Green

$ServiceName = "HealingRaysBackend"
$ServiceDirectory = "C:\healingrays\services\backend"
$PublishPath = "C:\healingrays\app\published"
$LogDirectory = "C:\healingrays\services\logs"

try {
    # Stop and remove existing service if it exists
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "Stopping existing service..." -ForegroundColor Yellow
        Stop-Service -Name $ServiceName -Force
        & nssm remove $ServiceName confirm
    }

    # Create service directory
    New-Item -ItemType Directory -Force -Path $ServiceDirectory | Out-Null
    New-Item -ItemType Directory -Force -Path $LogDirectory | Out-Null

    # Copy published files to service directory
    Write-Host "Copying published files to service directory..." -ForegroundColor Yellow
    Copy-Item "$PublishPath\*" -Destination $ServiceDirectory -Recurse -Force

    # Copy production appsettings
    $productionSettings = "C:\healingrays\app\HealingRays.Api\HealingRays.Api\appsettings.Production.json"
    if (Test-Path $productionSettings) {
        Copy-Item $productionSettings -Destination "$ServiceDirectory\appsettings.Production.json" -Force
    }

    # Register service with NSSM
    Write-Host "Registering Windows service..." -ForegroundColor Yellow

    & nssm install $ServiceName "C:\Program Files\dotnet\dotnet.exe" "HealingRays.Api.dll --environment Production"
    & nssm set $ServiceName AppDirectory $ServiceDirectory
    & nssm set $ServiceName AppStdout "$LogDirectory\backend.out.log"
    & nssm set $ServiceName AppStderr "$LogDirectory\backend.err.log"
    & nssm set $ServiceName Description "Healing Rays ASP.NET Core API Service"
    & nssm set $ServiceName Start SERVICE_AUTO_START

    # Set service account (requires service account to be created first)
    $serviceAccount = ".\healingrays-svc"
    & nssm set $ServiceName ObjectName $serviceAccount

    # Configure service recovery
    & nssm set $ServiceName AppRestartDelay 5000

    # Start the service
    Write-Host "Starting service..." -ForegroundColor Yellow
    Start-Service -Name $ServiceName

    # Wait a moment and check status
    Start-Sleep -Seconds 5
    $service = Get-Service -Name $ServiceName

    if ($service.Status -eq "Running") {
        Write-Host "=== Backend service deployed and started successfully! ===" -ForegroundColor Green
        Write-Host "Service Name: $ServiceName" -ForegroundColor Yellow
        Write-Host "Service Directory: $ServiceDirectory" -ForegroundColor Yellow
        Write-Host "Logs: $LogDirectory" -ForegroundColor Yellow
        Write-Host "" -ForegroundColor White
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Run Deploy-Frontend.ps1 to build and deploy the frontend" -ForegroundColor White
        Write-Host "2. Run Health-Check.ps1 to verify the deployment" -ForegroundColor White
    } else {
        Write-Host "Service failed to start. Check logs at $LogDirectory" -ForegroundColor Red
        throw "Service startup failed"
    }

} catch {
    Write-Host "Error during backend deployment: $($_.Exception.Message)" -ForegroundColor Red
    throw
}
