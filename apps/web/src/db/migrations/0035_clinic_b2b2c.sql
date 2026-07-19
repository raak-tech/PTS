-- Clinic B2B2C foundation: buyer org, memberships, patient attribution, and enrollment codes.
CREATE TABLE IF NOT EXISTS clinics (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  city text,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused')),
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS clinic_memberships (
  id text PRIMARY KEY,
  clinic_id text NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL
    CHECK (role IN ('referrer', 'clinic_admin')),
  created_at timestamptz NOT NULL,
  UNIQUE (clinic_id, user_id)
);

CREATE INDEX IF NOT EXISTS clinic_memberships_user_idx
  ON clinic_memberships(user_id);

CREATE TABLE IF NOT EXISTS clinic_enrollment_codes (
  id text PRIMARY KEY,
  clinic_id text NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_by_user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cohort_label text,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0 CHECK (uses >= 0),
  expires_at timestamptz,
  created_at timestamptz NOT NULL,
  CHECK (max_uses IS NULL OR max_uses > 0),
  CHECK (max_uses IS NULL OR uses <= max_uses)
);

CREATE INDEX IF NOT EXISTS clinic_enrollment_codes_clinic_idx
  ON clinic_enrollment_codes(clinic_id);

CREATE TABLE IF NOT EXISTS clinic_enrollments (
  id text PRIMARY KEY,
  clinic_id text NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  client_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referrer_user_id text REFERENCES users(id) ON DELETE SET NULL,
  enrollment_code text,
  consent_shared_with_clinic boolean NOT NULL DEFAULT false,
  consent_shared_at timestamptz,
  consent_withdrawn_at timestamptz,
  cohort_label text,
  status text NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'enrolled', 'active', 'graduated', 'withdrawn')),
  enrolled_at timestamptz,
  first_active_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (clinic_id, client_user_id),
  CHECK (
    consent_shared_with_clinic = false
    OR (consent_shared_at IS NOT NULL AND consent_withdrawn_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS clinic_enrollments_client_idx
  ON clinic_enrollments(client_user_id);

CREATE INDEX IF NOT EXISTS clinic_enrollments_clinic_status_idx
  ON clinic_enrollments(clinic_id, status);

-- Public org seed only; do not put personal contact details in migrations.
INSERT INTO clinics (id, name, slug, city, status, created_at)
VALUES (
  'clinic-sagars-rehab',
  'Sagar''s Rehab',
  'sagars-rehab',
  'Chennai',
  'active',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  city = EXCLUDED.city,
  status = EXCLUDED.status;
