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
  notificationsEnabled: boolean("notifications_enabled").notNull().default(false),
  /** A/B pilot: 'legacy' (control) | 'pain_script' (clinical formulation path) */
  pilotCohort: text("pilot_cohort").notNull().default("legacy"),
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
  /** Optional ephemeral room link for the next live session (Whereby/Meet/etc.). */
  sessionJoinUrl: text("session_join_url"),
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
  /** sudden | gradual | mixed — pain-script intake */
  onsetType: text("onset_type"),
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
  isUrgent: boolean("is_urgent").notNull().default(false),
  readAt: timestamp("read_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// LLM-generated + counselor-approved program plans.
export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  intakeResponseId: text("intake_response_id").notNull(),
  generatedContent: text("generated_content").notNull(),
  formulationId: text("formulation_id"),
  formulationVersion: integer("formulation_version"),
  counselorNotes: text("counselor_notes"),
  status: text("status").notNull().default("draft"),
  counselorId: text("counselor_id"),
  approvedAt: timestamp("approved_at", { mode: "date", withTimezone: true }),
  approvedBy: text("approved_by"),
  programAnchorDate: text("program_anchor_date"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

// One counselor assigned per client.
export const clientCounselor = pgTable("client_counselor", {
  clientId: text("client_id").primaryKey(),
  counselorId: text("counselor_id").notNull(),
  assignedAt: timestamp("assigned_at", { mode: "date", withTimezone: true }).notNull(),
  scheduleRequired: boolean("schedule_required").notNull().default(false),
  scheduleRequiredAt: timestamp("schedule_required_at", { mode: "date", withTimezone: true }),
  scheduleCompletedAt: timestamp("schedule_completed_at", { mode: "date", withTimezone: true }),
});

// Admin notes flagged on a specific client for the assigned counselor to see and address.
export const counselorNotes = pgTable("counselor_client_notes", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  authorId: text("author_id").notNull(),
  body: text("body").notNull(),
  isUrgent: boolean("is_urgent").notNull().default(false),
  resolvedAt: timestamp("resolved_at", { mode: "date", withTimezone: true }),
  resolvedBy: text("resolved_by"),
  /** Required counselor response when marking addressed. */
  resolutionNote: text("resolution_note"),
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

/** §7A.3 — resolved / owned music tracks (YouTube, Spotify, owned CDN). */
export const musicTracks = pgTable("music_tracks", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  externalId: text("external_id"),
  assetUrl: text("asset_url"),
  title: text("title").notNull(),
  artist: text("artist"),
  purpose: text("purpose").notNull(),
  mood: text("mood"),
  language: text("language"),
  durationSec: integer("duration_sec"),
  approvedBy: text("approved_by"),
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

/** Pain Script Phase G — client flare reports. */
export const flareEvents = pgTable("flare_events", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  painLevel: integer("pain_level"),
  triggerText: text("trigger_text"),
  tagsJson: text("tags_json").notNull().default("[]"),
  severity: text("severity").notNull().default("low"),
  safetyConcern: boolean("safety_concern").notNull().default(false),
  interventionKey: text("intervention_key"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
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
  status: text("status").notNull().default("draft"), // 'draft' | 'edited' | 'approved' | 'released'
  approvedAt: timestamp("approved_at", { mode: "date", withTimezone: true }),
  releasedAt: timestamp("released_at", { mode: "date", withTimezone: true }),
  editedAt: timestamp("edited_at", { mode: "date", withTimezone: true }),
  counselorId: text("counselor_id"),
  counselorWeekComment: text("counselor_week_comment"),
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

// Post-program monthly check-in (maintenance mode).
export const monthlyCheckIns = pgTable('monthly_check_ins', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull(),
  yearMonth: text('year_month').notNull(),
  painLevel: integer('pain_level').notNull(),
  sleepQuality: text('sleep_quality').notNull(),
  intention: text('intention'),
  submittedAt: timestamp('submitted_at', { mode: 'date', withTimezone: true }).notNull(),
});

// LLM API usage tracking for admin cost dashboards.
export const llmUsage = pgTable("llm_usage", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  operation: text("operation").notNull(), // 'plan_generation' | 'week_generation'
  model: text("model").notNull(),
  userId: text("user_id"),
  planId: text("plan_id"),
  weekNumber: integer("week_number"),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  totalTokens: integer("total_tokens"),
  costUsd: text("cost_usd"), // stored as string for numeric precision
  status: text("status").notNull(), // 'success' | 'error'
  latencyMs: integer("latency_ms"),
  requestId: text("request_id"),
  errorText: text("error_text"),
});

// intakeSessions — tracks new one-box intake flow extractions with confidence scores.
// One session per intake. Links to intakeResponses once confirmed.
export const intakeSessions = pgTable("intake_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  intakeResponseId: text("intake_response_id"),
  segmentType: text("segment_type"),
  rawText: text("raw_text").notNull(),
  extractionJson: text("extraction_json").notNull(), // JSON: ExtractedIntake with confidence
  confidenceScores: text("confidence_scores").notNull(), // JSON: Record<string, number>
  rounds: integer("rounds").notNull().default(1),
  overallConfidence: text("overall_confidence"), // stored as string for precision (0-1)
  summary: text("summary"),
  status: text("status").notNull().default("draft"), // 'draft' | 'confirmed' | 'reviewed'
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
});

// Admin/counselor action audit trail.
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  actorUserId: text("actor_user_id").notNull(),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  metadata: text("metadata"), // JSON
});

// Pain Script formulation — versioned clinical assessment (counselor gate).
export const formulations = pgTable("formulations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  intakeResponseId: text("intake_response_id").notNull(),
  version: integer("version").notNull().default(1),
  scriptBeliefs: text("script_beliefs").notNull(),
  scriptDisplays: text("script_displays").notNull(),
  reinforcingExperiences: text("reinforcing_experiences").notNull(),
  basicId: text("basic_id").notNull(),
  maintenanceHypothesis: text("maintenance_hypothesis").notNull(),
  primaryTargets: text("primary_targets").notNull(),
  confidenceJson: text("confidence_json"),
  safetyFlag: boolean("safety_flag").notNull().default(false),
  safetyReason: text("safety_reason"),
  source: text("source").notNull().default("llm"),
  status: text("status").notNull().default("draft"),
  counselorId: text("counselor_id"),
  counselorNote: text("counselor_note"),
  rescoreJson: text("rescore_json"),
  approvedAt: timestamp("approved_at", { mode: "date", withTimezone: true }),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
});

export const clientProfile = pgTable("client_profile", {
  userId: text("user_id").primaryKey(),
  lifeRoles: text("life_roles"),
  workStatus: text("work_status"),
  returnToWork: text("return_to_work"),
  livingSituation: text("living_situation"),
  culturalFrame: text("cultural_frame"),
  identityBefore: text("identity_before"),
  whatMissed: text("what_missed"),
  lifeBackVision: text("life_back_vision"),
  coreValues: text("core_values"),
  onsetType: text("onset_type"),
  trajectory: text("trajectory"),
  diagnosesContext: text("diagnoses_context"),
  comorbidities: text("comorbidities"),
  currentTreatments: text("current_treatments"),
  whatHelps: text("what_helps"),
  whoUnderstands: text("who_understands"),
  engagementPrefs: text("engagement_prefs"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
});

export const profileFacts = pgTable("profile_facts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  category: text("category").notNull(),
  sensitive: boolean("sensitive").notNull().default(false),
  source: text("source").notNull(),
  confidence: text("confidence"),
  consentScope: text("consent_scope"),
  counselorHeld: boolean("counselor_held").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
});

export const profileFieldRequests = pgTable("profile_field_requests", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull(),
  counselorId: text("counselor_id").notNull(),
  fieldKey: text("field_key").notNull(),
  prompt: text("prompt").notNull(),
  status: text("status").notNull().default("pending"),
  answeredAt: timestamp("answered_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

export const consentGrants = pgTable("consent_grants", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  scope: text("scope").notNull(),
  grantedAt: timestamp("granted_at", { mode: "date", withTimezone: true }),
  revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

/** Mid-flow one-box intake draft (client resume). Cleared on confirm complete. */
export const intakeFlowDrafts = pgTable("intake_flow_drafts", {
  userId: text("user_id").primaryKey(),
  payloadJson: text("payload_json").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
});
