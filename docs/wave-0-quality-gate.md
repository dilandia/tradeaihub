# Wave 0 Completion Quality Gate

**Project:** TakeZ Plan (TradeAIHub)
**Epic:** Technical Debt Resolution (TDR)
**Gate Scope:** TDR-01 through TDR-14 (Wave 0 -- Security + Foundation)
**Author:** Quinn (QA Agent)
**Date:** 2026-02-21
**Source Assessment:** `/home/takez/aios-core/docs/prd/technical-debt-assessment.md`

---

## 1. Gate Decision Framework

This quality gate MUST be passed before Wave 1 (Schema Reconciliation) begins.

**Decision options:**
- **APPROVED** -- All MUST criteria met, no CRITICAL issues open
- **CONDITIONAL** -- MUST criteria met, SHOULD criteria partially met with documented justification
- **BLOCKED** -- Any MUST criterion failed

---

## 2. Security Validation Checklist

### 2.1 RLS Policy Fixes (TDR-01, TDR-02, TDR-03)

**Migration files to verify:**
- `/home/takez/TakeZ-Plan/supabase/migrations/20260220000000_fix_rls_credit_purchases.sql`
- `/home/takez/TakeZ-Plan/supabase/migrations/20260220000001_fix_rls_ai_credits.sql`
- `/home/takez/TakeZ-Plan/supabase/migrations/20260220000002_fix_rls_subscriptions.sql`

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 2.1.1 | `credit_purchases` INSERT policy "Service role can insert credit_purchases" is DROPPED | MUST | [ ] | Verify via `SELECT * FROM pg_policies WHERE tablename = 'credit_purchases'` -- only SELECT policy should remain |
| 2.1.2 | `ai_credits` UPDATE policy "Users can update own ai_credits" is DROPPED | MUST | [ ] | Verify via `SELECT * FROM pg_policies WHERE tablename = 'ai_credits'` |
| 2.1.3 | `ai_credits` INSERT policy "Users can insert own ai_credits" is DROPPED | MUST | [ ] | Same query as above |
| 2.1.4 | `ai_credits` SELECT policy "Users can read own ai_credits" REMAINS functional | MUST | [ ] | Users must still be able to read their own credit balance |
| 2.1.5 | `subscriptions` UPDATE policy "Users can update own subscription" is DROPPED | MUST | [ ] | Verify via `SELECT * FROM pg_policies WHERE tablename = 'subscriptions'` |
| 2.1.6 | `subscriptions` INSERT policy "Users can insert own subscription" is DROPPED | MUST | [ ] | Same query as above |
| 2.1.7 | `subscriptions` SELECT policy remains functional | MUST | [ ] | Users must still be able to read their own subscription |
| 2.1.8 | Stripe webhook handler still functions (service_role bypasses RLS) | MUST | [ ] | Send test event via Stripe CLI or test mode |
| 2.1.9 | `handle_new_user_subscription()` trigger still functions (SECURITY DEFINER) | MUST | [ ] | Register a new user and verify subscription row created |
| 2.1.10 | DevTools attack vector closed: `supabase.from('ai_credits').update({credits_remaining: 9999})` FAILS | MUST | [ ] | Test from browser console with authenticated user |
| 2.1.11 | DevTools attack vector closed: `supabase.from('subscriptions').update({plan: 'elite'})` FAILS | MUST | [ ] | Test from browser console with authenticated user |

### 2.2 Race Condition Fixes (TDR-05, TDR-06)

**Migration file:**
- `/home/takez/TakeZ-Plan/supabase/migrations/20260220000003_atomic_consume_ai_credits_rpc.sql`

**Application code:**
- `/home/takez/TakeZ-Plan/src/lib/plan.ts` (lines 177-200 -- `consumeAiCredits()`)

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 2.2.1 | `consume_ai_credits_atomic` RPC function exists in database | MUST | [ ] | `SELECT proname FROM pg_proc WHERE proname = 'consume_ai_credits_atomic'` |
| 2.2.2 | RPC uses `SELECT FOR UPDATE` to prevent concurrent reads | MUST | [ ] | Verify in migration SQL -- confirmed present |
| 2.2.3 | RPC returns `{success: boolean, credits_remaining: integer}` | MUST | [ ] | Test via `SELECT * FROM consume_ai_credits_atomic('<user_id>', 1)` |
| 2.2.4 | `consumeAiCredits()` in `plan.ts` calls `supabase.rpc("consume_ai_credits_atomic", ...)` | MUST | [ ] | Verified in code: uses `createAdminClient()` + `.rpc()` |
| 2.2.5 | No read-modify-write pattern remains in `consumeAiCredits()` | MUST | [ ] | Old pattern was: read credits -> check -> update. Now single RPC call. |
| 2.2.6 | Concurrent requests (10+) with limited credits produce zero over-consumption | MUST | [ ] | Load test: 10 concurrent requests with 5 credits should result in exactly 5 successes |
| 2.2.7 | `stripe_payment_intent_id` has UNIQUE constraint in `credit_purchases` | MUST | [ ] | TDR-06: Prevents duplicate credit additions on webhook retries |
| 2.2.8 | Webhook handler returns 200 on duplicate `payment_intent_id` (not 500) | MUST | [ ] | Application code handles error 23505 (unique violation) gracefully |
| 2.2.9 | Webhook credit addition uses atomic operation (not read-modify-write) | MUST | [ ] | Currently at `/home/takez/TakeZ-Plan/src/app/api/stripe/webhook/route.ts` lines 62-95 -- check if still read-modify-write |

**KNOWN ISSUE:** The Stripe webhook handler at `/home/takez/TakeZ-Plan/src/app/api/stripe/webhook/route.ts` lines 62-95 still uses a read-modify-write pattern for credit addition (`existing.credits_remaining + creditsAmount`). TDR-06 must address this.

### 2.3 Debug Endpoint Removal (TDR-04)

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 2.3.1 | `/api/debug-host` route file is deleted | MUST | [ ] | `src/app/api/debug-host/` directory should not exist |
| 2.3.2 | No middleware exception for debug-host | SHOULD | [ ] | Check middleware for `/api/debug-host` references |
| 2.3.3 | `GET /api/debug-host` returns 404 in production | MUST | [ ] | Verify via curl or browser |
| 2.3.4 | No header information leaked in any other debug endpoint | SHOULD | [ ] | Search for `headers()` usage that exposes server headers to client |

### 2.4 Application Code Changes for RLS (TDR-02, TDR-03)

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 2.4.1 | `consumeAiCredits()` uses `createAdminClient()` (not `createClient()`) | MUST | [ ] | Verified in `/home/takez/TakeZ-Plan/src/lib/plan.ts:186` -- uses `createAdminClient()` |
| 2.4.2 | `ensureAiCreditsForPeriod()` uses `createAdminClient()` | MUST | [ ] | Verified in `/home/takez/TakeZ-Plan/src/lib/plan.ts:208` -- uses `createAdminClient()` |
| 2.4.3 | All 6 AI endpoints function correctly with admin client | MUST | [ ] | Test each: copilot, insights, analysis, risk assessment, plan suggestions, trade coaching |
| 2.4.4 | Stripe checkout routes use `createAdminClient()` for subscription writes | MUST | [ ] | `/home/takez/TakeZ-Plan/src/app/api/stripe/checkout/route.ts` and `checkout-credits/route.ts` |

---

## 3. Functional Validation Checklist

### 3.1 PlanProvider Waterfall Fix (TDR-07)

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 3.1.1 | Plan data fetched server-side (not client-side waterfall) | MUST | [ ] | No flash of loading state or incorrect plan on page load |
| 3.1.2 | Plan gate correctly restricts features per plan level | MUST | [ ] | Free user cannot access Pro/Elite features; Pro user can access Pro features |
| 3.1.3 | Plan change (upgrade/downgrade) reflects immediately after Stripe webhook | SHOULD | [ ] | No stale plan data after subscription change |
| 3.1.4 | Dashboard loads without PlanProvider flickering | MUST | [ ] | No visible content shift between loading and loaded states |

### 3.2 Environment Variable Validation (TDR-11)

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 3.2.1 | Missing critical env vars cause startup failure with clear error message | MUST | [ ] | Remove `SUPABASE_SERVICE_ROLE_KEY` temporarily and verify build/start fails with message |
| 3.2.2 | All required env vars listed: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, OPENAI_API_KEY, ENCRYPTION_KEY | MUST | [ ] | Check env.mjs/env.ts schema |
| 3.2.3 | Optional env vars do not cause startup failure when absent | SHOULD | [ ] | Variables like METAAPI_TOKEN should be optional |
| 3.2.4 | Zod schema validates env var formats (not just presence) | SHOULD | [ ] | e.g., SUPABASE_URL must be a valid URL |

### 3.3 Accessibility -- prefers-reduced-motion (TDR-12)

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 3.3.1 | Global CSS includes `@media (prefers-reduced-motion: reduce)` | MUST | [ ] | Check `globals.css` or equivalent |
| 3.3.2 | Animations are disabled/reduced when preference is set | MUST | [ ] | Toggle in OS settings or browser DevTools Rendering panel |
| 3.3.3 | No layout shifts when animations are disabled | SHOULD | [ ] | Content should remain in correct positions |

### 3.4 npm Audit (TDR-13)

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 3.4.1 | `npm audit` reports zero CRITICAL vulnerabilities | MUST | [ ] | Run `npm audit` in `/home/takez/TakeZ-Plan` |
| 3.4.2 | `npm audit` reports zero HIGH vulnerabilities (or documented exceptions) | SHOULD | [ ] | Some may require major version bumps; document exceptions |
| 3.4.3 | Audit results documented in project | SHOULD | [ ] | Before/after comparison |

---

## 4. Testing & Observability Validation

### 4.1 Vitest Setup (TDR-08)

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 4.1.1 | `vitest` is in `devDependencies` | MUST | [ ] | Check `/home/takez/TakeZ-Plan/package.json` |
| 4.1.2 | `npm test` or `npx vitest` runs and passes | MUST | [ ] | Execute in project root |
| 4.1.3 | At least 1 test exists for a Server Action (credits or auth) | MUST | [ ] | e.g., test for `consumeAiCredits()` |
| 4.1.4 | At least 1 test exists for an API route (Stripe webhook or AI) | MUST | [ ] | e.g., test for webhook idempotency |
| 4.1.5 | At least 1 test exists for a utility function (`plan.ts` or `parsers.ts`) | MUST | [ ] | e.g., test for `getPlanLimits()` |
| 4.1.6 | Supabase client is properly mocked for unit tests | MUST | [ ] | Tests should not require live database connection |
| 4.1.7 | Test configuration supports TypeScript and path aliases (`@/`) | MUST | [ ] | `vitest.config.ts` with resolve aliases |
| 4.1.8 | Coverage report can be generated (`npx vitest --coverage`) | SHOULD | [ ] | c8 or istanbul provider configured |

### 4.2 Structured Logging (TDR-09)

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 4.2.1 | Logging library installed (pino or winston) | MUST | [ ] | Check `package.json` for `pino`, `winston`, or `@sentry/nextjs` |
| 4.2.2 | Logger utility module exists and exports a configured logger | MUST | [ ] | e.g., `src/lib/logger.ts` |
| 4.2.3 | Critical paths use structured logger instead of `console.error` | SHOULD | [ ] | At minimum: `plan.ts`, `webhook/route.ts`, `security.ts` |
| 4.2.4 | Error tracking service configured (Sentry or equivalent) | SHOULD | [ ] | `@sentry/nextjs` or similar in dependencies |
| 4.2.5 | Server-side errors are captured with context (userId, endpoint, error) | SHOULD | [ ] | Verify logger calls include structured metadata |
| 4.2.6 | No sensitive data logged (passwords, tokens, full credit card numbers) | MUST | [ ] | Search for `password`, `secret`, `token` in log statements |

### 4.3 Backup Strategy (TDR-10)

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 4.3.1 | Backup strategy documented (location, frequency, retention) | MUST | [ ] | Document should exist in project docs |
| 4.3.2 | Supabase PITR status verified (is it enabled on current plan?) | MUST | [ ] | If Free plan: explicit acknowledgement of risk |
| 4.3.3 | Manual `pg_dump` procedure documented with exact commands | MUST | [ ] | Including `supabase db dump --schema public` |
| 4.3.4 | Recovery procedure documented and tested | SHOULD | [ ] | Step-by-step restore from backup |
| 4.3.5 | Pre-migration backup taken before any Wave 1 schema changes | MUST | [ ] | This is a BLOCKER for Wave 1 start |

---

## 5. Ghost Tables Migration Start (TDR-14)

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 5.1 | Migration files created for all 4 ghost tables | MUST | [ ] | trading_accounts, import_summaries, user_tags, user_preferences |
| 5.2 | Migrations use `CREATE TABLE IF NOT EXISTS` | MUST | [ ] | Production safety -- tables may already exist |
| 5.3 | Migrations include RLS ENABLE + policies | MUST | [ ] | Each table needs `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + per-user policies |
| 5.4 | Migrations include appropriate indexes | SHOULD | [ ] | At minimum: user_id index on each table |
| 5.5 | Migration order respects FK dependencies | MUST | [ ] | trading_accounts + import_summaries BEFORE any FK additions |
| 5.6 | Each migration has a corresponding rollback strategy | SHOULD | [ ] | `DROP TABLE IF EXISTS` or `ALTER TABLE DROP CONSTRAINT` |
| 5.7 | Migrations validated against actual production schema (no type conflicts) | MUST | [ ] | `supabase db dump --schema public` compared with proposed DDL |

---

## 6. Data Integrity Checks

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 6.1 | RPC function `consume_ai_credits_atomic` handles zero-credit users correctly | MUST | [ ] | Returns `{success: false, credits_remaining: 0}` |
| 6.2 | RPC function handles negative amount parameter | MUST | [ ] | Should reject or return false -- verify behavior |
| 6.3 | RPC function handles non-existent users | MUST | [ ] | Returns `{success: false, credits_remaining: 0}` |
| 6.4 | `ensureAiCreditsForPeriod()` correctly resets credits at period boundaries | MUST | [ ] | Simulate period expiry and verify reset |
| 6.5 | `deleteAccount()` at `/home/takez/TakeZ-Plan/src/app/actions/security.ts` still correctly deletes trades, import_summaries, trading_accounts, profiles | MUST | [ ] | Verify sequential deletes still work with RLS changes |
| 6.6 | Note: `deleteAccount()` still DOES NOT delete from ai_credits, credit_purchases, subscriptions, ai_copilot_conversations, user_tags, user_preferences | KNOWN DEBT | [ ] | Documented as S-014, scheduled for Wave 1. Verify this is tracked. |

---

## 7. Performance Validation

| # | Check | Category | Status | Notes |
|---|-------|----------|:---:|-------|
| 7.1 | PlanProvider server-side fetch does not add latency to page load | SHOULD | [ ] | Compare Time to First Byte before/after TDR-07 |
| 7.2 | RPC call `consume_ai_credits_atomic` executes in < 50ms | SHOULD | [ ] | Benchmark with `EXPLAIN ANALYZE` |
| 7.3 | No N+1 queries introduced by RLS or admin client changes | SHOULD | [ ] | Monitor query count on dashboard load |
| 7.4 | `npm run build` completes without errors | MUST | [ ] | Full production build validation |
| 7.5 | Application starts without warnings related to env validation | MUST | [ ] | `npm run dev` or `npm start` |

---

## 8. Regression Checks (Pre-Wave 1 Smoke Tests)

These MUST pass before beginning Wave 1 work:

| # | Critical Path | Status | Notes |
|---|---------------|:---:|-------|
| 8.1 | **Auth flow:** Register -> Email confirmation -> Login -> Dashboard -> Logout | [ ] | Verify end-to-end with new user |
| 8.2 | **Trade import:** Upload CSV -> Parse -> Store in DB -> Display in dashboard | [ ] | Use sample CSV with 10+ trades |
| 8.3 | **AI credit flow:** Check balance -> Use AI feature (copilot or insights) -> Balance decremented by correct amount | [ ] | Verify with Pro plan user |
| 8.4 | **Stripe webhook:** Simulate `checkout.session.completed` -> Credits added correctly -> Balance reflects in UI | [ ] | Use Stripe CLI `stripe trigger checkout.session.completed` |
| 8.5 | **MetaAPI sync:** Connect account -> Sync trades -> Trades display in dashboard | [ ] | If MetaAPI credentials available |
| 8.6 | **Plan gating:** Free user sees upgrade prompts -> Pro user sees Pro features -> Elite user sees Elite features | [ ] | Test with users on different plans |
| 8.7 | **Settings page:** Security settings load -> Change password works -> Email update sends confirmation | [ ] | Full settings flow |

---

## 9. Acceptance Criteria for Wave 0 Completion

### MUST (Blocking -- Wave 1 cannot start without these)

1. All 3 RLS vulnerability migrations applied to production (TDR-01, TDR-02, TDR-03)
2. Atomic credit consumption RPC deployed and functional (TDR-05)
3. No exploitable RLS policies on financial tables (`ai_credits`, `credit_purchases`, `subscriptions`)
4. All application code paths using `createAdminClient()` where RLS bypass is needed
5. Debug endpoint removed from production (TDR-04)
6. Vitest installed and at least 3 tests passing (1 Server Action, 1 API route, 1 utility)
7. Backup strategy documented and pre-migration backup taken (TDR-10)
8. Ghost table migration files created and validated against production schema (TDR-14)
9. `npm run build` succeeds without errors
10. All 7 regression smoke tests pass (Section 8)

### SHOULD (Expected but not blocking)

1. Environment variable validation with Zod (TDR-11)
2. `prefers-reduced-motion` global CSS applied (TDR-12)
3. npm audit -- zero CRITICAL/HIGH vulnerabilities (TDR-13)
4. Structured logging library installed and integrated in critical paths (TDR-09)
5. Stripe webhook idempotency with UNIQUE constraint (TDR-06)
6. PlanProvider waterfall eliminated (TDR-07)
7. Error tracking service (Sentry) configured

### COULD (Nice-to-have for Wave 0)

1. Coverage report generation configured
2. Logging dashboards or alerting
3. Automated CI pipeline for lint + typecheck + test

---

## 10. Critical Paths That MUST Work Before Wave 1

Wave 1 introduces significant schema changes (ghost table migrations, FK additions, updated_at triggers). The following paths MUST be verified as functional before any Wave 1 work begins, because schema changes could break them:

### Path 1: Financial Credit Flow (Highest Risk)
```
User purchases credits via Stripe
  -> Stripe sends checkout.session.completed webhook
  -> Webhook handler receives event
  -> Handler creates/updates ai_credits record (via service_role)
  -> Handler inserts credit_purchases record (via service_role)
  -> User sees updated balance in UI
  -> User uses AI feature
  -> consumeAiCredits() deducts via atomic RPC
  -> Balance correctly decremented
```
**Files involved:**
- `/home/takez/TakeZ-Plan/src/app/api/stripe/webhook/route.ts`
- `/home/takez/TakeZ-Plan/src/lib/plan.ts`
- `/home/takez/TakeZ-Plan/src/lib/supabase/admin.ts`

### Path 2: User Registration + Subscription Setup
```
New user registers
  -> Supabase auth creates user
  -> handle_new_user trigger creates profile
  -> handle_new_user_subscription trigger creates subscription (free plan)
  -> User lands on dashboard
  -> PlanProvider fetches plan data server-side
  -> Free plan limits enforced correctly
```
**Files involved:**
- `/home/takez/TakeZ-Plan/src/lib/supabase/server.ts`
- `/home/takez/TakeZ-Plan/src/lib/plan.ts`

### Path 3: Trade Data Integrity
```
User imports trades via CSV
  -> Parser processes CSV data
  -> Trades inserted with user_id, import_id, trading_account_id
  -> Dashboard calculates metrics from trades
  -> Tag operations (add/rename/delete) work correctly
```
**Files involved:**
- `/home/takez/TakeZ-Plan/src/lib/parsers.ts`
- `/home/takez/TakeZ-Plan/src/lib/dashboard-calc.ts`
- `/home/takez/TakeZ-Plan/src/lib/tags.ts`

### Path 4: Account Deletion (Partial)
```
User requests account deletion
  -> deleteAccount() deletes trades, import_summaries, trading_accounts, profiles
  -> admin.auth.admin.deleteUser() removes auth record
  -> User redirected to login
  NOTE: Does NOT yet delete ai_credits, credit_purchases, subscriptions (Wave 1 / S-014)
```
**File:** `/home/takez/TakeZ-Plan/src/app/actions/security.ts`

### Path 5: MetaAPI Synchronization
```
User connects MetaAPI account
  -> Encrypted credentials stored in trading_accounts
  -> Sync fetches trades from MetaAPI
  -> Trades deduplicated and stored
  -> Dashboard reflects synced data
```
**File:** `/home/takez/TakeZ-Plan/src/lib/metaapi-sync.ts`

---

## 11. Known Gaps Deferred to Wave 1+

| Gap | Severity | Wave | Notes |
|-----|----------|------|-------|
| `deleteAccount` incomplete (S-014) -- missing 5+ tables | ALTO | Wave 1 | Must be fixed before ghost table FKs with ON DELETE CASCADE |
| `ensureAiCreditsForPeriod()` race condition (D-018) | MEDIO | Wave 2 | Separate from `consumeAiCredits` fix |
| Stripe webhook credit addition still read-modify-write | CRITICO | Wave 0 (TDR-06) | Must be addressed before gate approval if not yet fixed |
| Zero error.tsx / loading.tsx / not-found.tsx | ALTO | Wave 2 | No error boundaries in production |
| No zod validation on API routes | ALTO | Wave 2 | Server Actions accept unvalidated input |
| No CORS headers configured | MEDIO | Wave 3 | API routes have no CORS policy |
| No security headers (CSP, HSTS) | MEDIO | Wave 3 | No defense against XSS/clickjacking |

---

## 12. Gate Execution Instructions

### Pre-Gate Checklist (Executor)

1. Run `npm run build` in `/home/takez/TakeZ-Plan` -- must succeed
2. Run `npm test` (or `npx vitest`) -- must pass
3. Run `npm audit` -- document results
4. Verify all 4 migration files exist in `/home/takez/TakeZ-Plan/supabase/migrations/`
5. Execute RLS verification queries against production (or staging):
   ```sql
   SELECT schemaname, tablename, policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename IN ('credit_purchases', 'ai_credits', 'subscriptions')
   ORDER BY tablename, policyname;
   ```
6. Execute smoke tests (Section 8) manually
7. Verify backup documentation exists

### Decision Record

| Criterion | Result | Evidence |
|-----------|--------|----------|
| MUST criteria met | [ ] YES / [ ] NO | List any failures |
| SHOULD criteria met | [ ] YES / [ ] PARTIAL | List exceptions |
| Regression tests pass | [ ] YES / [ ] NO | Attach results |
| Build succeeds | [ ] YES / [ ] NO | Build log |
| Tests pass | [ ] YES / [ ] NO | Test output |

**Gate Decision:** _____________ (APPROVED / CONDITIONAL / BLOCKED)
**Reviewer:** _____________
**Date:** _____________
**Notes:** _____________

---

*Document generated by Quinn (QA Agent) -- Wave 0 Quality Gate*
*Source: Technical Debt Assessment FINAL (91 debitos, ~287h)*
*Scope: TDR-01 through TDR-14 (Wave 0, ~35h estimated)*
