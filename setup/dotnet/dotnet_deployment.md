# Healing Rays .NET Core 3.1 Windows Server Deployment Guide

> Target: Windows Server 2012 R2+ with .NET Core 3.1 runtime
> Folder: `setup/dotnet` (contains this guide + PowerShell helpers)

---

## 0. Package Inventory

```
setup/dotnet
├── dotnet_deployment.md     # This guide
├── mssql_schema.sql         # Database schema creation scripts
└── scripts/
    ├── Install-Prerequisites.ps1
    ├── Setup-Database.ps1
    ├── Build-Application.ps1
    ├── Deploy-Backend.ps1
    ├── Deploy-Frontend.ps1
    ├── Register-Services.ps1
    └── Health-Check.ps1
```

Additional project assets:
- `HealingRays.Api/appsettings.json` – production configuration
- Application deploys to `C:\healingrays\app` after deployment

---

## 1. High-Level Architecture

```
C:\healingrays
├── app
│   ├── HealingRays.Api (ASP.NET Core API)
│   └── frontend (Vite build artifacts)
├── data
│   └── uploads (file attachments)
├── services       (NSSM + PowerShell scripts)
└── nginx
    ├── conf
    │   └── healingrays.conf
    └── logs
```

Runtime processes:

1. SQL Server (LocalDB or full SQL Server)
2. Backend ASP.NET Core service (.NET Core 3.1, port 5001)
3. Frontend static assets served by Nginx (ports 80/443)
4. Nginx reverse proxying `/api` to backend

---

## 2. Installation Matrix (Sources & Versions)

| Component | Version | Source | Notes |
|-----------|---------|--------|-------|
| Windows Server | 2012 R2+ | Microsoft | Install latest KB patches |
| .NET Core Runtime | 3.1.x | https://dotnet.microsoft.com/download/dotnet/3.1 | Hosting Bundle for IIS (optional) |
| .NET Core SDK | 3.1.x | https://dotnet.microsoft.com/download/dotnet/3.1 | Only needed for building |
| SQL Server | 2019+ or LocalDB | https://www.microsoft.com/sql-server | LocalDB for development/testing |
| Git | ≥ 2.39 | https://git-scm.com/download/win | Optional but simplifies code sync |
| Nginx | 1.26.* | https://nginx.org/en/download.html | Extract to `C:\nginx` |
| NSSM | 2.24+ | https://nssm.cc/download | Wraps PowerShell scripts into services |

Security recommendations:
- Create service account `healingrays-svc` with "Log on as a service" rights
- Windows Firewall: only expose ports 80/443 publicly
- Use HTTPS in production with proper certificates

---

## 3. Prerequisites Installation

Run PowerShell as Administrator:

```powershell
# Run the prerequisites installer
& "C:\healingrays\setup\dotnet\scripts\Install-Prerequisites.ps1"
```

This installs:
- .NET Core 3.1 Runtime
- NSSM for Windows Service management
- Creates necessary directories
- Sets up service account

### 2. Setup Database

Configure SQL Server and create the database schema:
```powershell
.\setup\dotnet\scripts\Setup-Database.ps1
```

### 3. Deploy Application

#### Option A: Automated Deployment
```powershell
# Single command deployment
.\setup\dotnet\scripts\Deploy-Integrated.ps1
```

#### Option B: Manual Steps
```powershell
# 1. Build frontend locally
cd frontend/
npm install
npm run build

# 2. Copy frontend to .NET Core
cp -r dist/* ../HealingRays.Api/HealingRays.Api/wwwroot/

# 3. Publish .NET Core application
cd ../HealingRays.Api/HealingRays.Api/
dotnet publish --configuration Release --output C:\healingrays\app\published

# 4. Install as Windows Service
.\setup\dotnet\scripts\Register-Services.ps1
```

## Configuration

### Application Settings

Update `appsettings.json` in the published directory:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=HealingRaysDb;Trusted_Connection=true;MultipleActiveResultSets=true;"
  },
  "JwtSettings": {
    "Secret": "your-super-secret-jwt-key-here-make-it-long-and-secure",
    "ExpiryInDays": 7
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

### Frontend Configuration

The frontend build is automatically configured to use relative API paths since it's served from the same origin.

## URL Structure

After deployment, the application will be available at:

```
http://localhost:5000/              # React Frontend (SPA)
http://localhost:5000/dashboard     # React Routes
http://localhost:5000/clients       # React Routes
http://localhost:5000/api/auth      # API Endpoints
http://localhost:5000/api/clients   # API Endpoints
http://localhost:5000/api/sessions  # API Endpoints
```

## Service Management

---

## 10. Deployment Workflow

1. Pull latest code into `C:\healingrays\app`
2. Backend: Run `Build-Application.ps1` → `Restart-Service HealingRaysBackend`
3. Frontend: Run `Deploy-Frontend.ps1` → `nginx -s reload`
4. Health checks: Run `Health-Check.ps1`

---

## 11. Health Checks

Run the health check script:

```powershell
& "C:\healingrays\setup\dotnet\scripts\Health-Check.ps1"
```

This will verify:
- Backend API is responding
- Database connection is working
- Frontend is accessible
- Services are running

---

## 12. Backup & Recovery

| Component | Strategy |
|-----------|----------|
| SQL Server | Nightly backups using SQL Server Agent → offsite storage |
| File Uploads | File-level backups of `C:\healingrays\data\uploads` |
| Application | Git history; rebuild artifacts as needed |
| Config | Securely store `appsettings.Production.json`, nginx configs |

---

## 13. Monitoring & Troubleshooting

- Logs: `C:\healingrays\services\logs\backend.*`, `C:\healingrays\nginx\logs`
- Services: `Get-Service HealingRaysBackend`
- Ports: `netstat -ano | findstr :5001`, `:80`, `:443`
- Database: Check SQL Server logs and connection strings

---

## 14. Migration Notes

### From NestJS to .NET Core

**Key Changes:**
- **Framework**: ASP.NET Core 3.1 Web API
- **Database**: SQL Server with Entity Framework Core
- **ORM**: EF Core instead of Mongoose
- **Language**: C# instead of TypeScript
- **Authentication**: JWT with Microsoft.AspNetCore.Authentication.JwtBearer

**Compatibility Maintained:**
- **API Endpoints**: Exact same routes and HTTP methods
- **Request/Response**: Identical JSON structures with snake_case
- **Frontend Integration**: Zero changes required to React frontend
- **Authentication**: Same JWT token format and flow

**New Features:**
- **Swagger UI**: Built-in API documentation at `/swagger`
- **Health Checks**: Application health monitoring
- **Structured Logging**: Better logging with Serilog (optional)
- **Windows Services**: Proper service integration with NSSM

This deployment guide ensures the .NET Core conversion maintains all functionality while providing better performance and enterprise features.
