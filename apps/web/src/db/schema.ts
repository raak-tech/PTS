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
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// Extended profile for counselors/providers
export const counselorProfiles = pgTable("counselor_profiles", {
  userId: text("user_id").primaryKey(),
  fullName: text("full_name").notNull(),
  title: text("title").notNull(),
  credentials: text("credentials"),
  specialisations: text("specialisations").notNull(), // JSON array
  languages: text("languages").notNull(),             // JSON array
  yearsExperience: text("years_experience"),
  bio: text("bio").notNull(),
  verifiedAt: timestamp("verified_at", { mode: "date", withTimezone: true }),
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
  dataStorageEnabled: boolean("data_storage_enabled").notNull().default(false),
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

// Stores a client's completed intake assessment. One per user.
export const intakeResponses = pgTable("intake_responses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  // Situation
  painSource: text("pain_source").notNull(),
  painSourceOther: text("pain_source_other"),
  painDescription: text("pain_description").notNull(),
  painDuration: text("pain_duration").notNull(),
  // Demographics
  ageRange: text("age_range"),
  gender: text("gender"),
  occupation: text("occupation"),
  affectsWork: text("affects_work"),
  hasDependents: boolean("has_dependents"),
  priorTherapy: text("prior_therapy"),
  countryRegion: text("country_region"),
  // Life impact
  activitiesAffected: text("activities_affected").notNull(),
  biggestChange: text("biggest_change").notNull(),
  // Goals
  recoveryGoal: text("recovery_goal").notNull(),
  recoveryTimeline: text("recovery_timeline"),
  // Support
  currentTreatment: text("current_treatment"),
  socialSupport: text("social_support"),
  // Preferences
  structurePreference: text("structure_preference"),
  engagementTime: text("engagement_time"),
  // Safety
  hasRedFlags: boolean("has_red_flags").notNull().default(false),
  isSafe: boolean("is_safe").notNull().default(true),
  consentGiven: boolean("consent_given").notNull().default(false),
  completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
});

// Async two-way messages between a client and their counselor.
export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  fromUserId: text("from_user_id").notNull(),
  toUserId: text("to_user_id").notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// LLM-generated + counselor-approved program plans.
export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  intakeResponseId: text("intake_response_id").notNull(),
  generatedContent: text("generated_content").notNull(),
  counselorNotes: text("counselor_notes"),
  status: text("status").notNull().default("draft"),
  counselorId: text("counselor_id"),
  approvedAt: timestamp("approved_at", { mode: "date", withTimezone: true }),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// One counselor assigned per client.
export const clientCounselor = pgTable("client_counselor", {
  clientId: text("client_id").primaryKey(),
  counselorId: text("counselor_id").notNull(),
  assignedAt: timestamp("assigned_at", { mode: "date", withTimezone: true }).notNull(),
});
