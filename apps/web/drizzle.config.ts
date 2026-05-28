import * as os from "node:os";

import { defineConfig } from "drizzle-kit";

function defaultDatabaseUrl() {
  // Prefer local unix socket to avoid TCP port/auth mismatches in dev/e2e.
  const username = encodeURIComponent(os.userInfo().username);
  const socketDir = encodeURIComponent("/var/run/postgresql");
  return `postgresql://${username}@localhost/pts?host=${socketDir}`;
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl(),
  },
});
