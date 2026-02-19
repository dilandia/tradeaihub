#!/bin/bash
# TakeZ Plan - Setup completo do VPS Hetzner
# Execute como root: bash vps-setup.sh

set -e

echo "=== TakeZ Plan - Setup VPS ==="

# --- Parte 1: Atualizar sistema ---
echo "[1/6] Atualizando sistema..."
apt update && apt upgrade -y

# --- Parte 2: Criar usuário takez ---
echo "[2/6] Criando usuário takez..."
if ! id "takez" &>/dev/null; then
  adduser --gecos "" --disabled-password takez
  echo "takez:qvZstYia0drblNYV" | chpasswd
  usermod -aG sudo takez
fi

mkdir -p /home/takez/.ssh
cp /root/.ssh/authorized_keys /home/takez/.ssh/ 2>/dev/null || true
chown -R takez:takez /home/takez/.ssh
chmod 700 /home/takez/.ssh
chmod 600 /home/takez/.ssh/authorized_keys 2>/dev/null || true

# --- Parte 3: Firewall ---
echo "[3/6] Configurando firewall..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

# --- Parte 4: Node.js 20, PostgreSQL, Nginx, PM2 ---
echo "[4/6] Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "[4/6] Instalando PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

echo "[4/6] Instalando Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

echo "[4/6] Instalando PM2..."
npm install -g pm2

# --- Parte 5: PostgreSQL - criar banco ---
echo "[5/6] Configurando PostgreSQL..."
DB_PASS="TkZ9Bd7Hm2QxR4vLp8Wn"
sudo -u postgres psql -c "CREATE USER takez_user WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE takez_plan OWNER takez_user;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE takez_plan TO takez_user;"
sudo -u postgres psql -c "ALTER USER takez_user WITH SUPERUSER;" 2>/dev/null || true

echo ""
echo "=== SENHA DO BANCO (guarde): $DB_PASS ==="
echo "DATABASE_URL=postgresql://takez_user:$DB_PASS@localhost:5432/takez_plan"
echo ""

# --- Parte 6: Git ---
echo "[6/6] Instalando Git..."
apt install -y git

echo ""
echo "=== Setup concluído! ==="
echo ""
echo "Próximos passos:"
echo "1. Conecte como takez: ssh takez@116.203.190.102"
echo "2. Clone o projeto ou envie os arquivos"
echo "3. Configure .env e rode npm run build && pm2 start npm --name takez-plan -- start"
echo ""
echo "Senha do usuário takez: qvZstYia0drblNYV (troque depois!)"
echo "Senha do banco: $DB_PASS"
echo ""
