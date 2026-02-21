# Wave 1: Performance Verification & Load Testing
**Phase 5 - Performance Validation**

---

## 1. Test Plan - React Cache Deduplication

### Objetivo
Verificar que funções cacheadas (getUserFirstName, getImportSummaries, getUserTradingAccounts) são executadas apenas UMA VEZ por request.

### Teste Manual
```bash
# Terminal 1: Monitorar logs do Supabase
npx supabase functions logs get-user-trades --follow

# Terminal 2: Fazer request à dashboard
curl https://app.tradeaihub.com/dashboard

# Resultado esperado:
# - getImportSummaries() aparece 1x no log (não 2x)
# - getUserTradingAccounts() aparece 1x no log
# - getUserFirstName() aparece 1x no log
```

### DevTools Verification
```javascript
// No console da página dashboard:
// Inspect Network tab - procure por:/api/plan (deve haver MENOS requests duplicados)
// Antes Phase 1: ~6 requests
// Depois Phase 1: ~4 requests
const before = 6;
const after = 4;
const saved = ((before - after) / before * 100).toFixed(1);
console.log(`Deduplication savings: ${saved}%`);
```

---

## 2. Test Plan - N+1 Prevention (Tag Counts RPC)

### Objetivo
Verificar que `get_user_tag_counts()` RPC executa em <500ms para 500+ trades.

### Query Direta no Supabase
```sql
-- Conectar ao Supabase SQL console
SELECT * FROM get_user_tag_counts('USER_ID_AQUI');

-- Resultado esperado:
-- Executa em < 500ms (antes levava ~2s com loop)
-- Retorna agregação correta
-- Ex: [{ "tag_name": "scalping", "tag_count": 45 }, ...]
```

### Page Test
```bash
# Abrir Settings > Tags no navegador
# DevTools > Network tab
# Procurar por:
# - POST /api/tags (getUserTags)
# - Tempo de resposta: < 1s (antes: ~3s)

# Verificar console:
console.log("RPC execution time should be < 1s");
```

---

## 3. Test Plan - Query Consolidation (Metrics RPC)

### Objetivo
Verificar que `get_trade_metrics()` retorna agregações sem carregar 500+ trades.

### Benchmark Manual
```javascript
// No Supabase Studio - SQL Editor
-- ANTES (sem RPC) - carrega 500+ trades
SELECT * FROM trades WHERE user_id = 'USER_ID' AND deleted_at IS NULL;
-- Tempo: ~2-3s

-- DEPOIS (com RPC) - calcula na DB
SELECT * FROM get_trade_metrics('USER_ID', NULL, NULL);
-- Tempo: <500ms
```

### Application Test
```bash
# Abrir /dashboard
# DevTools > Network > Slow 3G
# Procurar por request que busca métricas
# Antes: ~3s (carregar trades + computar)
# Depois: ~1s (RPC calcula)
```

---

## 4. Index Performance Validation

### Objective
Verificar que índices foram criados e melhoram query plans.

### Verificação no Supabase
```sql
-- Ver índices criados
\d trades

-- Expected indexes:
-- - idx_trades_tags_gin (GIN)
-- - idx_trades_not_deleted (Partial)
-- - idx_trades_user_date (Composite)
-- - idx_trades_import_account (Composite)
```

### Query Plan Inspection
```sql
-- ANTES (sem índice)
EXPLAIN ANALYZE
SELECT * FROM trades
WHERE user_id = 'USER_ID'
  AND deleted_at IS NULL
ORDER BY trade_date DESC;
-- Plan: Seq Scan (full table) ~500ms

-- DEPOIS (com índice)
-- Plan: Index Scan (partial index) ~50ms
-- Improvement: 10x faster
```

---

## 5. Full Load Test

### Simulação com 10K+ trades

```bash
# 1. Criar dados de teste (se houver sandbox)
npx ts-node scripts/generate-test-trades.ts --count 10000

# 2. Rodar teste de carga
npx loadtest -c 50 -n 1000 https://app.tradeaihub.com/dashboard

# 3. Métricas esperadas:
#    - RPS: 50+ (requests/second)
#    - P95 latency: <2s
#    - P99 latency: <3s
#    - Error rate: <1%
```

### Performance Metrics (DevTools Profiler)

```javascript
// Executar no console da dashboard
performance.mark('wave1-start');

// Navegar para /trades
// Navegar para /reports/performance
// Voltar para /dashboard

performance.mark('wave1-end');
performance.measure('wave1', 'wave1-start', 'wave1-end');

const measure = performance.getEntriesByName('wave1')[0];
console.log(`Total Phase 1-4 improvement: ${measure.duration}ms`);

// Esperado:
// - Phase 0 (antes Wave 1): ~5000ms
// - Phase 1-4 (depois Wave 1): ~2500ms
// - Improvement: 50% mais rápido
```

---

## 6. Validation Checklist

### ✅ Cache Deduplication
- [ ] Layout não chama queries redundantes
- [ ] Browser DevTools mostra -40% duplicate requests
- [ ] Supabase logs confirmam 1 execução por função

### ✅ N+1 Prevention
- [ ] `get_user_tag_counts()` RPC executa <500ms
- [ ] Settings > Tags carrega <1s
- [ ] Tag counts corretos

### ✅ Query Consolidation
- [ ] `get_trade_metrics()` RPC executa <500ms
- [ ] Dashboard carrega métricas sem load full trades
- [ ] 50% menos dados transferidos

### ✅ Indexing
- [ ] 5 índices criados no Supabase
- [ ] Query plans usam índices (não Seq Scan)
- [ ] 10x speedup em queries deletadas

### ✅ Overall Performance
- [ ] Full dashboard load: <2s
- [ ] Reports page: <1.5s
- [ ] Settings > Tags: <1s
- [ ] 50% improvement vs Wave 0

---

## 7. Revert Strategy (se necessário)

```bash
# Se performance piorar:

# 1. Revert migrations
npx supabase migration down 1  # Remove indexes
npx supabase migration down 1  # Remove metrics RPC
npx supabase migration down 1  # Remove tag counts RPC

# 2. Revert código
git revert <commit-id>

# 3. Rebuild
npm run build && npm start
```

---

## 8. Next Steps (Wave 2)

Se Phase 5 ✅ passar:

- [ ] Wave 2: Advanced Query Optimization (RPC for reports)
- [ ] Wave 2: Caching Layer (Redis)
- [ ] Wave 3: CDN + Static Asset Optimization

---

**Status**: Phase 5 Ready for Testing
**Expected Outcome**: 50% performance improvement
**Time to Complete**: 4h (automated + manual tests)
