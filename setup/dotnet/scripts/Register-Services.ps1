#Requires -Version 5.1
#Requires -RunAsAdministrator

<#
.SYNOPSIS
    Registers Healing Rays services with NSSM
.DESCRIPTION
    Sets up Windows services for backend and other components
#>

$ErrorActionPreference = "Stop"

Write-Host "=== Registering Healing Rays Services ===" -ForegroundColor Green

$ServiceName = "HealingRaysBackend"
$ServiceDirectory = "C:\healingrays\services\backend"

try {
    # Check if NSSM is available
    if (!(Get-Command nssm -ErrorAction SilentlyContinue)) {
        throw "NSSM not found. Please run Install-Prerequisites.ps1 first."
    }

    # Check if service directory exists
    if (!(Test-Path $ServiceDirectory)) {
        throw "Service directory not found. Please run Deploy-Backend.ps1 first."
    }

    # Check if service already exists
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "Service '$ServiceName' already exists. Removing and re-creating..." -ForegroundColor Yellow
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        & nssm remove $ServiceName confirm
    }

    # Register the service
    Write-Host "Registering backend service..." -ForegroundColor Yellow
    & nssm install $ServiceName "C:\Program Files\dotnet\dotnet.exe" "HealingRays.Api.dll --environment Production"
    & nssm set $ServiceName AppDirectory $ServiceDirectory
    & nssm set $ServiceName AppStdout "C:\healingrays\services\logs\backend.out.log"
    & nssm set $ServiceName AppStderr "C:\healingrays\services\logs\backend.err.log"
    & nssm set $ServiceName Description "Healing Rays ASP.NET Core API Service"
    & nssm set $ServiceName Start SERVICE_AUTO_START

    # Set service account
    $serviceAccount = ".\healingrays-svc"
    & nssm set $ServiceName ObjectName $serviceAccount

    # Configure service recovery
    & nssm set $ServiceName AppRestartDelay 5000

    Write-Host "=== Services registered successfully! ===" -ForegroundColor Green
    Write-Host "Service: $ServiceName" -ForegroundColor Yellow
    Write-Host "To start the service: Start-Service $ServiceName" -ForegroundColor White
    Write-Host "To check status: Get-Service $ServiceName" -ForegroundColor White

} catch {
    Write-Host "Error during service registration: $($_.Exception.Message)" -ForegroundColor Red
    throw
}
