#Requires -Version 5.1
#Requires -RunAsAdministrator

<#
.SYNOPSIS
    Installs prerequisites for Healing Rays .NET Core deployment
.DESCRIPTION
    Downloads and installs .NET Core 3.1 Runtime, SDK, NSSM, and Nginx
.PARAMETER SkipDownloads
    Skip downloading components (useful if already downloaded)
#>

param(
    [switch]$SkipDownloads
)

$ErrorActionPreference = "Stop"

# Define versions and URLs
$DotNetRuntimeUrl = "https://download.visualstudio.microsoft.com/download/pr/5e17c7b6-d45f-4af7-92b3-8c4cabcff4bc/4c835b9b0bb25b7b7b7e1b4b5b7b7b7b7/dotnet-hosting-3.1.32-win.exe"
$DotNetSdkUrl = "https://download.visualstudio.microsoft.com/download/pr/5e17c7b6-d45f-4af7-92b3-8c4cabcff4bc/4c835b9b0bb25b7b7b7e1b4b5b7b7b7b7/dotnet-sdk-3.1.426-win-x64.exe"
$NssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
$NginxUrl = "https://nginx.org/download/nginx-1.26.0.zip"

# Create temp directory
$TempDir = "$env:TEMP\HealingRaysSetup"
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

Write-Host "=== Healing Rays Prerequisites Installation ===" -ForegroundColor Green

function Install-DotNetRuntime {
    Write-Host "Installing .NET Core 3.1 Runtime..." -ForegroundColor Yellow

    if (!$SkipDownloads) {
        Write-Host "Downloading .NET Core Runtime..."
        Invoke-WebRequest -Uri $DotNetRuntimeUrl -OutFile "$TempDir\dotnet-runtime.exe"
    }

    Write-Host "Installing .NET Core Runtime..."
    Start-Process -FilePath "$TempDir\dotnet-runtime.exe" -ArgumentList "/quiet /norestart" -Wait

    Write-Host ".NET Core Runtime installed successfully." -ForegroundColor Green
}

function Install-DotNetSdk {
    Write-Host "Installing .NET Core 3.1 SDK..." -ForegroundColor Yellow

    if (!$SkipDownloads) {
        Write-Host "Downloading .NET Core SDK..."
        Invoke-WebRequest -Uri $DotNetSdkUrl -OutFile "$TempDir\dotnet-sdk.exe"
    }

    Write-Host "Installing .NET Core SDK..."
    Start-Process -FilePath "$TempDir\dotnet-sdk.exe" -ArgumentList "/quiet /norestart" -Wait

    Write-Host ".NET Core SDK installed successfully." -ForegroundColor Green
}

function Install-NSSM {
    Write-Host "Installing NSSM..." -ForegroundColor Yellow

    if (!$SkipDownloads) {
        Write-Host "Downloading NSSM..."
        Invoke-WebRequest -Uri $NssmUrl -OutFile "$TempDir\nssm.zip"
    }

    Write-Host "Extracting NSSM..."
    Expand-Archive -Path "$TempDir\nssm.zip" -DestinationPath "$TempDir\nssm" -Force

    # Copy NSSM to System32 for global access
    Copy-Item "$TempDir\nssm\nssm-2.24\win64\nssm.exe" "C:\Windows\System32\nssm.exe" -Force

    Write-Host "NSSM installed successfully." -ForegroundColor Green
}

function Install-Nginx {
    Write-Host "Installing Nginx..." -ForegroundColor Yellow

    if (!$SkipDownloads) {
        Write-Host "Downloading Nginx..."
        Invoke-WebRequest -Uri $NginxUrl -OutFile "$TempDir\nginx.zip"
    }

    Write-Host "Extracting Nginx..."
    Expand-Archive -Path "$TempDir\nginx.zip" -DestinationPath "C:\" -Force

    # Rename to standard nginx directory
    if (Test-Path "C:\nginx-1.26.0") {
        Rename-Item "C:\nginx-1.26.0" "C:\nginx" -Force
    }

    Write-Host "Nginx installed successfully." -ForegroundColor Green
}

function Create-ServiceAccount {
    Write-Host "Creating service account..." -ForegroundColor Yellow

    $ServiceAccount = "healingrays-svc"

    # Check if account already exists
    $existingUser = Get-LocalUser -Name $ServiceAccount -ErrorAction SilentlyContinue
    if ($existingUser) {
        Write-Host "Service account '$ServiceAccount' already exists." -ForegroundColor Yellow
        return
    }

    # Create service account
    $password = ConvertTo-SecureString "TempPass123!" -AsPlainText -Force
    New-LocalUser -Name $ServiceAccount -Password $password -Description "Healing Rays Service Account" -UserMayNotChangePassword -PasswordNeverExpires

    # Add to "Log on as a service" policy
    $sid = (Get-LocalUser -Name $ServiceAccount).SID.Value
    secedit /export /cfg "$TempDir\sec.cfg" | Out-Null
    (Get-Content "$TempDir\sec.cfg") -replace 'SeServiceLogonRight = ', "SeServiceLogonRight = *$sid," | Set-Content "$TempDir\sec.cfg"
    secedit /import /cfg "$TempDir\sec.cfg" /db "$TempDir\sec.sdb" | Out-Null
    secedit /configure /db "$TempDir\sec.sdb" /cfg "$TempDir\sec.cfg" | Out-Null

    Write-Host "Service account created and configured." -ForegroundColor Green
}

function Create-Directories {
    Write-Host "Creating required directories..." -ForegroundColor Yellow

    $directories = @(
        "C:\healingrays\app",
        "C:\healingrays\data\uploads",
        "C:\healingrays\services",
        "C:\healingrays\services\logs",
        "C:\healingrays\nginx\conf",
        "C:\healingrays\nginx\logs",
        "C:\healingrays\nginx\html"
    )

    foreach ($dir in $directories) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }

    Write-Host "Directories created successfully." -ForegroundColor Green
}

# Main installation process
try {
    Install-DotNetRuntime
    Install-DotNetSdk
    Install-NSSM
    Install-Nginx
    Create-ServiceAccount
    Create-Directories

    # Verify installations
    Write-Host "Verifying installations..." -ForegroundColor Yellow

    $dotnetVersion = & dotnet --version
    Write-Host ".NET SDK Version: $dotnetVersion" -ForegroundColor Green

    if (Test-Path "C:\nginx\nginx.exe") {
        Write-Host "Nginx installed successfully." -ForegroundColor Green
    }

    if (Test-Path "C:\Windows\System32\nssm.exe") {
        Write-Host "NSSM installed successfully." -ForegroundColor Green
    }

    Write-Host "=== Prerequisites installation completed successfully! ===" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run Setup-Database.ps1 to configure SQL Server" -ForegroundColor White
    Write-Host "2. Run Build-Application.ps1 to build the .NET application" -ForegroundColor White
    Write-Host "3. Run Deploy-Backend.ps1 to deploy the backend service" -ForegroundColor White

} catch {
    Write-Host "Error during installation: $($_.Exception.Message)" -ForegroundColor Red
    throw
} finally {
    # Cleanup
    Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
}
