import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: process.env.DATABASE_URL ? "postgresql" : "sqlite",
  dbCredentials: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : { url: `file:${process.env.SQLITE_PATH ?? "./.data/dev.db"}` },
});
