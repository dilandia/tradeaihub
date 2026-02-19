---
name: security-data-exposure
description: Previne exposição de dados sensíveis, informações no console e falhas de segurança no TakeZ-Plan. Ativa em code review, ao adicionar console.log/error, ao tratar erros, ao criar APIs ou ao manipular dados de trading/contas. Garante que tokens, senhas, IDs de conta, dados de trades e erros internos nunca vazem para o cliente ou logs.
---

# Security Data Exposure – TakeZ-Plan

Subagente de segurança focado em **evitar exposição desnecessária de dados** e **informações sensíveis no console**. Atua proativamente para que falhas nessa área não ocorram.

## Quando ativar

- Code review ou revisão de PR
- Adicionar `console.log`, `console.debug`, `console.info`, `console.warn`, `console.error`
- Tratar erros e exceções
- Criar ou modificar rotas `/api/*`
- Manipular dados de trading, contas MetaApi, Supabase
- Integrar APIs externas (MetaApi, Finnhub, Twelve Data, etc.)
- Expor dados em respostas HTTP ou Server Actions

## Dados sensíveis no TakeZ-Plan

| Categoria | Exemplos | Nunca expor em |
|-----------|----------|----------------|
| Credenciais | `SUPABASE_SERVICE_ROLE_KEY`, `METAAPI_TOKEN`, `OPENAI_API_KEY`, `ENCRYPTION_KEY` | código, logs, respostas |
| Tokens/JWT | `SUPABASE_ANON_KEY`, tokens de sessão | console, respostas de API |
| IDs internos | `account_id` MetaApi, `user_id`, IDs de contas de trading | console em produção |
| Dados de conta | login, server, platform, senhas criptografadas | logs, respostas |
| Dados de trades | valores exatos, P&L, posições | console em produção |
| Stack traces | `error.stack`, detalhes de erro interno | respostas ao cliente |
| Env vars | qualquer `process.env` com segredo | client-side, logs |

## Regras de console

### ❌ Nunca fazer

```typescript
console.log("[metaApi] Creating account...", { login, server, platform });
console.log("[metaApi] Account created:", data.id);
console.error("[sync] Insert error:", insertErr);  // pode conter dados sensíveis
console.log("User:", user);  // user pode ter campos sensíveis
```

### ✅ Fazer em dev (opcional)

```typescript
if (process.env.NODE_ENV === "development") {
  console.log("[metaApi] Account created (id omitido em prod)");
}
```

### ✅ Padrão recomendado

```typescript
// Erros: só mensagem genérica + correlation ID
console.error("[metaApi] Create error:", errBody.message ?? "Unknown");
// Nunca: errBody completo, stack, tokens

// Logs informativos: sem dados sensíveis
console.log("[metaApi] Account created successfully");
console.warn("[metaApi] 429 rate limited, retrying...");
```

## Regras de respostas de API

### ❌ Nunca retornar ao cliente

- Stack traces
- Mensagens de erro internas (ex.: mensagem de exceção do banco)
- Objetos de erro completos
- IDs internos desnecessários
- Detalhes de configuração

### ✅ Padrão de erro em API

```typescript
try {
  // ...
} catch (err) {
  const correlationId = crypto.randomUUID();
  console.error(`[${correlationId}] Internal error:`, err?.message ?? "Unknown");
  return NextResponse.json(
    { error: "An error occurred. Please try again.", correlationId },
    { status: 500 }
  );
}
```

## Checklist de verificação

Antes de commitar ou fazer merge:

- [ ] Nenhum `console.log` com objetos que possam conter tokens, IDs de conta ou dados de usuário
- [ ] `console.error` não expõe stack trace, corpo de erro completo ou credenciais
- [ ] Respostas de API não retornam mensagens de erro internas nem stack
- [ ] Nenhuma variável `NEXT_PUBLIC_` com segredos
- [ ] `.env.local` e `.env.production` no `.gitignore`
- [ ] Server Actions e rotas `/api` não vazam dados sensíveis em mensagens de erro

## Padrões específicos do TakeZ-Plan

### metaapi-sync.ts e similares

- Logs de progresso: OK sem dados sensíveis (ex.: "Sync started", "Deals fetched")
- Evitar: `accountId`, `login`, `server`, corpo de `errBody` completo
- Em erros: logar apenas `status`, `message` genérica, nunca o body inteiro

### Rotas /api/ai/*

- Erros: mensagem genérica + correlation ID
- Nunca: stack, chaves de API, prompts ou respostas brutas da IA

### Server Actions (trading-accounts, trades, etc.)

- `console.error` com `error.message` é aceitável se a mensagem for genérica
- Evitar: `error` completo, objetos com `user_id` ou dados de conta

## Integração com regras existentes

Este skill complementa `.cursor/rules.md`:

- **04 - Secrets Vault**: reforça que logs não devem expor env vars
- **08 - Error Handling**: reforça que erros ao cliente devem ser genéricos
- **01 - Security Isolation**: reforça que dados sensíveis não vão para o client

## Ação em caso de violação

Se encontrar violação:

1. Remover ou redactar o dado sensível do log/resposta
2. Usar mensagem genérica ou correlation ID
3. Em dev: considerar `NODE_ENV === "development"` para logs verbosos
4. Nunca commitar correção que ainda exponha dados
