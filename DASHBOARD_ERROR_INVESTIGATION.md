# Dashboard Error Investigation - Wave 3

## Current Status
- ✅ Build passes successfully
- ✅ Tests pass (8/8)
- ✅ Dev server runs on port 3002
- ✅ Login page renders correctly
- ⚠️ Dashboard shows error: "Algo deu errado no dashboard"

## What's Happening
The error boundary added in TDW3-04 (`src/app/(dashboard)/error.tsx`) is **correctly catching an error** thrown by the dashboard page's Server Components. This is working as intended - it's preventing a white-screen-of-death and showing a user-friendly error message.

**The error is NOT caused by the error boundary itself** - the error boundary is just doing its job catching a deeper issue.

## Probable Root Causes

### 1. **Supabase Connection or Authentication Issue**
The dashboard page (`src/app/(dashboard)/dashboard/page.tsx`) calls these server functions:
- `getTrades()` - Line 28
- `getImportSummaries()` - Line 28
- `getUserTradingAccounts()` - Line 28

If any of these fail to connect to Supabase or the user's session is invalid, the error will be caught by the error boundary.

**Debug Steps:**
```typescript
// Add logging to src/lib/trades.ts getTrades function
export const getTrades = unstable_cache(
  async (importId?: string | null, tradingAccountId?: string | null, include_deleted?: boolean) => {
    console.log('getTrades called');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Auth failed: ${authError.message}`);
    }
    if (!user) {
      console.error('No user found');
      throw new Error('User not authenticated');
    }
    // ... rest of function
  },
  ["getTrades"],
  { revalidate: 60, tags: ["trades"] }
);
```

### 2. **Missing Environment Variables**
If Supabase connection fails due to missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`, the dashboard will fail.

**Debug Steps:**
```bash
# Check .env.local
grep NEXT_PUBLIC_SUPABASE /home/takez/TakeZ-Plan/.env.local
```

### 3. **Calculation Function Error**
One of the dashboard calculation functions (`computeClientMetrics`, `filterByDateRange`, etc.) might be throwing an error if the data format is unexpected.

**Likely culprit:** `buildCumulativePnl(trades)` if the trades array structure changed

## How to Debug in Production

1. **Check Browser Console in Development Mode:**
   - Open DevTools (F12)
   - Look for error stack trace in Console tab
   - The root error message will be shown in the error boundary with stack trace in dev mode

2. **Enable Verbose Logging:**
   - Add console.log/console.error throughout the dashboard page dependencies
   - Restart dev server
   - Try to access dashboard and check terminal output

3. **Verify Supabase Connection:**
   - Test the Supabase client manually
   - Ensure RLS policies allow the current user to read trades/imports

4. **Test Individual Functions:**
   - Create a test script to call getTrades, getImportSummaries, getUserTradingAccounts independently
   - Verify each returns expected data structure

## Action Items

### Immediate (Debug & Fix)
1. [ ] Check browser console for full error stack
2. [ ] Add logging to getTrades, getImportSummaries, getUserTradingAccounts
3. [ ] Verify Supabase environment variables are set
4. [ ] Check if RLS policies were modified in Wave 3

### Testing
1. [ ] Test dashboard with demo data (new user with no trades)
2. [ ] Test dashboard with actual trades
3. [ ] Verify error boundary shows correct error message

### Prevention
1. [ ] Add error handling to dashboard page's Promise.all()
2. [ ] Add fallback for when Supabase connection fails
3. [ ] Add logging to error boundary to capture error details

## Files Related to Dashboard Error

- Error Boundary: `src/app/(dashboard)/error.tsx`
- Dashboard Page: `src/app/(dashboard)/dashboard/page.tsx`
- Dashboard Content: `src/components/dashboard/dashboard-content.tsx`
- Trade Functions: `src/lib/trades.ts`
- Calculation Functions: `src/lib/dashboard-calc.ts`

## Next Steps

1. Open browser DevTools and check Console tab for the actual error
2. Share the error message and stack trace
3. Add logging to identify which function is failing
4. Fix the identified issue
5. Verify dashboard loads correctly with demo data
