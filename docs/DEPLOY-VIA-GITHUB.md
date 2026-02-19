# Deploy via GitHub – TakeZ Plan / Trade AI Hub

Fluxo recomendado: **código local → push GitHub → pull no VPS → build → restart**.

---

## 1. Configuração inicial (uma vez)

### No seu PC

```powershell
cd C:\Users\Diego\Documents\TakeZ-Plan
git remote -v   # deve mostrar origin → https://github.com/dilandia/tradeaihub.git
```

### No VPS

O projeto já está em `/home/takez/TakeZ-Plan`. Se foi clonado manualmente antes, configure o remote:

```bash
cd /home/takez/TakeZ-Plan
git remote -v
# Se não tiver origin:
git remote add origin https://github.com/dilandia/tradeaihub.git
```

**Repositório privado?** Configure autenticação no VPS:

- **Opção A – Deploy key (SSH):** Crie uma chave no VPS, adicione em GitHub → Settings → Deploy keys, e use `git@github.com:dilandia/tradeaihub.git` como remote.
- **Opção B – Token (HTTPS):** Crie um Personal Access Token no GitHub e use:
  ```bash
  git remote set-url origin https://SEU_TOKEN@github.com/dilandia/tradeaihub.git
  ```

---

## 2. Fluxo de deploy

### Passo 1: No seu PC (após alterar o código)

```powershell
cd C:\Users\Diego\Documents\TakeZ-Plan
git add -A
git commit -m "descrição da alteração"
git push origin master
```

### Passo 2: No VPS (puxar e publicar)

```bash
cd /home/takez/TakeZ-Plan
bash scripts/deploy-from-github.sh
```

Ou em uma linha via SSH (do seu PC):

```powershell
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez_new" takez@116.203.190.102 "cd /home/takez/TakeZ-Plan && bash scripts/deploy-from-github.sh"
```

---

## 3. Comandos Git úteis

| Comando | O que faz |
|---------|-----------|
| `git status` | Mostra arquivos alterados |
| `git add -A` | Adiciona todas as alterações |
| `git commit -m "mensagem"` | Cria commit com mensagem |
| `git push origin master` | Envia commits para o GitHub |
| `git pull origin master` | Baixa alterações do GitHub |
| `git log --oneline -5` | Últimos 5 commits |

---

## 4. Checklist antes do push

- [ ] `.env.local` e credenciais **não** estão no commit (já no `.gitignore`)
- [ ] `npm run build` passa localmente
- [ ] Testes relevantes passando (se houver)

---

## 5. Estrutura do repositório

```
tradeaihub/
├── src/           # Código fonte
├── scripts/       # Scripts de deploy e Nginx
├── docs/          # Documentação
├── .gitignore     # Arquivos ignorados (env, node_modules, etc.)
└── package.json
```
