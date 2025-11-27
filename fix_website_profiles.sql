-- Fix website_profiles table RLS policy
-- Run this in Supabase SQL Editor

-- Enable RLS on website_profiles table
ALTER TABLE website_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Users can manage own website profiles" ON website_profiles;

-- Create policy for website_profiles - users can manage their own profiles
CREATE POLICY "Users can manage own website profiles"
ON website_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_website_profiles_user_id ON website_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_website_profiles_url ON website_profiles(website_url);
CREATE INDEX IF NOT EXISTS idx_website_profiles_filled_fields ON website_profiles USING GIN (filled_fields);
