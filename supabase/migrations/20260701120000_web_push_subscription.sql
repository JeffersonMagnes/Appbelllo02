-- Add web push subscription column to profiles for browser PWA notifications
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS web_push_subscription jsonb;
