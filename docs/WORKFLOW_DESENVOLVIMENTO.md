# Workflow — Desenvolvimento e Deploy TakeZ Plan

**Estratégia:** Desenvolver no Cursor (local) + Claude Code → Deploy para o VPS (produção).

---

## Onde cada coisa roda

| Onde | O que |
|------|-------|
| **Cursor (seu PC)** | Editar código, testar com `npm run dev` |
| **Claude Code** | Agentes, ajuda com código, revisões |
| **VPS (116.203.190.102)** | Produção — app em produção, host do SaaS |

---

## Fluxo de trabalho

### 1. Desenvolver localmente

```powershell
cd C:\Users\Diego\Documents\TakeZ-Plan
npm run dev
```

Acesse http://localhost:3000 para testar. O app local usa o mesmo Supabase do VPS (dados compartilhados).

### 2. Quando estiver pronto para publicar

```powershell
# Enviar código para o VPS
.\scripts\1-enviar-projeto.ps1

# Conectar e fazer build
ssh -i "$env:USERPROFILE\.ssh\hetzner_takez_new" takez@116.203.190.102
cd ~/TakeZ-Plan
npm install
npm run build
pm2 restart takez-plan
```

### 3. Se mudar só o .env.local

O script **não envia** `.env.local` (segurança). Se adicionar variáveis novas (ex: Stripe), edite no VPS:

```bash
nano ~/TakeZ-Plan/.env.local
pm2 restart takez-plan
```

---

## Resumo

- **Editar:** Cursor (local)
- **Ajuda com código:** Claude Code
- **Testar:** `npm run dev` local
- **Publicar:** `1-enviar-projeto.ps1` + build no VPS
- **Produção:** http://116.203.190.102
