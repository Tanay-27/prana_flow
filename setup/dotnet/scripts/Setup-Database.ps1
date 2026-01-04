#Requires -Version 5.1
#Requires -RunAsAdministrator

<#
.SYNOPSIS
    Sets up SQL Server database for Healing Rays application
.DESCRIPTION
    Installs and configures SQL Server LocalDB or connects to existing SQL Server instance
.PARAMETER DatabaseType
    Type of database installation: LocalDB or FullSQL
.PARAMETER InstanceName
    Name of SQL Server instance (for FullSQL)
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("LocalDB", "FullSQL")]
    [string]$DatabaseType,

    [string]$InstanceName = "HEALINGRAYS"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Healing Rays Database Setup ===" -ForegroundColor Green

function Install-SqlLocalDB {
    Write-Host "Installing SQL Server LocalDB..." -ForegroundColor Yellow

    # Check if LocalDB is already installed
    try {
        $localDbVersion = & "C:\Program Files\Microsoft SQL Server\130\Tools\Binn\SqlLocalDB.exe" versions 2>$null
        if ($localDbVersion) {
            Write-Host "SQL Server LocalDB is already installed." -ForegroundColor Yellow
            return
        }
    } catch {
        # LocalDB not found, continue with installation
    }

    # Download and install SQL Server LocalDB
    $installerUrl = "https://download.microsoft.com/download/7/c/1/7c14a87c-d954-4c85-b621-4c03d6b1b569/SqlLocalDB.msi"
    $installerPath = "$env:TEMP\SqlLocalDB.msi"

    Write-Host "Downloading SQL Server LocalDB..."
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

    Write-Host "Installing SQL Server LocalDB..."
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$installerPath`" /quiet /norestart IACCEPTSQLLOCALDBLICENSETERMS=YES" -Wait

    # Clean up
    Remove-Item $installerPath -Force

    Write-Host "SQL Server LocalDB installed successfully." -ForegroundColor Green
}

function Create-Database {
    param([string]$ConnectionString)

    Write-Host "Creating database schema..." -ForegroundColor Yellow

    $schemaPath = "C:\healingrays\setup\dotnet\mssql_schema.sql"

    if (!(Test-Path $schemaPath)) {
        throw "Schema file not found at $schemaPath"
    }

    # Use sqlcmd to execute the schema
    try {
        if ($DatabaseType -eq "LocalDB") {
            & sqlcmd -S "(localdb)\MSSQLLocalDB" -i $schemaPath
        } else {
            & sqlcmd -S "localhost\$InstanceName" -i $schemaPath
        }

        Write-Host "Database schema created successfully." -ForegroundColor Green
    } catch {
        Write-Host "Failed to create database schema: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Test-DatabaseConnection {
    param([string]$ConnectionString)

    Write-Host "Testing database connection..." -ForegroundColor Yellow

    try {
        $connection = New-Object System.Data.SqlClient.SqlConnection
        $connection.ConnectionString = $ConnectionString
        $connection.Open()
        $connection.Close()

        Write-Host "Database connection successful." -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Database connection failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main setup process
try {
    if ($DatabaseType -eq "LocalDB") {
        Install-SqlLocalDB

        # Start LocalDB instance
        Write-Host "Starting LocalDB instance..." -ForegroundColor Yellow
        & "C:\Program Files\Microsoft SQL Server\130\Tools\Binn\SqlLocalDB.exe" start "MSSQLLocalDB"

        $connectionString = "Server=(localdb)\MSSQLLocalDB;Database=HealingRaysDb;Trusted_Connection=True;"
    } else {
        Write-Host "Using existing SQL Server instance: $InstanceName" -ForegroundColor Yellow

        # Test connection to existing instance
        $connectionString = "Server=localhost\$InstanceName;Database=HealingRaysDb;Trusted_Connection=True;"
    }

    # Test connection
    if (!(Test-DatabaseConnection -ConnectionString $connectionString)) {
        throw "Unable to connect to database"
    }

    # Create database schema
    Create-Database -ConnectionString $connectionString

    # Final connection test with actual database
    if (Test-DatabaseConnection -ConnectionString $connectionString) {
        Write-Host "=== Database setup completed successfully! ===" -ForegroundColor Green
        Write-Host "Connection String: $connectionString" -ForegroundColor Yellow
        Write-Host "" -ForegroundColor White
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Update appsettings.json with the connection string above" -ForegroundColor White
        Write-Host "2. Run Build-Application.ps1 to build the .NET application" -ForegroundColor White
    }

} catch {
    Write-Host "Error during database setup: $($_.Exception.Message)" -ForegroundColor Red
    throw
}
