#!/usr/bin/env node

/**
 * Diagnostic script to identify dashboard error causes
 * Run with: node scripts/diagnose-dashboard.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 Dashboard Error Diagnostic\n');

// 1. Check environment variables
console.log('1️⃣  Checking Environment Variables:');
const envPath = path.join(projectRoot, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log(`   ✅ .env.local exists`);
  console.log(`   ${hasSupabaseUrl ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_URL configured`);
  console.log(`   ${hasSupabaseKey ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_ANON_KEY configured`);
} else {
  console.log(`   ❌ .env.local not found`);
}

// 2. Check error boundary files
console.log('\n2️⃣  Checking Error Boundary Files:');
const errorBoundaries = [
  'src/app/error.tsx',
  'src/app/(auth)/error.tsx',
  'src/app/(dashboard)/error.tsx',
];

errorBoundaries.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} missing`);
  }
});

// 3. Check dashboard dependencies
console.log('\n3️⃣  Checking Dashboard Dependencies:');
const dashboardFile = path.join(projectRoot, 'src/app/(dashboard)/dashboard/page.tsx');
const dashboardContent = fs.readFileSync(dashboardFile, 'utf-8');

const dependencies = [
  { name: 'getTrades', pattern: 'getTrades' },
  { name: 'getImportSummaries', pattern: 'getImportSummaries' },
  { name: 'getUserTradingAccounts', pattern: 'getUserTradingAccounts' },
  { name: 'buildCumulativePnl', pattern: 'buildCumulativePnl' },
  { name: 'toCalendarTrades', pattern: 'toCalendarTrades' },
  { name: 'DashboardContent', pattern: 'DashboardContent' },
];

dependencies.forEach(dep => {
  if (dashboardContent.includes(dep.pattern)) {
    console.log(`   ✅ ${dep.name} imported`);
  } else {
    console.log(`   ❌ ${dep.name} NOT imported`);
  }
});

// 4. Check for recent changes
console.log('\n4️⃣  Checking Wave 3 Changes:');
const changedFiles = [
  'src/app/actions/trades.ts',
  'src/app/(auth)/error.tsx',
  'src/app/error.tsx',
  'src/lib/validation/trade-schemas.ts',
];

changedFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ⚠️  ${file} doesn't exist (might be new)`);
  }
});

// 5. Check for syntax errors
console.log('\n5️⃣  Checking TypeScript Configuration:');
const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
if (fs.existsSync(tsConfigPath)) {
  console.log(`   ✅ tsconfig.json exists`);
} else {
  console.log(`   ❌ tsconfig.json missing`);
}

// 6. Summary
console.log('\n📋 Summary:');
console.log('\nIf all checks pass but dashboard still errors:');
console.log('1. Check browser Console (F12) for full error stack');
console.log('2. Look for errors related to:');
console.log('   - Supabase connection');
console.log('   - Database query (RLS policy issue)');
console.log('   - Calculation function failure');
console.log('3. Check server logs: tail -f /tmp/dev-server.log');
console.log('4. Add console.error() to getTrades() in src/lib/trades.ts');

console.log('\n✅ Diagnostic complete!\n');
