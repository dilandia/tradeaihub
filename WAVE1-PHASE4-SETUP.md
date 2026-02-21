# Wave 1 - Phase 4: Database Indexing Setup

## Status
📋 **Phase 4: Indexing** - Em andamento
- Arquivo de migration: `supabase/migrations/20260221_wave1_phase4_indexing.sql`
- Próximo: Phase 5 (Load Testing)

## Como Aplicar os Índices

### Método 1: Supabase Studio (Recomendado)

1. **Acesse o SQL Editor:**
   - https://supabase.com/dashboard/project/uuijdsofeszoazgfyhve/sql/new

2. **Copie o SQL abaixo e execute:**

```sql
-- Wave 1 Phase 4: Database Indexing Strategy
-- Criado em: 2026-02-21

-- Index 1: GIN INDEX para trades.tags
CREATE INDEX IF NOT EXISTS idx_trades_tags_gin
  ON public.trades USING GIN(tags);

-- Index 2: Partial Index - Active Trades (user_id + trade_date)
CREATE INDEX IF NOT EXISTS idx_trades_active_user_date
  ON public.trades(user_id, trade_date DESC)
  WHERE deleted_at IS NULL;

-- Index 3: Composite Index (user_id, trade_date)
CREATE INDEX IF NOT EXISTS idx_trades_user_date
  ON public.trades(user_id, trade_date DESC);

-- Index 4: Import ID Index - Active Trades
CREATE INDEX IF NOT EXISTS idx_trades_import_id_active
  ON public.trades(import_id)
  WHERE deleted_at IS NULL;
```

3. **Clique "Execute" e aguarde a conclusão**

### Método 2: Verificação dos Índices

Após criar, execute esta query para confirmar:

```sql
SELECT indexname, indextype
FROM pg_indexes
WHERE tablename = 'trades'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;
```

### Esperado (4 índices):
- ✅ `idx_trades_tags_gin` (GIN type)
- ✅ `idx_trades_active_user_date` (BTREE type)
- ✅ `idx_trades_user_date` (BTREE type)
- ✅ `idx_trades_import_id_active` (BTREE type)

## Impacto Esperado

### Queries Otimizadas:

| Query | Antes | Depois | Melhoria |
|-------|-------|--------|----------|
| `.contains("tags", ["PATTERN"])` | O(n) | O(log n) | ~100x ⚡ |
| `getTradesPaginated()` | ~500ms | ~50ms | ~10x ⚡ |
| Tag filtering | ~200ms | ~20ms | ~10x ⚡ |
| Soft-delete cascata | ~300ms | ~30ms | ~10x ⚡ |

## Próximas Fases

### Phase 5: Load Testing (~4h)
- [ ] Testar com 10K+ trades
- [ ] Medir performance antes/depois
- [ ] Documentar resultados
- [ ] Validar RLS performance

## Referências
- Arquivo completo: `supabase/migrations/20260221_wave1_phase4_indexing.sql`
- Wave 1 início: Phase 1 (React Cache) ✅
- Wave 1 Phase 2: N+1 Prevention RPC ✅
- Wave 1 Phase 3: Query Consolidation ✅

---
**Status:** ⏳ Aguardando execução manual no Supabase Studio
