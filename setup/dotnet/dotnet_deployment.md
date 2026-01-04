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

This script will:
- Install .NET Core 3.1 Runtime
- Install .NET Core 3.1 SDK
- Install NSSM service manager
- Install Nginx
- Create required directories

---

## 4. Folder Preparation

```powershell
New-Item -ItemType Directory -Force -Path "C:\healingrays\app"
New-Item -ItemType Directory -Force -Path "C:\healingrays\data\uploads"
New-Item -ItemType Directory -Force -Path "C:\healingrays\services\logs"
New-Item -ItemType Directory -Force -Path "C:\healingrays\nginx\conf"
New-Item -ItemType Directory -Force -Path "C:\healingrays\nginx\logs"
New-Item -ItemType Directory -Force -Path "C:\healingrays\nginx\html"
```

Fetch the repo into `C:\healingrays\app`:

```powershell
cd C:\healingrays\app
git clone https://github.com/<org>/healingrays.git .
```

---

## 5. Database Setup

### 5.1 SQL Server Installation

For LocalDB (recommended for small deployments):

```powershell
# Install SQL Server LocalDB
& "C:\healingrays\setup\dotnet\scripts\Setup-Database.ps1" -DatabaseType LocalDB
```

For full SQL Server:

```powershell
# Install and configure full SQL Server instance
& "C:\healingrays\setup\dotnet\scripts\Setup-Database.ps1" -DatabaseType FullSQL -InstanceName "HEALINGRAYS"
```

### 5.2 Create Database Schema

Run the schema creation script:

```powershell
# Connect to SQL Server and run the schema script
sqlcmd -S "(localdb)\MSSQLLocalDB" -i "C:\healingrays\setup\dotnet\mssql_schema.sql"
```

Or for full SQL Server:

```powershell
sqlcmd -S "localhost\HEALINGRAYS" -i "C:\healingrays\setup\dotnet\mssql_schema.sql"
```

---

## 6. Backend (.NET Core) Deployment

### 6.1 Configuration

Copy and configure `appsettings.json`:

```powershell
cd C:\healingrays\app\HealingRays.Api\HealingRays.Api
Copy-Item appsettings.json appsettings.Production.json

# Edit appsettings.Production.json with production values
notepad appsettings.Production.json
```

Key settings to update:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=HealingRaysDb;Trusted_Connection=True;"
  },
  "JwtSettings": {
    "Secret": "your-very-secure-secret-key-here-change-in-production",
    "ExpirationDays": 30
  }
}
```

### 6.2 Build Application

```powershell
# Run the build script
& "C:\healingrays\setup\dotnet\scripts\Build-Application.ps1"
```

This script will:
- Restore NuGet packages
- Build the application in Release mode
- Publish to `C:\healingrays\app\published`

### 6.3 Windows Service

```powershell
# Run the backend deployment script
& "C:\healingrays\setup\dotnet\scripts\Deploy-Backend.ps1"
```

This script will:
- Copy published files to service directory
- Register with NSSM as Windows service
- Configure service to run as `healingrays-svc`
- Set up logging

---

## 7. Frontend Deployment

### 7.1 Build Static Assets

```powershell
# Run the frontend deployment script
& "C:\healingrays\setup\dotnet\scripts\Deploy-Frontend.ps1"
```

This script will:
- Install npm dependencies
- Set API URL environment variable
- Build production assets
- Copy to Nginx directory

### 7.2 Environment Variable

The script sets: `VITE_API_URL="http://127.0.0.1:5001"`

---

## 8. Nginx Configuration

Create `C:\healingrays\nginx\conf\healingrays.conf`:

```nginx
server {
    listen 80;
    server_name <STATIC_PUBLIC_IP_OR_DOMAIN>;

    root   C:/healingrays/nginx/html;
    index  index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    access_log  C:/healingrays/nginx/logs/access.log;
    error_log   C:/healingrays/nginx/logs/error.log;
}

# HTTPS configuration (recommended for production)
server {
    listen 443 ssl http2;
    server_name <STATIC_PUBLIC_IP_OR_DOMAIN>;

    ssl_certificate C:/path/to/certificate.crt;
    ssl_certificate_key C:/path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    root   C:/healingrays/nginx/html;
    index  index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    access_log  C:/healingrays/nginx/logs/access.log;
    error_log   C:/healingrays/nginx/logs/error.log;
}
```

Update main Nginx config `C:\nginx\conf\nginx.conf`:

```nginx
worker_processes  1;
error_log  logs/error.log;
pid        logs/nginx.pid;

events { worker_connections 1024; }

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    include C:/healingrays/nginx/conf/healingrays.conf;
}
```

Start Nginx:

```powershell
cd C:\nginx
start nginx.exe
```

---

## 9. Service Registration

Run the service registration script:

```powershell
& "C:\healingrays\setup\dotnet\scripts\Register-Services.ps1"
```

This will register both backend and frontend services with NSSM.

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
