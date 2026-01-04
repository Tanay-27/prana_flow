param(
    [string]$NssmPath = "C:\\Tools\\nssm.exe",
    [string]$BackendScript = "C:\\pranaflow\\services\\start-backend.ps1",
    [string]$MinioScript = "C:\\pranaflow\\services\\start-minio.ps1",
    [string]$LogsPath = "C:\\pranaflow\\services\\logs",
    [string]$ServiceAccount = ".\\pranaflow-svc"
)

function Ensure-File {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        throw "Required file not found: $Path"
    }
}

Ensure-File $NssmPath
Ensure-File $BackendScript
Ensure-File $MinioScript

if (-not (Test-Path $LogsPath)) {
    New-Item -ItemType Directory -Force -Path $LogsPath | Out-Null
}

function Register-PranaService {
    param(
        [string]$Name,
        [string]$ScriptPath
    )

    & $NssmPath install $Name "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" "-ExecutionPolicy Bypass -File $ScriptPath"
    & $NssmPath set $Name ObjectName $ServiceAccount
    & $NssmPath set $Name AppDirectory (Split-Path -Path $ScriptPath -Parent)
    & $NssmPath set $Name AppStdout "$LogsPath\\$Name.out.log"
    & $NssmPath set $Name AppStderr "$LogsPath\\$Name.err.log"
    & $NssmPath set $Name Start SERVICE_AUTO_START
    & $NssmPath start $Name
}

Register-PranaService -Name "PranaFlowBackend" -ScriptPath $BackendScript
Register-PranaService -Name "MinIOPranaFlow" -ScriptPath $MinioScript
