# Prompt para Claude — Landing + App no mesmo VPS

Copie e cole o texto abaixo para o Claude:

---

## Contexto

Tenho um projeto Next.js (TakeZ Plan) que hoje tem:
- `/login` e `/register` — autenticação
- `/` e rotas em `(dashboard)/` — dashboard completo (após login)
- Middleware que redireciona usuário não logado para `/login`

O app está no VPS 116.203.190.102. O domínio é tradeaihub.com (Hostinger).

## Objetivo

Quero que **tudo fique no mesmo VPS e no mesmo IP**, mas com conteúdo diferente conforme o domínio:

| Domínio | Conteúdo |
|---------|----------|
| tradeaihub.com | Landing page (marketing) — pública, sem login |
| www.tradeaihub.com | Landing page (mesma) |
| app.tradeaihub.com | Login, dashboard e todo o sistema atual |

## O que preciso

1. **Landing page** — Criar uma página de marketing em `/` que só aparece quando o host for `tradeaihub.com` ou `www.tradeaihub.com`. Deve ter: hero, benefícios, CTA para "Acessar o app" (link para https://app.tradeaihub.com), design moderno e responsivo.

2. **Lógica por host** — Quando o host for `app.tradeaihub.com`, manter o comportamento atual: usuário não logado vai para `/login`, logado vai para o dashboard. A landing NUNCA aparece em app.tradeaihub.com.

3. **Middleware** — Ajustar o middleware para:
   - Em `tradeaihub.com` ou `www`: permitir acesso à landing sem auth; não redirecionar para login.
   - Em `app.tradeaihub.com`: comportamento atual (proteger rotas, redirecionar para login se não logado).

4. **Nginx** — Atualizar o `server_name` para aceitar os três: `tradeaihub.com www.tradeaihub.com app.tradeaihub.com`.

5. **DNS** — Documentar: os três domínios apontam para o mesmo IP (116.203.190.102). Não precisa de IPs diferentes.

## Stack

- Next.js 15, App Router
- Tailwind CSS
- Supabase Auth
- O projeto já tem i18n (pt-BR, en) — a landing deve respeitar o idioma selecionado

## Restrições

- Não criar um projeto separado. Tudo no mesmo app Next.js.
- A landing deve ser leve e responsiva (mobile-first).
- Manter o sistema de idiomas existente.

---

Implemente a landing page, a lógica por host e as alterações no middleware e no Nginx. Atualize a documentação em `docs/CONFIGURAR_APP_TRADEAIHUB.md` para refletir que tudo roda no mesmo VPS.
