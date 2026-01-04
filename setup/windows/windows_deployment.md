# PranaFlow Windows Server 2012 Deployment Guide

> Target: Bare-metal/VM Windows Server 2012 R2 with static public IP (no Docker)
> Folder: `setup/windows` (contains this guide + PowerShell helpers)

---

## 0. Package Inventory

```
setup/windows
├── windows_deployment.md   # This guide
└── scripts/
    ├── start-backend.ps1
    ├── start-frontend.ps1
    ├── start-minio.ps1
    └── register-services.ps1
```

Additional project assets:

- `backend/.env.sample` – template for production env vars.
- Application source lives under `C:\pranaflow\app` after deployment (see Section 3).

---

## 1. High-Level Architecture

```
C:\pranaflow
├── app
│   ├── backend (NestJS API)
│   └── frontend (Vite build artifacts)
├── data
│   ├── mongodb    (database files)
│   └── minio      (object storage)
├── services       (NSSM + PowerShell scripts)
└── nginx
    ├── conf
    │   └── pranaflow.conf
    └── logs
```

Runtime processes:

1. MongoDB Windows service (port 27017)
2. MinIO Windows service (API 9000, Console 9001)
3. Backend NestJS service (Node 20, port 3000)
4. Frontend static assets served by Nginx (ports 80/443)
5. Nginx reverse proxying `/api` and `/storage` to backend

---

## 2. Installation Matrix (Sources & Versions)

| Component | Version | Source | Notes |
|-----------|---------|--------|-------|
| Windows Server | 2012 R2 64-bit | Microsoft Volume Licensing / Azure Marketplace | Install latest KB patches, .NET 4.8 |
| Node.js | 20.x LTS (64-bit) | https://nodejs.org/en/download | Required for backend build + scripts |
| npm | Bundled with Node | — | Run `npm config set prefix "C:\\node-global"` to avoid permission issues |
| Git | ≥ 2.39 | https://git-scm.com/download/win | Optional but simplifies code sync |
| Python | 3.9+ | https://www.python.org/downloads/windows/ | Needed for native addon builds (bcrypt) |
| MongoDB | 6.0 Community | https://www.mongodb.com/try/download/community | Install as Windows service → `C:\pranaflow\data\mongodb` |
| MinIO | RELEASE.2024-10-02T or later | https://min.io/download#/windows | Standalone binary; run via NSSM |
| Nginx | 1.26.* Windows build | https://nginx.org/en/download.html | Extract to `C:\nginx` |
| NSSM | 2.24+ | https://nssm.cc/download | Wraps PowerShell scripts into services |
| OpenSSL | Optional | https://slproweb.com/products/Win32OpenSSL.html | Needed only if issuing custom TLS certs |

Security recommendations:
- Disable TLS 1.0/1.1 in OS registry (IIS Crypto or GPO).
- Create service account `pranaflow-svc` with "Log on as a service" rights; run MongoDB, MinIO, backend under this account.
- Windows Firewall: only expose ports 80/443 publicly. Keep 27017/3000/9000/9001 scoped to localhost.

---

## 3. Folder Preparation

Run PowerShell as Administrator:

```powershell
New-Item -ItemType Directory -Force -Path "C:\pranaflow\app"
New-Item -ItemType Directory -Force -Path "C:\pranaflow\data\mongodb"
New-Item -ItemType Directory -Force -Path "C:\pranaflow\data\minio"
New-Item -ItemType Directory -Force -Path "C:\pranaflow\nginx\conf"
New-Item -ItemType Directory -Force -Path "C:\pranaflow\nginx\logs"
New-Item -ItemType Directory -Force -Path "C:\pranaflow\services\logs"
```

Fetch the repo (or drop CI artifact) into `C:\pranaflow\app`:

```powershell
cd C:\pranaflow\app
git clone https://github.com/<org>/pranaflow.git .
```

> Without Git, copy a packaged ZIP to `C:\pranaflow\app` and extract.

---

## 4. MongoDB Installation

1. Run MongoDB MSI (Custom mode). Data path → `C:\pranaflow\data\mongodb`.
2. Register Windows service name `MongoDBPranaFlow`, log on as `pranaflow-svc`.
3. Initialize DB using `mongosh`:

```javascript
use pranaflow;
db.createCollection('init');
```

4. Optional hardening: enable auth in `C:\Program Files\MongoDB\Server\6.0\bin\mongod.cfg`, create admin user.

---

## 5. MinIO Service

1. Download `minio.exe` to `C:\pranaflow\services\minio`.
2. Copy `setup/windows/scripts/start-minio.ps1` to `C:\pranaflow\services\start-minio.ps1` (or reference directly).
3. Update secrets in the script if not using defaults.
4. Register via NSSM (adjust path to `nssm.exe`):

```powershell
nssm install MinIOPranaFlow "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" "-ExecutionPolicy Bypass -File C:\pranaflow\services\start-minio.ps1"
nssm set MinIOPranaFlow AppDirectory "C:\pranaflow\services"
nssm set MinIOPranaFlow ObjectName ".\pranaflow-svc"
nssm set MinIOPranaFlow AppStdout "C:\pranaflow\services\logs\minio.out.log"
nssm set MinIOPranaFlow AppStderr "C:\pranaflow\services\logs\minio.err.log"
Start-Service MinIOPranaFlow
```

> Ports 9000/9001 should remain blocked from the internet.

---

## 6. Backend (NestJS) Deployment

### 6.1 Environment Variables

Copy `backend/.env.sample` → `backend/.env` and set values:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pranaflow
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=<change>
MINIO_SECRET_KEY=<change>
MINIO_BUCKET=pranaflow-storage
JWT_SECRET=<long-random>
JWT_EXPIRATION=30d
```

Create bucket `pranaflow-storage` via MinIO console (`http://localhost:9001`).

### 6.2 Install & Build

```powershell
cd C:\pranaflow\app\backend
npm install --production
npm run build
```

### 6.3 Windows Service

1. Copy `setup/windows/scripts/start-backend.ps1` → `C:\pranaflow\services\start-backend.ps1`.
2. Register with NSSM:

```powershell
nssm install PranaFlowBackend "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" "-ExecutionPolicy Bypass -File C:\pranaflow\services\start-backend.ps1"
nssm set PranaFlowBackend AppDirectory "C:\pranaflow\services"
nssm set PranaFlowBackend ObjectName ".\pranaflow-svc"
nssm set PranaFlowBackend AppStdout "C:\pranaflow\services\logs\backend.out.log"
nssm set PranaFlowBackend AppStderr "C:\pranaflow\services\logs\backend.err.log"
Start-Service PranaFlowBackend
```

---

## 7. Frontend Deployment

### 7.1 Build Static Assets

```powershell
cd C:\pranaflow\app\frontend
npm install
setx VITE_API_URL "http://127.0.0.1:3000"
npm run build
```

Copy `frontend/dist` → `C:\pranaflow\nginx\html`:

```powershell
New-Item -ItemType Directory -Force -Path "C:\pranaflow\nginx\html"
Copy-Item -Path "C:\pranaflow\app\frontend\dist\*" -Destination "C:\pranaflow\nginx\html" -Recurse -Force
```

### 7.2 Optional Dev Service

`setup/windows/scripts/start-frontend.ps1` runs `npm run dev -- --host 0.0.0.0 --port 4173` if you need a preview server behind Nginx. Production should use static files only.

---

## 8. Nginx Configuration

1. Extract Nginx to `C:\nginx`.
2. Create `C:\nginx\conf\nginx.conf`:

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
    include conf/pranaflow.conf;
}
```

3. Create `C:\pranaflow\nginx\conf\pranaflow.conf`:

```nginx
server {
    listen 80;
    server_name <STATIC_PUBLIC_IP_OR_DOMAIN>;

    root   C:/pranaflow/nginx/html;
    index  index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /storage/ {
        proxy_pass http://127.0.0.1:3000/storage/;
    }

    access_log  C:/pranaflow/nginx/logs/access.log;
    error_log   C:/pranaflow/nginx/logs/error.log;
}
```

4. Start Nginx:

```powershell
cd C:\nginx
start nginx.exe
```

Reload on config changes: `nginx -s reload`

> For HTTPS add `listen 443 ssl;` plus `ssl_certificate` and `ssl_certificate_key` (use win-acme for Let's Encrypt automation).

---

## 9. Service Registration Helper

`setup/windows/scripts/register-services.ps1` contains functions to register backend & MinIO with NSSM. Customize `$NssmPath`, service names, and log directories before running:

```powershell
& "C:\pranaflow\setup\windows\scripts\register-services.ps1" -NssmPath "C:\Tools\nssm.exe"
```

Extend the script to add frontend dev or Nginx services if needed.

---

## 10. Deployment Workflow

1. Pull latest code into `C:\pranaflow\app` (Git or artifact).
2. Backend: `npm ci && npm run build` → `Restart-Service PranaFlowBackend`.
3. Frontend: `npm ci && npm run build` → copy `dist` → `nginx -s reload`.
4. Run `npm run seed` (from `C:\pranaflow\app\backend`) for initial data:
   - Creates **Admin** user → `admin / Admin@123`
   - Creates **Healer** user → `healer / Healer@123`
   - Inserts demo clients, protocols, sessions, payments
   - Stop backend service temporarily before seeding if it is running.
5. Health checks:
   - `curl http://127.0.0.1:3000/health`
   - `curl http://<STATIC_IP>/`
   - Upload file via UI to verify MinIO.

---

## 11. Backup & Recovery

| Component | Strategy |
|-----------|----------|
| MongoDB | Nightly `mongodump` scheduled task → offsite storage |
| MinIO | `mc mirror` to external bucket or file-level backups of `C:\pranaflow\data\minio` (stop MinIO first) |
| Backend/Frontend | Git history; rebuild artifacts as needed |
| Config | Securely store `.env`, `pranaflow.conf`, NSSM scripts (avoid secrets in Git) |

---

## 12. Monitoring & Troubleshooting

- Logs: `C:\pranaflow\services\logs\backend.*`, `minio.*`, `C:\pranaflow\nginx\logs`.
- Services: `Get-Service PranaFlowBackend`, `Get-Service MinIOPranaFlow`.
- Ports: `netstat -ano | findstr :3000`, `:9000`, `:80`.
- Firewall: `New-NetFirewallRule -DisplayName "PranaFlow-HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow`.

---

## 13. Future Enhancements

1. Automate TLS renewal with win-acme.
2. Replace NSSM with `node-windows` or PM2 if desired.
3. Ship logs to ELK/Datadog using nxlog or Fluent Bit.
4. Implement CI/CD pipeline pushing built artifacts + running service restart script.

This `setup/windows` package centralizes the Windows deployment checklist, scripts, and configuration references for repeatable installs.
