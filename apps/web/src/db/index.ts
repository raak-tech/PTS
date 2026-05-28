import { createRequire } from "node:module";
import * as os from "node:os";

import { validateEnv } from '../lib/env';

const require = createRequire(import.meta.url);
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

export type Db = ReturnType<typeof getDb>;

let cached: ReturnType<typeof drizzle> | null = null;

function defaultDatabaseUrl() {
  // Prefer local unix socket to avoid TCP port/auth mismatches in dev/e2e.
  const username = encodeURIComponent(os.userInfo().username);
  const socketDir = encodeURIComponent("/var/run/postgresql");
  return `postgresql://${username}@localhost/pts?host=${socketDir}`;
}

export function getDb() {
  if (cached) return cached;

  validateEnv();
  const connectionString = process.env.DATABASE_URL ?? defaultDatabaseUrl();
  const client = postgres(connectionString, { max: 1 });
  cached = drizzle(client);
  return cached;
}
