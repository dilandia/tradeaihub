# Deploy TakeZ Plan para VPS
# Execute na raiz do projeto: .\scripts\deploy-takez-vps.ps1

$VPS = "takez@116.203.190.102"
$KEY = "$env:USERPROFILE\.ssh\hetzner_takez_new"
$PROJECT = "/home/takez/TakeZ-Plan"

Write-Host "=== Deploy TakeZ Plan ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Enviando src..." -ForegroundColor Yellow
scp -i $KEY -r "$PSScriptRoot\..\src" "${VPS}:${PROJECT}/"
if ($LASTEXITCODE -ne 0) { Write-Host "Erro no SCP." -ForegroundColor Red; exit 1 }

Write-Host "[2/3] Enviando scripts..." -ForegroundColor Yellow
scp -i $KEY -r "$PSScriptRoot\..\scripts" "${VPS}:${PROJECT}/"
if ($LASTEXITCODE -ne 0) { Write-Host "Erro no SCP scripts." -ForegroundColor Red; exit 1 }

Write-Host "[3/3] Build e restart no VPS..." -ForegroundColor Yellow
ssh -i $KEY -o ConnectTimeout=15 $VPS "cd $PROJECT && npm run build && pm2 restart takez-plan"
if ($LASTEXITCODE -ne 0) { Write-Host "Erro no build/restart." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Deploy concluido!" -ForegroundColor Green
Write-Host "  Landing: https://tradeaihub.com" -ForegroundColor Gray
Write-Host "  App:   https://app.tradeaihub.com" -ForegroundColor Gray
