# Status do Deploy — TakeZ Plan

**Data:** 18/02/2025

---

## ✅ O que já foi feito

| Fase | Status | Detalhes |
|------|--------|----------|
| **1. Enviar projeto** | ✅ Concluído | Arquivos enviados via SCP para `/home/takez/TakeZ-Plan/` |
| **2. Build** | ✅ Concluído | `npm install` + `npm run build` executados com sucesso |
| **3. PM2 + Nginx** | ✅ Concluído | App rodando, site em http://116.203.190.102 |
| **4. .env.local** | ✅ Concluído | Chaves copiadas do PC para o VPS |

---

## 📦 O que está no VPS

| Item | Status |
|------|--------|
| Código fonte (`src/`) | ✅ |
| Configs (package.json, tsconfig, etc.) | ✅ |
| Supabase (migrations) | ✅ |
| `.env.local` (chaves) | ✅ (você copiou) |
| `node_modules` | ✅ (npm install) |
| Build (`.next/`) | ✅ (npm run build) |

**URL:** http://116.203.190.102

---

## 🔄 Local vs VPS — quando usar cada um

### Para USAR o app (login, trades, relatórios)
**Não precisa rodar local.** Acesse http://116.203.190.102 de qualquer lugar. O VPS é a produção.

### Para DESENVOLVER (novas features, correções)
Você pode:
- **Opção A:** Editar via Remote-SSH no Cursor → mudanças direto no VPS. Depois: `npm run build` + `pm2 restart takez-plan`
- **Opção B:** Desenvolver local no PC (`npm run dev`) → quando pronto, enviar com `.\scripts\1-enviar-projeto.ps1` e fazer build no VPS

### Supabase
O banco está na nuvem. Tanto o app local quanto o do VPS usam o mesmo Supabase. Os dados são compartilhados.

---

## ⚠️ Se o login ainda der "fetch failed"

1. **Rebuild no VPS:** `npm run build` e `pm2 restart takez-plan`
2. **Supabase Dashboard** → Authentication → URL Configuration: adicione `http://116.203.190.102` em Redirect URLs
3. Confira se o `.env.local` no VPS tem `NEXT_PUBLIC_APP_URL=http://116.203.190.102`

---

## Comandos úteis

| Ação | Comando |
|------|---------|
| Ver status do app | `pm2 list` |
| Ver logs | `pm2 logs takez-plan` |
| Reiniciar app | `pm2 restart takez-plan` |
| Parar app | `pm2 stop takez-plan` |

---

## Próximos passos (Fases 4 e 5)

- **Fase 4:** Instalar Synkra AIOS no projeto
- **Fase 5:** Configurar Claude Code para usar o squad via Remote-SSH

Consulte `docs/GUIA_COMPLETO_INICIANTE.md` para os detalhes.
