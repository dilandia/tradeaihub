# Passos Manuais – Configuração dos Agentes de IA

> **Somente você pode fazer estes passos.** São configurações que exigem chaves de API e decisões de conta.

---

## 1. Configurar a chave da OpenAI

Os agentes de IA usam a **OpenAI** (GPT-4o-mini por padrão). Recomendação:

- **GPT-4o-mini**: melhor custo/benefício, respostas rápidas
- **GPT-4o**: melhor qualidade para análises mais complexas

### Passo a passo

1. Acesse [platform.openai.com](https://platform.openai.com) e faça login
2. Vá em **API Keys** → **Create new secret key**
3. Copie a chave (começa com `sk-...`)
4. Abra o arquivo `.env.local` na raiz do projeto
5. Adicione a linha:

```env
OPENAI_API_KEY=sk-sua-chave-aqui
```

6. Salve o arquivo e reinicie o servidor de desenvolvimento (`npm run dev`)

> **Importante:** Nunca commite o `.env.local` no Git. Ele já está no `.gitignore`.

---

## 2. Variáveis de ambiente (referência)

| Variável        | Obrigatória | Descrição                          |
|-----------------|-------------|------------------------------------|
| `OPENAI_API_KEY`| Sim         | Chave da API OpenAI para os agentes |

---

## 3. Executar migration do cache (Supabase)

Para ativar o cache de insights (reduz custos com chamadas repetidas):

1. Acesse o **Supabase Dashboard** → **SQL Editor**
2. Crie uma nova query e cole o conteúdo de `supabase/migrations/20250213140000_create_ai_insights_cache.sql`
3. Execute a query

Ou, se usar Supabase CLI: `supabase db push`

## 4. O que já está implementado

- Cliente LLM em `src/lib/ai/client.ts`
- Agentes: Report Summary, Performance Insights, Pattern Detection, Risk Analysis
- APIs em `/api/ai/*`
- **Cache de 1 hora** em `ai_insights_cache` (Supabase) – reduz custos
- Central de Agentes em `/ai-hub`
- Integração no Dashboard (rodapé), AI Insights, Relatório Overview, Relatório Risk

---

## 5. Se aparecer erro "OPENAI_API_KEY não configurada"

1. Confirme que a chave está em `.env.local`
2. Reinicie o `npm run dev`
3. Verifique se a chave está correta (sem espaços extras)

---

## 6. Custos estimados (OpenAI)

- **GPT-4o-mini**: ~US$ 0,15 / 1M tokens de entrada, ~US$ 0,60 / 1M tokens de saída
- Cada insight usa ~500–1500 tokens em média
- 100 insights/mês ≈ US$ 0,10–0,30

---

*Documento criado em fev/2025.*
