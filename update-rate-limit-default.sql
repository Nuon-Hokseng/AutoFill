-- Update rate_limit_usage table to set default generation_count to 20
-- This changes the schema default from 3 to 20 for all new records

-- Step 1: Change the DEFAULT constraint for generation_count column
ALTER TABLE public.rate_limit_usage 
ALTER COLUMN generation_count SET DEFAULT 20;

-- Step 2: Update existing users who have 3 or fewer uses to 20
-- (Optional but recommended to be fair to existing users)
UPDATE public.rate_limit_usage
SET generation_count = 20,
    updated_at = now()
WHERE generation_count <= 3;

-- Step 3: Verify the change
-- Run this query to check the new default value:
-- SELECT column_name, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'rate_limit_usage' 
-- AND column_name = 'generation_count';

-- Expected result: column_default should now be '20'
