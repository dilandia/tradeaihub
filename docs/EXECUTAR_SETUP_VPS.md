# Executar Setup no VPS — Passo a Passo

O ambiente do Cursor não consegue conectar ao seu VPS. Execute estes comandos **no seu PowerShell** ou **Windows Terminal**.

**Começar do zero?** Veja **`docs/INICIO_DO_ZERO.md`** — guia para criar um novo VPS com chave SSH desde o início (evita problemas de senha).

---

## ⚠️ Se a senha não funcionar (Permission denied)

O Ubuntu na Hetzner costuma aceitar **apenas chave SSH** para root. Se a senha for rejeitada, use o **Rescue System** para adicionar sua chave. Siga: **`docs/RECUPERAR_ACESSO_VPS.md`**

---

## Passo 0: Primeira conexão (com senha)

Se o servidor aceitar senha, conecte assim:

```powershell
ssh root@116.203.190.102
```

**Senha:** a que a Hetzner mostrou ao criar/resetar o servidor.

Na primeira vez, digite `yes` para aceitar o fingerprint do servidor.

---

## Passo 0b: Adicionar sua chave SSH (uma vez só)

**Dentro do servidor** (após conectar), rode:

```bash
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOa/9ORDGpoQcFjGBL5hJ+KFLFq+H8qDv1n17iyiA9fy diegorgc@yahoo.com" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Depois disso, você poderá usar a chave e não precisará mais digitar a senha.

---

## Passo 1: Enviar o script para o servidor

Saia do servidor (`exit`) e, no PowerShell, na pasta do projeto:

```powershell
cd C:\Users\Diego\Documents\TakeZ-Plan
scp -i "$env:USERPROFILE\.ssh\hetzner_takez" scripts/vps-setup.sh root@116.203.190.102:/root/
```

Se a chave ainda não estiver no servidor, use sem `-i` (vai pedir a senha):

```powershell
scp scripts/vps-setup.sh root@116.203.190.102:/root/
```

---

## Passo 2: Conectar ao servidor

```powershell
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez" root@116.203.190.102
```

(Se a chave não funcionar, use `ssh root@116.203.190.102` e digite a senha.)

---

## Passo 3: Executar o script (dentro do servidor)

Quando estiver conectado (verá `root@Server-tradeAihub:~#`):

```bash
chmod +x /root/vps-setup.sh
bash /root/vps-setup.sh
```

O script vai:
- Atualizar o sistema
- Criar usuário `takez` (senha: `TakeZ2025!Secure`)
- Configurar firewall
- Instalar Node.js 20, PostgreSQL, Nginx, PM2, Git
- Criar banco `takez_plan` e usuário `takez_user`

**Leva ~5–10 minutos.** No final, anote a senha do banco que aparecer.

---

## Passo 4: Sair e conectar como takez

```bash
exit
```

```powershell
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez" takez@116.203.190.102
```

---

## Passo 5: Enviar o projeto TakeZ Plan

**Opção A — Git (recomendado):** Se o projeto estiver no GitHub, no servidor:

```bash
cd /home/takez
git clone https://github.com/SEU_USUARIO/TakeZ-Plan.git
cd TakeZ-Plan
```

**Opção B — SCP (arquivos essenciais, sem node_modules):** No servidor, crie a pasta: `mkdir -p /home/takez/TakeZ-Plan`. No seu PC:

```powershell
cd C:\Users\Diego\Documents\TakeZ-Plan
scp -i "$env:USERPROFILE\.ssh\hetzner_takez" -r src package.json package-lock.json next.config.ts tailwind.config.ts tsconfig.json postcss.config.mjs .env.example supabase docs scripts takez@116.203.190.102:/home/takez/TakeZ-Plan/
```

Depois, no servidor: `cd /home/takez/TakeZ-Plan && npm install`

---

## Credenciais criadas pelo script

| Item | Valor |
|------|-------|
| Usuário SSH | `takez` |
| Senha SSH | `qvZstYia0drblNYV` |
| Banco | `takez_plan` |
| Usuário DB | `takez_user` |
| Senha DB | `TkZ9Bd7Hm2QxR4vLp8Wn` |
| DATABASE_URL | `postgresql://takez_user:TkZ9Bd7Hm2QxR4vLp8Wn@localhost:5432/takez_plan` |

**Troque essas senhas depois do primeiro acesso.**

---

## Passo 6: Instalar Synkra AIOS (depois do deploy)

Quando o TakeZ Plan estiver rodando, instale o AIOS para usar os agentes (analyst, pm, architect, dev, qa, etc.):

```bash
cd /home/takez/TakeZ-Plan
npx aios-core@latest install
```

Siga o assistente (escolha Cursor como IDE). Veja **`docs/INSTALAR_AIOS_VPS.md`** para detalhes.

---

## Se preferir fazer manualmente (sem script)

Conecte e rode os comandos do `scripts/vps-setup.sh` um por um. O script está em `scripts/vps-setup.sh` no seu projeto.
