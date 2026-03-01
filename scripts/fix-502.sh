#!/bin/bash
# Correção rápida do erro 502
# Executar no VPS: bash scripts/fix-502.sh
# Ou via SSH: ssh takez@116.203.190.102 "cd /home/takez/TakeZ-Plan && bash scripts/fix-502.sh"

set -e

echo "========================================="
echo "  FIX 502 — TradeAI Hub"
echo "========================================="
echo ""

cd /home/takez/TakeZ-Plan

# 1. Verificar e limpar memória se necessário
echo "[1/5] Verificando memória..."
MEM_AVAIL=$(free -m | awk '/Mem:/ {print $7}')
echo "  Memória disponível: ${MEM_AVAIL}MB"
if [ "$MEM_AVAIL" -lt 200 ] 2>/dev/null; then
  echo "  ⚠️  Memória baixa! Limpando caches do sistema..."
  sync && echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null 2>&1 || true
  MEM_AVAIL=$(free -m | awk '/Mem:/ {print $7}')
  echo "  Memória após limpeza: ${MEM_AVAIL}MB"
fi
echo ""

# 2. Parar PM2 process se existir
echo "[2/5] Parando processo PM2..."
pm2 stop takez-plan 2>/dev/null || true
pm2 delete takez-plan 2>/dev/null || true
echo "  ✅ Processo limpo"
echo ""

# 3. Verificar se .next existe e tem build válido
echo "[3/5] Verificando build..."
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
  echo "  ⚠️  Build não encontrado ou inválido. Reconstruindo..."
  rm -rf .next
  npm run build
  echo "  ✅ Build concluído"
else
  BUILD_AGE=$(( ($(date +%s) - $(stat -c %Y .next/BUILD_ID)) / 3600 ))
  echo "  ✅ Build encontrado (${BUILD_AGE}h atrás)"
fi
echo ""

# 4. Reiniciar Next.js via PM2
echo "[4/5] Iniciando Next.js via PM2..."
pm2 start npm --name takez-plan -- start
sleep 3

# Verificar se arrancou
if pm2 list | grep -q "online"; then
  echo "  ✅ PM2 online"
else
  echo "  ❌ PM2 falhou. Verificando logs..."
  pm2 logs takez-plan --err --lines 20 --nostream
  exit 1
fi
echo ""

# 5. Verificar Nginx e recarregar
echo "[5/5] Verificando Nginx..."
if ! systemctl is-active --quiet nginx; then
  echo "  Nginx parado. Reiniciando..."
  sudo systemctl start nginx
fi
sudo nginx -t 2>&1 && sudo systemctl reload nginx
echo "  ✅ Nginx OK"
echo ""

# Teste final
echo "========================================="
echo "  TESTE FINAL"
echo "========================================="
sleep 2

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ --max-time 10 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ]; then
  echo "✅ Next.js respondendo! (HTTP $HTTP_CODE)"
  echo ""
  echo "🎉 Servidor restaurado!"
  echo "  Landing: https://tradeaihub.com"
  echo "  App:     https://app.tradeaihub.com"
else
  echo "❌ Next.js não está a responder (HTTP $HTTP_CODE)"
  echo ""
  echo "Possíveis problemas:"
  echo "  1. Variáveis .env em falta — verifique: cat .env | head"
  echo "  2. Erro no build — corra: npm run build"
  echo "  3. Falta de memória — verifique: free -h"
  echo ""
  echo "Logs de erro:"
  pm2 logs takez-plan --err --lines 20 --nostream 2>/dev/null
fi

# Salvar PM2 para auto-restart
pm2 save 2>/dev/null || true
echo ""
