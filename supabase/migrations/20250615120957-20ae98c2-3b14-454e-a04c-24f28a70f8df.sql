
-- Add job_title column to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN job_title text;

-- Update the updated_at timestamp for any existing profiles
UPDATE public.profiles 
SET updated_at = now() 
WHERE job_title IS NULL;
