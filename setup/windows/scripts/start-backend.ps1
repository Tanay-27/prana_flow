param(
    [string]$BackendPath = "C:\pranaflow\app\backend",
    [string]$NodeBinary = "C:\\Program Files\\nodejs\\node.exe"
)

if (-not (Test-Path $BackendPath)) {
    Write-Error "Backend path '$BackendPath' not found."
    exit 1
}

Set-Location $BackendPath

if (-not (Test-Path "dist/main.js")) {
    Write-Warning "dist/main.js not found. Run 'npm install' and 'npm run build' before starting the service."
}

$env:NODE_ENV = "production"

& $NodeBinary "dist/main.js"
