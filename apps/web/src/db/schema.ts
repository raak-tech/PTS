import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Postgres-first schema for dev/pilot. Production can use the same logical model.

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'client' | 'provider'
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { mode: "date", withTimezone: true }),
});

export const userConsents = pgTable("user_consents", {
  userId: text("user_id").primaryKey(),
  providerAccessEnabled: boolean("provider_access_enabled").notNull().default(false),
  reflectionsEnabled: boolean("reflections_enabled").notNull().default(false),
  redFlagsStorageEnabled: boolean("red_flags_storage_enabled").notNull().default(false),
  enabledAt: timestamp("enabled_at", { mode: "date", withTimezone: true }),
  revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
  reflectionEncryptionEnabled: boolean("reflection_encryption_enabled").notNull().default(false),
  reflectionSalt: text("reflection_salt"),
});

export const supportArtifacts = pgTable("support_artifacts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  bodyText: text("body_text").notNull(),
  reflectionCiphertext: text("reflection_ciphertext"),
  reflectionEncryptionMeta: text("reflection_encryption_meta"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

export const supportAuditEvents = pgTable("support_audit_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

export const inviteCodes = pgTable("invite_codes", {
  code: text("code").primaryKey(),
  providerUserId: text("provider_user_id").notNull(),
  uses: integer("uses").notNull().default(0),
  maxUses: integer("max_uses"),
  expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

export const emailOutbox = pgTable("email_outbox", {
  id: text("id").primaryKey(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  bodyText: text("body_text").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});
