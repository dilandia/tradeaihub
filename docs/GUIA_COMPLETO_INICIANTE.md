# Guia Completo para Iniciantes — Deploy TakeZ Plan + AIOS + Claude Code

**Para quem:** Nunca usou Linux, nunca usou VPS, está começando com VS Code.

**O que vamos fazer:**
1. Enviar o TakeZ Plan para o servidor
2. Configurar e rodar o app no VPS
3. Instalar o Synkra AIOS (software house virtual)
4. Configurar o Claude Code para usar os agentes

---

## Índice rápido

| Fase | O que fazer | Onde |
|------|-------------|------|
| **1** | Enviar projeto | Terminal no seu PC (PowerShell) |
| **2** | npm install, .env, build | Terminal conectado ao VPS |
| **3** | PM2 + Nginx | Terminal conectado ao VPS |
| **4** | Instalar AIOS | Terminal no seu PC |
| **5** | Configurar Claude Code | VS Code + SSH |

**Script automático (Fase 1):** No terminal, `.\scripts\1-enviar-projeto.ps1`

---

## Antes de começar — o que você precisa ter

- [ ] **VS Code** instalado (você já tem)
- [ ] **Projeto TakeZ Plan** na pasta `C:\Users\Diego\Documents\TakeZ-Plan`
- [ ] **Chave SSH** em `C:\Users\Diego\.ssh\hetzner_takez_new`
- [ ] **VPS configurado** (IP: 116.203.190.102, usuário: takez)
- [ ] **Chaves do Supabase** (URL, anon key, service_role) — no seu .env.local
- [ ] **Chave da OpenAI** — para a IA funcionar
- [ ] **Chaves do Stripe** (se quiser planos pagos) — opcional no início

---

## FASE 1: Enviar o projeto para o VPS

### Passo 1.1 — Abrir o Terminal no VS Code

1. No VS Code, pressione **Ctrl + `** (a tecla do acento grave, ao lado do 1)
2. Ou clique em **Terminal** no menu → **Novo Terminal**
3. Um painel vai abrir embaixo. Você verá algo como `PS C:\Users\Diego\Documents\TakeZ-Plan>`

**O que é:** O terminal é onde você digita comandos. No Windows, ele usa PowerShell (PS).

---

### Passo 1.2 — Ir para a pasta do projeto

Digite (ou copie e cole) e pressione **Enter**:

```
cd C:\Users\Diego\Documents\TakeZ-Plan
```

**O que faz:** `cd` = "change directory" (mudar de pasta). Garante que você está na pasta certa.

---

### Passo 1.3 — Enviar os arquivos para o servidor

**Importante:** Não enviamos `node_modules` (pesado) nem `.next` (será gerado no servidor).

Digite este comando **inteiro** (uma linha só) e pressione **Enter**:

```
scp -i "$env:USERPROFILE\.ssh\hetzner_takez_new" -r src package.json package-lock.json next.config.ts tailwind.config.ts tsconfig.json postcss.config.mjs .env.example supabase takez@116.203.190.102:/home/takez/TakeZ-Plan/
```

**O que faz:** `scp` = copiar arquivos via SSH. Envia o código fonte e configurações para o servidor.

**Se der erro "pasta não existe":** O servidor pode não ter a pasta. Vamos criar no próximo passo.

---

### Passo 1.4 — Conectar ao servidor e criar a pasta (se precisar)

Se o comando anterior deu erro de "No such file", faça assim:

1. Conecte ao servidor:

```
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez_new" takez@116.203.190.102
```

2. Crie a pasta:

```
mkdir -p /home/takez/TakeZ-Plan
```

3. Saia do servidor:

```
exit
```

4. Repita o **Passo 1.3** (comando scp).

---

### Passo 1.5 — Verificar se os arquivos chegaram

1. Conecte de novo:

```
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez_new" takez@116.203.190.102
```

2. Liste os arquivos:

```
ls -la /home/takez/TakeZ-Plan/
```

Você deve ver: `src`, `package.json`, `supabase`, etc.

3. Saia:

```
exit
```

---

## FASE 2: Configurar .env e instalar dependências no VPS

### Passo 2.1 — Conectar ao servidor

```
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez_new" takez@116.203.190.102
```

---

### Passo 2.2 — Ir para a pasta do projeto

```
cd /home/takez/TakeZ-Plan
```

---

### Passo 2.3 — Instalar as dependências (npm install)

```
npm install
```

**O que faz:** Baixa todas as bibliotecas do projeto (Next.js, React, etc.). Pode levar 2–5 minutos.

---

### Passo 2.4 — Criar o arquivo .env.local

O app precisa de variáveis de ambiente (chaves secretas). Você vai criar o arquivo no servidor.

1. Copie o conteúdo do seu `.env.local` do seu PC (em `C:\Users\Diego\Documents\TakeZ-Plan\.env.local`).

2. No servidor, crie o arquivo:

```
nano .env.local
```

3. **Nano** é um editor de texto no terminal. Cole o conteúdo do seu .env.local (Ctrl+V ou botão direito → Colar).

4. **Para salvar no Nano:**
   - Pressione **Ctrl + O** (letra O)
   - Pressione **Enter** para confirmar
   - Pressione **Ctrl + X** para sair

**Se não tiver .env.local no PC:** Use o `.env.example` como base e preencha com suas chaves (Supabase, OpenAI, etc.).

---

### Passo 2.5 — Fazer o build do projeto

```
npm run build
```

**O que faz:** Compila o Next.js para produção. Pode levar 2–5 minutos.

**Se der erro:** Verifique se o `.env.local` tem todas as chaves obrigatórias (Supabase URL, anon key, service_role, OPENAI_API_KEY).

---

## FASE 3: Rodar o app com PM2 e configurar Nginx

### Passo 3.1 — Iniciar o app com PM2

Ainda com a sessão SSH aberta:

```
pm2 start npm --name takez-plan -- start
```

**O que faz:** PM2 mantém o app rodando 24/7. Se cair, reinicia sozinho.

---

### Passo 3.2 — Salvar a configuração do PM2

```
pm2 save
pm2 startup
```

O `pm2 startup` pode mostrar um comando que começa com `sudo`. **Copie e execute esse comando** (ele configura o PM2 para iniciar quando o servidor reiniciar).

---

### Passo 3.3 — Configurar o Nginx (reverse proxy)

O Nginx vai receber as requisições na porta 80 e encaminhar para o app na porta 3000.

1. Crie o arquivo de configuração:

```
sudo nano /etc/nginx/sites-available/takez
```

2. Cole este conteúdo (use o IP pois ainda não tem domínio):

```
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

3. Salve: **Ctrl+O**, **Enter**, **Ctrl+X**

4. Ative o site e recarregue o Nginx:

```
sudo ln -sf /etc/nginx/sites-available/takez /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

### Passo 3.4 — Testar no navegador

Abra no navegador: **http://116.203.190.102**

Você deve ver o TakeZ Plan. Se aparecer a página de login, está funcionando.

---

## FASE 4: Instalar o Synkra AIOS (software house virtual)

### Passo 4.1 — Onde instalar

Você pode instalar **no seu PC** (recomendado) ou **no VPS**. Recomendo no PC porque o instalador é interativo.

**No seu PC:**

1. Abra o terminal no VS Code (Ctrl + `)
2. Certifique-se de estar na pasta do projeto:

```
cd C:\Users\Diego\Documents\TakeZ-Plan
```

3. Execute:

```
npx aios-core@latest install
```

---

### Passo 4.2 — Responder o assistente

O instalador vai perguntar:

| Pergunta | O que responder |
|----------|------------------|
| Nome do projeto | **TakeZ Plan** (ou Enter para aceitar) |
| Componentes | **Core + Agent System** (mínimo) |
| Gerenciador de pacotes | **npm** |
| IDE | **Claude Code** (ou Cursor se preferir) |

---

### Passo 4.3 — Enviar as alterações para o VPS

O AIOS adiciona pastas como `.aios-core`, `.aios`, `.claude`, `.cursor`. Precisamos enviar isso para o VPS.

1. No terminal do seu PC (PowerShell):

```
scp -i "$env:USERPROFILE\.ssh\hetzner_takez_new" -r .aios-core .aios .claude .cursor AGENTS.md takez@116.203.190.102:/home/takez/TakeZ-Plan/
```

**Se alguma pasta não existir:** O comando pode dar aviso. Envie apenas as que existirem. Por exemplo, se não tiver AGENTS.md:

```
scp -i "$env:USERPROFILE\.ssh\hetzner_takez_new" -r .aios-core .aios .claude .cursor takez@116.203.190.102:/home/takez/TakeZ-Plan/
```

---

## FASE 5: Configurar Claude Code para usar o squad

### Passo 5.1 — O que é Claude Code

Claude Code é o **Claude para desenvolvedores** — você pode usar no navegador (claude.ai/code) ou como extensão. Ele se conecta ao seu projeto e pode editar arquivos.

---

### Passo 5.2 — Instalar a extensão Remote - SSH (se usar VS Code)

No VS Code, você pode usar o projeto **remoto** direto no servidor:

1. Pressione **Ctrl+Shift+X** (abre Extensions)
2. Pesquise por **Remote - SSH**
3. Instale a extensão **Remote - SSH** (Microsoft)

---

### Passo 5.3 — Configurar o SSH config

1. Crie ou edite o arquivo `C:\Users\Diego\.ssh\config`
2. Adicione (ou substitua):

```
Host takez-vps
    HostName 116.203.190.102
    User takez
    IdentityFile C:/Users/Diego/.ssh/hetzner_takez_new
```

3. Salve o arquivo.

---

### Passo 5.4 — Conectar ao VPS pelo VS Code

1. Pressione **Ctrl+Shift+P** (abre a paleta de comandos)
2. Digite: **Remote-SSH: Connect to Host**
3. Selecione **takez-vps**
4. Uma nova janela do VS Code vai abrir, conectada ao servidor
5. Clique em **Open Folder** e escolha: `/home/takez/TakeZ-Plan`

Agora você está editando os arquivos **direto no servidor**.

---

### Passo 5.5 — Usar o Claude Code com o projeto

O **Claude Code** (claude.ai/code ou extensão) usa a pasta do projeto. Se você abrir a pasta `/home/takez/TakeZ-Plan` (via Remote SSH), o Claude já terá acesso aos arquivos e ao AIOS.

**Para ativar um agente no Claude Code:**
- Digite `/dev` para o agente desenvolvedor
- Digite `/architect` para o arquiteto
- Digite `/qa` para QA
- Digite `*help` para ver todos os comandos

---

## Checklist final

- [ ] **Fase 1:** Projeto enviado para o VPS
- [ ] **Fase 2:** .env configurado, npm install, npm run build
- [ ] **Fase 3:** PM2 rodando, Nginx configurado, site acessível em http://116.203.190.102
- [ ] **Fase 4:** AIOS instalado no projeto
- [ ] **Fase 5:** Claude Code configurado para conectar ao VPS

---

## Resumo de comandos (para copiar)

| Onde | Comando |
|------|---------|
| **PC** | `cd C:\Users\Diego\Documents\TakeZ-Plan` |
| **PC** | `scp -i "$env:USERPROFILE\.ssh\hetzner_takez_new" -r src package.json package-lock.json next.config.ts tailwind.config.ts tsconfig.json postcss.config.mjs .env.example supabase takez@116.203.190.102:/home/takez/TakeZ-Plan/` |
| **PC** | `ssh -i "$env:USERPROFILE\.ssh\hetzner_takez_new" takez@116.203.190.102` |
| **VPS** | `cd /home/takez/TakeZ-Plan` |
| **VPS** | `npm install` |
| **VPS** | `nano .env.local` (criar e colar conteúdo) |
| **VPS** | `npm run build` |
| **VPS** | `pm2 start npm --name takez-plan -- start` |
| **VPS** | `pm2 save && pm2 startup` |
| **PC** | `npx aios-core@latest install` |

---

## Se algo der errado

- **Erro de permissão:** Use `sudo` antes do comando (ex: `sudo nano ...`)
- **Conexão recusada:** Verifique se o firewall permite SSH (porta 22) e HTTP (porta 80)
- **Build falha:** Verifique o `.env.local` — Supabase e OpenAI são obrigatórios
- **Site não abre:** Verifique `pm2 status` e `pm2 logs takez-plan` — o app pode ter crashado
