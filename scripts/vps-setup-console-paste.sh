#!/bin/bash
# === COMO USAR NO CONSOLE WEB DA HETZNER ===
#
# OPÇÃO 1 - Se o projeto estiver no GitHub:
#   curl -sSL https://raw.githubusercontent.com/SEU_USER/TakeZ-Plan/main/scripts/vps-setup.sh | bash
#
# OPÇÃO 2 - Colar manualmente:
#   1. Digite: cat > /tmp/setup.sh << 'ENDOFSCRIPT'
#   2. Cole TODO o conteúdo abaixo (da linha set -e até o último echo)
#   3. Digite: ENDOFSCRIPT
#   4. Digite: bash /tmp/setup.sh
#
# ============================================

set -e
echo "=== TakeZ Plan - Setup VPS ==="

echo "[1/6] Atualizando sistema..."
apt update && apt upgrade -y

echo "[2/6] Criando usuário takez..."
if ! id "takez" &>/dev/null; then
  adduser --gecos "" --disabled-password takez
  echo "takez:qvZstYia0drblNYV" | chpasswd
  usermod -aG sudo takez
fi

mkdir -p /home/takez/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOa/9ORDGpoQcFjGBL5hJ+KFLFq+H8qDv1n17iyiA9fy diegorgc@yahoo.com" >> /root/.ssh/authorized_keys 2>/dev/null || true
cp /root/.ssh/authorized_keys /home/takez/.ssh/ 2>/dev/null || true
chown -R takez:takez /home/takez/.ssh
chmod 700 /home/takez/.ssh /root/.ssh
chmod 600 /home/takez/.ssh/authorized_keys /root/.ssh/authorized_keys 2>/dev/null || true

echo "[3/6] Configurando firewall..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

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

echo "[5/6] Configurando PostgreSQL..."
DB_PASS="TkZ9Bd7Hm2QxR4vLp8Wn"
sudo -u postgres psql -c "CREATE USER takez_user WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE takez_plan OWNER takez_user;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE takez_plan TO takez_user;"
sudo -u postgres psql -c "ALTER USER takez_user WITH SUPERUSER;" 2>/dev/null || true

echo "[6/6] Instalando Git..."
apt install -y git

echo ""
echo "=== SETUP CONCLUÍDO! ==="
echo ""
echo "SENHA DO BANCO: $DB_PASS"
echo "DATABASE_URL=postgresql://takez_user:$DB_PASS@localhost:5432/takez_plan"
echo ""
echo "Usuário takez - senha: qvZstYia0drblNYV"
echo "Conecte: ssh -i ~/.ssh/hetzner_takez takez@116.203.190.102"
echo ""
