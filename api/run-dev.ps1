# Carrega variáveis do .env e sobe a API Spring Boot
# Uso: ./run-dev.ps1

$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Error ".env não encontrado em $envFile"
    exit 1
}

# Lê o .env e monta os argumentos JVM
$jvmArgs = Get-Content $envFile |
    Where-Object { $_ -match '^\s*[^#]\S+=\S' } |
    ForEach-Object {
        $parts = $_ -split '=', 2
        "-D$($parts[0].Trim())=$($parts[1].Trim())"
    }

$jvmArgsString = $jvmArgs -join ' '

Write-Host "Subindo FieldOps API com variaveis do .env..." -ForegroundColor Cyan
mvn spring-boot:run "-Dspring-boot.run.jvmArguments=$jvmArgsString"
