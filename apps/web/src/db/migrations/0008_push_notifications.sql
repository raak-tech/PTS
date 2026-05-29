-- Store push notification subscriptions
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  endpoint text NOT NULL,
  auth text NOT NULL,
  p256dh text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  UNIQUE(user_id, endpoint)
);

-- Track notification preferences
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notifications_enabled" boolean NOT NULL DEFAULT false;
