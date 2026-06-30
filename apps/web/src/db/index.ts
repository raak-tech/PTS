import { createRequire } from "node:module";
import * as os from "node:os";

import { validateEnv } from '../lib/env';

const require = createRequire(import.meta.url);
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

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
