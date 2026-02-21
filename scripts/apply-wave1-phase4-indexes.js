#!/usr/bin/env node

/**
 * Wave 1 Phase 4: Apply Indexing Strategy
 * Executa os índices SQL no Supabase via RPC
 */

const fs = require('fs');
const path = require('path');

async function applyIndexes() {
  console.log('🔍 Wave 1 Phase 4: Applying Database Indexes\n');

  const sqlFile = path.join(__dirname, '../supabase/migrations/20260221_wave1_phase4_indexing.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ SQL file not found: ${sqlFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFile, 'utf-8');

  console.log('📋 SQL Commands to execute:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));

  console.log('\n✅ To apply these indexes:');
  console.log('1. Go to https://supabase.com/dashboard/project/uuijdsofeszoazgfyhve/sql/new');
  console.log('2. Copy and paste the SQL above');
  console.log('3. Click "Execute" to apply all indexes');
  console.log('\n4. Verify with:');
  console.log('   SELECT indexname FROM pg_indexes WHERE tablename = "trades" ORDER BY indexname;');
}

applyIndexes().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
