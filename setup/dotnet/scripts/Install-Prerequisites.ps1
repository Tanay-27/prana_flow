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

Write-Host "=== Installing Healing Rays Prerequisites ===" -ForegroundColor Green

# Define paths
$AppDir = "C:\healingrays\app"
$BackupDir = "C:\healingrays\backups"
$LogDir = "C:\healingrays\logs"
$TempDir = "$env:TEMP\HealingRaysSetup"

try {
    # Create directory structure
    Write-Host "Creating directory structure..." -ForegroundColor Yellow
    
    @($AppDir, $BackupDir, $LogDir) | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Force -Path $_ | Out-Null
            Write-Host "Created directory: $_" -ForegroundColor Green
        } else {
            Write-Host "Directory already exists: $_" -ForegroundColor Yellow
        }
    }

    # Download and install .NET Core 3.1 Runtime
    Write-Host "Installing .NET Core 3.1 Runtime..." -ForegroundColor Yellow
    
    $dotnetUrl = "https://download.microsoft.com/download/5/F/0/5F0362BD-7D0A-4A9D-9BF9-016851F0BF3C/dotnet-hosting-3.1.32-win.exe"
    $dotnetInstaller = "$TempDir\dotnet-hosting-3.1.32-win.exe"
    
    # Check if .NET Core 3.1 is already installed
    $dotnetInstalled = $false
    try {
        $dotnetVersion = & dotnet --list-runtimes 2>$null | Where-Object { $_ -match "Microsoft.AspNetCore.App 3.1" }
        if ($dotnetVersion) {
            Write-Host ".NET Core 3.1 Runtime already installed" -ForegroundColor Green
            $dotnetInstalled = $true
        }
    } catch {
        # dotnet command not found, need to install
    }
    
    if (-not $dotnetInstalled) {
        if (!$SkipDownloads) {
            Write-Host "Downloading .NET Core 3.1 Runtime..." -ForegroundColor Yellow
            Invoke-WebRequest -Uri $dotnetUrl -OutFile $dotnetInstaller -UseBasicParsing
        }
        
        Write-Host "Installing .NET Core 3.1 Runtime..." -ForegroundColor Yellow
        Start-Process -FilePath $dotnetInstaller -ArgumentList "/quiet" -Wait
        
        # Verify installation
        Start-Sleep -Seconds 5
        $dotnetVersion = & dotnet --list-runtimes 2>$null | Where-Object { $_ -match "Microsoft.AspNetCore.App 3.1" }
        if ($dotnetVersion) {
            Write-Host ".NET Core 3.1 Runtime installed successfully" -ForegroundColor Green
        } else {
            throw ".NET Core 3.1 Runtime installation failed"
        }
    }

    # Download and install NSSM
    Write-Host "Installing NSSM (Non-Sucking Service Manager)..." -ForegroundColor Yellow
    
    $nssmPath = "C:\nssm"
    if (-not (Test-Path "$nssmPath\nssm.exe")) {
        $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
        $nssmZip = "$TempDir\nssm-2.24.zip"
        $nssmExtract = "$TempDir\nssm-2.24"
        
        if (!$SkipDownloads) {
            Write-Host "Downloading NSSM..." -ForegroundColor Yellow
            Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip -UseBasicParsing
        }
        
        Write-Host "Extracting NSSM..." -ForegroundColor Yellow
        Expand-Archive -Path $nssmZip -DestinationPath $TempDir -Force
        
        # Create NSSM directory
        if (-not (Test-Path $nssmPath)) {
            New-Item -ItemType Directory -Force -Path $nssmPath | Out-Null
        }
        
        # Copy appropriate NSSM executable
        $architecture = if ([Environment]::Is64BitOperatingSystem) { "win64" } else { "win32" }
        Copy-Item "$nssmExtract\nssm-2.24\$architecture\nssm.exe" -Destination "$nssmPath\nssm.exe" -Force
        
        # Add NSSM to PATH
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
        if ($currentPath -notlike "*$nssmPath*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$nssmPath", "Machine")
            Write-Host "Added NSSM to system PATH" -ForegroundColor Green
        }
        
        Write-Host "NSSM installed successfully" -ForegroundColor Green
    } else {
        Write-Host "NSSM already installed" -ForegroundColor Green
    }

    # Create service account (optional, can run as Local System)
    Write-Host "Setting up service configuration..." -ForegroundColor Yellow
    
    $serviceName = "HealingRaysApp"
    Write-Host "Service will be configured as: $serviceName" -ForegroundColor Green

    # Set up Windows Firewall rule for port 5000
    Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow
    
    $firewallRule = Get-NetFirewallRule -DisplayName "Healing Rays Application" -ErrorAction SilentlyContinue
    if (-not $firewallRule) {
        New-NetFirewallRule -DisplayName "Healing Rays Application" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow | Out-Null
        Write-Host "Created firewall rule for port 5000" -ForegroundColor Green
    } else {
        Write-Host "Firewall rule already exists" -ForegroundColor Green
    }

    # Clean up temporary files
    Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
    Remove-Item "$TempDir\*" -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host "=== Prerequisites installation completed successfully! ===" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "Installed components:" -ForegroundColor Yellow
    Write-Host "- .NET Core 3.1 Runtime (ASP.NET Core)" -ForegroundColor White
    Write-Host "- NSSM (Windows Service Manager)" -ForegroundColor White
    Write-Host "- Directory structure in C:\healingrays\" -ForegroundColor White
    Write-Host "- Windows Firewall rule for port 5000" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run Setup-Database.ps1 to configure the database" -ForegroundColor White
    Write-Host "2. Run Deploy-Integrated.ps1 to deploy the application" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "No longer required:" -ForegroundColor Yellow
    Write-Host "- Nginx (integrated into .NET Core)" -ForegroundColor Green
    Write-Host "- Node.js on production server (build locally)" -ForegroundColor Green

} catch {
    Write-Host "Error during prerequisites installation: $($_.Exception.Message)" -ForegroundColor Red
    throw
} finally {
    # Cleanup
    Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
}
