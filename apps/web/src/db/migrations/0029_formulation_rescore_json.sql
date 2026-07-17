-- Stage 3 rescore deltas stored on draft formulation rows (counselor review).
ALTER TABLE formulations ADD COLUMN IF NOT EXISTS rescore_json text;
