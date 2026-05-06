import * as os from "node:os";

import { defineConfig } from "drizzle-kit";

function defaultDatabaseUrl() {
  const username = encodeURIComponent(os.userInfo().username);
  return `postgresql://${username}@127.0.0.1:5433/pts`;
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl(),
  },
});
