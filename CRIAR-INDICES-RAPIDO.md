# ⚡ Criar Índices - 2 minutos

## Copie este SQL INTEIRO:

```sql
CREATE INDEX IF NOT EXISTS idx_trades_tags_gin ON public.trades USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_trades_active_user_date ON public.trades(user_id, trade_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trades_user_date ON public.trades(user_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_import_id_active ON public.trades(import_id) WHERE deleted_at IS NULL;

-- Verificar criação:
SELECT indexname FROM pg_indexes WHERE tablename = 'trades' AND indexname LIKE 'idx_%' ORDER BY indexname;
```

## Execute em 3 passos:

**1. Abra URL:**
```
https://supabase.com/dashboard/project/uuijdsofeszoazgfyhve/sql/new
```

**2. Cola o SQL acima**

**3. Click no botão "Execute"**

## ✅ Pronto! Indices criados em segundos

Depos você verá:
- `idx_trades_tags_gin`
- `idx_trades_active_user_date`
- `idx_trades_user_date`
- `idx_trades_import_id_active`

---

**Próximo:** Phase 5 - Load Testing
