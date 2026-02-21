#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function executeIndexes() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('❌ Missing SUPABASE env vars');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false }
  });

  // Admin client (requires SERVICE_ROLE_KEY)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY - need admin access');
    console.log('📝 Service Role Key needed to execute DDL statements');
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false }
  });

  console.log('🔍 Wave 1 Phase 4: Executing Indexes\n');

  // Read SQL file
  const sqlFile = path.join(__dirname, '../supabase/migrations/20260221_wave1_phase4_indexing.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

  try {
    // Execute as admin for DDL
    const { data, error } = await admin.rpc('exec_sql', {
      sql: sqlContent
    }).catch(() => ({ data: null, error: new Error('RPC not available - execute manually in SQL editor') }));

    if (error) {
      console.log('⚠️  RPC method not available:', error.message);
      console.log('\n📋 Execute manually:');
      console.log('1. Go to: https://supabase.com/dashboard/project/uuijdsofeszoazgfyhve/sql/new');
      console.log('2. Paste the SQL file contents');
      console.log('3. Click Execute\n');
      process.exit(1);
    }

    console.log('✅ Indexes created successfully!');
    console.log(data);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

executeIndexes();
