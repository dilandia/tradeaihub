# Guia Completo: TakeZ Plan no Hetzner CX33

Este guia acompanha você do zero até o TakeZ Plan rodando no Hetzner. Para cada etapa, você pode me chamar e eu te ajudo.

---

## ⚠️ Importante: Supabase vs PostgreSQL local

O TakeZ Plan hoje usa **Supabase** (auth + banco na nuvem). Você tem duas opções:

1. **Testar o VPS primeiro:** Rode o app como está, mantendo Supabase temporariamente. Só o Next.js fica no VPS. Bom para validar servidor, Nginx, PM2.
2. **Migrar tudo:** Trocar Supabase por PostgreSQL local + auth próprio (NextAuth ou similar). Exige alterações no código — podemos fazer isso em etapas depois que o VPS estiver ok.

Recomendo: **contrate o VPS, siga o guia até a Parte 6, e me avise quando estiver pronto.** Aí decidimos se testamos com Supabase primeiro ou já partimos para a migração.

---

## Parte 1: Contratar o VPS

### 1.1 Criar conta na Hetzner

1. Acesse [hetzner.com/cloud](https://www.hetzner.com/cloud/)
2. Clique em **Sign Up**
3. Preencha e-mail, senha, país
4. Confirme o e-mail

### 1.2 Criar o servidor (CX33)

1. No **Cloud Console**, clique em **New Project** → nomeie (ex: "TakeZ Plan")
2. Clique em **Add Server**
3. Configure:
   - **Location:** Germany (NBG1) ou Finland (FSN1)
   - **Image:** **Ubuntu 24.04**
   - **Type:** Shared → **Cost-Optimized** → **CX33** (4 vCPU, 8 GB RAM, 80 GB SSD)
   - **SSH Key:** (veja 1.3 abaixo)
   - **Name:** `takez-plan` (ou outro)
4. Clique em **Create & Buy Now**
5. Anote o **IP público** (ex: `95.217.xxx.xxx`)

### 1.3 Gerar chave SSH (no seu PC Windows)

Abra o **PowerShell** e rode:

```powershell
ssh-keygen -t ed25519 -C "seu-email@exemplo.com" -f "$env:USERPROFILE\.ssh\hetzner_takez"
```

- Pressione Enter para senha vazia (ou defina uma)
- Depois, mostre a chave pública:

```powershell
Get-Content "$env:USERPROFILE\.ssh\hetzner_takez.pub"
```

- Copie todo o texto (começa com `ssh-ed25519`)
- Na Hetzner, em **SSH Key**, clique em **Add SSH Key** e cole

**Se não adicionar chave SSH:** a Hetzner mostra uma senha root na tela. Guarde-a — você precisará para o primeiro login.

---

## Parte 2: Primeiro acesso ao servidor

### 2.1 Conectar via SSH

No PowerShell (substitua pelo seu IP):

```powershell
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez" root@95.217.xxx.xxx
```

Se usou senha em vez de chave:

```powershell
ssh root@95.217.xxx.xxx
```

- Digite `yes` na primeira vez (fingerprint)
- Se pedir senha, use a que a Hetzner mostrou

Você deve ver algo como `root@takez-plan:~#`.

---

## Parte 3: Configuração inicial do servidor

Rode os comandos abaixo **um por um** (ou em blocos, se preferir).

### 3.1 Atualizar o sistema

```bash
apt update && apt upgrade -y
```

### 3.2 Criar usuário (não usar root no dia a dia)

```bash
adduser takez
usermod -aG sudo takez
```

- Defina uma senha forte para `takez`
- Preencha nome etc. ou deixe em branco (Enter)

### 3.3 Configurar SSH para o novo usuário

```bash
mkdir -p /home/takez/.ssh
cp /root/.ssh/authorized_keys /home/takez/.ssh/
chown -R takez:takez /home/takez/.ssh
chmod 700 /home/takez/.ssh
chmod 600 /home/takez/.ssh/authorized_keys
```

### 3.4 Firewall básico

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
ufw status
```

### 3.5 Sair e entrar como `takez`

```bash
exit
```

Depois:

```powershell
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez" takez@95.217.xxx.xxx
```

---

## Parte 4: Instalar Node.js, PostgreSQL, Nginx, PM2

### 4.1 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # deve mostrar v20.x
npm -v
```

### 4.2 PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4.3 Nginx (reverse proxy)

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4.4 PM2 (gerenciar processos Node)

```bash
sudo npm install -g pm2
```

---

## Parte 5: Configurar o PostgreSQL

### 5.1 Criar banco e usuário

```bash
sudo -u postgres psql
```

Dentro do `psql`:

```sql
CREATE USER takez_user WITH PASSWORD 'SENHA_FORTE_AQUI';
CREATE DATABASE takez_plan OWNER takez_user;
GRANT ALL PRIVILEGES ON DATABASE takez_plan TO takez_user;
\q
```

Troque `SENHA_FORTE_AQUI` por uma senha segura.

### 5.2 Permitir conexões locais (se necessário)

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Na seção `# IPv4 local connections`, adicione (ou ajuste):

```
host    takez_plan    takez_user    127.0.0.1/32    scram-sha-256
```

Salve (Ctrl+O, Enter, Ctrl+X).

```bash
sudo systemctl restart postgresql
```

---

## Parte 6: Preparar e deployar o TakeZ Plan

### 6.1 Instalar Git

```bash
sudo apt install -y git
```

### 6.2 Clonar o projeto (ou enviar via SCP/rsync)

**Opção A:** Se o repositório estiver no GitHub:

```bash
cd /home/takez
git clone https://github.com/SEU_USUARIO/TakeZ-Plan.git
cd TakeZ-Plan
```

**Opção B:** Enviar do seu PC por SCP:

No seu PC (PowerShell), na pasta do projeto:

```powershell
scp -i "$env:USERPROFILE\.ssh\hetzner_takez" -r . takez@95.217.xxx.xxx:/home/takez/TakeZ-Plan
```

### 6.3 Instalar dependências

```bash
cd /home/takez/TakeZ-Plan
npm install
```

### 6.4 Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

**Se ainda usar Supabase (teste inicial):** use as mesmas variáveis do seu `.env.local` atual:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
# Stripe, MetaApi, ENCRYPTION_KEY, etc.
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

**Depois da migração para PostgreSQL:** o `.env` terá `DATABASE_URL` e auth próprio em vez de Supabase.

### 6.5 Build

```bash
npm run build
```

### 6.6 Rodar com PM2

```bash
pm2 start npm --name "takez-plan" -- start
pm2 save
pm2 startup
```

O último comando vai mostrar um comando para rodar; rode-o como indicado.

---

## Parte 7: Nginx (reverse proxy)

### 7.1 Configurar site

```bash
sudo nano /etc/nginx/sites-available/takez
```

Cole (ajuste o `server_name` e o IP se for diferente):

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    # ou use o IP: server_name 95.217.xxx.xxx;

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
```

### 7.2 Ativar e testar

```bash
sudo ln -s /etc/nginx/sites-available/takez /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7.3 Testar

No navegador: `http://95.217.xxx.xxx` ou `http://seu-dominio.com`

---

## Parte 8: SSL (HTTPS) com Let's Encrypt

Só faça isso quando tiver um domínio apontando para o IP do servidor.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

Siga o assistente. O Certbot configura o Nginx e renova o certificado automaticamente.

---

## Comandos úteis

| Ação | Comando |
|------|---------|
| Ver logs do app | `pm2 logs takez-plan` |
| Reiniciar app | `pm2 restart takez-plan` |
| Reiniciar Nginx | `sudo systemctl restart nginx` |
| Status do PostgreSQL | `sudo systemctl status postgresql` |
| Ver uso de disco | `df -h` |
| Ver uso de RAM | `free -h` |

---

## Próximos passos (quando você estiver pronto)

1. **Migrar de Supabase para PostgreSQL** — ajustar o código para usar o banco local
2. **Configurar domínio** — apontar DNS para o IP do VPS
3. **Webhook Stripe** — URL: `https://seu-dominio.com/api/stripe/webhook`
4. **Backup** — script de backup do PostgreSQL

---

## Checklist de ajuda

Quando precisar de ajuda, me diga em qual etapa está:

- [ ] Parte 1: Contratar o VPS
- [ ] Parte 2: Primeiro acesso ao servidor
- [ ] Parte 3: Configuração inicial
- [ ] Parte 4: Instalar Node, PostgreSQL, Nginx, PM2
- [ ] Parte 5: Configurar PostgreSQL
- [ ] Parte 6: Deploy do TakeZ Plan
- [ ] Parte 7: Nginx
- [ ] Parte 8: SSL
- [ ] Migração Supabase → PostgreSQL

**Pode me chamar a qualquer momento.** Boa sorte com o CX33.
