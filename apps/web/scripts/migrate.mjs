import os from "node:os";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

function defaultDatabaseUrl() {
  const username = encodeURIComponent(os.userInfo().username);
  return `postgresql://${username}@127.0.0.1:5433/pts`;
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
