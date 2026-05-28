import os from "node:os";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

if (process.env.SKIP_DB_MIGRATE === "1") {
  console.log("Skipping database migrations (SKIP_DB_MIGRATE=1).");
  process.exit(0);
}

function defaultDatabaseUrl() {
  // Prefer local unix socket to avoid TCP port/auth mismatches in dev/e2e.
  // Works with default Ubuntu Postgres cluster settings (peer auth for local user).
  const username = encodeURIComponent(os.userInfo().username);
  const socketDir = encodeURIComponent("/var/run/postgresql");
  // postgres-js requires a hostname in the authority; use localhost + unix socket host override.
  return `postgresql://${username}@localhost/pts?host=${socketDir}`;
}

const connectionString = process.env.DATABASE_URL ?? defaultDatabaseUrl();
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log(`migrated postgres db at ${connectionString}`);
} finally {
  await client.end({ timeout: 5 });
}
