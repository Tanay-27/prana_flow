param(
    [string]$FrontendPath = "C:\pranaflow\app\frontend",
    [string]$NodeBinary = "C:\\Program Files\\nodejs\\node.exe",
    [int]$Port = 4173,
    [switch]$DevServer
)

if (-not (Test-Path $FrontendPath)) {
    Write-Error "Frontend path '$FrontendPath' not found."
    exit 1
}

Set-Location $FrontendPath

if (-not (Test-Path "dist")) {
    Write-Warning "dist folder missing. Run 'npm install' and 'npm run build' for production." 
}

if ($DevServer) {
    & "C:\\Program Files\\nodejs\\npm.cmd" "run" "dev" "--" "--host" "0.0.0.0" "--port" $Port
} else {
    # No long-running process required for static hosting; exit quietly.
    Write-Output "Frontend build copied to nginx; no service needed."
}
