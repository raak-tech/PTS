/**
 * Migration runner — reads SQL files from src/db/migrations/ in filename order
 * and applies any that haven't been recorded in _pts_migrations.
 * Does not depend on drizzle-kit meta/snapshot files.
 */

import os from 'node:os';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

if (process.env.SKIP_DB_MIGRATE === '1') {
  console.log('Skipping database migrations (SKIP_DB_MIGRATE=1).');
  process.exit(0);
}

function createSql() {
  if (process.env.DATABASE_URL) {
    return postgres(process.env.DATABASE_URL, { max: 1 });
  }
  return postgres({
    database: 'pts',
    user: os.userInfo().username,
    host: '/var/run/postgresql',
    max: 1,
  });
}

const sql = createSql();
const connectionLabel = process.env.DATABASE_URL ?? `unix socket /var/run/postgresql (db=pts, user=${os.userInfo().username})`;

const __dir = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dir, '../src/db/migrations');

try {
  // Ensure tracking table exists
  await sql`
    CREATE TABLE IF NOT EXISTS _pts_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  // Find all .sql files, sorted by name
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // Find already-applied migrations
  const applied = await sql`SELECT filename FROM _pts_migrations`;
  const appliedSet = new Set(applied.map((r) => r.filename));

  // Legacy: if users table exists but phone column is missing, unmark 0009 so it can re-run.
  const [phoneCol] = await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
    LIMIT 1
  `;
  if (!phoneCol) {
    await sql`DELETE FROM _pts_migrations WHERE filename IN ('0009_mobile_auth.sql', '0010_mobile_auth_retry.sql')`;
    appliedSet.delete('0009_mobile_auth.sql');
    appliedSet.delete('0010_mobile_auth_retry.sql');
  }

  let count = 0;
  for (const file of files) {
    if (appliedSet.has(file)) continue;

    const ddl = readFileSync(resolve(migrationsDir, file), 'utf8');

    // 0001/0002 were generated for SQLite; 0000_postgres already includes those columns.
    if (ddl.includes('`')) {
      console.log(`  skipping ${file} (legacy SQLite migration)`);
      await sql`INSERT INTO _pts_migrations (filename) VALUES (${file})`;
      count++;
      continue;
    }

    console.log(`  applying ${file}…`);
    await sql.unsafe(ddl);
    await sql`INSERT INTO _pts_migrations (filename) VALUES (${file})`;
    count++;
  }

  if (count === 0) {
    console.log('No new migrations to apply.');
  } else {
    console.log(`Applied ${count} migration(s).`);
  }

  console.log(`migrated postgres db at ${connectionLabel}`);
} finally {
  await sql.end({ timeout: 5 });
}
