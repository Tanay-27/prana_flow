# PranaFlow Windows Server 2012 Deployment Guide

> Target: Bare-metal/VM Windows Server 2012 R2 with a static public IP (no Docker).
> Audience: Ops/SRE owner preparing production-like environment.

---

## 1. High-Level Architecture

```
C:\pranaflow
├── app
│   ├── backend (NestJS API)
│   └── frontend (Vite build artifacts)
├── data
│   ├── mongodb (DB files)
│   └── minio   (object storage)
├── services
│   ├── start-backend.ps1
│   ├── start-frontend.ps1
│   ├── start-minio.ps1
│   └── register-services.ps1
└── nginx
    ├── conf
    │   └── pranaflow.conf
    └── logs
```

Key runtime processes:

1. **MongoDB** service (Windows service from MSI installer).
2. **MinIO** Windows service (via NSSM or Service Wrapper).
3. **Backend** NestJS process (Node 20 LTS, exposed internally on port `3000`).
4. **Frontend** static files served by Nginx (compiled Vite build).
5. **Nginx** reverse proxy exposing the static IP on ports `80/443`.

---

## 2. Prerequisites & System Hardening

| Component | Version | Notes |
|-----------|---------|-------|
| Windows Server | 2012 R2 64-bit | Ensure latest KB patches & .NET Framework 4.8 installed. |
| Node.js | 20.x LTS (64-bit) | Required for both backend build and pm2/NSSM scripts. |
| npm | Bundled with Node 20 | Use `npm config set prefix "C:\\node-global"` to avoid permission issues. |
| Git | ≥ 2.39 | Optional but simplifies code fetch. |
| Python | 3.9+ | Needed for some npm native builds (bcrypt). |
| MongoDB | 6.0 Community MSI | Install as Windows service pointing to `C:\pranaflow\data\mongodb`. |
| MinIO | RELEASE.2024-10-02T | Download Windows binary. |
| Nginx | 1.26.* (Windows build) | Extract to `C:\nginx`. |
| NSSM | 2.24+ | Simplifies running Node/MinIO as services. |
| OpenSSL | Optional | For generating TLS certificates if terminating TLS on Nginx. |

Security recommendations:
- Disable TLS 1.0/1.1 on the OS.
- Create a service account `pranaflow-svc` with "Log on as a service" rights; run Mongo, MinIO, backend under this account for least privilege.
- Ensure Windows Firewall only exposes ports 80/443 (plus 22 if WinRM/SSH is required) and internally open 3000 (API) + 9000/9001 (MinIO) only for localhost.

---

## 3. Folder Preparation

Run PowerShell as Administrator:

```powershell
New-Item -ItemType Directory -Force -Path "C:\pranaflow\app"
New-Item -ItemType Directory -Force -Path "C:\pranaflow\data\mongodb"
New-Item -ItemType Directory -Force -Path "C:\pranaflow\data\minio"
New-Item -ItemType Directory -Force -Path "C:\pranaflow\nginx\conf"
New-Item -ItemType Directory -Force -Path "C:\pranaflow\nginx\logs"
New-Item -ItemType Directory -Force -Path "C:\pranaflow\services"
```

Clone/copy the repository into `C:\pranaflow\app`:

```powershell
cd C:\pranaflow\app
git clone https://github.com/<org>/pranaflow.git .
```

> ⚠️ If Git is unavailable, copy the repo via ZIP/CI artifact.

---

## 4. MongoDB Installation

1. Download MongoDB 6.0 Community MSI.
2. Run installer, select **Custom** and set data path to `C:\pranaflow\data\mongodb`.
3. Enable "Install MongoDB as a Service"; set service name `MongoDBPranaFlow` and run under `pranaflow-svc` account.
4. Open `C:\Program Files\MongoDB\Server\6.0\bin\mongosh.exe` and create database:

```javascript
use pranaflow;
db.createCollection('init');
```

5. (Optional) Add admin user & enable auth in `mongod.cfg` if required for production.

---

## 5. MinIO Installation (Windows Service)

1. Download the latest Windows release from https://min.io/download#/windows.
2. Place `minio.exe` into `C:\pranaflow\services\minio`.
3. Create `C:\pranaflow\services\start-minio.ps1`:

```powershell
$env:MINIO_ROOT_USER = "minioadmin"
$env:MINIO_ROOT_PASSWORD = "minioadmin"
$env:MINIO_VOLUMES = "C:\pranaflow\data\minio"
cd C:\pranaflow\services\minio
# Console listens on 9001, API on 9000
dotnet .\minio.exe server $env:MINIO_VOLUMES --console-address ":9001" --address ":9000"
```

4. Register the script with NSSM:

```powershell
nssm install MinIOPranaFlow "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" "-File C:\pranaflow\services\start-minio.ps1"
nssm set MinIOPranaFlow AppDirectory "C:\pranaflow\services\minio"
nssm set MinIOPranaFlow AppStdout "C:\pranaflow\services\logs\minio.out.log"
nssm set MinIOPranaFlow AppStderr "C:\pranaflow\services\logs\minio.err.log"
Start-Service MinIOPranaFlow
```

> Ensure ports 9000/9001 are firewall-restricted to the server only; Nginx/Backend talk via localhost.

---

## 6. Backend (NestJS) Deployment

### 6.1 Environment Variables

Copy `backend/.env.example` → `backend/.env` and set values:

```
MONGODB_URI=mongodb://localhost:27017/pranaflow
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=pranaflow-storage
PORT=3000
JWT_SECRET=<long-random-string>
```

> Create the MinIO bucket once via the console: http://localhost:9001 → Buckets → `pranaflow-storage`.

### 6.2 Install Dependencies & Build

```powershell
cd C:\pranaflow\app\backend
npm install --production
npm run build
```

### 6.3 Windows Service Script

`C:\pranaflow\services\start-backend.ps1`:

```powershell
$env:NODE_ENV = "production"
cd C:\pranaflow\app\backend
node dist/main.js
```

Register with NSSM:

```powershell
nssm install PranaFlowBackend "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" "-File C:\pranaflow\services\start-backend.ps1"
nssm set PranaFlowBackend AppDirectory "C:\pranaflow\app\backend"
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
# Point the API to the internal backend URL
setx VITE_API_URL "http://127.0.0.1:3000"
npm run build
```

The Vite build outputs to `frontend/dist`. Copy the contents to `C:\pranaflow\nginx\html` (create folder if missing):

```powershell
New-Item -ItemType Directory -Force -Path "C:\pranaflow\nginx\html"
Copy-Item -Path "C:\pranaflow\app\frontend\dist\*" -Destination "C:\pranaflow\nginx\html" -Recurse -Force
```

### 7.2 (Optional) Frontend Dev Service

If you prefer running `npm run dev` behind Nginx (e.g., staging), create `start-frontend.ps1` similar to backend but pointing to `npm run dev -- --host 0.0.0.0 --port 4173`. Production should serve static assets via Nginx for performance.

---

## 8. Nginx Configuration

1. Download official Nginx Windows zip → extract to `C:\nginx`.
2. Create `C:\nginx\conf\nginx.conf` with:

```nginx
worker_processes  1;
error_log  logs/error.log;
pid        logs/nginx.pid;

events {
    worker_connections  1024;
}

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
    server_name <STATIC_PUBLIC_IP>;

    # Redirect HTTP to HTTPS if TLS configured
    # return 301 https://$host$request_uri;

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

> Replace `<STATIC_PUBLIC_IP>` with the actual IP or DNS record. If HTTPS is required, add `listen 443 ssl;` block with `ssl_certificate` pointing to `.crt/.key`. Use win-acme or Certbot (via WSL) for Let’s Encrypt certificates.

4. Start Nginx:

```powershell
cd C:\nginx
start nginx.exe
```

To reload after config changes:

```powershell
nginx -s reload
```

(Optional) Register Nginx as a service via NSSM just like backend.

---

## 9. Service Registration Helper Script (Optional)

`C:\pranaflow\services\register-services.ps1` consolidates NSSM commands:

```powershell
$nssm = "C:\Tools\nssm.exe"  # adjust path

function Register-Service($name, $scriptPath, $workDir) {
    & $nssm install $name "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" "-File $scriptPath"
    & $nssm set $name AppDirectory $workDir
    & $nssm set $name AppStdout "C:\pranaflow\services\logs\$name.out.log"
    & $nssm set $name AppStderr "C:\pranaflow\services\logs\$name.err.log"
    & $nssm set $name Start SERVICE_AUTO_START
    & $nssm start $name
}

Register-Service -name "PranaFlowBackend" -scriptPath "C:\pranaflow\services\start-backend.ps1" -workDir "C:\pranaflow\app\backend"
Register-Service -name "MinIOPranaFlow" -scriptPath "C:\pranaflow\services\start-minio.ps1" -workDir "C:\pranaflow\services\minio"
```

You can extend the function to include frontend dev server or Nginx if required.

---

## 10. Deployment Workflow

1. **Pull latest code** into `C:\pranaflow\app` (Git or artifact).
2. **Backend**: `npm ci && npm run build` → restart backend service (`Restart-Service PranaFlowBackend`).
3. **Frontend**: `npm ci && npm run build` → copy `dist` to `C:\pranaflow\nginx\html` → `nginx -s reload`.
4. **Database migrations/seed**: run `npm run seed` if necessary (ensure `.env` is configured and backend service is stopped to avoid conflicts).
5. **Health checks**:
   - `curl http://127.0.0.1:3000/health` (implement `/health` endpoint if absent).
   - `curl http://<STATIC_IP>/` to verify SPA loads via Nginx.
   - Upload a file to confirm MinIO integration.

---

## 11. Backup & Recovery

| Component | Strategy |
|-----------|----------|
| MongoDB | Nightly `mongodump` via Task Scheduler → offsite storage.
| MinIO | Use `mc mirror` to replicate `pranaflow-storage` bucket to S3/Azure, or schedule file-system backups of `C:\pranaflow\data\minio` after stopping MinIO service.
| Backend/Frontend | Versioned in Git; rebuild from source.
| Config | Store `.env`, `pranaflow.conf`, and NSSM scripts in a secure repo (avoid secrets in Git by using Windows Credential Manager / Azure Key Vault).

---

## 12. Monitoring & Troubleshooting

- **Logs**
  - Backend: `C:\pranaflow\services\logs\backend.*`
  - MinIO:   `C:\pranaflow\services\logs\minio.*`
  - Nginx:   `C:\pranaflow\nginx\logs\`
- **Services**: `Get-Service PranaFlowBackend`, `Get-Service MinIOPranaFlow`.
- **Ports**: `netstat -ano | findstr :3000`, `:9000`, `:80`.
- **Firewall**: Use `New-NetFirewallRule` to whitelist inbound HTTP/HTTPS only.

---

## 13. Future Enhancements

1. **TLS Automation**: integrate win-acme for automatic Let’s Encrypt renewal.
2. **Process Manager**: consider PM2 or node-windows if NSSM is unavailable.
3. **Observability**: ship logs to ELK/Datadog via nxlog or Fluent Bit.
4. **CI/CD**: produce artifacts (backend `dist`, frontend `dist`) and push to the server via WinRM/SSH + scripts above.

This guide should enable a repeatable Windows Server deployment without Docker, ensuring the frontend, backend, MinIO, MongoDB, and Nginx are installed, started, and exposed over the static IP responsibly.
