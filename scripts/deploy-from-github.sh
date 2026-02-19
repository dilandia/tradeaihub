#!/bin/bash
# Deploy TakeZ Plan no VPS via GitHub
# Execute NO VPS: bash scripts/deploy-from-github.sh
# Ou via SSH: ssh takez@116.203.190.102 "cd /home/takez/TakeZ-Plan && bash scripts/deploy-from-github.sh"

set -e
cd /home/takez/TakeZ-Plan

echo "=== Deploy via GitHub ==="
echo "[1/3] git pull..."
git pull origin master

echo "[2/3] Limpando cache e build..."
rm -rf .next
npm run build

echo "[3/3] pm2 restart..."
pm2 restart takez-plan

echo ""
echo "Deploy concluído!"
echo "  Landing: https://tradeaihub.com"
echo "  App:     https://app.tradeaihub.com"
