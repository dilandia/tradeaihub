# TakeZ Plan — Começar do Zero no VPS

Guia para criar um **novo VPS** na Hetzner com a chave SSH configurada desde o início, evitando problemas de senha.

---

## Credenciais novas (guarde em local seguro)

| Item | Valor |
|------|-------|
| **Usuário takez** | `takez` |
| **Senha takez** | `qvZstYia0drblNYV` |
| **Banco** | `takez_plan` |
| **Usuário DB** | `takez_user` |
| **Senha DB** | `TkZ9Bd7Hm2QxR4vLp8Wn` |
| **DATABASE_URL** | `postgresql://takez_user:TkZ9Bd7Hm2QxR4vLp8Wn@localhost:5432/takez_plan` |

---

## Passo 1: Criar novo VPS na Hetzner

1. Acesse [console.hetzner.com](https://console.hetzner.com/)
2. Abra o projeto e clique em **Add Server**
3. Configure:
   - **Location:** Nuremberg (ou outro)
   - **Image:** Ubuntu 24.04
   - **Type:** CPX32 (4 vCPU, 8 GB RAM, 160 GB SSD)
   - **SSH Key:** clique em **Add SSH Key** e cole sua chave pública:
     ```
     ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOa/9ORDGpoQcFjGBL5hJ+KFLFq+H8qDv1n17iyiA9fy diegorgc@yahoo.com
     ```
   - **Name:** `takez-plan` (ou outro)
4. Clique em **Create & Buy Now**
5. **Anote o novo IP** do servidor

---

## Passo 2: Conectar ao novo servidor

No PowerShell (substitua `NOVO_IP` pelo IP):

```powershell
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez" root@NOVO_IP
```

- Se pedir passphrase da chave: digite ou pressione Enter se vazia
- Digite `yes` na primeira vez (fingerprint)

---

## Passo 3: Enviar e executar o setup

No seu PC (PowerShell):

```powershell
cd C:\Users\Diego\Documents\TakeZ-Plan
scp -i "$env:USERPROFILE\.ssh\hetzner_takez" scripts/vps-setup.sh root@NOVO_IP:/root/
```

Depois, no servidor (via SSH):

```bash
chmod +x /root/vps-setup.sh
bash /root/vps-setup.sh
```

Leva ~5–10 minutos. No final, anote as credenciais mostradas.

---

## Passo 4: Conectar como takez e fazer deploy

```powershell
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez" takez@NOVO_IP
```

No servidor:

```bash
cd /home/takez
git clone https://github.com/SEU_USUARIO/TakeZ-Plan.git
cd TakeZ-Plan
```

Ou envie os arquivos via SCP do seu PC.

---

## Se a chave tiver passphrase

Para evitar digitar toda vez:

```powershell
Start-Service ssh-agent
ssh-add "$env:USERPROFILE\.ssh\hetzner_takez"
```

---

## Se não quiser criar chave nova

Crie uma chave **sem passphrase**:

```powershell
ssh-keygen -t ed25519 -C "diegorgc@yahoo.com" -f "$env:USERPROFILE\.ssh\hetzner_takez" -N '""'
```

Depois adicione a nova chave pública no painel da Hetzner ao criar o servidor.

---

## Servidor antigo (116.203.190.102)

Se quiser **apagar** o servidor antigo:

1. No painel Hetzner, selecione o servidor
2. **Delete** (ou **Power** → **Power off**)

Ou mantenha e use o novo IP para o TakeZ Plan.
