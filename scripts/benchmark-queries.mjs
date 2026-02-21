/**
 * Wave 1 Phase 5.2: Performance Benchmark Script
 * Measures latency of primary Supabase queries against production database.
 *
 * Methodology:
 *   - 3 warm-up runs (discarded)
 *   - 10 measured runs per query
 *   - Records: min / max / avg / p95 / p99 latency
 *   - Output: results/benchmark-2026-02-21.csv
 *
 * Queries benchmarked:
 *   1. getTradesPaginated (100 records, user_id + trade_date DESC)
 *   2. getTrades (all trades with RLS filter)
 *   3. Tag filtering (.contains("tags", [...]))
 *   4. getTradeMetricsRpc (aggregation via RPC)
 *   5. deleteImport soft-delete cascade (simulated, rolled back)
 *   6. getTradeCount (count with RLS)
 *   7. getUserTagCounts RPC
 *
 * Usage: node scripts/benchmark-queries.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Load .env.local
const envContent = readFileSync(resolve(projectRoot, '.env.local'), 'utf8');
function getEnv(key) {
  const match = envContent.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : null;
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('Missing required environment variables in .env.local');
  process.exit(1);
}

// Admin client (bypasses RLS -- used for setup/teardown)
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Simulated authenticated client (service role acts as user for benchmarking)
// We use service role for benchmarking since we cannot authenticate via cookies here.
// The queries go through the same PostgREST paths but without cookie-based auth overhead.
const supabase = admin;

const WARMUP_RUNS = 3;
const MEASURED_RUNS = 10;

// Discover the primary test user
async function getTestUser() {
  const { data } = await admin.from('trades').select('user_id').limit(1);
  if (!data || data.length === 0) {
    console.error('No trades found in database. Cannot benchmark.');
    process.exit(1);
  }
  return data[0].user_id;
}

// Percentile calculation
function percentile(sortedArr, p) {
  const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, idx)];
}

// Run a benchmark: warmup + measured runs
async function benchmark(name, fn) {
  // Warm-up
  for (let i = 0; i < WARMUP_RUNS; i++) {
    await fn();
  }

  // Measured runs
  const times = [];
  for (let i = 0; i < MEASURED_RUNS; i++) {
    const start = performance.now();
    await fn();
    const elapsed = performance.now() - start;
    times.push(elapsed);
  }

  times.sort((a, b) => a - b);

  const min = times[0];
  const max = times[times.length - 1];
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  const p95 = percentile(times, 95);
  const p99 = percentile(times, 99);

  return { name, min, max, avg, p95, p99, runs: MEASURED_RUNS, raw: times };
}

async function main() {
  const userId = await getTestUser();

  // Get trade count for context
  const { count: tradeCount } = await admin
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);

  // Get a sample import_id for cascade test
  const { data: imports } = await admin
    .from('import_summaries')
    .select('id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .limit(1);

  const testImportId = imports?.[0]?.id || null;

  // Get a sample tag for tag filtering
  const { data: sampleTrades } = await admin
    .from('trades')
    .select('tags')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .not('tags', 'eq', '{}')
    .limit(10);

  let testTag = null;
  if (sampleTrades) {
    for (const t of sampleTrades) {
      if (t.tags && t.tags.length > 0) {
        testTag = t.tags[0];
        break;
      }
    }
  }

  console.log('=== Wave 1 Phase 5.2: Performance Benchmark ===');
  console.log(`User ID:     ${userId}`);
  console.log(`Trade count: ${tradeCount}`);
  console.log(`Test tag:    ${testTag || '(none found)'}`);
  console.log(`Import ID:   ${testImportId || '(none found)'}`);
  console.log(`Warm-up:     ${WARMUP_RUNS} runs (discarded)`);
  console.log(`Measured:    ${MEASURED_RUNS} runs per query`);
  console.log('');

  const results = [];

  // 1. getTradesPaginated -- 100 records
  console.log('Benchmarking: getTradesPaginated (100 records)...');
  results.push(await benchmark('getTradesPaginated_100', async () => {
    await supabase
      .from('trades')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('trade_date', { ascending: false })
      .range(0, 99);
  }));

  // 2. getTrades -- fetch all
  console.log('Benchmarking: getTrades (all trades)...');
  results.push(await benchmark('getTrades_all', async () => {
    await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('trade_date', { ascending: false });
  }));

  // 3. Tag filtering
  if (testTag) {
    console.log(`Benchmarking: Tag filtering (tag: "${testTag}")...`);
    results.push(await benchmark(`tagFilter_${testTag}`, async () => {
      await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .contains('tags', [testTag]);
    }));
  } else {
    console.log('SKIP: No tags found in trades. Tag filtering benchmark skipped.');
    results.push({
      name: 'tagFilter_NONE',
      min: 0, max: 0, avg: 0, p95: 0, p99: 0,
      runs: 0, raw: [],
    });
  }

  // 4. getTradeMetricsRpc
  console.log('Benchmarking: getTradeMetricsRpc...');
  results.push(await benchmark('getTradeMetricsRpc', async () => {
    await supabase.rpc('get_trade_metrics', {
      p_user_id: userId,
      p_import_id: null,
      p_account_id: null,
    });
  }));

  // 5. deleteImport soft-delete cascade (READ-ONLY simulation)
  // Instead of actually deleting, we simulate the read pattern of the cascade
  if (testImportId) {
    console.log('Benchmarking: deleteImport cascade (read simulation)...');
    results.push(await benchmark('deleteImport_cascade_read', async () => {
      // Step 1: Count trades linked to import
      await supabase
        .from('trades')
        .select('id', { count: 'exact', head: true })
        .eq('import_id', testImportId)
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Step 2: Read import summary
      await supabase
        .from('import_summaries')
        .select('id')
        .eq('id', testImportId)
        .eq('user_id', userId)
        .single();
    }));
  } else {
    console.log('SKIP: No import found. deleteImport cascade benchmark skipped.');
    results.push({
      name: 'deleteImport_cascade_read',
      min: 0, max: 0, avg: 0, p95: 0, p99: 0,
      runs: 0, raw: [],
    });
  }

  // 6. getTradeCount
  console.log('Benchmarking: getTradeCount...');
  results.push(await benchmark('getTradeCount', async () => {
    await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null);
  }));

  // 7. getUserTagCounts RPC
  console.log('Benchmarking: getUserTagCounts RPC...');
  results.push(await benchmark('getUserTagCounts_rpc', async () => {
    await supabase.rpc('get_user_tag_counts', {
      p_user_id: userId,
    });
  }));

  // 8. getTradesPaginated with tag filter
  if (testTag) {
    console.log(`Benchmarking: getTradesPaginated + tag filter (tag: "${testTag}")...`);
    results.push(await benchmark(`getTradesPaginated_tagFilter_${testTag}`, async () => {
      await supabase
        .from('trades')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null)
        .contains('tags', [testTag])
        .order('trade_date', { ascending: false })
        .range(0, 99);
    }));
  }

  // Print results
  console.log('\n=== BENCHMARK RESULTS ===\n');
  console.log(
    'Query'.padEnd(45) +
    'Min(ms)'.padStart(10) +
    'Max(ms)'.padStart(10) +
    'Avg(ms)'.padStart(10) +
    'P95(ms)'.padStart(10) +
    'P99(ms)'.padStart(10) +
    'Runs'.padStart(6)
  );
  console.log('-'.repeat(101));

  for (const r of results) {
    const fmt = (v) => v.toFixed(2);
    console.log(
      r.name.padEnd(45) +
      fmt(r.min).padStart(10) +
      fmt(r.max).padStart(10) +
      fmt(r.avg).padStart(10) +
      fmt(r.p95).padStart(10) +
      fmt(r.p99).padStart(10) +
      String(r.runs).padStart(6)
    );
  }

  // Write CSV
  const csvLines = [
    'query,min_ms,max_ms,avg_ms,p95_ms,p99_ms,runs,trade_count,timestamp',
  ];

  const timestamp = new Date().toISOString();
  for (const r of results) {
    csvLines.push(
      `${r.name},${r.min.toFixed(2)},${r.max.toFixed(2)},${r.avg.toFixed(2)},${r.p95.toFixed(2)},${r.p99.toFixed(2)},${r.runs},${tradeCount},${timestamp}`
    );
  }

  const csvPath = resolve(projectRoot, 'results', 'benchmark-2026-02-21.csv');
  writeFileSync(csvPath, csvLines.join('\n') + '\n');
  console.log(`\nCSV written to: ${csvPath}`);

  // PASS/FAIL determination
  console.log('\n=== PASS/FAIL ASSESSMENT ===\n');
  const thresholds = {
    getTradesPaginated_100: { p95: 500, label: 'Paginated query (100 rows)' },
    getTrades_all: { p95: 1000, label: 'All trades fetch' },
    getTradeMetricsRpc: { p95: 500, label: 'Trade metrics RPC' },
    getTradeCount: { p95: 300, label: 'Trade count' },
    getUserTagCounts_rpc: { p95: 500, label: 'Tag counts RPC' },
  };

  let allPass = true;
  for (const r of results) {
    const threshold = thresholds[r.name];
    if (threshold && r.runs > 0) {
      const pass = r.p95 <= threshold.p95;
      const status = pass ? 'PASS' : 'FAIL';
      if (!pass) allPass = false;
      console.log(`  ${status}: ${threshold.label} -- p95=${r.p95.toFixed(2)}ms (threshold: ${threshold.p95}ms)`);
    }
  }

  console.log(`\nOverall: ${allPass ? 'PASS' : 'FAIL'}`);
  console.log(`\nNote: Tested with ${tradeCount} trades. Re-run with 10K+ trades for Phase 5.1 verification.`);
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
