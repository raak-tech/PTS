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

function defaultDatabaseUrl() {
  const username = encodeURIComponent(os.userInfo().username);
  const socketDir = encodeURIComponent('/var/run/postgresql');
  return `postgresql://${username}@localhost/pts?host=${socketDir}`;
}

const connectionString = process.env.DATABASE_URL ?? defaultDatabaseUrl();
const sql = postgres(connectionString, { max: 1 });

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

  // If this is an existing DB (users table already exists), mark any old migration
  // files as applied without running them so they don't error on "already exists".
  const [usersExists] = await sql`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'users' LIMIT 1
  `;
  if (usersExists) {
    for (const file of files) {
      await sql`
        INSERT INTO _pts_migrations (filename) VALUES (${file})
        ON CONFLICT (filename) DO NOTHING
      `;
    }
    // Now re-fetch applied set so only truly new files (added after this seeding) get run
  }

  // Find already-applied migrations
  const applied = await sql`SELECT filename FROM _pts_migrations`;
  const appliedSet = new Set(applied.map(r => r.filename));

  let count = 0;
  for (const file of files) {
    if (appliedSet.has(file)) continue;

    const ddl = readFileSync(resolve(migrationsDir, file), 'utf8');
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

  console.log(`migrated postgres db at ${connectionString}`);
} finally {
  await sql.end({ timeout: 5 });
}
