# Wave 0 Test Scenarios

**Project:** TakeZ Plan (TradeAIHub)
**Epic:** Technical Debt Resolution (TDR)
**Scope:** TDR-01 through TDR-14 (Wave 0)
**Author:** Quinn (QA Agent)
**Date:** 2026-02-21
**Total Scenarios:** 28

---

## Test Scenario Index

| # | TDR | Title | Priority | Type |
|---|-----|-------|----------|------|
| TS-01 | TDR-01 | RLS: credit_purchases INSERT blocked for authenticated users | P0 | Security |
| TS-02 | TDR-01 | RLS: Stripe webhook still inserts credit_purchases via service_role | P0 | Security |
| TS-03 | TDR-02 | RLS: Users cannot UPDATE ai_credits via browser DevTools | P0 | Security |
| TS-04 | TDR-02 | RLS: Users can still SELECT (read) their own ai_credits | P0 | Security |
| TS-05 | TDR-02 | RLS: Server code with admin client can still modify ai_credits | P0 | Security |
| TS-06 | TDR-03 | RLS: Users cannot UPDATE subscriptions to change plan via DevTools | P0 | Security |
| TS-07 | TDR-03 | RLS: Subscription trigger still creates free plan for new users | P0 | Security |
| TS-08 | TDR-04 | Debug endpoint removed: GET /api/debug-host returns 404 | P0 | Security |
| TS-09 | TDR-05 | Atomic credits: Concurrent requests do not over-consume | P0 | Concurrency |
| TS-10 | TDR-05 | Atomic credits: Zero credits returns failure | P0 | Functional |
| TS-11 | TDR-05 | Atomic credits: Negative amount handled correctly | P1 | Edge Case |
| TS-12 | TDR-05 | Atomic credits: Non-existent user returns failure | P1 | Edge Case |
| TS-13 | TDR-06 | Webhook idempotency: Duplicate payment_intent_id does not double-add credits | P0 | Security |
| TS-14 | TDR-06 | Webhook idempotency: UNIQUE constraint exists on stripe_payment_intent_id | P0 | Data Integrity |
| TS-15 | TDR-06 | Webhook idempotency: Duplicate webhook returns 200 (not 500) | P0 | Resilience |
| TS-16 | TDR-07 | PlanProvider: No client-side waterfall on page load | P1 | Performance |
| TS-17 | TDR-07 | PlanProvider: Plan limits enforced correctly per plan level | P0 | Functional |
| TS-18 | TDR-08 | Vitest: Test framework runs and passes | P0 | Infrastructure |
| TS-19 | TDR-08 | Vitest: Server Action test for credit consumption | P0 | Test Coverage |
| TS-20 | TDR-08 | Vitest: API route test for webhook handler | P1 | Test Coverage |
| TS-21 | TDR-09 | Logging: Structured logger captures errors with context | P1 | Observability |
| TS-22 | TDR-09 | Logging: No sensitive data in log output | P0 | Security |
| TS-23 | TDR-10 | Backup: Strategy documented and pg_dump executed | P0 | Data Safety |
| TS-24 | TDR-11 | Env validation: Missing critical env var causes startup failure | P0 | Resilience |
| TS-25 | TDR-11 | Env validation: All required vars listed in schema | P1 | Completeness |
| TS-26 | TDR-12 | Reduced motion: Animations disabled with OS preference | P2 | Accessibility |
| TS-27 | TDR-13 | npm audit: Zero CRITICAL vulnerabilities | P0 | Security |
| TS-28 | TDR-14 | Ghost tables: Migration files created for all 4 tables | P0 | Schema |

---

## Detailed Test Scenarios

### TS-01: RLS -- credit_purchases INSERT blocked for authenticated users

**TDR:** TDR-01 (S-001)
**Priority:** P0
**Type:** Security / SQL
**Preconditions:** Migration `20260220000000_fix_rls_credit_purchases.sql` applied

**Steps to reproduce:**
1. Authenticate as a regular user in the browser
2. Open browser DevTools (F12) -> Console
3. Execute:
   ```javascript
   const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
   const supabase = createClient(
     '<SUPABASE_URL>',
     '<SUPABASE_ANON_KEY>'
   );
   // Attempt to set session from existing cookies
   const { data, error } = await supabase.from('credit_purchases').insert({
     user_id: '<authenticated_user_id>',
     credits_amount: 9999,
     amount_paid_usd: 0,
     stripe_payment_intent_id: 'fake_pi_test'
   });
   console.log('Result:', data, 'Error:', error);
   ```
4. Observe result

**Expected result:**
- INSERT fails with RLS policy violation error
- Error message indicates insufficient permissions
- No row created in `credit_purchases` table

**Actual result:** _____________

---

### TS-02: RLS -- Stripe webhook still inserts credit_purchases via service_role

**TDR:** TDR-01 (S-001)
**Priority:** P0
**Type:** Security / Integration
**Preconditions:** Migration applied, Stripe test mode configured

**Steps to reproduce:**
1. Use Stripe CLI to trigger a test webhook event:
   ```bash
   stripe trigger checkout.session.completed \
     --add checkout_session:metadata[supabase_user_id]=<test_user_id> \
     --add checkout_session:metadata[credits_type]=purchase \
     --add checkout_session:metadata[credits_amount]=10 \
     --add checkout_session:metadata[credits_amount_usd]=5
   ```
2. Or use Stripe Dashboard -> Developers -> Webhooks -> Send test webhook
3. Check `credit_purchases` table for new row

**Expected result:**
- Webhook handler receives event
- `credit_purchases` row created successfully (service_role bypasses RLS)
- Row contains correct `user_id`, `credits_amount`, `amount_paid_usd`

**Actual result:** _____________

---

### TS-03: RLS -- Users cannot UPDATE ai_credits via browser DevTools

**TDR:** TDR-02 (D-015)
**Priority:** P0
**Type:** Security / SQL
**Preconditions:** Migration `20260220000001_fix_rls_ai_credits.sql` applied

**Steps to reproduce:**
1. Authenticate as a user with existing ai_credits record
2. Note current `credits_remaining` value
3. Open DevTools Console
4. Execute:
   ```javascript
   const { data, error } = await supabase
     .from('ai_credits')
     .update({ credits_remaining: 99999 })
     .eq('user_id', '<my_user_id>');
   console.log('Data:', data, 'Error:', error);
   ```
5. Check `credits_remaining` in the database

**Expected result:**
- UPDATE fails with RLS policy violation
- `credits_remaining` unchanged in database
- Error returned to client

**Actual result:** _____________

---

### TS-04: RLS -- Users can still SELECT (read) their own ai_credits

**TDR:** TDR-02 (D-015)
**Priority:** P0
**Type:** Functional / SQL
**Preconditions:** Migration applied

**Steps to reproduce:**
1. Authenticate as a user with ai_credits record
2. Navigate to any page that displays credit balance (dashboard, AI feature pages)
3. Verify credit balance displays correctly
4. Also verify via DevTools:
   ```javascript
   const { data, error } = await supabase
     .from('ai_credits')
     .select('*')
     .eq('user_id', '<my_user_id>')
     .single();
   console.log('Data:', data, 'Error:', error);
   ```

**Expected result:**
- SELECT returns the user's ai_credits record
- `credits_remaining`, `period_start`, `period_end` all present
- UI displays correct balance

**Actual result:** _____________

---

### TS-05: RLS -- Server code with admin client can still modify ai_credits

**TDR:** TDR-02 (D-015)
**Priority:** P0
**Type:** Integration
**Preconditions:** `consumeAiCredits()` in `plan.ts` uses `createAdminClient()`

**Steps to reproduce:**
1. Authenticate as a user with credits (e.g., 10 credits remaining)
2. Use an AI feature that consumes credits (AI Copilot, Trade Analysis, etc.)
3. After the AI response, check `credits_remaining` in the database
4. Also verify via API:
   ```
   POST /api/ai/copilot  (or any AI endpoint)
   Body: { "prompt": "test" }
   ```

**Expected result:**
- AI feature functions correctly
- `credits_remaining` decremented by the appropriate amount
- `credits_used_this_period` incremented
- `updated_at` updated

**Actual result:** _____________

---

### TS-06: RLS -- Users cannot UPDATE subscriptions to change plan

**TDR:** TDR-03 (D-016)
**Priority:** P0
**Type:** Security / SQL
**Preconditions:** Migration `20260220000002_fix_rls_subscriptions.sql` applied

**Steps to reproduce:**
1. Authenticate as a free-plan user
2. Open DevTools Console
3. Execute:
   ```javascript
   const { data, error } = await supabase
     .from('subscriptions')
     .update({ plan: 'elite', status: 'active' })
     .eq('user_id', '<my_user_id>');
   console.log('Data:', data, 'Error:', error);
   ```
4. Check `subscriptions` table in database
5. Refresh the dashboard and verify plan features

**Expected result:**
- UPDATE fails with RLS policy violation
- `plan` remains `free` in database
- User does NOT see Elite features after page refresh

**Actual result:** _____________

---

### TS-07: RLS -- Subscription trigger still creates free plan for new users

**TDR:** TDR-03 (D-016)
**Priority:** P0
**Type:** Integration
**Preconditions:** `handle_new_user_subscription()` trigger uses SECURITY DEFINER

**Steps to reproduce:**
1. Register a new user via the signup flow
2. After email confirmation and first login, query the database:
   ```sql
   SELECT * FROM subscriptions WHERE user_id = '<new_user_id>';
   ```

**Expected result:**
- `subscriptions` row exists for the new user
- `plan` = `free`
- `status` = `active`
- Created automatically by the `handle_new_user_subscription` trigger

**Actual result:** _____________

---

### TS-08: Debug endpoint removed -- GET /api/debug-host returns 404

**TDR:** TDR-04 (S-005)
**Priority:** P0
**Type:** Security / Negative Test
**Preconditions:** Debug endpoint route file deleted

**Steps to reproduce:**
1. Make a GET request to the debug endpoint:
   ```bash
   curl -v https://<your-domain>/api/debug-host
   ```
2. Also test in development:
   ```bash
   curl -v http://localhost:3000/api/debug-host
   ```

**Expected result:**
- HTTP 404 response (Not Found)
- No server headers, environment variables, or host information leaked
- Response body contains default Next.js 404 page (not JSON with debug info)

**Actual result:** _____________

---

### TS-09: Atomic credits -- Concurrent requests do not over-consume

**TDR:** TDR-05 (S-002)
**Priority:** P0
**Type:** Concurrency / Load Test
**Preconditions:** `consume_ai_credits_atomic` RPC deployed, user has exactly 5 credits

**Steps to reproduce:**
1. Set user's `credits_remaining` to exactly 5
2. Fire 10 concurrent requests that each consume 1 credit:
   ```bash
   # Using a simple parallel curl script or load testing tool
   for i in $(seq 1 10); do
     curl -X POST https://<domain>/api/ai/copilot \
       -H "Cookie: <session_cookie>" \
       -H "Content-Type: application/json" \
       -d '{"prompt":"test"}' &
   done
   wait
   ```
   Or use a dedicated test:
   ```typescript
   // Vitest concurrent test
   const promises = Array.from({ length: 10 }, () =>
     consumeAiCredits(userId, 1)
   );
   const results = await Promise.all(promises);
   const successes = results.filter(r => r === true).length;
   ```
3. Check final `credits_remaining` and count of successful responses

**Expected result:**
- Exactly 5 requests succeed (`success: true`)
- Exactly 5 requests fail (`success: false`)
- `credits_remaining` = 0 (not negative)
- `credits_used_this_period` incremented by exactly 5

**Actual result:** _____________

---

### TS-10: Atomic credits -- Zero credits returns failure

**TDR:** TDR-05 (S-002)
**Priority:** P0
**Type:** Functional / Edge Case
**Preconditions:** User has `credits_remaining` = 0

**Steps to reproduce:**
1. Ensure user has 0 credits remaining
2. Attempt to use an AI feature
3. Or call directly:
   ```sql
   SELECT * FROM consume_ai_credits_atomic('<user_id>', 1);
   ```

**Expected result:**
- RPC returns `{success: false, credits_remaining: 0}`
- No negative balance created
- User sees "insufficient credits" message in UI

**Actual result:** _____________

---

### TS-11: Atomic credits -- Negative amount handled correctly

**TDR:** TDR-05 (S-002)
**Priority:** P1
**Type:** Edge Case / Security
**Preconditions:** RPC deployed

**Steps to reproduce:**
1. Call RPC with negative amount:
   ```sql
   SELECT * FROM consume_ai_credits_atomic('<user_id>', -5);
   ```
2. Check if credits increased (vulnerability) or request was rejected

**Expected result:**
- Either: RPC returns `{success: false}` (rejects negative amounts)
- Or: RPC adds credits (which would be a vulnerability -- flag if this happens)
- Credits should NOT increase from a "consume" operation

**Actual result:** _____________

**NOTE:** If RPC accepts negative amounts and increases credits, this is a P0 security finding that must be fixed before Wave 0 gate approval.

---

### TS-12: Atomic credits -- Non-existent user returns failure

**TDR:** TDR-05 (S-002)
**Priority:** P1
**Type:** Edge Case
**Preconditions:** RPC deployed

**Steps to reproduce:**
1. Call RPC with a UUID that does not exist in ai_credits:
   ```sql
   SELECT * FROM consume_ai_credits_atomic('00000000-0000-0000-0000-000000000000', 1);
   ```

**Expected result:**
- RPC returns `{success: false, credits_remaining: 0}`
- No error thrown
- No rows affected

**Actual result:** _____________

---

### TS-13: Webhook idempotency -- Duplicate payment_intent_id does not double-add credits

**TDR:** TDR-06 (S-004 + D-014)
**Priority:** P0
**Type:** Security / Idempotency
**Preconditions:** UNIQUE constraint on `credit_purchases.stripe_payment_intent_id`, idempotent webhook code

**Steps to reproduce:**
1. Set user's `credits_remaining` to 0
2. Send a webhook event for `checkout.session.completed` with `payment_intent_id = 'pi_test_idem_001'` and `credits_amount = 10`
3. Verify credits = 10
4. Send the EXACT same webhook event again (same `payment_intent_id`)
5. Check final `credits_remaining`

**Expected result:**
- First event: credits set to 10, `credit_purchases` row created
- Second event: credits remain at 10, no new `credit_purchases` row
- Webhook returns 200 on both calls (not 500 on duplicate)

**Actual result:** _____________

---

### TS-14: Webhook idempotency -- UNIQUE constraint exists on stripe_payment_intent_id

**TDR:** TDR-06 (D-014)
**Priority:** P0
**Type:** Data Integrity / SQL
**Preconditions:** Migration for UNIQUE constraint applied

**Steps to reproduce:**
1. Query the database for constraints:
   ```sql
   SELECT conname, contype
   FROM pg_constraint
   WHERE conrelid = 'public.credit_purchases'::regclass
   AND contype = 'u';
   ```
2. Or attempt a direct duplicate insert:
   ```sql
   INSERT INTO credit_purchases (user_id, credits_amount, amount_paid_usd, stripe_payment_intent_id)
   VALUES ('<user_id>', 10, 5, 'pi_test_unique_001');
   -- Then attempt the same insert again:
   INSERT INTO credit_purchases (user_id, credits_amount, amount_paid_usd, stripe_payment_intent_id)
   VALUES ('<user_id>', 10, 5, 'pi_test_unique_001');
   ```

**Expected result:**
- UNIQUE constraint exists on `stripe_payment_intent_id`
- First INSERT succeeds
- Second INSERT fails with error code 23505 (unique_violation)

**Actual result:** _____________

---

### TS-15: Webhook idempotency -- Duplicate webhook returns 200

**TDR:** TDR-06 (S-004)
**Priority:** P0
**Type:** Resilience / Error Handling
**Preconditions:** Idempotent webhook handler code deployed

**Steps to reproduce:**
1. Send a valid webhook event (checkout.session.completed) to `/api/stripe/webhook`
2. Note the HTTP response code (should be 200)
3. Resend the exact same event (same event ID and payment_intent_id)
4. Note the HTTP response code again

**Expected result:**
- First request: 200 OK, credits added
- Second request: 200 OK, credits NOT added (duplicate detected)
- Application code catches error 23505 and treats as "already processed"
- No 500 error returned to Stripe (which would cause Stripe to keep retrying)

**Actual result:** _____________

---

### TS-16: PlanProvider -- No client-side waterfall on page load

**TDR:** TDR-07 (A-010)
**Priority:** P1
**Type:** Performance / UX
**Preconditions:** PlanProvider fix applied

**Steps to reproduce:**
1. Clear browser cache and cookies
2. Log in as a Pro plan user
3. Open DevTools -> Network tab -> Disable cache
4. Navigate to dashboard
5. Observe: Is there a visible flash where the page shows Free plan limits before switching to Pro?
6. Check Network tab: Are there client-side fetches for plan data after initial page load?

**Expected result:**
- No visible content flicker between plan states
- Plan data available on first render (server-side)
- No additional client-side fetch for plan data after initial page load
- Pro features visible immediately

**Actual result:** _____________

---

### TS-17: PlanProvider -- Plan limits enforced correctly per plan level

**TDR:** TDR-07 (A-010)
**Priority:** P0
**Type:** Functional
**Preconditions:** PlanProvider fix applied

**Steps to reproduce:**
1. Test with Free plan user:
   - Verify AI features show upgrade prompt
   - Verify trade count limits enforced
   - Verify PDF export restricted
2. Test with Pro plan user:
   - Verify AI features accessible (up to Pro limit)
   - Verify higher trade count limit
   - Verify PDF export available
3. Test with Elite plan user:
   - Verify all features accessible
   - Verify highest limits

**Expected result:**
- Each plan level has correct feature gates
- `getPlanLimits()` returns accurate limits for each plan
- UI correctly shows/hides features based on plan
- No feature "leaking" across plan boundaries

**Actual result:** _____________

---

### TS-18: Vitest -- Test framework runs and passes

**TDR:** TDR-08 (T-001a)
**Priority:** P0
**Type:** Infrastructure
**Preconditions:** Vitest installed and configured

**Steps to reproduce:**
1. Run from project root:
   ```bash
   cd /home/takez/TakeZ-Plan
   npx vitest run
   ```
2. Observe output

**Expected result:**
- Vitest executes without configuration errors
- At least 3 test files run
- All tests pass (green)
- Exit code 0

**Actual result:** _____________

---

### TS-19: Vitest -- Server Action test for credit consumption

**TDR:** TDR-08 (T-001a)
**Priority:** P0
**Type:** Test Coverage
**Preconditions:** Test file exists for `consumeAiCredits`

**Steps to reproduce:**
1. Locate test file (expected at `__tests__/lib/plan.test.ts` or `src/lib/__tests__/plan.test.ts`)
2. Verify it tests:
   - Successful credit consumption (sufficient balance)
   - Failed credit consumption (insufficient balance)
   - Zero credit edge case
3. Run:
   ```bash
   npx vitest run --reporter=verbose plan
   ```

**Expected result:**
- Test file exists and is properly structured
- Supabase client is mocked (no live DB dependency)
- All test cases pass
- Tests validate the RPC call interface

**Actual result:** _____________

---

### TS-20: Vitest -- API route test for webhook handler

**TDR:** TDR-08 (T-001a)
**Priority:** P1
**Type:** Test Coverage
**Preconditions:** Test file exists for Stripe webhook

**Steps to reproduce:**
1. Locate test file for webhook handler
2. Verify it tests:
   - Valid checkout.session.completed event processing
   - Signature verification (Stripe-Signature header)
   - Idempotency (duplicate payment_intent_id handling)
3. Run the test

**Expected result:**
- Test mocks Stripe event construction and signature
- Tests cover happy path and error cases
- Tests validate credit addition logic

**Actual result:** _____________

---

### TS-21: Logging -- Structured logger captures errors with context

**TDR:** TDR-09 (O-001a)
**Priority:** P1
**Type:** Observability
**Preconditions:** Logging library installed, logger module created

**Steps to reproduce:**
1. Verify logger module exists (e.g., `src/lib/logger.ts`)
2. Trigger an error in a critical path:
   - Call an AI endpoint with invalid data
   - Or simulate a Supabase connection failure
3. Check log output (stdout, file, or error tracking service)

**Expected result:**
- Error logged with structured format (JSON preferred)
- Log includes: timestamp, level (error/warn/info), message, relevant context (userId, endpoint, error details)
- No stack trace exposure to end users
- Log output is machine-parseable

**Actual result:** _____________

---

### TS-22: Logging -- No sensitive data in log output

**TDR:** TDR-09 (O-001a)
**Priority:** P0
**Type:** Security / Compliance
**Preconditions:** Logger integrated in critical paths

**Steps to reproduce:**
1. Search all log statements for sensitive data patterns:
   ```bash
   grep -rn "password\|secret\|token\|apikey\|api_key\|service_role" src/ --include="*.ts" --include="*.tsx" | grep -i "log\|console"
   ```
2. Review logger configuration for any PII redaction rules
3. Trigger auth flow and check logs for password values
4. Trigger Stripe flow and check logs for payment details

**Expected result:**
- No passwords, API keys, or tokens appear in log output
- Stripe payment_intent_id may appear (non-sensitive identifier)
- User IDs may appear (required for debugging)
- Email addresses should be masked or excluded from logs

**Actual result:** _____________

---

### TS-23: Backup -- Strategy documented and pg_dump executed

**TDR:** TDR-10 (D-009)
**Priority:** P0
**Type:** Data Safety
**Preconditions:** None

**Steps to reproduce:**
1. Locate backup strategy document in project docs
2. Verify it covers:
   - Backup frequency (daily/weekly)
   - Retention period
   - Storage location
   - Recovery procedure with step-by-step commands
3. Verify Supabase plan level (Free vs Pro -- affects PITR availability)
4. Execute a manual backup:
   ```bash
   supabase db dump --schema public > schema_backup_$(date +%Y%m%d).sql
   ```
5. Verify backup file is non-empty and contains expected tables

**Expected result:**
- Backup strategy document exists and is comprehensive
- Manual `pg_dump` executes successfully
- Backup file contains DDL for all tables (profiles, trades, subscriptions, ai_credits, credit_purchases, etc.)
- Supabase PITR status documented (enabled or risk acknowledged)

**Actual result:** _____________

---

### TS-24: Env validation -- Missing critical env var causes startup failure

**TDR:** TDR-11 (T-007)
**Priority:** P0
**Type:** Resilience
**Preconditions:** Zod-based env validation module created

**Steps to reproduce:**
1. Temporarily remove `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`
2. Attempt to start the development server:
   ```bash
   cd /home/takez/TakeZ-Plan
   npm run dev
   ```
3. Observe the error output
4. Restore the env var after testing

**Expected result:**
- Application fails to start with a clear error message
- Error message identifies the missing variable by name
- Error message indicates expected type/format
- Application does NOT start with undefined critical variables

**Actual result:** _____________

---

### TS-25: Env validation -- All required vars listed in schema

**TDR:** TDR-11 (T-007)
**Priority:** P1
**Type:** Completeness
**Preconditions:** Env validation module exists

**Steps to reproduce:**
1. Locate env validation file (expected at `src/env.mjs`, `src/env.ts`, or `src/lib/env.ts`)
2. Verify the following variables are validated:
   - `NEXT_PUBLIC_SUPABASE_URL` (required, URL format)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required, non-empty string)
   - `SUPABASE_SERVICE_ROLE_KEY` (required, non-empty string, server-only)
   - `STRIPE_SECRET_KEY` (required, starts with `sk_`)
   - `STRIPE_WEBHOOK_SECRET` (required, starts with `whsec_`)
   - `OPENAI_API_KEY` (required, starts with `sk-`)
   - `ENCRYPTION_KEY` (required, non-empty string)
3. Verify optional variables are marked as such:
   - `METAAPI_TOKEN` (optional)
   - `FINNHUB_API_KEY` (optional)
   - `TWELVE_DATA_API_KEY` (optional)

**Expected result:**
- All 7 critical variables validated as required
- Optional variables do not cause failure when absent
- Clear distinction between server-only and public variables

**Actual result:** _____________

---

### TS-26: Reduced motion -- Animations disabled with OS preference

**TDR:** TDR-12 (F-015a)
**Priority:** P2
**Type:** Accessibility
**Preconditions:** Global CSS media query added

**Steps to reproduce:**
1. Open Chrome DevTools -> Rendering tab (More tools -> Rendering)
2. Set "Emulate CSS media feature prefers-reduced-motion" to "reduce"
3. Navigate through the application:
   - Dashboard page transitions
   - Modal open/close
   - Sidebar hover effects
   - Loading spinners
4. Observe if animations are disabled or significantly reduced

**Expected result:**
- CSS transitions and animations are disabled or reduced
- Content remains functional (no layout breaks)
- Key UI transitions use `transition: none` or `animation: none`
- Loading indicators may use opacity changes instead of spinning animations

**Actual result:** _____________

---

### TS-27: npm audit -- Zero CRITICAL vulnerabilities

**TDR:** TDR-13 (S-016)
**Priority:** P0
**Type:** Security / Dependencies
**Preconditions:** npm audit run and vulnerabilities addressed

**Steps to reproduce:**
1. Run from project root:
   ```bash
   cd /home/takez/TakeZ-Plan
   npm audit
   ```
2. Note counts by severity level:
   - Critical: ___
   - High: ___
   - Moderate: ___
   - Low: ___
3. If any CRITICAL or HIGH remain, check if they have documented exceptions

**Expected result:**
- Zero CRITICAL vulnerabilities
- Zero HIGH vulnerabilities (or documented exceptions with justification)
- Moderate and Low may exist but should be tracked

**Actual result:** _____________

---

### TS-28: Ghost tables -- Migration files created for all 4 tables

**TDR:** TDR-14 (A-001)
**Priority:** P0
**Type:** Schema / Infrastructure
**Preconditions:** Migration files written

**Steps to reproduce:**
1. List migration files:
   ```bash
   ls -la /home/takez/TakeZ-Plan/supabase/migrations/
   ```
2. Verify migration files exist for:
   - `trading_accounts` (CREATE TABLE IF NOT EXISTS + RLS + indexes)
   - `import_summaries` (CREATE TABLE IF NOT EXISTS + RLS + indexes)
   - `user_tags` (CREATE TABLE IF NOT EXISTS + RLS + UNIQUE constraints)
   - `user_preferences` (CREATE TABLE IF NOT EXISTS + RLS + UNIQUE constraints)
3. Open each migration and verify:
   - Uses `IF NOT EXISTS` (production safety)
   - Includes `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
   - Includes per-user RLS policies (`auth.uid() = user_id`)
   - Includes appropriate indexes (at minimum on `user_id`)
4. Validate column types against actual production schema:
   ```bash
   supabase db dump --schema public > /tmp/current_schema.sql
   ```
   Compare proposed DDL with actual types.

**Expected result:**
- 4 migration files exist (one per ghost table, or combined)
- All use `CREATE TABLE IF NOT EXISTS`
- All include RLS enablement + policies
- Column types match production reality
- Migration order respects FK dependencies (trading_accounts and import_summaries before any FK references)

**Actual result:** _____________

---

## Regression Test Suite

The following end-to-end regression tests must pass after all Wave 0 changes are applied. These are manual smoke tests until TDR-08 (Vitest) automates them.

### RT-01: Full Auth Flow
1. Go to `/register`
2. Create new account with email + password
3. Confirm email (if required)
4. Log in with credentials
5. Verify dashboard loads
6. Navigate to Settings -> Security
7. Log out
8. Verify redirect to login page

**Pass criteria:** All steps complete without errors, correct redirects, no 500 pages.

### RT-02: Trade Import Flow
1. Log in as existing user with trades
2. Navigate to Import page
3. Upload a sample CSV (10+ trades)
4. Verify parser recognizes format
5. Confirm import
6. Verify trades appear in dashboard
7. Verify trade count and metrics update

**Pass criteria:** CSV parsed correctly, trades stored, dashboard reflects new data.

### RT-03: AI Credit Consumption Flow
1. Log in as Pro plan user with 5+ credits
2. Note current credit balance
3. Use AI Copilot (send a prompt)
4. Wait for AI response
5. Verify credit balance decremented by correct amount
6. Use AI feature until credits reach 0
7. Verify "insufficient credits" message on next attempt

**Pass criteria:** Credits decrement atomically, zero-credit state handled gracefully.

### RT-04: Stripe Purchase Flow
1. Log in as free plan user
2. Navigate to pricing/upgrade page
3. Select Pro plan
4. Complete Stripe checkout (test mode)
5. Wait for webhook processing
6. Verify subscription updated to Pro
7. Verify AI credits allocated
8. Verify Pro features now accessible

**Pass criteria:** Stripe -> webhook -> subscription update -> credits allocated -> features unlocked.

### RT-05: Plan Gating Verification
1. Create or use 3 test accounts (free, pro, elite)
2. For each account, verify:
   - Correct features visible/hidden
   - Correct credit limits
   - Correct trade limits
   - AI features accessible per plan
3. Verify no feature "leaking" between plans

**Pass criteria:** Each plan level enforces its specific limits consistently.

---

## Test Execution Tracking

| Scenario | Tester | Date | Result | Notes |
|----------|--------|------|--------|-------|
| TS-01 | | | | |
| TS-02 | | | | |
| TS-03 | | | | |
| TS-04 | | | | |
| TS-05 | | | | |
| TS-06 | | | | |
| TS-07 | | | | |
| TS-08 | | | | |
| TS-09 | | | | |
| TS-10 | | | | |
| TS-11 | | | | |
| TS-12 | | | | |
| TS-13 | | | | |
| TS-14 | | | | |
| TS-15 | | | | |
| TS-16 | | | | |
| TS-17 | | | | |
| TS-18 | | | | |
| TS-19 | | | | |
| TS-20 | | | | |
| TS-21 | | | | |
| TS-22 | | | | |
| TS-23 | | | | |
| TS-24 | | | | |
| TS-25 | | | | |
| TS-26 | | | | |
| TS-27 | | | | |
| TS-28 | | | | |
| RT-01 | | | | |
| RT-02 | | | | |
| RT-03 | | | | |
| RT-04 | | | | |
| RT-05 | | | | |

---

*Document generated by Quinn (QA Agent) -- Wave 0 Test Scenarios*
*28 test scenarios + 5 regression tests covering TDR-01 through TDR-14*
*Source: Technical Debt Assessment FINAL + verified code analysis*
