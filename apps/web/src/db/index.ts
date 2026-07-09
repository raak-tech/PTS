import * as os from "node:os";

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { validateEnv } from '../lib/env';

export type Db = ReturnType<typeof getDb>;

let cached: ReturnType<typeof drizzle> | null = null;

function createPostgresClient() {
  if (process.env.DATABASE_URL) {
    return postgres(process.env.DATABASE_URL, { max: 1 });
  }
  // Local dev: unix socket (psql-style peer auth). Avoids TCP password prompts.
  return postgres({
    database: 'pts',
    user: os.userInfo().username,
    host: '/var/run/postgresql',
    max: 1,
  });
}

export function getDb() {
  if (cached) return cached;

  validateEnv();
  cached = drizzle(createPostgresClient());
  return cached;
}
