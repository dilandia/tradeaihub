# Configuração do Supabase – TakeZ Plan

## 1. Variáveis de ambiente

O arquivo **`.env.local`** já foi criado na raiz do projeto com a URL e as chaves do seu projeto Supabase. O Next.js carrega esse arquivo automaticamente (o build já mostrou "Environments: .env.local").

- O `.env.local` está no `.gitignore` e não será commitado.
- Se precisar trocar as chaves no futuro, edite `.env.local` ou use `.env.example` como referência dos nomes das variáveis.

---

## 2. Rodar a migration no banco

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto.
2. Vá em **SQL Editor** → **New query**.
3. Abra o arquivo `supabase/migrations/20250213000000_create_profiles_and_trades.sql` neste projeto.
4. Copie todo o conteúdo e cole no editor SQL.
5. Clique em **Run**. Deve criar as tabelas `profiles` e `trades` com RLS e o trigger de novo usuário.

---

## 3. Auth no Supabase (opcional para email/senha)

1. No Dashboard: **Authentication → Providers**.
2. **Email** já vem ativado (email + senha).
3. Se quiser **Confirm email** desativado em desenvolvimento: **Authentication → Settings → Auth** e ajuste “Enable email confirmations” conforme quiser.

Depois disso, o login e o registro do app devem funcionar.
