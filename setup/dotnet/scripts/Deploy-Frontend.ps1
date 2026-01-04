#Requires -Version 5.1

<#
.SYNOPSIS
    Builds and deploys the Healing Rays frontend
.DESCRIPTION
    Installs npm dependencies, builds the frontend, and copies to Nginx directory
#>

$ErrorActionPreference = "Stop"

Write-Host "=== Deploying Healing Rays Frontend ===" -ForegroundColor Green

$FrontendPath = "C:\healingrays\app\frontend"
$NginxHtmlPath = "C:\healingrays\nginx\html"

try {
    # Ensure we're in the frontend directory
    Push-Location $FrontendPath

    # Install dependencies
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }

    # Set API URL environment variable
    Write-Host "Setting API URL environment variable..." -ForegroundColor Yellow
    $env:VITE_API_URL = "http://127.0.0.1:5001"

    # Build frontend
    Write-Host "Building frontend..." -ForegroundColor Yellow
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build failed"
    }

    # Copy to Nginx directory
    Write-Host "Copying build artifacts to Nginx..." -ForegroundColor Yellow

    # Clean existing files
    if (Test-Path $NginxHtmlPath) {
        Remove-Item "$NginxHtmlPath\*" -Recurse -Force
    } else {
        New-Item -ItemType Directory -Force -Path $NginxHtmlPath | Out-Null
    }

    # Copy new build
    Copy-Item "dist\*" -Destination $NginxHtmlPath -Recurse -Force

    Write-Host "=== Frontend deployed successfully! ===" -ForegroundColor Green
    Write-Host "Frontend served from: $NginxHtmlPath" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor White
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Ensure Nginx is configured and running" -ForegroundColor White
    Write-Host "2. Run Health-Check.ps1 to verify the deployment" -ForegroundColor White

} catch {
    Write-Host "Error during frontend deployment: $($_.Exception.Message)" -ForegroundColor Red
    throw
} finally {
    Pop-Location
}
