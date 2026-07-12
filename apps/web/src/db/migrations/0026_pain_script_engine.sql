-- Pain Script engine (Phases A–D pilot). Legacy clients unaffected when flag off.

ALTER TABLE users ADD COLUMN IF NOT EXISTS pilot_cohort text NOT NULL DEFAULT 'legacy';

ALTER TABLE intake_responses ADD COLUMN IF NOT EXISTS onset_type text;

ALTER TABLE plans ADD COLUMN IF NOT EXISTS formulation_id text;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS formulation_version integer;

CREATE TABLE IF NOT EXISTS formulations (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  intake_response_id text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  script_beliefs text NOT NULL,
  script_displays text NOT NULL,
  reinforcing_experiences text NOT NULL,
  basic_id text NOT NULL,
  maintenance_hypothesis text NOT NULL,
  primary_targets text NOT NULL,
  confidence_json text,
  safety_flag boolean NOT NULL DEFAULT false,
  safety_reason text,
  source text NOT NULL DEFAULT 'llm',
  status text NOT NULL DEFAULT 'draft',
  counselor_id text,
  counselor_note text,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS formulations_user_id_idx ON formulations(user_id);
CREATE INDEX IF NOT EXISTS formulations_status_idx ON formulations(status);

CREATE TABLE IF NOT EXISTS client_profile (
  user_id text PRIMARY KEY,
  life_roles text,
  work_status text,
  return_to_work text,
  living_situation text,
  cultural_frame text,
  identity_before text,
  what_missed text,
  life_back_vision text,
  core_values text,
  onset_type text,
  trajectory text,
  diagnoses_context text,
  comorbidities text,
  current_treatments text,
  what_helps text,
  who_understands text,
  engagement_prefs text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS profile_facts (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  category text NOT NULL,
  sensitive boolean NOT NULL DEFAULT false,
  source text NOT NULL,
  confidence text,
  consent_scope text,
  counselor_held boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS profile_facts_user_id_idx ON profile_facts(user_id);

CREATE TABLE IF NOT EXISTS profile_field_requests (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  counselor_id text NOT NULL,
  field_key text NOT NULL,
  prompt text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  answered_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS consent_grants (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  scope text NOT NULL,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS consent_grants_user_id_idx ON consent_grants(user_id);
