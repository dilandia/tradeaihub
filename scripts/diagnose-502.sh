#!/bin/bash
# Diagnóstico rápido do erro 502
# Executar no VPS: bash scripts/diagnose-502.sh
# Ou via SSH: ssh takez@116.203.190.102 "cd /home/takez/TakeZ-Plan && bash scripts/diagnose-502.sh"

echo "========================================="
echo "  DIAGNÓSTICO 502 — TradeAI Hub"
echo "========================================="
echo ""

# 1. PM2 status
echo "--- [1/7] PM2 Status ---"
pm2 list 2>/dev/null || echo "❌ PM2 não encontrado ou sem processos"
echo ""

# 2. PM2 process details
echo "--- [2/7] PM2 Process Info ---"
pm2 show takez-plan 2>/dev/null | head -20 || echo "❌ Processo takez-plan não existe"
echo ""

# 3. Porta 3000 em uso?
echo "--- [3/7] Porta 3000 ---"
if ss -tlnp | grep -q ':3000'; then
  echo "✅ Porta 3000 está a escutar"
  ss -tlnp | grep ':3000'
else
  echo "❌ Porta 3000 NÃO está a escutar — Next.js está em baixo!"
fi
echo ""

# 4. Nginx status
echo "--- [4/7] Nginx Status ---"
systemctl is-active nginx 2>/dev/null && echo "✅ Nginx está ativo" || echo "❌ Nginx está parado"
nginx -t 2>&1 || echo "❌ Config Nginx com erros"
echo ""

# 5. Memória
echo "--- [5/7] Memória ---"
free -h
echo ""

# 6. Disco
echo "--- [6/7] Espaço em disco ---"
df -h / | tail -1
echo ""

# 7. Últimos logs de erro do PM2
echo "--- [7/7] Últimos erros PM2 (últimas 30 linhas) ---"
pm2 logs takez-plan --err --lines 30 --nostream 2>/dev/null || echo "Sem logs disponíveis"
echo ""

echo "========================================="
echo "  RESUMO RÁPIDO"
echo "========================================="

# Summary
ISSUES=0

if ! pm2 list 2>/dev/null | grep -q "online"; then
  echo "🔴 PM2: Processo NÃO está online"
  ISSUES=$((ISSUES+1))
else
  echo "🟢 PM2: Online"
fi

if ! ss -tlnp | grep -q ':3000'; then
  echo "🔴 Porta 3000: Não está a escutar"
  ISSUES=$((ISSUES+1))
else
  echo "🟢 Porta 3000: A escutar"
fi

if ! systemctl is-active --quiet nginx; then
  echo "🔴 Nginx: Parado"
  ISSUES=$((ISSUES+1))
else
  echo "🟢 Nginx: Ativo"
fi

MEM_AVAIL=$(free -m | awk '/Mem:/ {print $7}')
if [ "$MEM_AVAIL" -lt 200 ] 2>/dev/null; then
  echo "🔴 Memória: Apenas ${MEM_AVAIL}MB disponível (crítico!)"
  ISSUES=$((ISSUES+1))
else
  echo "🟢 Memória: ${MEM_AVAIL}MB disponível"
fi

DISK_USE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USE" -gt 90 ] 2>/dev/null; then
  echo "🔴 Disco: ${DISK_USE}% usado (crítico!)"
  ISSUES=$((ISSUES+1))
else
  echo "🟢 Disco: ${DISK_USE}% usado"
fi

echo ""
if [ "$ISSUES" -eq 0 ]; then
  echo "✅ Tudo parece OK. O problema pode ser temporário."
  echo "   Tente: pm2 restart takez-plan"
else
  echo "⚠️  $ISSUES problema(s) encontrado(s)."
  echo "   Corra: bash scripts/fix-502.sh"
fi
echo ""
