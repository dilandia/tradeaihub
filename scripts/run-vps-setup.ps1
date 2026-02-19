# TakeZ Plan - Executar setup no VPS via SSH
# Execute no PowerShell: .\scripts\run-vps-setup.ps1
#
# Se a senha for rejeitada (Permission denied), use o Rescue System:
# Veja docs/RECUPERAR_ACESSO_VPS.md

$ErrorActionPreference = "Stop"
$VPS_IP = "116.203.190.102"
$VPS_USER = "root"
$SSH_KEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOa/9ORDGpoQcFjGBL5hJ+KFLFq+H8qDv1n17iyiA9fy diegorgc@yahoo.com"

Write-Host "=== TakeZ Plan - Setup VPS ===" -ForegroundColor Cyan
Write-Host ""

# 0. Primeira vez: adicionar chave SSH
Write-Host "[0/3] Adicionando chave SSH ao servidor (pule se já fez)..." -ForegroundColor Yellow
$addKey = "mkdir -p ~/.ssh && grep -qF '$SSH_KEY' ~/.ssh/authorized_keys 2>/dev/null || echo '$SSH_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'Chave OK'"
ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" $addKey 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "      (Digite a senha quando pedir)" -ForegroundColor Gray }
Write-Host ""

# 1. Enviar script (usa chave se já estiver no servidor)
$keyPath = "$env:USERPROFILE\.ssh\hetzner_takez"
Write-Host "[1/3] Enviando vps-setup.sh para o servidor..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=no -i $keyPath "$PSScriptRoot\vps-setup.sh" "${VPS_USER}@${VPS_IP}:/root/" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "      (Chave não configurada - digite a senha)" -ForegroundColor Gray
    scp -o StrictHostKeyChecking=no "$PSScriptRoot\vps-setup.sh" "${VPS_USER}@${VPS_IP}:/root/"
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao enviar arquivo. Verifique a conexão." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/3] Executando setup no servidor (~5-10 min)..." -ForegroundColor Yellow
$runCmd = "chmod +x /root/vps-setup.sh && bash /root/vps-setup.sh"
ssh -o StrictHostKeyChecking=no -i $keyPath "${VPS_USER}@${VPS_IP}" $runCmd 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "      (Digite a senha se pedir)" -ForegroundColor Gray
    ssh -o StrictHostKeyChecking=no "${VPS_USER}@${VPS_IP}" $runCmd
}

Write-Host ""
Write-Host "=== Concluído! ===" -ForegroundColor Green
Write-Host "Próximo passo: conectar como takez e fazer o deploy do projeto."
Write-Host "  ssh takez@$VPS_IP"
Write-Host ""
