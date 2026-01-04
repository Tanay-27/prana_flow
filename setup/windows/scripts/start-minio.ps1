param(
    [string]$MinioBinary = "C:\\pranaflow\\services\\minio\\minio.exe",
    [string]$DataPath = "C:\\pranaflow\\data\\minio",
    [string]$ApiAddress = ":9000",
    [string]$ConsoleAddress = ":9001",
    [string]$AccessKey = "minioadmin",
    [string]$SecretKey = "minioadmin"
)

if (-not (Test-Path $MinioBinary)) {
    Write-Error "MinIO binary not found at '$MinioBinary'."
    exit 1
}

if (-not (Test-Path $DataPath)) {
    New-Item -ItemType Directory -Force -Path $DataPath | Out-Null
}

$env:MINIO_ROOT_USER = $AccessKey
$env:MINIO_ROOT_PASSWORD = $SecretKey

& $MinioBinary server $DataPath --address $ApiAddress --console-address $ConsoleAddress
