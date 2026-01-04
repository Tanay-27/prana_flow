#Requires -Version 5.1

<#
.SYNOPSIS
    Builds the Healing Rays .NET Core application
.DESCRIPTION
    Restores NuGet packages, builds the application, and publishes it for deployment
#>

$ErrorActionPreference = "Stop"

Write-Host "=== Building Healing Rays .NET Application ===" -ForegroundColor Green

$ProjectPath = "C:\healingrays\app\HealingRays.Api\HealingRays.Api"
$PublishPath = "C:\healingrays\app\published"

try {
    # Ensure we're in the right directory
    Push-Location $ProjectPath

    Write-Host "Restoring NuGet packages..." -ForegroundColor Yellow
    & dotnet restore
    if ($LASTEXITCODE -ne 0) {
        throw "NuGet restore failed"
    }

    Write-Host "Building application..." -ForegroundColor Yellow
    & dotnet build --configuration Release --verbosity minimal
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }

    Write-Host "Publishing application..." -ForegroundColor Yellow
    & dotnet publish --configuration Release --output $PublishPath --verbosity minimal
    if ($LASTEXITCODE -ne 0) {
        throw "Publish failed"
    }

    # Create web.config for IIS hosting (optional)
    $webConfig = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" arguments=".\HealingRays.Api.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
    </system.webServer>
  </location>
</configuration>
"@

    $webConfig | Out-File -FilePath "$PublishPath\web.config" -Encoding UTF8

    Write-Host "=== Build completed successfully! ===" -ForegroundColor Green
    Write-Host "Published application to: $PublishPath" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor White
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run Deploy-Backend.ps1 to deploy the backend service" -ForegroundColor White
    Write-Host "2. Run Deploy-Frontend.ps1 to build and deploy the frontend" -ForegroundColor White

} catch {
    Write-Host "Error during build: $($_.Exception.Message)" -ForegroundColor Red
    throw
} finally {
    Pop-Location
}
