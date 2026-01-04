#Requires -Version 5.1

<#
.SYNOPSIS
    Deploys the integrated Healing Rays application (Frontend + Backend in one)
.DESCRIPTION
    Builds frontend locally, copies to .NET Core wwwroot, and deploys as single application
#>

$ErrorActionPreference = "Stop"

Write-Host "=== Deploying Integrated Healing Rays Application ===" -ForegroundColor Green

$FrontendPath = "C:\healingrays\app\frontend"
$BackendPath = "C:\healingrays\app\HealingRays.Api\HealingRays.Api"
$WwwRootPath = "$BackendPath\wwwroot"
$PublishPath = "C:\healingrays\app\published"

try {
    # Step 1: Build Frontend
    Write-Host "Building React frontend..." -ForegroundColor Yellow
    Push-Location $FrontendPath
    
    # Install dependencies
    & npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    
    # Set API URL to same origin (no separate backend URL needed)
    $env:VITE_API_URL = ""
    
    # Build frontend
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
    
    Pop-Location

    # Step 2: Copy frontend build to .NET Core wwwroot
    Write-Host "Copying frontend build to .NET Core wwwroot..." -ForegroundColor Yellow
    
    if (Test-Path $WwwRootPath) {
        Remove-Item "$WwwRootPath\*" -Recurse -Force
    } else {
        New-Item -ItemType Directory -Force -Path $WwwRootPath | Out-Null
    }
    
    Copy-Item "$FrontendPath\dist\*" -Destination $WwwRootPath -Recurse -Force

    # Step 3: Build and publish .NET Core application
    Write-Host "Building and publishing .NET Core application..." -ForegroundColor Yellow
    Push-Location $BackendPath
    
    # Restore packages
    & dotnet restore
    if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed" }
    
    # Build application
    & dotnet build --configuration Release
    if ($LASTEXITCODE -ne 0) { throw "dotnet build failed" }
    
    # Publish application
    & dotnet publish --configuration Release --output $PublishPath --no-build
    if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }
    
    Pop-Location

    # Step 4: Deploy as Windows Service
    Write-Host "Deploying as Windows Service..." -ForegroundColor Yellow
    
    $ServiceName = "HealingRaysApp"
    $ServicePath = "$PublishPath\HealingRays.Api.exe"
    
    # Stop existing service
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "Stopping existing service..." -ForegroundColor Yellow
        Stop-Service -Name $ServiceName -Force
        & nssm remove $ServiceName confirm
    }
    
    # Install new service
    Write-Host "Installing Windows Service..." -ForegroundColor Yellow
    & nssm install $ServiceName $ServicePath
    & nssm set $ServiceName AppDirectory $PublishPath
    & nssm set $ServiceName DisplayName "Healing Rays Application"
    & nssm set $ServiceName Description "Healing Rays integrated web application"
    & nssm set $ServiceName Start SERVICE_AUTO_START
    
    # Set environment variables
    & nssm set $ServiceName AppEnvironmentExtra "ASPNETCORE_ENVIRONMENT=Production" "ASPNETCORE_URLS=http://localhost:5000"
    
    # Start service
    Write-Host "Starting service..." -ForegroundColor Yellow
    Start-Service -Name $ServiceName
    
    # Wait for service to start
    Start-Sleep -Seconds 5
    
    Write-Host "=== Integrated application deployed successfully! ===" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "Application URL: http://localhost:5000" -ForegroundColor Yellow
    Write-Host "API endpoints: http://localhost:5000/api/" -ForegroundColor Yellow
    Write-Host "Frontend: http://localhost:5000/ (React SPA)" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor White
    Write-Host "Service Details:" -ForegroundColor Yellow
    Write-Host "- Service Name: $ServiceName" -ForegroundColor White
    Write-Host "- Published to: $PublishPath" -ForegroundColor White
    Write-Host "- No Nginx required!" -ForegroundColor Green

} catch {
    Write-Host "Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
    throw
} finally {
    Pop-Location
}
