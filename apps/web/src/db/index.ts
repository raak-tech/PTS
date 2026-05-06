import { createRequire } from "node:module";
import * as os from "node:os";

const require = createRequire(`${process.cwd()}/noop.js`);
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

export type Db = ReturnType<typeof getDb>;

let cached: ReturnType<typeof drizzle> | null = null;

function defaultDatabaseUrl() {
  const username = encodeURIComponent(os.userInfo().username);
  return `postgresql://${username}@127.0.0.1:5433/pts`;
}

export function getDb() {
  if (cached) return cached;

  const connectionString = process.env.DATABASE_URL ?? defaultDatabaseUrl();
  const client = postgres(connectionString, { max: 1 });
  cached = drizzle(client);
  return cached;
}
