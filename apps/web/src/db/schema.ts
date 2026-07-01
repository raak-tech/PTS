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
  passwordHash: text("password_hash"),
  phone: text("phone").unique(),
  role: text("role").notNull(), // 'client' | 'provider' | 'admin'
  displayName: text("display_name"),
  expoPushToken: text("expo_push_token"),
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
  calendlyUrl: text("calendly_url"),
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
  ayurvedaPreferences: text("ayurveda_preferences"),
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

// Admin notes flagged on a specific client for the assigned counselor to see and address.
export const counselorNotes = pgTable("counselor_client_notes", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  authorId: text("author_id").notNull(),
  body: text("body").notNull(),
  resolvedAt: timestamp("resolved_at", { mode: "date", withTimezone: true }),
  resolvedBy: text("resolved_by"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// Web Push notification subscriptions (for Web Push Protocol)
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  auth: text("auth").notNull(),
  p256dh: text("p256dh").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

export const dailyReinforcements = pgTable("daily_reinforcements", {
  id: text("id").primaryKey(),
  counselorId: text("counselor_id").notNull(),
  clientId: text("client_id").notNull(),
  title: text("title").notNull(),
  bodyText: text("body_text").notNull(),
  counselorAudioUrl: text("counselor_audio_url"),
  planWeek: integer("plan_week"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

export const reinforcementResponses = pgTable("reinforcement_responses", {
  id: text("id").primaryKey(),
  reinforcementId: text("reinforcement_id").notNull(),
  clientId: text("client_id").notNull(),
  responseType: text("response_type").notNull(),
  bodyText: text("body_text"),
  audioUrl: text("audio_url"),
  submittedAt: timestamp("submitted_at", { mode: "date", withTimezone: true }).notNull(),
});

export const dailyCalendarEntries = pgTable("daily_calendar_entries", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  dateIso: text("date_iso").notNull(),
  blocks: text("blocks").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
});

export const dailyScheduleFeedback = pgTable("daily_schedule_feedback", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  dateIso: text("date_iso").notNull(),
  workedText: text("worked_text"),
  didntWorkText: text("didnt_work_text"),
  submittedAt: timestamp("submitted_at", { mode: "date", withTimezone: true }).notNull(),
});

export const musicSets = pgTable("music_sets", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  purposeTag: text("purpose_tag").notNull(),
  spotifyUri: text("spotify_uri"),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

export const holisticCompletions = pgTable("holistic_completions", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  dateIso: text("date_iso").notNull(),
  weekNumber: integer("week_number").notNull(),
  activityType: text("activity_type").notNull(),
  notes: text("notes"),
  completedAt: timestamp("completed_at", { mode: "date", withTimezone: true }).notNull(),
});

export const weeklyCheckIns = pgTable("weekly_check_ins", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  weekStartIso: text("week_start_iso").notNull(),
  answersJson: text("answers_json").notNull(),
  submittedAt: timestamp("submitted_at", { mode: "date", withTimezone: true }).notNull(),
});

export const eveningReflections = pgTable("evening_reflections", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  dateIso: text("date_iso").notNull(),
  bodyText: text("body_text").notNull(),
  submittedAt: timestamp("submitted_at", { mode: "date", withTimezone: true }).notNull(),
});

export const otpCodes = pgTable("otp_codes", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(10),
  expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// Per-week counselor-approved plan content (SCOPE-A).
// Replaces atomic plan approval — clients see only weeks with status='approved'.
// Counselor edits content inline then approves each week independently.
export const planWeeks = pgTable("plan_weeks", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  content: text("content").notNull(), // JSON — one week from GeneratedPlan.weeks[]
  status: text("status").notNull().default("draft"), // 'draft' | 'edited' | 'approved'
  approvedAt: timestamp("approved_at", { mode: "date", withTimezone: true }),
  editedAt: timestamp("edited_at", { mode: "date", withTimezone: true }),
  counselorId: text("counselor_id"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// Daily morning check-in — pain level, sleep quality, intention (SCOPE-F).
// One entry per client per day. Feeds counselor engagement dashboard pain trend.
export const dailyCheckIns = pgTable("daily_check_ins", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  dateIso: text("date_iso").notNull(),         // YYYY-MM-DD local date
  painLevel: integer("pain_level").notNull(),  // 0–10 NRS
  sleepQuality: text("sleep_quality").notNull(), // 'poor' | 'ok' | 'good'
  intention: text("intention"),
  submittedAt: timestamp("submitted_at", { mode: "date", withTimezone: true }).notNull(),
});
