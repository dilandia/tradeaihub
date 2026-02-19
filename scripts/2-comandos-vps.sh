#!/bin/bash
# Passo 2 - Comandos para rodar NO SERVIDOR (via SSH)
# Conecte: ssh -i ~/.ssh/hetzner_takez_new takez@116.203.190.102
# Depois copie e cole estes comandos um por um (ou em blocos)

cd /home/takez/TakeZ-Plan

# Instalar dependências
npm install

# CRIAR .env.local antes do build!
# Use: nano .env.local
# Cole o conteúdo do seu .env.local do PC e salve (Ctrl+O, Enter, Ctrl+X)

# Build
npm run build

# Iniciar com PM2
pm2 start npm --name takez-plan -- start
pm2 save
pm2 startup
# Execute o comando que o pm2 startup mostrar (começa com sudo)
