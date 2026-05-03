import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

export type Db = ReturnType<typeof getDb>;

let cached: ReturnType<typeof drizzle> | null = null;

function ensureSqliteDir(sqlitePath: string) {
  const dir = path.dirname(sqlitePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function getDb() {
  if (cached) return cached;

  const sqlitePath = process.env.SQLITE_PATH ?? "./.data/dev.db";
  ensureSqliteDir(sqlitePath);
  const sqlite = new Database(sqlitePath);
  cached = drizzle(sqlite);
  return cached;
}
