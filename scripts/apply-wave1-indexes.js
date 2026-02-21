#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');

async function applyIndexes() {
  console.log('🔍 Wave 1 Phase 4: Applying Database Indexes\n');

  const sqlFile = './supabase/migrations/20260221_wave1_phase4_indexing.sql';
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))
    .filter(s => s.length > 0);

  console.log(`📋 Found ${statements.length} SQL statements\n`);

  const client = new Client({
    host: 'db.uuijdsofeszoazgfyhve.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres.uuijdsofeszoazgfyhve',
    password: process.env.SUPABASE_DB_PASSWORD || 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('⏳ Attempting to connect to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    let success = 0;

    for (const [i, stmt] of statements.entries()) {
      try {
        process.stdout.write(`⏳ [${i + 1}/${statements.length}] ${stmt.substring(0, 40)}... `);
        await client.query(stmt);
        console.log('✅');
        success++;
      } catch (err) {
        console.log(`❌ ${err.message.substring(0, 50)}`);
      }
    }

    await client.end();
    console.log(`\n✅ Result: ${success}/${statements.length} indexes successfully created`);

  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
}

applyIndexes();
