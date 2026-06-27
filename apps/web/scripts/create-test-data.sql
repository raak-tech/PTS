-- Test data for Phase 0 (reference only — do NOT execute directly)
-- Phase 0 testing should use the UI for authentic flows.
-- Use via API or UI form instead of raw SQL inserts.

-- 1. Test client user
INSERT INTO users (id, email, password_hash, role, display_name, created_at)
VALUES (
  'test-client-001',
  'client@pts-test.local',
  '$argon2id$v=19$m=19456,t=2,p=1$...',  -- Hash of "test1234" (pre-hashed placeholder)
  'client',
  'Test Client',
  NOW()
) ON CONFLICT DO NOTHING;

-- 2. Test counselor user
INSERT INTO users (id, email, password_hash, role, display_name, created_at)
VALUES (
  'test-counselor-001',
  'counselor@pts-test.local',
  '$argon2id$v=19$m=19456,t=2,p=1$...',  -- Hash of "test1234"
  'provider',
  'Ramya Test',
  NOW()
) ON CONFLICT DO NOTHING;

-- 3. Counselor profile
INSERT INTO counselor_profiles (user_id, full_name, title, credentials, specialisations, languages, years_experience, bio, calendly_url, created_at)
VALUES (
  'test-counselor-001',
  'Dr. Ramya Test',
  'Psychologist',
  'M.Sc. Psychology, RCI Licensed',
  '["workplace", "accident", "sports"]',
  '["English", "Hindi"]',
  '5to10',
  'Experienced psychologist specializing in pain recovery and trauma support. Uses ACT and CBT approaches.',
  'https://calendly.com/ramya-test',
  NOW()
) ON CONFLICT DO NOTHING;

-- 4. Test intake response
INSERT INTO intake_responses (
  id, user_id, pain_source, pain_source_other, pain_description, pain_duration,
  age_range, gender, occupation, affects_work, has_dependents, prior_therapy, country_region,
  activities_affected, biggest_change, recovery_goal, recovery_timeline,
  current_treatment, social_support, structure_preference, engagement_time,
  has_red_flags, is_safe, consent_given, completed_at, created_at, updated_at
) VALUES (
  'intake-001',
  'test-client-001',
  'workplace',
  NULL,
  'Injured my knee in a fall at work 4 months ago. Initially thought it was minor but it has developed into chronic pain that is affecting my ability to work and my confidence.',
  '3to6m',
  '36to50',
  'male',
  'Software engineer',
  'yes',
  true,
  'no',
  'India',
  '["work", "sport", "social"]',
  'I cannot work full 8-hour days anymore. I have had to reduce to part-time. I cannot play tennis which was my main hobby.',
  'Return to full-time work and be able to play sports again without fear of re-injury.',
  '6to12m',
  'Physiotherapy twice a week',
  'yes',
  'structured',
  'evening',
  false,
  true,
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 5. Assign counselor to client
INSERT INTO client_counselor (client_id, counselor_id, assigned_at)
VALUES ('test-client-001', 'test-counselor-001', NOW())
ON CONFLICT DO NOTHING;

-- NOTE: Do NOT run this directly. Use via API instead:
-- curl -X POST /api/intake -H "Cookie: sessionToken=..." -d '{...}'
-- OR just use the UI form for authentic Phase 0 testing
