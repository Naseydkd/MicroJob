/**
 * Script de synchronisation entre la base locale et Supabase cloud
 * Usage:
 *   node scripts/sync-db.js pull   → cloud → local
 *   node scripts/sync-db.js push   → local → cloud
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

const LOCAL_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const CLOUD_URL = 'postgresql://postgres.iggypdtgjjqdjquopjcf:pkCYHLcHfljXVku1@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

const TABLES = [
  'microjob_users',
  'microjob_auth',
  'jeune_profiles',
  'entreprise_profiles',
  'missions',
  'candidatures',
  'evaluations',
  'notifications',
  'admin_logs',
  'reports',
];

async function sync(from, to, direction) {
  console.log(`\n🔄 Synchronisation ${direction}...\n`);
  for (const table of TABLES) {
    try {
      const { rows } = await from.query(`SELECT * FROM ${table}`);
      if (rows.length === 0) { console.log(`⏭️  ${table} (vide)`); continue; }
      let ok = 0, skip = 0;
      for (const row of rows) {
        const keys = Object.keys(row);
        const vals = Object.values(row).map(v =>
          v instanceof Date ? v.toISOString() :
          (typeof v === 'object' && v !== null ? JSON.stringify(v) : v)
        );
        const ph = keys.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${ph}) ON CONFLICT DO NOTHING`;
        try { await to.query(sql, vals); ok++; } catch { skip++; }
      }
      console.log(`✅ ${table.padEnd(25)} ${ok} insérés, ${skip} ignorés`);
    } catch (e) {
      console.error(`❌ ${table}: ${e.message.slice(0, 80)}`);
    }
  }
  console.log('\n✅ Synchronisation terminée !');
}

async function main() {
  const direction = process.argv[2];
  if (!['pull', 'push'].includes(direction)) {
    console.log('Usage: node sync-db.js [pull|push]');
    console.log('  pull → cloud → local');
    console.log('  push → local → cloud');
    process.exit(1);
  }

  const local = new Pool({ connectionString: LOCAL_URL });
  const cloud = new Pool({ connectionString: CLOUD_URL, ssl: { rejectUnauthorized: false } });

  try {
    if (direction === 'pull') {
      await sync(cloud, local, 'cloud → local');
    } else {
      const confirm = process.argv[3];
      if (confirm !== '--confirm') {
        console.log('⚠️  Attention: push va écraser les données cloud !');
        console.log('   Relance avec --confirm pour confirmer:');
        console.log('   node scripts/sync-db.js push --confirm');
        process.exit(0);
      }
      await sync(local, cloud, 'local → cloud');
    }
  } finally {
    await local.end();
    await cloud.end();
  }
}

main();
