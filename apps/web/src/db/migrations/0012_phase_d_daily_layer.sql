-- Phase D: daily reinforcements, calendar, stickiness feedback, music catalog prep

ALTER TABLE intake_responses
  ADD COLUMN IF NOT EXISTS ayurveda_preferences text;

CREATE TABLE IF NOT EXISTS daily_reinforcements (
  id text PRIMARY KEY,
  counselor_id text NOT NULL,
  client_id text NOT NULL,
  title text NOT NULL,
  body_text text NOT NULL,
  counselor_audio_url text,
  plan_week integer,
  start_date text NOT NULL,
  end_date text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_reinforcements_client
  ON daily_reinforcements (client_id, start_date, end_date);

CREATE TABLE IF NOT EXISTS reinforcement_responses (
  id text PRIMARY KEY,
  reinforcement_id text NOT NULL,
  client_id text NOT NULL,
  response_type text NOT NULL,
  body_text text,
  audio_url text,
  submitted_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reinforcement_responses_reinforcement
  ON reinforcement_responses (reinforcement_id);

CREATE TABLE IF NOT EXISTS daily_calendar_entries (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  date_iso text NOT NULL,
  blocks text NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (client_id, date_iso)
);

CREATE TABLE IF NOT EXISTS daily_schedule_feedback (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  date_iso text NOT NULL,
  worked_text text,
  didnt_work_text text,
  submitted_at timestamptz NOT NULL,
  UNIQUE (client_id, date_iso)
);

CREATE TABLE IF NOT EXISTS music_sets (
  id text PRIMARY KEY,
  title text NOT NULL,
  purpose_tag text NOT NULL,
  spotify_uri text,
  description text,
  created_at timestamptz NOT NULL
);
