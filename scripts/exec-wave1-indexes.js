#!/usr/bin/env node

const https = require('https');

async function executeIndexes() {
  console.log('🔍 Wave 1 Phase 4: Executing Database Indexes\n');

  // Credentials
  const url = 'https://uuijdsofeszoazgfyhve.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1aWpkc29mZXN6b2F6Z2Z5aHZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk5MTIxNiwiZXhwIjoyMDg2NTY3MjE2fQ.x8axFonFSYQrb8sKTIbaEFEvl7p-NaMi5nmf7ybbelk';

  // SQL statements
  const statements = [
    'CREATE INDEX IF NOT EXISTS idx_trades_tags_gin ON public.trades USING GIN(tags)',
    'CREATE INDEX IF NOT EXISTS idx_trades_active_user_date ON public.trades(user_id, trade_date DESC) WHERE deleted_at IS NULL',
    'CREATE INDEX IF NOT EXISTS idx_trades_user_date ON public.trades(user_id, trade_date DESC)',
    'CREATE INDEX IF NOT EXISTS idx_trades_import_id_active ON public.trades(import_id) WHERE deleted_at IS NULL'
  ];

  console.log('⚠️  Supabase limitations:');
  console.log('   • REST API: No DDL support (CREATE INDEX, ALTER TABLE, etc)');
  console.log('   • You MUST execute these manually in Supabase Studio\n');

  console.log('✅ Solution: 3 options to create indexes:\n');

  console.log('📋 OPTION 1: Supabase Studio (Easiest)');
  console.log('─'.repeat(60));
  console.log('1. Open: https://supabase.com/dashboard/project/uuijdsofeszoazgfyhve/sql/new');
  console.log('2. Paste this SQL:\n');
  
  statements.forEach((stmt, i) => {
    console.log(`${stmt};`);
  });

  console.log('\n3. Click "Execute"\n');

  console.log('📋 OPTION 2: Supabase CLI');
  console.log('─'.repeat(60));
  console.log('supabase migration new wave1_phase4_indexes');
  console.log('supabase db push\n');

  console.log('📋 OPTION 3: PostgreSQL Client (if you have DB password)');
  console.log('─'.repeat(60));
  console.log('psql -h db.uuijdsofeszoazgfyhve.supabase.co -U postgres.uuijdsofeszoazgfyhve -d postgres');
  console.log('Then paste the SQL above.\n');

  console.log('📊 Status:');
  console.log('   Migration file: supabase/migrations/20260221_wave1_phase4_indexing.sql');
  console.log('   Setup guide: WAVE1-PHASE4-SETUP.md\n');
}

executeIndexes().catch(console.error);
