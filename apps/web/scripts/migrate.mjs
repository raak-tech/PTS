import fs from "node:fs";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const sqlitePath = process.env.SQLITE_PATH ?? "./.data/dev.db";
fs.mkdirSync(new URL("../.data/", import.meta.url), { recursive: true });

const sqlite = new Database(sqlitePath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "./src/db/migrations" });

console.log(`migrated sqlite db at ${sqlitePath}`);
