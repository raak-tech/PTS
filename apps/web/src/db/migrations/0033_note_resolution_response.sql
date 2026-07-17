-- Counselor must record a response when addressing an admin note.
ALTER TABLE counselor_client_notes
  ADD COLUMN IF NOT EXISTS resolution_note TEXT;
