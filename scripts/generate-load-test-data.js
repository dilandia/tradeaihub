#!/usr/bin/env node
/**
 * Wave 1 Phase 5.1 - Load Test Data Generation
 *
 * Generates 10,000+ synthetic forex trades across 8 test users
 * and inserts them into Supabase for benchmarking.
 *
 * Usage:
 *   node scripts/generate-load-test-data.js
 *   npm run seed:load-test
 *
 * Prerequisites:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * What it does:
 *   1. Creates 8 test users (loadtest-01@test.local ... loadtest-08@test.local)
 *   2. Creates import_summaries for each user
 *   3. Generates 10,000+ trades with realistic forex data
 *   4. ~5% of trades are soft-deleted (deleted_at set)
 *   5. ~70% of trades have tags
 *   6. ~60% of trades linked to import_ids
 *
 * Cleanup:
 *   node scripts/generate-load-test-data.js --cleanup
 */

const path = require("path");
const fs = require("fs");

// ──────────────────────────────────────────────
// Load .env.local
// ──────────────────────────────────────────────

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()])
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    });
}

const { createClient } = require("@supabase/supabase-js");

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const TOTAL_TRADES = 10500;
const NUM_USERS = 8;
const BATCH_SIZE = 500;
const TEST_USER_PREFIX = "loadtest";
const TEST_USER_DOMAIN = "test.local";
const TEST_USER_PASSWORD = "LoadTest2026!Secure";

const PAIRS = [
  { pair: "EURUSD", weight: 25, basePrice: 1.08, pipFactor: 10000 },
  { pair: "GBPUSD", weight: 20, basePrice: 1.26, pipFactor: 10000 },
  { pair: "USDJPY", weight: 18, basePrice: 150.0, pipFactor: 100 },
  { pair: "AUDUSD", weight: 12, basePrice: 0.65, pipFactor: 10000 },
  { pair: "USDCAD", weight: 8, basePrice: 1.36, pipFactor: 10000 },
  { pair: "NZDUSD", weight: 7, basePrice: 0.61, pipFactor: 10000 },
  { pair: "USDCHF", weight: 5, basePrice: 0.88, pipFactor: 10000 },
  { pair: "EURGBP", weight: 5, basePrice: 0.86, pipFactor: 10000 },
];

const TAGS = [
  "WIN",
  "LOSS",
  "PATTERN",
  "BREAKOUT",
  "REVERSAL",
  "TREND",
  "SCALP",
  "SWING",
  "NEWS",
  "ASIAN",
  "LONDON",
  "NY",
  "EUR",
  "GBP",
  "USD",
  "JPY",
  "HIGH-VOLUME",
  "LOW-RISK",
];

const NOTES_TEMPLATES = [
  "Good entry on support bounce",
  "Missed the initial breakout, late entry",
  "Clean trend following setup",
  "News-driven volatility trade",
  "Asian session range breakout",
  "London open momentum trade",
  "NY session reversal pattern",
  "Risk managed well, tight stop",
  "Should have held longer",
  "Perfect execution on this one",
  "Overtraded this pair today",
  "Followed the plan exactly",
  null,
  null,
  null,
  null,
  null,
];

// ──────────────────────────────────────────────
// Utility functions
// ──────────────────────────────────────────────

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function pickWeighted(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const d = new Date(start + Math.random() * (end - start));
  // Skip weekends (forex market closed)
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function generateTags(isWin) {
  const shouldHaveTags = Math.random() < 0.7; // 70% have tags
  if (!shouldHaveTags) return [];

  const tags = [];
  tags.push(isWin ? "WIN" : "LOSS");

  const numExtraTags = randomInt(0, 3);
  const available = TAGS.filter((t) => t !== "WIN" && t !== "LOSS");
  const shuffled = available.sort(() => Math.random() - 0.5);
  for (let i = 0; i < numExtraTags && i < shuffled.length; i++) {
    tags.push(shuffled[i]);
  }

  return [...new Set(tags)];
}

// ──────────────────────────────────────────────
// Trade generation
// ──────────────────────────────────────────────

function generateTrade(userId, importId, tradeDate) {
  const pairData = pickWeighted(PAIRS);
  const isWin = Math.random() < 0.6; // 60% win rate

  // Generate realistic pips
  let pips;
  if (isWin) {
    // Winners: 5 to 150 pips, skewed toward smaller values
    pips = Math.round(randomBetween(5, 150) * 10) / 10;
    // Occasional big winners (5% chance)
    if (Math.random() < 0.05) {
      pips = Math.round(randomBetween(150, 500) * 10) / 10;
    }
    // Rare huge winners (1% chance)
    if (Math.random() < 0.01) {
      pips = Math.round(randomBetween(500, 1000) * 10) / 10;
    }
  } else {
    // Losers: -5 to -100 pips, skewed toward smaller values
    pips = -Math.round(randomBetween(5, 100) * 10) / 10;
    // Occasional big losers (3% chance)
    if (Math.random() < 0.03) {
      pips = -Math.round(randomBetween(100, 300) * 10) / 10;
    }
    // Rare huge losers (0.5% chance)
    if (Math.random() < 0.005) {
      pips = -Math.round(randomBetween(300, 500) * 10) / 10;
    }
  }

  // Calculate entry/exit prices
  const priceVariation = randomBetween(-0.02, 0.02);
  const entryPrice = Math.round((pairData.basePrice + priceVariation) * pairData.pipFactor) / pairData.pipFactor;
  const exitPrice = Math.round((entryPrice + pips / pairData.pipFactor) * pairData.pipFactor) / pairData.pipFactor;

  // Risk/Reward (available for ~60% of trades)
  let riskReward = null;
  if (Math.random() < 0.6) {
    if (isWin) {
      riskReward = Math.round(randomBetween(1.0, 3.0) * 10) / 10;
    } else {
      riskReward = Math.round(randomBetween(0.3, 1.5) * 10) / 10;
    }
  }

  // Entry/exit times (DB column type is 'time', format: HH:MM:SS)
  const entryHour = randomInt(0, 23);
  const entryMinute = randomInt(0, 59);
  const entrySecond = randomInt(0, 59);
  const durationMinutes = randomInt(5, 480); // 5 min to 8 hours

  // Format as HH:MM:SS (time-only, no date component)
  const entryTimeStr = `${String(entryHour).padStart(2, "0")}:${String(entryMinute).padStart(2, "0")}:${String(entrySecond).padStart(2, "0")}`;
  const exitTotalMinutes = entryHour * 60 + entryMinute + durationMinutes;
  const exitHour = Math.floor(exitTotalMinutes / 60) % 24;
  const exitMinute = exitTotalMinutes % 60;
  const exitSecond = randomInt(0, 59);
  const exitTimeStr = `${String(exitHour).padStart(2, "0")}:${String(exitMinute).padStart(2, "0")}:${String(exitSecond).padStart(2, "0")}`;

  // Profit in dollars (~50% have dollar data)
  let profitDollar = null;
  if (Math.random() < 0.5) {
    const lotSize = pickRandom([0.01, 0.05, 0.1, 0.5, 1.0]);
    // Approximate: 1 standard lot = $10/pip for most pairs
    profitDollar = Math.round(pips * lotSize * 10 * 100) / 100;
  }

  // Soft-delete ~5% of trades
  let deletedAt = null;
  if (Math.random() < 0.05) {
    const deleteDate = new Date(tradeDate);
    deleteDate.setDate(deleteDate.getDate() + randomInt(1, 30));
    deletedAt = deleteDate.toISOString();
  }

  return {
    user_id: userId,
    trade_date: formatDate(tradeDate),
    pair: pairData.pair,
    entry_price: entryPrice,
    exit_price: exitPrice,
    pips: pips,
    is_win: isWin,
    risk_reward: riskReward,
    tags: generateTags(isWin),
    notes: pickRandom(NOTES_TEMPLATES),
    import_id: importId,
    entry_time: entryTimeStr,
    exit_time: exitTimeStr,
    duration_minutes: durationMinutes,
    profit_dollar: profitDollar,
    deleted_at: deletedAt,
  };
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  const isCleanup = process.argv.includes("--cleanup");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ─── Step 1: Create or find test users ───
  console.log("Step 1: Setting up test users...");

  const { data: { users: existingUsers }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("Failed to list users:", listErr.message);
    process.exit(1);
  }

  const testUserEmails = [];
  for (let i = 1; i <= NUM_USERS; i++) {
    testUserEmails.push(`${TEST_USER_PREFIX}-${String(i).padStart(2, "0")}@${TEST_USER_DOMAIN}`);
  }

  if (isCleanup) {
    console.log("CLEANUP MODE: Removing load test data...\n");
    await cleanup(supabase, existingUsers, testUserEmails);
    return;
  }

  const userIds = [];

  for (const email of testUserEmails) {
    const existing = existingUsers?.find((u) => u.email === email);
    if (existing) {
      userIds.push(existing.id);
      console.log(`  Found existing user: ${email} (${existing.id})`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: TEST_USER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: `Load Test User ${email.split("@")[0].split("-")[1]}`,
        },
      });

      if (error) {
        console.error(`  Failed to create user ${email}:`, error.message);
        process.exit(1);
      }

      userIds.push(data.user.id);
      console.log(`  Created user: ${email} (${data.user.id})`);
    }
  }

  console.log(`  ${userIds.length} users ready.\n`);

  // ─── Step 2: Create import_summaries ───
  console.log("Step 2: Creating import summaries...");

  const importIds = []; // { userId, importId }
  const importsPerUser = 3; // Each user gets 3 imports

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    for (let j = 0; j < importsPerUser; j++) {
      const importDate = randomDate("2025-08-01", "2026-02-01");
      const { data: summaryRow, error: sumErr } = await supabase
        .from("import_summaries")
        .insert({
          user_id: userId,
          source_filename: `mt5-report-${formatDate(importDate)}.xlsx`,
          imported_trades_count: 0, // Will be updated after
          account_name: `Demo Account ${j + 1}`,
          account_number: String(1000000 + i * 100 + j),
          broker: pickRandom(["IC Markets", "Pepperstone", "OANDA", "XM", "Exness"]),
          report_date: formatDate(importDate),
          total_net_profit: Math.round(randomBetween(-5000, 15000) * 100) / 100,
          gross_profit: Math.round(randomBetween(1000, 20000) * 100) / 100,
          gross_loss: Math.round(randomBetween(500, 10000) * 100) / 100,
          profit_factor: Math.round(randomBetween(0.5, 3.0) * 100) / 100,
        })
        .select("id")
        .single();

      if (sumErr) {
        console.error(`  Failed to create import summary:`, sumErr.message);
        process.exit(1);
      }

      importIds.push({ userId, importId: summaryRow.id });
    }
  }

  console.log(`  ${importIds.length} import summaries created.\n`);

  // ─── Step 3: Generate trades ───
  console.log(`Step 3: Generating ${TOTAL_TRADES} trades...`);

  const trades = [];

  // Distribute trades across users (not perfectly even, more realistic)
  const userWeights = userIds.map(() => randomBetween(0.8, 1.2));
  const totalWeight = userWeights.reduce((s, w) => s + w, 0);
  const tradesPerUser = userWeights.map((w) => Math.floor((w / totalWeight) * TOTAL_TRADES));

  // Fix rounding to hit exact total
  const diff = TOTAL_TRADES - tradesPerUser.reduce((s, n) => s + n, 0);
  tradesPerUser[0] += diff;

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const userImports = importIds.filter((imp) => imp.userId === userId);
    const count = tradesPerUser[i];

    for (let j = 0; j < count; j++) {
      // ~60% linked to an import, ~40% manual (no import_id)
      let importId = null;
      if (Math.random() < 0.6 && userImports.length > 0) {
        importId = pickRandom(userImports).importId;
      }

      const tradeDate = randomDate("2025-08-01", "2026-02-21");
      trades.push(generateTrade(userId, importId, tradeDate));
    }
  }

  console.log(`  Generated ${trades.length} trade objects.\n`);

  // ─── Step 4: Insert in batches ───
  console.log(`Step 4: Inserting trades in batches of ${BATCH_SIZE}...`);

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < trades.length; i += BATCH_SIZE) {
    const batch = trades.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("trades").insert(batch);

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errors++;
      // Try individual inserts for failed batch to isolate the problem
      for (const trade of batch) {
        const { error: singleErr } = await supabase.from("trades").insert(trade);
        if (singleErr) {
          console.error(`    Individual insert error:`, singleErr.message, JSON.stringify(trade).slice(0, 200));
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
      const progress = Math.round((inserted / trades.length) * 100);
      process.stdout.write(`\r  Inserted: ${inserted}/${trades.length} (${progress}%)`);
    }
  }

  console.log(""); // New line after progress

  // ─── Step 5: Update import_summaries counts ───
  console.log("\nStep 5: Updating import summary trade counts...");

  for (const imp of importIds) {
    const { count } = await supabase
      .from("trades")
      .select("id", { count: "exact", head: true })
      .eq("import_id", imp.importId)
      .is("deleted_at", null);

    await supabase
      .from("import_summaries")
      .update({ imported_trades_count: count || 0 })
      .eq("id", imp.importId);
  }

  // ─── Step 6: Verification ───
  console.log("\nStep 6: Verification...");

  const stats = { total: 0, byUser: {}, softDeleted: 0, withTags: 0, withImport: 0 };

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const email = testUserEmails[i];

    // Count ALL trades (including soft-deleted) using service role
    const { count: totalCount } = await supabase
      .from("trades")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // Count active (not deleted) trades
    const { count: activeCount } = await supabase
      .from("trades")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

    const deleted = (totalCount || 0) - (activeCount || 0);

    stats.total += totalCount || 0;
    stats.byUser[email] = { total: totalCount || 0, active: activeCount || 0, deleted };
    stats.softDeleted += deleted;
  }

  // Count trades with tags (non-empty array)
  const { count: tagCount } = await supabase
    .from("trades")
    .select("id", { count: "exact", head: true })
    .in("user_id", userIds)
    .not("tags", "eq", "{}");

  stats.withTags = tagCount || 0;

  // Count trades with import_id
  const { count: importCount } = await supabase
    .from("trades")
    .select("id", { count: "exact", head: true })
    .in("user_id", userIds)
    .not("import_id", "is", null);

  stats.withImport = importCount || 0;

  // ─── Results ───
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n" + "=".repeat(60));
  console.log("LOAD TEST DATA GENERATION - RESULTS");
  console.log("=".repeat(60));
  console.log(`Total trades inserted: ${stats.total}`);
  console.log(`Batch errors:          ${errors}`);
  console.log(`Soft-deleted:          ${stats.softDeleted} (${((stats.softDeleted / stats.total) * 100).toFixed(1)}%)`);
  console.log(`With tags:             ${stats.withTags} (${((stats.withTags / stats.total) * 100).toFixed(1)}%)`);
  console.log(`With import_id:        ${stats.withImport} (${((stats.withImport / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Import summaries:      ${importIds.length}`);
  console.log("-".repeat(60));
  console.log("Per user breakdown:");

  for (const [email, data] of Object.entries(stats.byUser)) {
    console.log(`  ${email}: ${data.total} trades (${data.active} active, ${data.deleted} deleted)`);
  }

  console.log("-".repeat(60));
  console.log(`Time elapsed: ${elapsed}s`);
  console.log("=".repeat(60));

  if (stats.total >= 10000 && errors === 0) {
    console.log(`\nSUCCESS: Generated ${stats.total.toLocaleString()} trades across ${NUM_USERS} users in ${elapsed}s`);
  } else if (stats.total >= 10000) {
    console.log(`\nPARTIAL SUCCESS: ${stats.total.toLocaleString()} trades inserted, ${errors} batch errors`);
  } else {
    console.error(`\nFAILURE: Only ${stats.total} trades inserted (target: 10,000+)`);
    process.exit(1);
  }
}

async function cleanup(supabase, existingUsers, testUserEmails) {
  // Delete trades for test users
  const testUsers = existingUsers?.filter((u) => testUserEmails.includes(u.email)) || [];

  if (testUsers.length === 0) {
    console.log("No test users found. Nothing to clean up.");
    return;
  }

  const testUserIds = testUsers.map((u) => u.id);

  // Delete trades
  const { error: tradeErr, count: tradeCount } = await supabase
    .from("trades")
    .delete()
    .in("user_id", testUserIds);

  if (tradeErr) {
    console.error("Failed to delete trades:", tradeErr.message);
  } else {
    console.log(`  Deleted trades for test users`);
  }

  // Delete import_summaries
  const { error: importErr } = await supabase
    .from("import_summaries")
    .delete()
    .in("user_id", testUserIds);

  if (importErr) {
    console.error("Failed to delete import summaries:", importErr.message);
  } else {
    console.log(`  Deleted import summaries for test users`);
  }

  // Delete profiles
  const { error: profileErr } = await supabase
    .from("profiles")
    .delete()
    .in("id", testUserIds);

  if (profileErr) {
    console.error("Failed to delete profiles:", profileErr.message);
  } else {
    console.log(`  Deleted profiles for test users`);
  }

  // Delete auth users
  for (const user of testUsers) {
    const { error: authErr } = await supabase.auth.admin.deleteUser(user.id);
    if (authErr) {
      console.error(`  Failed to delete auth user ${user.email}:`, authErr.message);
    } else {
      console.log(`  Deleted auth user: ${user.email}`);
    }
  }

  console.log("\nCleanup complete.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
