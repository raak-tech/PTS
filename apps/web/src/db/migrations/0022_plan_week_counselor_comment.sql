-- Counselor clinical comment required before generating the next week (Week 2+).
ALTER TABLE plan_weeks
  ADD COLUMN IF NOT EXISTS counselor_week_comment text;
