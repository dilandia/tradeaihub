# Plano PRO e Supabase — TakeZ Plan

## ⚠️ Site URL no Supabase (importante para o badge PRO)

Se o badge ainda mostra FREE mesmo após o upgrade, **ajuste o Site URL** no Supabase:

1. **Supabase** → **Authentication** → **URL Configuration**
2. **Site URL:** altere de `https://tradeaihub.com/` para **`https://app.tradeaihub.com`**
3. Salve

O app principal está em `app.tradeaihub.com`. Com o Site URL errado, os cookies de sessão podem não funcionar nesse domínio e a API `/api/plan` retorna 401, fazendo o front exibir FREE.

Depois de alterar: faça **logout**, **login** e **atualize a página** (Ctrl+Shift+R).

---

## Banco de dados: onde está?

**Tudo está no Supabase (cloud).** Não há banco local separado. O app (local e VPS) conecta ao mesmo projeto Supabase:

- **URL:** `https://uuijdsofeszoazgfyhve.supabase.co`
- **Tabelas:** `subscriptions`, `ai_credits`, `profiles`, `trades`, etc.

Local e VPS usam o **mesmo banco**. A diferença é só o ambiente (localhost vs app.tradeaihub.com).

## Por que aparecia FREE?

O plano vem da tabela `subscriptions` no Supabase. Se não houver registro com `status = 'active'` ou `'trialing'`, o app mostra FREE.

## Upgrade para PRO (já feito)

O usuário **diegorgo@yahoo.com** foi promovido a PRO. A alteração foi feita diretamente no Supabase.

## Como promover outro usuário a PRO

Execute localmente (com .env.local configurado):

```bash
# Listar usuários
npm run upgrade:pro -- --list

# Promover por email
npm run upgrade:pro -- diegorgo@yahoo.com
```

Ou:

```bash
node scripts/upgrade-user-to-pro.mjs diegorgo@yahoo.com
```

## VPS: conferir Supabase

Se no VPS ainda aparecer FREE após o upgrade, verifique o `.env.local` no VPS:

```bash
ssh takez@116.203.190.102
cat /home/takez/TakeZ-Plan/.env.local
```

Deve ter:

```
NEXT_PUBLIC_SUPABASE_URL=https://uuijdsofeszoazgfyhve.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Se a URL estiver errada (ex: `seu-projeto.supabase.co`), corrija e reinicie:

```bash
pm2 restart takez-plan
```

## Após o upgrade

Faça **logout e login** no app para o badge PRO aparecer corretamente.
