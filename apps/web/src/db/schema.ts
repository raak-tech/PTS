import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

// SQLite-first schema for dev/CI. Production can use Postgres with the same logical model.

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'client' | 'provider'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
});

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
});

export const userConsents = sqliteTable("user_consents", {
  userId: text("user_id").primaryKey(),
  dataStorageEnabled: integer("data_storage_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  enabledAt: integer("enabled_at", { mode: "timestamp" }),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
});

export const supportArtifacts = sqliteTable("support_artifacts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  bodyText: text("body_text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const inviteCodes = sqliteTable("invite_codes", {
  code: text("code").primaryKey(),
  providerUserId: text("provider_user_id").notNull(),
  uses: integer("uses").notNull().default(0),
  maxUses: integer("max_uses"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const emailOutbox = sqliteTable("email_outbox", {
  id: text("id").primaryKey(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  bodyText: text("body_text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
