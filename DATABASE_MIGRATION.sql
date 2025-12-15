-- Migration: Create rate_limit_usage table for per-user rate limiting
-- This table tracks daily auto-generate usage per user
-- NOTE: RLS is disabled because browser extensions use anon keys
-- Security is enforced by app logic: only the authenticated user can increment their own counter

CREATE TABLE IF NOT EXISTS rate_limit_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_count INT NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL,
  bonus_uses INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Unique constraint to ensure one record per user per day
  UNIQUE(user_id, last_reset_date)
);

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_usage_user_id_date 
ON rate_limit_usage(user_id, last_reset_date DESC);

-- Create a trigger to auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_rate_limit_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rate_limit_usage_updated_at
BEFORE UPDATE ON rate_limit_usage
FOR EACH ROW
EXECUTE FUNCTION update_rate_limit_usage_updated_at();

-- RLS is DISABLED for browser extension compatibility
-- The extension uses an anon key and cannot authenticate with auth.uid()
-- Security is enforced by app logic: only authenticated users get their user_id
ALTER TABLE rate_limit_usage DISABLE ROW LEVEL SECURITY;

