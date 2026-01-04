# IIS Deployment Guide for Healing Rays

## Overview

The Healing Rays application uses an integrated architecture where .NET Core serves both the API and React frontend. This works seamlessly with IIS.

## Prerequisites

- **IIS** with ASP.NET Core Hosting Bundle
- **.NET Core 3.1 Runtime** (ASP.NET Core)
- **SQL Server** (LocalDB or full instance)

## Deployment Steps

### 1. Build Frontend (Development Machine)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# Copy build to .NET Core wwwroot
mkdir -p ../HealingRays.Api/HealingRays.Api/wwwroot
cp -r dist/* ../HealingRays.Api/HealingRays.Api/wwwroot/
```

### 2. Publish .NET Core Application

```bash
cd HealingRays.Api/HealingRays.Api
dotnet publish --configuration Release --output C:\inetpub\wwwroot\HealingRays
```

### 3. Configure IIS

1. **Create IIS Site**:
   - Site Name: `HealingRays`
   - Physical Path: `C:\inetpub\wwwroot\HealingRays`
   - Port: `80` (or your preferred port)

2. **Application Pool Settings**:
   - .NET CLR Version: `No Managed Code`
   - Managed Pipeline Mode: `Integrated`
   - Identity: `ApplicationPoolIdentity`

### 4. Configure web.config

IIS requires a `web.config` file. Create one in your publish directory:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" 
                  arguments=".\HealingRays.Api.dll" 
                  stdoutLogEnabled="false" 
                  stdoutLogFile=".\logs\stdout" 
                  hostingModel="inprocess" />
      
      <!-- SPA Fallback Routing -->
      <rewrite>
        <rules>
          <rule name="React Routes" stopProcessing="true">
            <match url=".*" />
            <conditions logicalGrouping="MatchAll">
              <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
              <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
              <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
            </conditions>
            <action type="Rewrite" url="/" />
          </rule>
        </rules>
      </rewrite>
    </system.webServer>
  </location>
</configuration>
```

## URL Structure

After deployment, your application will be available at:

```
http://your-domain/              # React Frontend (SPA)
http://your-domain/dashboard     # React Routes (handled by SPA)
http://your-domain/clients       # React Routes (handled by SPA)
http://your-domain/api/auth      # API Endpoints
http://your-domain/api/clients   # API Endpoints
```

## How It Works

1. **Static Files**: IIS serves React build files from `wwwroot/`
2. **API Requests**: `/api/*` requests go to .NET Core controllers
3. **SPA Routing**: All other requests fall back to `index.html` for React Router
4. **Same Origin**: No CORS issues since everything is served from one domain

## Troubleshooting

### Frontend Not Loading
- Ensure `wwwroot/index.html` exists
- Check IIS has permission to read `wwwroot/` directory
- Verify static file handling is enabled in IIS

### API Not Working
- Check .NET Core application is running
- Verify `web.config` is correctly configured
- Check Windows Event Log for ASP.NET Core errors

### SPA Routing Issues
- Ensure URL Rewrite module is installed in IIS
- Verify rewrite rules in `web.config`
- Check that non-API routes fall back to `index.html`

## Development vs Production

### Development
```bash
# Frontend dev server (separate)
cd frontend && npm run dev     # http://localhost:3000

# Backend dev server (separate)  
cd HealingRays.Api/HealingRays.Api && dotnet run  # http://localhost:5001
```

### Production (IIS)
```
# Single integrated application
http://your-domain/            # Everything served by IIS + .NET Core
```

## Benefits of Integrated Approach

- ✅ **Single Deployment**: One publish, one IIS site
- ✅ **No CORS**: Same origin for frontend and API
- ✅ **Simplified Configuration**: No reverse proxy needed
- ✅ **Better Performance**: No additional network hops
- ✅ **Easier SSL**: Single certificate for entire application

## Automated Deployment

For automated deployment, you can use the PowerShell scripts with IIS:

```powershell
# Build and publish (modify paths for IIS)
.\setup\dotnet\scripts\Deploy-Integrated.ps1

# Then configure IIS site to point to published directory
```

---

**Your React frontend will work perfectly with IIS using this integrated approach!**
