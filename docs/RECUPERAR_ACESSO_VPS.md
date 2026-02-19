# Recuperar Acesso ao VPS — Quando a Senha Não Funciona

O Ubuntu na Hetzner Cloud costuma ter **apenas login por chave SSH** para root. A senha é ignorada mesmo que esteja correta. Use o **Rescue System** para adicionar sua chave.

---

## Passo 1: Ativar o Rescue no painel Hetzner

1. Acesse [console.hetzner.com](https://console.hetzner.com/)
2. Abra o projeto e selecione o servidor **Server-tradeAihub** (IP: 116.203.190.102)
3. No menu superior do servidor, clique em **Rescue**
4. Selecione **linux64** como sistema
5. **Importante:** em **SSH Key**, escolha **Add SSH Key** e cole sua chave pública:
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOa/9ORDGpoQcFjGBL5hJ+KFLFq+H8qDv1n17iyiA9fy diegorgc@yahoo.com
   ```
6. Clique em **Enable rescue & power cycle** (ativa e reinicia o servidor)

O servidor vai reiniciar e bootar no sistema de resgate. A Hetzner mostra uma **senha temporária** na tela — guarde-a.

---

## Passo 2: Limpar o fingerprint antigo (no seu PC)

No PowerShell:

```powershell
ssh-keygen -R 116.203.190.102
```

---

## Passo 3: Conectar ao Rescue

```powershell
ssh root@116.203.190.102
```

- Se escolheu a chave no passo 1: deve conectar direto
- Se não: use a senha temporária que a Hetzner mostrou

---

## Passo 4: Montar o disco e adicionar sua chave

**Dentro do Rescue**, rode (um comando por vez):

```bash
# Ver o disco
fdisk -l
```

Procure a partição principal (ex: `/dev/sda1` ou `/dev/nvme0n1p1`). Use o que aparecer. Exemplo com `/dev/sda1`:

```bash
# Montar o sistema
mount /dev/sda1 /mnt

# Se usar nvme (verifique com fdisk -l):
# mount /dev/nvme0n1p1 /mnt

# Criar .ssh no root do sistema real
mkdir -p /mnt/root/.ssh

# Adicionar sua chave
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOa/9ORDGpoQcFjGBL5hJ+KFLFq+H8qDv1n17iyiA9fy diegorgc@yahoo.com" >> /mnt/root/.ssh/authorized_keys

# Permissões corretas
chmod 700 /mnt/root/.ssh
chmod 600 /mnt/root/.ssh/authorized_keys

# Desmontar
umount /mnt
```

---

## Passo 5: Desativar Rescue e reiniciar

1. No painel Hetzner, vá em **Rescue** de novo
2. Clique em **Disable rescue**
3. Reinicie o servidor (Power → Restart)

---

## Passo 6: Conectar com sua chave

Depois que o servidor subir (1–2 min):

```powershell
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez" root@116.203.190.102
```

Deve conectar sem pedir senha.

---

## Se a partição for diferente

Se `fdisk -l` mostrar algo como `/dev/nvme0n1p1` em vez de `/dev/sda1`, use:

```bash
mount /dev/nvme0n1p1 /mnt
```

E siga o resto igual.
