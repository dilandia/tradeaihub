# Passo 1 - Enviar projeto TakeZ Plan para o VPS
# Execute: .\scripts\1-enviar-projeto.ps1

$ErrorActionPreference = "Stop"
$keyPath = "$env:USERPROFILE\.ssh\hetzner_takez_new"
$vps = "takez@116.203.190.102"
$dest = "/home/takez/TakeZ-Plan/"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=== Enviando TakeZ Plan para o VPS ===" -ForegroundColor Cyan
Write-Host ""

# Criar pasta no servidor se não existir
Write-Host "[1/2] Criando pasta no servidor (se precisar)..." -ForegroundColor Yellow
ssh -i $keyPath $vps "mkdir -p $dest" 2>$null

# Enviar arquivos
Write-Host "[2/2] Enviando arquivos..." -ForegroundColor Yellow
Set-Location $projectRoot
$scpDest = "${vps}:/home/takez/TakeZ-Plan/"
scp -i $keyPath -r src package.json package-lock.json next.config.ts tailwind.config.ts tsconfig.json postcss.config.mjs .env.example supabase $scpDest

Write-Host ""
Write-Host "Concluído! Proximo passo: conectar ao VPS e rodar npm install" -ForegroundColor Green
Write-Host "  ssh -i `"`$env:USERPROFILE\.ssh\hetzner_takez_new`" takez@116.203.190.102" -ForegroundColor Gray
