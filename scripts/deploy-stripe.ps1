# Deploy TakeZ Plan + Stripe para VPS
# Execute: .\scripts\deploy-stripe.ps1

$ErrorActionPreference = "Stop"
$key = "$env:USERPROFILE\.ssh\hetzner_takez_new"
$vps = "takez@116.203.190.102"
$dest = "/home/takez/TakeZ-Plan/"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "=== Deploy TakeZ Plan (Stripe) ===" -ForegroundColor Cyan

# 1. Enviar .env.local
Write-Host "`n[1/4] Enviando .env.local..." -ForegroundColor Yellow
scp -i $key "$root\.env.local" "${vps}:${dest}.env.local"

# 2. Enviar código
Write-Host "[2/4] Enviando código..." -ForegroundColor Yellow
Set-Location $root
scp -i $key -r src package.json package-lock.json next.config.ts tailwind.config.ts tsconfig.json postcss.config.mjs supabase scripts docs .env.example "${vps}:${dest}"

# 3. Build no VPS
Write-Host "[3/4] Rodando npm install e build no VPS..." -ForegroundColor Yellow
ssh -i $key $vps "cd $dest && npm install && npm run build"

# 4. Restart PM2
Write-Host "[4/4] Reiniciando PM2..." -ForegroundColor Yellow
ssh -i $key $vps "cd $dest && pm2 restart takez-plan || pm2 start npm --name takez-plan -- start"

Write-Host "`n=== Deploy concluído ===" -ForegroundColor Green
Write-Host "URL: https://116.203.190.102" -ForegroundColor Gray
