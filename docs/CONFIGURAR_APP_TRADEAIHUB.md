# Configurar app.tradeaihub.com

Guia para ter:
- **tradeaihub.com** / **www.tradeaihub.com** → Landing page (marketing)
- **app.tradeaihub.com** → Login, dashboard e todo o sistema

---

## Visão geral

| Domínio | Destino | Conteúdo |
|---------|---------|----------|
| tradeaihub.com | Hostinger | Landing page (marketing) |
| www.tradeaihub.com | Hostinger | Landing page |
| app.tradeaihub.com | VPS 116.203.190.102 | Login, dashboard, sistema completo |

---

## 1. DNS na Hostinger

1. Acesse: **Hostinger** → **Domínios** → **tradeaihub.com** → **DNS / Nameservers** → **Gerenciar DNS**

2. **Registros para o app** (subdomínio):
   - Adicione um registro **A**:
     - **Nome:** `app`
     - **Aponta para:** `116.203.190.102`
     - **TTL:** 300

3. **Registros para a landing** (domínio principal):
   - **@** e **www** devem apontar para o **hospedagem da Hostinger** (não para o VPS).
   - Se hoje @ e www apontam para 116.203.190.102, altere para o IP da Hostinger ou use o construtor de sites da Hostinger.
   - No painel Hostinger: **Website** → crie ou edite o site em tradeaihub.com. O DNS @ e www será configurado automaticamente para a landing.

4. Salve. A propagação pode levar até 48h (geralmente minutos).

**Alternativa:** Se ainda não tiver landing page na Hostinger, pode deixar @ e www apontando para o VPS e criar depois. O importante é que **app** aponte para 116.203.190.102.

---

## 2. Nginx no VPS (com HTTPS)

Conecte ao VPS e execute:

```bash
ssh -i ~/.ssh/hetzner_takez_new takez@116.203.190.102
```

### 2.1 Atualizar config do Nginx

```bash
sudo tee /etc/nginx/sites-available/takez << 'EOF'
server {
    listen 80;
    server_name app.tradeaihub.com 116.203.190.102;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/takez /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 2.2 Instalar Certbot e obter SSL (HTTPS)

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.tradeaihub.com --non-interactive --agree-tos -m seu-email@exemplo.com
```

Substitua `seu-email@exemplo.com` pelo seu e-mail. O Certbot configura HTTPS automaticamente.

---

## 3. Variáveis de ambiente no VPS

Edite o `.env.local` no VPS:

```bash
nano /home/takez/TakeZ-Plan/.env.local
```

Defina:

```
NEXT_PUBLIC_APP_URL=https://app.tradeaihub.com
```

Reinicie o app:

```bash
cd /home/takez/TakeZ-Plan && pm2 restart takez-plan
```

---

## 4. Supabase Auth

1. **Supabase** → **Authentication** → **URL Configuration**
2. **Site URL:** `https://app.tradeaihub.com`
3. **Redirect URLs:** adicione:
   - `https://app.tradeaihub.com/**`
   - `https://app.tradeaihub.com`

---

## 5. Stripe (se usar)

No Stripe Dashboard, atualize o webhook para:
- URL: `https://app.tradeaihub.com/api/stripe/webhook`

E em **Customer portal** / **Checkout**, use `https://app.tradeaihub.com` como base URL.

---

## Resumo

| Etapa | Onde | O quê |
|-------|------|-------|
| 1 | Hostinger DNS | A record `app` → `116.203.190.102` |
| 2 | VPS Nginx | server_name app.tradeaihub.com |
| 3 | VPS Certbot | SSL para app.tradeaihub.com |
| 4 | VPS .env.local | NEXT_PUBLIC_APP_URL=https://app.tradeaihub.com |
| 5 | Supabase Auth | Site URL e Redirect URLs |
| 6 | PM2 | pm2 restart takez-plan |
