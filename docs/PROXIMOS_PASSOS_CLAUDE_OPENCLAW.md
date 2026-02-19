# Próximos Passos — Deploy, Claude Code e OpenClaw

Guia para colocar o TakeZ Plan no ar e configurar **Claude Code** e **OpenClaw** para os agentes trabalharem no VPS.

---

## Visão geral

| Etapa | O que faz |
|-------|-----------|
| 1. Deploy | TakeZ Plan rodando no VPS (PM2 + Nginx) |
| 2. Claude Code | Configurar SSH remoto para editar no servidor |
| 3. AIOS (Synkra) | Agentes (analyst, pm, architect, dev, qa) no Cursor/Claude Code |
| 4. OpenClaw | Framework de agentes IA (opcional, alternativo ao AIOS) |

---

## Etapa 1: Deploy do TakeZ Plan no VPS

### 1.1 Conectar via SSH

```powershell
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez_new" takez@116.203.190.102
```

### 1.2 Enviar o projeto

**Opção A — Git (se o projeto estiver no GitHub):**

```bash
cd /home/takez
git clone https://github.com/SEU_USUARIO/TakeZ-Plan.git
cd TakeZ-Plan
```

**Opção B — SCP (do seu PC):**

No PowerShell:

```powershell
cd C:\Users\Diego\Documents\TakeZ-Plan
scp -i "$env:USERPROFILE\.ssh\hetzner_takez_new" -r src package.json package-lock.json next.config.ts tailwind.config.ts tsconfig.json postcss.config.mjs .env.example supabase docs scripts takez@116.203.190.102:/home/takez/TakeZ-Plan/
```

No servidor:

```bash
cd /home/takez/TakeZ-Plan
npm install
```

### 1.3 Configurar .env

No servidor:

```bash
cd /home/takez/TakeZ-Plan
cp .env.example .env.local
nano .env.local
```

Preencha com suas chaves (Supabase, Stripe, OpenAI, etc.). Use `CREDENCIAIS_VPS.txt` para a senha do banco se migrar para PostgreSQL local.

### 1.4 Build e PM2

```bash
cd /home/takez/TakeZ-Plan
npm run build
pm2 start npm --name takez-plan -- start
pm2 save
pm2 startup
```

### 1.5 Nginx (reverse proxy)

```bash
sudo nano /etc/nginx/sites-available/takez
```

Cole (use o IP se não tiver domínio):

```nginx
server {
    listen 80;
    server_name 116.203.190.102;

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

Ativar:

```bash
sudo ln -sf /etc/nginx/sites-available/takez /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Teste: `http://116.203.190.102`

---

## Etapa 2: Claude Code com SSH remoto

Para os agentes do Claude Code trabalharem **direto no VPS**:

### 2.1 Configurar Remote SSH no Claude Code

1. Abra o **Claude Code** (ou Cursor com extensão Remote SSH)
2. `Ctrl+Shift+P` → **Remote-SSH: Connect to Host**
3. Adicione: `takez@116.203.190.102`
4. Configure o SSH config (em `~/.ssh/config` ou `C:\Users\Diego\.ssh\config`):

```
Host takez-vps
    HostName 116.203.190.102
    User takez
    IdentityFile ~/.ssh/hetzner_takez_new
```

No Windows, use o caminho completo: `C:\Users\Diego\.ssh\hetzner_takez_new`

5. Conecte e abra a pasta `/home/takez/TakeZ-Plan`

A partir daí, os agentes do Claude Code editam os arquivos no servidor.

---

## Etapa 3: Synkra AIOS — Software House Virtual

O [Synkra AIOS](https://github.com/SynkraAI/aios-core) adiciona um **squad de agentes** (analyst, pm, architect, sm, dev, qa) que funcionam como uma software house virtual para te ajudar a desenvolver o TakeZ Plan.

### 3.1 Instalar no projeto

**No seu PC** (recomendado — depois envie para o VPS):

```powershell
cd C:\Users\Diego\Documents\TakeZ-Plan
npx aios-core@latest install
```

**Ou no VPS** (via SSH):

```bash
cd /home/takez/TakeZ-Plan
npx aios-core@latest install
```

No assistente, escolha: **Claude Code** (paridade completa) ou **Cursor**.

### 3.2 Usar os agentes

- **Claude Code:** Digite `/dev`, `/architect`, `/qa`, etc. — `*help` para comandos
- **Cursor:** Regras em `.cursor/rules/` — use `/dev` ou `@dev`

**Guia completo:** `docs/INSTALAR_AIOS_VPS.md`

---

## Etapa 4: OpenClaw (opcional)

[OpenClaw](https://github.com/openclaw-ai/openclaw) é um framework de agentes IA com runtime, ferramentas e workflows.

### 4.1 Onde usar

- **Local:** OpenClaw roda no seu PC e pode se conectar ao VPS via SSH
- **No VPS:** Para agentes 24/7 no servidor (mais avançado)

### 4.2 Instalação rápida (local)

```powershell
# Windows - via pip ou npm
pip install openclaw
# ou
npx @openclaw/cli init
```

### 4.3 Integração com Claude Code

OpenClaw pode ser usado como CLI para orquestrar tarefas. Configure as ferramentas (SSH, Git, etc.) no perfil do agente para que ele acesse o VPS.

Documentação: [docs.openclaw.ai](https://docs.openclaw.ai)

---

## Resumo

| Etapa | Comando | Status |
|-------|---------|--------|
| 1. Deploy | `npm run build && pm2 start`, Nginx | Faça primeiro |
| 2. Claude Code | SSH config + Remote-SSH | Conectar ao VPS |
| 3. AIOS | `npx aios-core@latest install` | Agentes no projeto |
| 4. OpenClaw | `pip install openclaw` ou CLI | Opcional |

---

## Credenciais

- **SSH:** `takez@116.203.190.102` (chave: `hetzner_takez_new`)
- **Senha takez:** `qvZstYia0drblNYV`
- **Banco:** `postgresql://takez_user:TkZ9Bd7Hm2QxR4vLp8Wn@localhost:5432/takez_plan`
