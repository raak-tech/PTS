-- Urgency flag on messages (client-marked) and counselor notes (admin-marked).
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE counselor_client_notes
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT false;
