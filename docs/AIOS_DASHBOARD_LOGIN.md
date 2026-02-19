# AIOS Dashboard — Login corrigido

## Localização

- **Caminho no VPS:** `/home/takez/aios-core/dashboard`
- **URL:** https://tradeaihub.com/aios/login
- **Proxy Nginx:** `/aios` → `http://127.0.0.1:4001`

## O que foi corrigido

1. **Rota de login** (`app/api/auth/login/route.ts`):
   - Troca de `getIronSession` por `sealData` (compatível com Next.js 15)
   - Cookie com `path: '/aios'` para funcionar com basePath
   - Leitura do body com `req.text()` + `JSON.parse` para evitar erros de parsing

2. **Session** (`src/lib/session.ts`):
   - `path: '/aios'` em `cookieOptions` para o basePath

3. **Nova senha:** `TakeZ2026nova`

## Credenciais

| Variável | Valor |
|----------|-------|
| Senha de acesso | `TakeZ2026nova` |
| DASHBOARD_PASSWORD | Definido em `.env.local` e `ecosystem.config.js` |

## Como alterar a senha

1. SSH no VPS:
   ```bash
   ssh -i ~/.ssh/hetzner_takez_new takez@116.203.190.102
   ```

2. Editar `.env.local` e `ecosystem.config.js`:
   ```bash
   cd /home/takez/aios-core/dashboard
   nano .env.local   # alterar DASHBOARD_PASSWORD
   nano ecosystem.config.js  # alterar DASHBOARD_PASSWORD no env
   ```

3. Reiniciar:
   ```bash
   pm2 reload ecosystem.config.js --update-env
   ```

## Teste no navegador

1. Acesse https://tradeaihub.com/aios/login
2. Digite a senha: **TakeZ2026nova**
3. Clique em **Entrar**

Se ainda travar, verifique os logs:
```bash
pm2 logs aios-dashboard
```
