# Deploy das correções de segurança para o VPS
# Execute: .\scripts\deploy-vps-security.ps1

$ErrorActionPreference = "Stop"
$keyPath = "$env:USERPROFILE\.ssh\hetzner_takez_new"
$vps = "takez@116.203.190.102"
$dest = "/home/takez/TakeZ-Plan/"
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot

Write-Host "=== Deploy TakeZ Plan (correções de segurança) ===" -ForegroundColor Cyan
Write-Host ""

# 1) Enviar arquivos
Write-Host "[1/2] Enviando arquivos para o VPS..." -ForegroundColor Yellow
ssh -i $keyPath $vps "mkdir -p $dest" 2>$null
scp -i $keyPath -r src package.json package-lock.json next.config.ts tailwind.config.ts tsconfig.json postcss.config.mjs .env.example supabase "${vps}:${dest}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao enviar arquivos." -ForegroundColor Red
    exit 1
}

Write-Host "[2/2] Build e restart no VPS..." -ForegroundColor Yellow
ssh -i $keyPath $vps "cd /home/takez/TakeZ-Plan && npm run build && pm2 restart takez-plan"

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "Erro no build ou restart. Verifique se pm2 está rodando." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "App: https://app.tradeaihub.com" -ForegroundColor Gray
Pop-Location
